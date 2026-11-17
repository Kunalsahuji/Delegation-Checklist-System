const Enquiry = require('../models/enquiry.model');
const Lead = require('../models/lead.model');
const VisitReport = require('../models/visitReport.model');
const Reminder = require('../models/reminder.model');
const Broker = require('../models/broker.model');
const Project = require('../../master/models/project.model');
const User = require('../../auth/models/user.model');

class CrmDashboardService {
  /**
   * Helper for today's start and end boundaries
   */
  getTodayBoundaries() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Aggregate executive dashboard metrics
   */
  async getDashboardData() {
    const { start: todayStart, end: todayEnd } = this.getTodayBoundaries();

    // 1. KPI Counts
    const [
      totalEnquiries,
      qualifiedEnquiries,
      newEnquiries,
      totalLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      totalVisits,
      verifiedVisits,
      todayVisits,
      totalBrokers,
      yardsAgg,
    ] = await Promise.all([
      Enquiry.countDocuments({ deletedAt: null }),
      Enquiry.countDocuments({ deletedAt: null, status: 'qualified' }),
      Enquiry.countDocuments({ deletedAt: null, status: 'new' }),
      Lead.countDocuments({ deletedAt: null }),
      Lead.countDocuments({ deletedAt: null, status: { $in: ['active', 'Active'] } }),
      Lead.countDocuments({ deletedAt: null, status: { $in: ['won', 'Won'] } }),
      Lead.countDocuments({ deletedAt: null, status: { $in: ['lost', 'Lost'] } }),
      VisitReport.countDocuments({ deletedAt: null }),
      VisitReport.countDocuments({ deletedAt: null, geoVerified: true }),
      VisitReport.countDocuments({
        deletedAt: null,
        visitDate: { $gte: todayStart, $lte: todayEnd },
      }),
      Broker.countDocuments({ status: { $ne: 'Inactive' } }),
      Broker.aggregate([
        { $match: { status: { $ne: 'Inactive' } } },
        { $group: { _id: null, totalYards: { $sum: '$totalYards' } } },
      ]),
    ]);

    const totalYards = yardsAgg[0]?.totalYards || 0;
    const qualificationRate =
      totalEnquiries > 0 ? Math.round((qualifiedEnquiries / totalEnquiries) * 100) : 0;
    const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    // 2. 8-Stage Pipeline Breakdown
    const stages = [
      'Contact Initiated',
      'Requirement Captured',
      'Project Shortlisted',
      'Site Visit Scheduled',
      'Visit Completed',
      'Negotiation & Booking',
      'Agreement & Documentation',
      'Deal Won / Registry',
    ];

    const stageCounts = await Promise.all(
      stages.map(async (st) => {
        const count = await Lead.countDocuments({ deletedAt: null, currentStage: st });
        return { stage: st, count };
      })
    );

    // 3. Lead Source Distribution
    const sourceAgg = await Enquiry.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const leadSources = sourceAgg.map((s) => ({
      source: s._id || 'other',
      count: s.count,
    }));

    // 4. Client Temperature Distribution
    const tempAgg = await Enquiry.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$temperature', count: { $sum: 1 } } },
    ]);

    const temperatures = {
      hot: tempAgg.find((t) => t._id === 'hot')?.count || 0,
      warm: tempAgg.find((t) => t._id === 'warm')?.count || 0,
      cold: tempAgg.find((t) => t._id === 'cold')?.count || 0,
    };

    // 5. Follow-ups & Operational Health
    const [overdueReminders, todayReminders, specialFollowups] = await Promise.all([
      Reminder.countDocuments({
        deletedAt: null,
        status: 'pending',
        $or: [
          { reminderDate: { $lt: todayStart } },
          { reminderAt: { $lt: todayStart } },
        ],
      }),
      Reminder.countDocuments({
        deletedAt: null,
        status: 'pending',
        $or: [
          { reminderDate: { $gte: todayStart, $lte: todayEnd } },
          { reminderAt: { $gte: todayStart, $lte: todayEnd } },
        ],
      }),
      Lead.countDocuments({
        deletedAt: null,
        specialFollowUp: true,
        status: { $in: ['active', 'Active'] },
      }),
    ]);

    // 6. Top Team Performers / Lead Workload
    const teamAgg = await Lead.aggregate([
      { $match: { deletedAt: null, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          wonDeals: { $sum: { $cond: [{ $in: ['$status', ['won', 'Won']] }, 1, 0] } },
        },
      },
      { $sort: { totalAssigned: -1 } },
      { $limit: 5 },
    ]);

    const teamPerformers = await Promise.all(
      teamAgg.map(async (t) => {
        const user = await User.findById(t._id).select('name email role');
        return {
          user: user ? user.name : 'Unknown Agent',
          email: user ? user.email : '',
          role: user ? user.role : 'Sales',
          totalAssigned: t.totalAssigned,
          wonDeals: t.wonDeals,
        };
      })
    );

    // 7. Recent Enquiries & Leads Activity Feed
    const recentEnquiries = await Enquiry.find({ deletedAt: null })
      .select('enquiryNumber clientName clientPhone temperature source status createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      kpis: {
        totalEnquiries,
        qualifiedEnquiries,
        newEnquiries,
        qualificationRate,
        totalLeads,
        activeLeads,
        wonLeads,
        lostLeads,
        winRate,
        totalVisits,
        verifiedVisits,
        todayVisits,
        totalBrokers,
        totalYards,
      },
      funnel: stageCounts,
      leadSources,
      temperatures,
      operations: {
        overdueReminders,
        todayReminders,
        specialFollowups,
      },
      teamPerformers,
      recentEnquiries,
    };
  }
}

module.exports = new CrmDashboardService();
