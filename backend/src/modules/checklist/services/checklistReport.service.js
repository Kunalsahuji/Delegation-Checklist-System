const ChecklistOccurrence = require('../models/checklistOccurrence.model');
const ChecklistTask = require('../models/checklistTask.model');
const ChecklistWeeklyPlan = require('../models/checklistWeeklyPlan.model');
const User = require('../../auth/models/user.model');
const { toCivilDate, addDays, civilToday } = require('../../../utils/recurrence');

const getMondayOfWeek = (d) => {
  const date = toCivilDate(d);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7; // Monday is 0
  return new Date(date.getTime() - diff * 86400000);
};

const getISOWeek = (d) => {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
};

class ChecklistReportService {
  async getWeeklyReport(params = {}) {
    const today = civilToday();
    const currentWeekMonday = getMondayOfWeek(today);

    const refDate = params.weekStart ? toCivilDate(params.weekStart) : currentWeekMonday;
    const weekStart = getMondayOfWeek(refDate);
    const weekEnd = addDays(weekStart, 6);
    const weekNumber = getISOWeek(weekStart);
    const isCurrentWeek = weekStart.getTime() === currentWeekMonday.getTime();

    // Occurrence query for the 7 days of this week (excluding deleted tasks)
    const activeTasks = await ChecklistTask.find({ deletedAt: null }).select('_id').lean();
    const activeTaskIds = activeTasks.map((t) => t._id);

    const filter = {
      plannedOn: { $gte: weekStart, $lte: weekEnd },
      task: { $in: activeTaskIds },
    };

    if (params.department) filter.department = params.department;
    if (params.assignee) filter.assignedTo = params.assignee;

    const occurrences = await ChecklistOccurrence.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('department', 'name key')
      .populate('project', 'name code')
      .lean();

    // Summary calculation
    const totalPlanned = occurrences.length;
    let notDoneCount = 0;
    let notDoneOnTimeCount = 0;

    const doerMap = new Map();

    for (const occ of occurrences) {
      const isDone = occ.status === 'done';
      const isLate = isDone && occ.completedAt && occ.plannedAt && new Date(occ.completedAt) > new Date(occ.plannedAt);

      const isNotDone = !isDone;
      const isNotDoneOnTime = isNotDone || isLate;

      if (isNotDone) notDoneCount++;
      if (isNotDoneOnTime) notDoneOnTimeCount++;

      // Doer aggregation
      const doerId = String(occ.assignedTo?._id || occ.assignedTo || 'unassigned');
      const doerName = occ.assignedToName || occ.assignedTo?.name || 'Unassigned';

      if (!doerMap.has(doerId)) {
        doerMap.set(doerId, {
          doerId,
          doerName,
          planned: 0,
          notDone: 0,
          notDoneOnTime: 0,
        });
      }

      const d = doerMap.get(doerId);
      d.planned++;
      if (isNotDone) d.notDone++;
      if (isNotDoneOnTime) d.notDoneOnTime++;
    }

    const pctNotDone = totalPlanned > 0 ? Math.round((notDoneCount / totalPlanned) * 100) : null;
    const pctNotDoneOnTime = totalPlanned > 0 ? Math.round((notDoneOnTimeCount / totalPlanned) * 100) : null;

    // Fetch weekly plans for target comparisons
    const previousWeekStart = addDays(weekStart, -7);

    // Plans for this week and previous week
    const [currentPlans, prevPlans] = await Promise.all([
      ChecklistWeeklyPlan.find({ weekStart }).lean(),
      ChecklistWeeklyPlan.find({ weekStart: previousWeekStart }).lean(),
    ]);

    const currentPlanByDoer = new Map(currentPlans.map((p) => [String(p.assignedTo), p]));
    const prevPlanByDoer = new Map(prevPlans.map((p) => [String(p.assignedTo), p]));

    // Format By-Doer records
    const byDoer = Array.from(doerMap.values()).map((d) => {
      const curPlan = currentPlanByDoer.get(d.doerId);
      const prevPlan = prevPlanByDoer.get(d.doerId);

      return {
        ...d,
        pctNotDone: d.planned > 0 ? Math.round((d.notDone / d.planned) * 100) : null,
        pctNotDoneOnTime: d.planned > 0 ? Math.round((d.notDoneOnTime / d.planned) * 100) : null,
        thisWeekPlanned: prevPlan?.next || null,
        nextWeekPlanned: curPlan?.next || null,
      };
    });

    return {
      weekNumber,
      weekStart,
      weekEnd,
      isCurrentWeek,
      currentWeekNumber: getISOWeek(currentWeekMonday),
      summary: {
        totalPlanned,
        notDone: notDoneCount,
        notDoneOnTime: notDoneOnTimeCount,
        pctNotDone,
        pctNotDoneOnTime,
      },
      byDoer,
      items: occurrences.map((occ) => ({
        _id: occ._id,
        title: occ.title,
        personName: occ.assignedToName || occ.assignedTo?.name || 'Unassigned',
        personId: occ.assignedTo?._id ? String(occ.assignedTo._id) : '',
        departmentName: occ.departmentName || occ.department?.name || 'Company-wide',
        plannedOn: occ.plannedOn,
        plannedAt: occ.plannedAt,
        frequency: occ.frequency,
        status: occ.status,
        completedAt: occ.completedAt,
        remarks: occ.remarks || [],
        isNotDone: occ.status !== 'done' || (occ.completedAt && new Date(occ.completedAt) > new Date(occ.plannedAt)),
      })),
    };
  }

  async savePlan({ assignedTo, weekStart, next, user }) {
    const monday = getMondayOfWeek(weekStart);
    const weekNumber = getISOWeek(monday);

    const plan = await ChecklistWeeklyPlan.findOneAndUpdate(
      { assignedTo, weekStart: monday },
      {
        $set: {
          weekNumber,
          next: {
            notDone: next?.notDone !== undefined ? next.notDone : null,
            notDoneOnTime: next?.notDoneOnTime !== undefined ? next.notDoneOnTime : null,
          },
          updatedBy: user?._id || null,
        },
        $setOnInsert: {
          createdBy: user?._id || null,
        },
      },
      { upsert: true, new: true }
    );

    return plan;
  }
}

module.exports = new ChecklistReportService();
