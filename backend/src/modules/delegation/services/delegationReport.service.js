const DelegationTask = require('../models/delegationTask.model');
const DelegationWeeklyPlan = require('../models/delegationWeeklyPlan.model');
const User = require('../../auth/models/user.model');
const { toCivilDate, addDays, civilToday } = require('../../../utils/recurrence');

const getSundayOfWeek = (d) => {
  const date = toCivilDate(d);
  const day = date.getUTCDay(); // Sunday is 0
  return new Date(date.getTime() - day * 86400000);
};

const getISOWeek = (d) => {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
};

class DelegationReportService {
  async getWeeklyReport(params = {}) {
    const today = civilToday();
    const currentWeekSunday = getSundayOfWeek(today);

    const refDate = params.weekStart ? toCivilDate(params.weekStart) : currentWeekSunday;
    const weekStart = getSundayOfWeek(refDate);
    const weekEnd = addDays(weekStart, 6); // Saturday
    const weekNumber = getISOWeek(weekStart);
    const isCurrentWeek = weekStart.getTime() === currentWeekSunday.getTime();

    // Query tasks whose active dueDate lands in this week
    const filter = {
      deletedAt: null,
      dueDate: { $gte: weekStart, $lte: weekEnd },
    };

    if (params.department) filter.department = params.department;
    if (params.assignee) filter.assignedTo = params.assignee;
    if (params.project) filter.project = params.project;

    const tasks = await DelegationTask.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('department', 'name key')
      .populate('project', 'name code')
      .lean();

    const totalTasks = tasks.length;
    let greenCount = 0;
    let yellowCount = 0;
    let redCount = 0;

    const doerMap = new Map();

    for (const t of tasks) {
      const revs = t.revisionCount || 0;
      const isGreen = revs === 0;
      const isYellow = revs === 1;
      const isRed = revs >= 2;

      if (isGreen) greenCount++;
      else if (isYellow) yellowCount++;
      else if (isRed) redCount++;

      const doerId = String(t.assignedTo?._id || t.assignedTo || 'unassigned');
      const doerName = t.assignedToName || t.assignedTo?.name || 'Unassigned';

      if (!doerMap.has(doerId)) {
        doerMap.set(doerId, {
          doerId,
          doerName,
          total: 0,
          green: 0,
          yellow: 0,
          red: 0,
        });
      }

      const d = doerMap.get(doerId);
      d.total++;
      if (isGreen) d.green++;
      else if (isYellow) d.yellow++;
      else if (isRed) d.red++;
    }

    const pctGreen = totalTasks > 0 ? Math.round((greenCount / totalTasks) * 100) : null;
    const pctYellow = totalTasks > 0 ? Math.round((yellowCount / totalTasks) * 100) : null;
    const pctRed = totalTasks > 0 ? Math.round((redCount / totalTasks) * 100) : null;

    // Plans for this week and previous week
    const previousWeekStart = addDays(weekStart, -7);

    const [currentPlans, prevPlans] = await Promise.all([
      DelegationWeeklyPlan.find({ weekStart }).lean(),
      DelegationWeeklyPlan.find({ weekStart: previousWeekStart }).lean(),
    ]);

    const currentPlanByDoer = new Map(currentPlans.map((p) => [String(p.assignedTo), p]));
    const prevPlanByDoer = new Map(prevPlans.map((p) => [String(p.assignedTo), p]));

    const byDoer = Array.from(doerMap.values()).map((d) => {
      const curPlan = currentPlanByDoer.get(d.doerId);
      const prevPlan = prevPlanByDoer.get(d.doerId);

      return {
        ...d,
        pctGreen: d.total > 0 ? Math.round((d.green / d.total) * 100) : null,
        pctYellow: d.total > 0 ? Math.round((d.yellow / d.total) * 100) : null,
        pctRed: d.total > 0 ? Math.round((d.red / d.total) * 100) : null,
        thisWeekPlanned: prevPlan?.next || null,
        nextWeekPlanned: curPlan?.next || null,
      };
    });

    return {
      weekNumber,
      weekStart,
      weekEnd,
      isCurrentWeek,
      currentWeekNumber: getISOWeek(currentWeekSunday),
      summary: {
        totalTasks,
        green: greenCount,
        yellow: yellowCount,
        red: redCount,
        pctGreen,
        pctYellow,
        pctRed,
      },
      byDoer,
      tasks: tasks.map((t) => ({
        _id: t._id,
        code: t.code,
        legacyCode: t.legacyCode || null,
        title: t.title,
        doerName: t.assignedTo?.name || 'Unassigned',
        doerId: t.assignedTo?._id ? String(t.assignedTo._id) : '',
        departmentName: t.department?.name || 'Company-wide',
        projectName: t.project?.name || 'Company-wide',
        originalDueDate: t.originalDueDate,
        dueDate: t.dueDate,
        revisionCount: t.revisionCount || 0,
        revisions: t.revisions || [],
        status: t.status,
        priority: t.priority || 'medium',
        rygScore: (t.revisionCount || 0) === 0 ? 'green' : (t.revisionCount || 0) === 1 ? 'yellow' : 'red',
      })),
    };
  }

  async savePlan({ assignedTo, weekStart, next, user }) {
    const sunday = getSundayOfWeek(weekStart);
    const weekNumber = getISOWeek(sunday);

    const plan = await DelegationWeeklyPlan.findOneAndUpdate(
      { assignedTo, weekStart: sunday },
      {
        $set: {
          weekNumber,
          next: {
            red: next?.red !== undefined ? next.red : null,
            yellow: next?.yellow !== undefined ? next.yellow : null,
            green: next?.green !== undefined ? next.green : null,
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

module.exports = new DelegationReportService();
