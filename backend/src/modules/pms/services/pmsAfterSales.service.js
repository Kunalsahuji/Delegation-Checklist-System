const mongoose = require('mongoose');
const PmsAfterSales = require('../models/pmsAfterSales.model');
const PmsProject = require('../models/pmsProject.model');
const {
  AFTER_SALES_SECTION_KEYS,
  AFTER_SALES_STATUS,
} = require('../constants/pms.constants');

class PmsAfterSalesService {
  async getKPIs() {
    const [agg] = await PmsAfterSales.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          activeClaimsTotal: { $sum: '$activeClaimsCount' },
          completedVisitsTotal: { $sum: '$completedVisitsCount' },
          resolvedTicketsTotal: { $sum: '$resolvedTicketsCount' },
          avgRatingSum: { $avg: '$averageSatisfactionScore' },
          approved: {
            $sum: { $cond: [{ $in: ['$status', ['approved', 'dlpMatured']] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      total: agg?.total || 0,
      activeClaimsTotal: agg?.activeClaimsTotal || 0,
      completedVisitsTotal: agg?.completedVisitsTotal || 0,
      resolvedTicketsTotal: agg?.resolvedTicketsTotal || 0,
      averageSatisfactionScore: agg?.avgRatingSum ? Number(agg.avgRatingSum.toFixed(1)) : 0,
      approved: agg?.approved || 0,
    };
  }

  async listRecords(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      projectId,
      hasActiveClaims,
      amcCompleted,
      supportResolved,
      topRated,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (hasActiveClaims === true || hasActiveClaims === 'true') {
      filter.activeClaimsCount = { $gt: 0 };
    }

    if (amcCompleted === true || amcCompleted === 'true') {
      filter.completedVisitsCount = { $gt: 0 };
    }

    if (supportResolved === true || supportResolved === 'true') {
      filter.resolvedTicketsCount = { $gt: 0 };
    }

    if (topRated === true || topRated === 'true') {
      filter.averageSatisfactionScore = { $gte: 4.0 };
    }

    if (projectId) {
      filter.project = projectId;
    }

    if (search && search.trim()) {
      const term = search.trim();
      const projectMatches = await PmsProject.find({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { code: { $regex: term, $options: 'i' } },
        ],
      }).select('_id');

      const projectIds = projectMatches.map((p) => p._id);

      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { 'warrantyClaims.claims.claimNumber': { $regex: term, $options: 'i' } },
        { 'warrantyClaims.claims.customerName': { $regex: term, $options: 'i' } },
        { project: { $in: projectIds } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [records, total] = await Promise.all([
      PmsAfterSales.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('project', 'name code locality city stageOrder stages')
        .populate('createdBy', 'name email role')
        .populate('approvedBy', 'name email role')
        .lean(),
      PmsAfterSales.countDocuments(filter),
    ]);

    return {
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getRecordById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid After-Sales ID');
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsAfterSales.findById(id)
      .populate('project', 'name code locality city stageOrder stages baseline')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('warrantyClaims.completedBy', 'name email')
      .populate('amcVisits.completedBy', 'name email')
      .populate('customerSupport.completedBy', 'name email')
      .populate('feedback.completedBy', 'name email')
      .populate('statusHistory.by', 'name email role')
      .lean();

    if (!record) {
      const err = new Error('After-Sales record not found');
      err.statusCode = 404;
      throw err;
    }

    return record;
  }

  async createFromProject(projectId, userId = null) {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      const err = new Error('Valid Project ID is required');
      err.statusCode = 400;
      throw err;
    }

    const project = await PmsProject.findById(projectId);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Check existing
    let record = await PmsAfterSales.findOne({ project: projectId });
    if (record) {
      return { pmsAfterSales: await this.getRecordById(record._id), created: false };
    }

    const count = await PmsAfterSales.countDocuments();
    const code = `ASL-${String(count + 1).padStart(6, '0')}`;

    // Default Seed Claims
    const defaultClaims = [
      {
        claimNumber: `CLM-PLM-01`,
        customerName: 'Mr. Arvind Gupta',
        unitNumber: 'Flat 502, Wing B',
        issueDescription: 'Minor sink drain line slow drainage in master bathroom.',
        trade: 'Plumbing',
        severity: 'Low',
        status: 'Rectified',
        reportedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        resolvedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        assignedTechnician: 'DLP Rapid Response Team',
        resolutionCost: 1200,
      },
      {
        claimNumber: `CLM-ELC-02`,
        customerName: 'Ms. Sunita Sharma',
        unitNumber: 'Flat 304, Wing A',
        issueDescription: 'Balcony LED spotlight dimmer flickering during voltage spike.',
        trade: 'Electrical',
        severity: 'Low',
        status: 'WorkAssigned',
        reportedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        resolvedDate: null,
        assignedTechnician: 'Er. Rakesh (Technician)',
        resolutionCost: 800,
      },
    ];

    // Default AMC Visits
    const defaultVisits = [
      {
        visitCode: `AMC-Q1-01`,
        visitType: 'Quarterly Preventive Maintenance',
        scheduledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        vendorName: 'BlueStar MEP Facilities',
        technicianName: 'Sanjay Verma (Lead Tech)',
        findings: 'Cleaned filters, checked refrigerant pressure; operational at 100%',
        status: 'Completed',
      },
      {
        visitCode: `AMC-LFT-02`,
        visitType: 'Lift & Elevator Audit',
        scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        completedDate: null,
        vendorName: 'Otis Elevator India Pvt Ltd',
        technicianName: 'Otis Field Engineer',
        findings: 'Pending scheduled inspection',
        status: 'Scheduled',
      },
    ];

    // Default Customer Support Tickets
    const defaultTickets = [
      {
        ticketNumber: `SUP-TKT-101`,
        customerName: 'Mr. Arvind Gupta',
        contactNumber: '+91 98260 11223',
        category: 'Amenities & Club Access',
        priority: 'Medium',
        status: 'Resolved',
        subject: 'Clubhouse smart access card activation',
        resolutionNotes: 'Access profile synced with gated entry RFID database.',
        openedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNumber: `SUP-TKT-102`,
        customerName: 'Mr. Deepak Verma',
        contactNumber: '+91 98930 44556',
        category: 'Documentation & Certificates',
        priority: 'Low',
        status: 'Closed',
        subject: 'Request for duplicate NOC certificate copy',
        resolutionNotes: 'Digital copy shared via registered email.',
        openedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    // Default Customer Reviews
    const defaultReviews = [
      {
        reviewId: `REV-001`,
        customerName: 'Mr. Arvind Gupta',
        unitNumber: 'Flat 502, Wing B',
        overallRating: 5,
        qualityRating: 5,
        serviceSpeedRating: 5,
        comments: 'Prompt response from the DLP team. The drainage touch-up was fixed within 48 hours.',
        npsScore: 10,
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        reviewId: `REV-002`,
        customerName: 'Ms. Sunita Sharma',
        unitNumber: 'Flat 304, Wing A',
        overallRating: 4,
        qualityRating: 5,
        serviceSpeedRating: 4,
        comments: 'Great build quality and immaculate landscaping. Highly satisfied with handover handover.',
        npsScore: 9,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    const totalClaims = defaultClaims.length;
    const activeClaims = defaultClaims.filter((c) => !['Rectified', 'Closed'].includes(c.status)).length;
    const resolvedClaims = defaultClaims.filter((c) => ['Rectified', 'Closed'].includes(c.status)).length;

    const totalVisits = defaultVisits.length;
    const completedVisits = defaultVisits.filter((v) => v.status === 'Completed').length;
    const pendingVisits = defaultVisits.filter((v) => v.status !== 'Completed').length;

    const totalTickets = defaultTickets.length;
    const openTickets = defaultTickets.filter((t) => ['Open', 'InProgress'].includes(t.status)).length;
    const resolvedTickets = defaultTickets.filter((t) => ['Resolved', 'Closed'].includes(t.status)).length;

    const avgRating =
      defaultReviews.reduce((sum, r) => sum + r.overallRating, 0) / (defaultReviews.length || 1);

    record = new PmsAfterSales({
      code,
      project: projectId,
      status: 'warrantyActive',
      warrantyClaims: {
        claims: defaultClaims,
        totalClaims,
        activeClaims,
        resolvedClaims,
        status: activeClaims === 0 ? 'completed' : 'inProgress',
        remarks: 'DLP active support desk engaged.',
      },
      amcVisits: {
        visits: defaultVisits,
        totalVisits,
        completedVisits,
        pendingVisits,
        status: completedVisits > 0 ? 'completed' : 'inProgress',
        remarks: 'Preventive AMC service schedule active.',
      },
      customerSupport: {
        tickets: defaultTickets,
        totalTickets,
        openTickets,
        resolvedTickets,
        status: resolvedTickets > 0 ? 'completed' : 'inProgress',
        remarks: 'Grievance and service ticketing portal operational.',
      },
      feedback: {
        reviews: defaultReviews,
        averageRating: Number(avgRating.toFixed(1)),
        totalFeedbackCount: defaultReviews.length,
        npsScore: 9.5,
        status: defaultReviews.length > 0 ? 'completed' : 'inProgress',
        remarks: 'Customer satisfaction rating exceeds 90% benchmark.',
      },
      totalClaimsCount: totalClaims,
      activeClaimsCount: activeClaims,
      completedVisitsCount: completedVisits,
      resolvedTicketsCount: resolvedTickets,
      averageSatisfactionScore: Number(avgRating.toFixed(1)),
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'warrantyActive',
          by: userId,
          reason: 'Stage 13 After Sales & DLP Register initiated',
          at: new Date(),
        },
      ],
    });

    await record.save();
    await this.syncStage13(projectId);

    const populated = await this.getRecordById(record._id);
    return { pmsAfterSales: populated, created: true };
  }

  async updateSection(id, sectionKey, data, userId = null) {
    if (!AFTER_SALES_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsAfterSales.findById(id);
    if (!record) {
      const err = new Error('After-Sales record not found');
      err.statusCode = 404;
      throw err;
    }

    if (sectionKey === 'warrantyClaims') {
      if (Array.isArray(data.claims)) {
        record.warrantyClaims.claims = data.claims;
      }
      const total = record.warrantyClaims.claims.length;
      const active = record.warrantyClaims.claims.filter(
        (c) => !['Rectified', 'Closed'].includes(c.status)
      ).length;
      const resolved = total - active;

      record.warrantyClaims.totalClaims = total;
      record.warrantyClaims.activeClaims = active;
      record.warrantyClaims.resolvedClaims = resolved;
      record.totalClaimsCount = total;
      record.activeClaimsCount = active;

      if (data.remarks !== undefined) record.warrantyClaims.remarks = data.remarks;
      record.warrantyClaims.status = active === 0 ? 'completed' : 'inProgress';
    }

    if (sectionKey === 'amcVisits') {
      if (Array.isArray(data.visits)) {
        record.amcVisits.visits = data.visits;
      }
      const total = record.amcVisits.visits.length;
      const completed = record.amcVisits.visits.filter((v) => v.status === 'Completed').length;
      const pending = total - completed;

      record.amcVisits.totalVisits = total;
      record.amcVisits.completedVisits = completed;
      record.amcVisits.pendingVisits = pending;
      record.completedVisitsCount = completed;

      if (data.remarks !== undefined) record.amcVisits.remarks = data.remarks;
      record.amcVisits.status = completed > 0 ? 'completed' : 'inProgress';
    }

    if (sectionKey === 'customerSupport') {
      if (Array.isArray(data.tickets)) {
        record.customerSupport.tickets = data.tickets;
      }
      const total = record.customerSupport.tickets.length;
      const open = record.customerSupport.tickets.filter((t) =>
        ['Open', 'InProgress'].includes(t.status)
      ).length;
      const resolved = total - open;

      record.customerSupport.totalTickets = total;
      record.customerSupport.openTickets = open;
      record.customerSupport.resolvedTickets = resolved;
      record.resolvedTicketsCount = resolved;

      if (data.remarks !== undefined) record.customerSupport.remarks = data.remarks;
      record.customerSupport.status = resolved > 0 ? 'completed' : 'inProgress';
    }

    if (sectionKey === 'feedback') {
      if (Array.isArray(data.reviews)) {
        record.feedback.reviews = data.reviews;
      }
      const count = record.feedback.reviews.length;
      const avg =
        count > 0
          ? Number(
              (
                record.feedback.reviews.reduce((s, r) => s + (r.overallRating || 5), 0) / count
              ).toFixed(1)
            )
          : 0;
      const nps =
        count > 0
          ? Number(
              (
                record.feedback.reviews.reduce((s, r) => s + (r.npsScore || 9), 0) / count
              ).toFixed(1)
            )
          : 0;

      record.feedback.averageRating = avg;
      record.feedback.totalFeedbackCount = count;
      record.feedback.npsScore = nps;
      record.averageSatisfactionScore = avg;

      if (data.remarks !== undefined) record.feedback.remarks = data.remarks;
      record.feedback.status = count > 0 ? 'completed' : 'inProgress';
    }

    await record.save();
    await this.syncStage13(record.project);

    return this.getRecordById(record._id);
  }

  async completeSection(id, sectionKey, remarks = '', userId = null) {
    if (!AFTER_SALES_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsAfterSales.findById(id);
    if (!record) {
      const err = new Error('After-Sales record not found');
      err.statusCode = 404;
      throw err;
    }

    record[sectionKey].status = 'completed';
    record[sectionKey].remarks = remarks || record[sectionKey].remarks;
    record[sectionKey].completedBy = userId;
    record[sectionKey].completedAt = new Date();

    if (sectionKey === 'warrantyClaims') {
      record.warrantyClaims.claims.forEach((c) => {
        if (!['Rectified', 'Closed'].includes(c.status)) {
          c.status = 'Rectified';
          c.resolvedDate = new Date();
        }
      });
      record.warrantyClaims.activeClaims = 0;
      record.activeClaimsCount = 0;
    }

    if (sectionKey === 'amcVisits') {
      record.amcVisits.visits.forEach((v) => {
        v.status = 'Completed';
        if (!v.completedDate) v.completedDate = new Date();
      });
      record.amcVisits.completedVisits = record.amcVisits.totalVisits;
      record.amcVisits.pendingVisits = 0;
      record.completedVisitsCount = record.amcVisits.totalVisits;
    }

    if (sectionKey === 'customerSupport') {
      record.customerSupport.tickets.forEach((t) => {
        if (!['Resolved', 'Closed'].includes(t.status)) {
          t.status = 'Resolved';
          t.closedAt = new Date();
        }
      });
      record.customerSupport.openTickets = 0;
      record.customerSupport.resolvedTickets = record.customerSupport.totalTickets;
      record.resolvedTicketsCount = record.customerSupport.totalTickets;
    }

    const allSectionsDone = AFTER_SALES_SECTION_KEYS.every(
      (k) => record[k].status === 'completed'
    );

    if (allSectionsDone && record.status !== 'approved' && record.status !== 'dlpMatured') {
      record.status = 'auditPending';
      record.statusHistory.push({
        from: record.status,
        to: 'auditPending',
        by: userId,
        reason: 'All After-Sales modules verified. Submitted for DLP Clearance & Project Closure.',
        at: new Date(),
      });
    }

    await record.save();
    await this.syncStage13(record.project);

    return this.getRecordById(record._id);
  }

  async requestApproval(id, userId = null) {
    const record = await PmsAfterSales.findById(id);
    if (!record) {
      const err = new Error('After-Sales record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved' || record.status === 'dlpMatured') {
      const err = new Error('After-Sales is already approved');
      err.statusCode = 400;
      throw err;
    }

    const from = record.status;
    record.status = 'auditPending';
    record.statusHistory.push({
      from,
      to: 'auditPending',
      by: userId,
      reason: 'Submitted for Stage 13 Final DLP Maturity & Project Lifecycle Closure',
      at: new Date(),
    });

    await record.save();
    return this.getRecordById(record._id);
  }

  async decideApproval(id, { decision, reason = '' }, userId = null) {
    const record = await PmsAfterSales.findById(id);
    if (!record) {
      const err = new Error('After-Sales record not found');
      err.statusCode = 404;
      throw err;
    }

    if (!['approved', 'rejected'].includes(decision)) {
      const err = new Error('Decision must be approved or rejected');
      err.statusCode = 400;
      throw err;
    }

    const from = record.status;
    if (decision === 'approved') {
      record.status = 'approved';
      record.isApproved = true;
      record.approvedBy = userId;
      record.approvedAt = new Date();
      record.rejectionReason = '';

      record.statusHistory.push({
        from,
        to: 'approved',
        by: userId,
        reason: reason || 'Stage 13 After-Sales certified and DLP successfully matured',
        at: new Date(),
      });

      await record.save();

      // Sync stage 13 to project and complete full project lifecycle
      await this.syncStage13(record.project, true);
    } else {
      record.status = 'routineMaintenance';
      record.isApproved = false;
      record.rejectionReason = reason;

      record.statusHistory.push({
        from,
        to: 'routineMaintenance',
        by: userId,
        reason: reason || 'Approval rejected; ongoing routine maintenance required',
        at: new Date(),
      });

      await record.save();
    }

    return this.getRecordById(record._id);
  }

  async syncStage13(projectId, isApproved = false) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage13 = project.stages?.find((s) => s.order === 13 || s.key === 'afterSales');
    if (!stage13) return;

    const asl = await PmsAfterSales.findOne({ project: projectId }).lean();
    if (!asl) return;

    // Stage 13 checklist: ['Warranty Claims', 'AMC / Service Visits', 'Customer Support', 'Feedback']
    const hasClaims = (asl.warrantyClaims?.claims?.length || 0) > 0;
    const hasAmc = (asl.amcVisits?.visits?.length || 0) > 0;
    const hasSupport = (asl.customerSupport?.tickets?.length || 0) > 0;
    const hasFeedback = (asl.feedback?.reviews?.length || 0) > 0;
    const isOfficiallyApproved = isApproved || asl.status === 'approved' || asl.isApproved;

    if (stage13.checklist?.[0]) {
      stage13.checklist[0].done = hasClaims;
      stage13.checklist[0].auto = true;
    }
    if (stage13.checklist?.[1]) {
      stage13.checklist[1].done = hasAmc;
      stage13.checklist[1].auto = true;
    }
    if (stage13.checklist?.[2]) {
      stage13.checklist[2].done = hasSupport;
      stage13.checklist[2].auto = true;
    }
    if (stage13.checklist?.[3]) {
      stage13.checklist[3].done = hasFeedback;
      stage13.checklist[3].auto = true;
    }

    if (isOfficiallyApproved) {
      stage13.approved = true;
      stage13.approvedAt = new Date();
      // Project completes full 13-stage lifecycle
      project.stageOrder = 13;
      project.status = 'completed';
    }

    await project.save();
  }
}

module.exports = new PmsAfterSalesService();
