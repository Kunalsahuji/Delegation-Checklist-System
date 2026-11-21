const mongoose = require('mongoose');
const ConstructionExecution = require('../models/constructionExecution.model');
const PmsProject = require('../models/pmsProject.model');
const {
  CONSTRUCTION_SECTION_KEYS,
  CONSTRUCTION_STATUS,
} = require('../constants/pms.constants');

class ConstructionExecutionService {
  async getKPIs() {
    const [agg] = await ConstructionExecution.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          inProgress: {
            $sum: { $cond: [{ $in: ['$status', ['inProgress', 'siteMobilized']] }, 1, 0] },
          },
          reviewPending: {
            $sum: { $cond: [{ $eq: ['$status', 'reviewPending'] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          totalDprCount: { $sum: '$totalDprCount' },
          totalManHours: { $sum: '$totalManHours' },
          totalLabourCost: { $sum: '$totalLabourCost' },
          totalMaterialCost: { $sum: '$totalMaterialCost' },
          totalPhotosCount: { $sum: '$totalPhotosCount' },
        },
      },
    ]);

    return {
      total: agg?.total || 0,
      inProgress: agg?.inProgress || 0,
      reviewPending: agg?.reviewPending || 0,
      approved: agg?.approved || 0,
      totalDprCount: agg?.totalDprCount || 0,
      totalManHours: agg?.totalManHours || 0,
      totalLabourCost: agg?.totalLabourCost || 0,
      totalMaterialCost: agg?.totalMaterialCost || 0,
      totalPhotosCount: agg?.totalPhotosCount || 0,
    };
  }

  async listRecords(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      projectId,
      hasDpr,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status && status !== 'all') {
      if (status === 'hasDpr') {
        filter.totalDprCount = { $gt: 0 };
      } else if (status === 'inProgress') {
        filter.status = { $in: ['inProgress', 'siteMobilized'] };
      } else {
        filter.status = status;
      }
    }
    }

    if (projectId) {
      filter.project = projectId;
    }

    if (hasDpr === true || hasDpr === 'true') {
      filter.totalDprCount = { $gt: 0 };
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
        { project: { $in: projectIds } },
      ];
    }

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (numericPage - 1) * numericLimit;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [records, total] = await Promise.all([
      ConstructionExecution.find(filter)
        .populate('project', 'name code location status stageOrder baselineLocked')
        .populate('approvedBy', 'name email role')
        .populate('createdBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      ConstructionExecution.countDocuments(filter),
    ]);

    return {
      records,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit) || 1,
      },
    };
  }

  async getRecordById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid Construction Execution ID');
      err.statusCode = 400;
      throw err;
    }

    const record = await ConstructionExecution.findById(id)
      .populate('project', 'name code location status stageOrder baselineLocked')
      .populate('approvedBy', 'name email role')
      .populate('createdBy', 'name email')
      .populate('dailyProgress.completedBy', 'name email')
      .populate('labourTracking.completedBy', 'name email')
      .populate('materialConsumption.completedBy', 'name email')
      .populate('qualitySitePhotos.completedBy', 'name email')
      .populate('statusHistory.by', 'name email');

    if (!record) {
      const err = new Error('Construction Execution record not found');
      err.statusCode = 404;
      throw err;
    }

    return record;
  }

  async createFromProject(projectId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const err = new Error('Invalid Project ID');
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
    let record = await ConstructionExecution.findOne({ project: projectId });
    if (record) {
      return { constructionExecution: await this.getRecordById(record._id), created: false };
    }

    // Generate code
    const count = await ConstructionExecution.countDocuments();
    const code = `CEX-${String(count + 1).padStart(6, '0')}`;

    // Sample default DPR logs
    const defaultDpr = [
      {
        dprNumber: `DPR-${project.code || 'PRJ'}-001`,
        date: new Date(),
        shift: 'Day Shift',
        weather: 'Clear',
        temperature: '31°C',
        workHours: 8,
        siteEngineer: 'Er. Sandeep Rathore',
        plannedActivities: 'Excavation of Column Footing CF-01 to CF-12 & PCC Bed Pouring',
        completedActivities: 'Excavation of 12 footings completed; PCC 1:4:8 poured for 8 footings (32 cum).',
        delaysOrBlockers: 'None. Work executed as per structural drawings.',
        siteSafetyIncidents: 0,
        status: 'verified',
      },
      {
        dprNumber: `DPR-${project.code || 'PRJ'}-002`,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        shift: 'Day Shift',
        weather: 'Sunny',
        temperature: '33°C',
        workHours: 8,
        siteEngineer: 'Er. Sandeep Rathore',
        plannedActivities: 'Footing Steel Rebar Cage binding & Formwork shuttering placement',
        completedActivities: 'TMT rebar fabricated and placed for 8 footings. Shuttering checked for alignment.',
        delaysOrBlockers: 'Minor delay in shuttering oil delivery; rectified within 1 hour.',
        siteSafetyIncidents: 0,
        status: 'verified',
      },
    ];

    // Default Labour Entries
    const defaultLabour = [
      {
        date: new Date(),
        contractorName: 'Apex Civil Infra & RCC Contractors',
        trade: 'Civil & Masonry',
        headCount: 8,
        hoursPerWorker: 8,
        totalManHours: 64,
        dailyWageRate: 850,
        totalLabourCost: 6800,
        supervisor: 'Harish Chander',
        verified: true,
      },
      {
        date: new Date(),
        contractorName: 'Apex Civil Infra & RCC Contractors',
        trade: 'Bar Bending & Steel',
        headCount: 6,
        hoursPerWorker: 8,
        totalManHours: 48,
        dailyWageRate: 900,
        totalLabourCost: 5400,
        supervisor: 'Mohan Singh',
        verified: true,
      },
      {
        date: new Date(),
        contractorName: 'Royal Shuttering & Scaffolding Works',
        trade: 'Shuttering & Formwork',
        headCount: 6,
        hoursPerWorker: 8,
        totalManHours: 48,
        dailyWageRate: 850,
        totalLabourCost: 5100,
        supervisor: 'Ram Kumar',
        verified: true,
      },
      {
        date: new Date(),
        contractorName: 'Apex Civil Infra & RCC Contractors',
        trade: 'General Unskilled Labour',
        headCount: 14,
        hoursPerWorker: 8,
        totalManHours: 112,
        dailyWageRate: 550,
        totalLabourCost: 7700,
        supervisor: 'Harish Chander',
        verified: true,
      },
    ];

    // Default Material Consumption
    const defaultConsumption = [
      {
        date: new Date(),
        materialName: 'OPC 53 Grade Cement',
        category: 'cement',
        unit: 'Bags',
        quantityConsumed: 120,
        unitRate: 380,
        totalCost: 45600,
        locationOrElement: 'Substructure Footings CF-01 to CF-08',
        stockLedgerRef: 'STK-PRC-001',
        verifiedBy: 'Er. Sandeep Rathore',
      },
      {
        date: new Date(),
        materialName: 'Fe 550D TMT Reinforcement Steel',
        category: 'steel',
        unit: 'MT',
        quantityConsumed: 3.5,
        unitRate: 62000,
        totalCost: 217000,
        locationOrElement: 'Footing Mats & Column Starter Bars',
        stockLedgerRef: 'STK-PRC-002',
        verifiedBy: 'Er. Sandeep Rathore',
      },
      {
        date: new Date(),
        materialName: 'Coarse River Sand',
        category: 'sand',
        unit: 'MT',
        quantityConsumed: 22,
        unitRate: 1400,
        totalCost: 30800,
        locationOrElement: 'PCC Foundation Bed',
        stockLedgerRef: 'STK-PRC-003',
        verifiedBy: 'Er. Sandeep Rathore',
      },
    ];

    // Default Quality Checks & Photos
    const defaultQuality = [
      {
        inspectionDate: new Date(),
        elementOrLocation: 'Column Footing Rebar Cage CF-01 to CF-08',
        stage: 'Reinforcement & Cover Block Verification',
        checkedBy: 'Er. Sandeep Rathore',
        verdict: 'Passed',
        remedialAction: 'N/A - Concrete clear cover of 50mm verified with spacer blocks.',
        signOffEngineer: 'Er. Sandeep Rathore',
      },
      {
        inspectionDate: new Date(),
        elementOrLocation: 'PCC 1:4:8 Foundation Sub-base',
        stage: 'Soil Compaction & Bed Level Check',
        checkedBy: 'Er. Sandeep Rathore',
        verdict: 'Passed',
        remedialAction: 'N/A - Auto level check verified correct depth.',
        signOffEngineer: 'Er. Sandeep Rathore',
      },
    ];

    const defaultPhotos = [
      {
        date: new Date(),
        title: 'Footing Excavation and Bed Compaction Progress',
        category: 'Foundation & Excavation',
        locationTag: 'Grid A-1 to A-8',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80',
        capturedBy: 'Er. Sandeep Rathore',
        notes: 'Site excavation completed to hard stratum, ready for reinforcement placement.',
      },
      {
        date: new Date(),
        title: 'TMT Rebar Mesh Placement & Spacer Block Checking',
        category: 'RCC Structural Work',
        locationTag: 'Footing CF-01 to CF-08',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        capturedBy: 'Er. Sandeep Rathore',
        notes: 'High yield steel cages tied with 18 gauge binding wire.',
      },
    ];

    const totalLabourCost = defaultLabour.reduce((sum, item) => sum + (item.totalLabourCost || 0), 0);
    const totalManHours = defaultLabour.reduce((sum, item) => sum + (item.totalManHours || 0), 0);
    const totalMaterialCost = defaultConsumption.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    record = new ConstructionExecution({
      code,
      project: projectId,
      status: 'inProgress',
      dailyProgress: {
        dprLogs: defaultDpr,
      },
      labourTracking: {
        labourEntries: defaultLabour,
        totalManHours,
        totalLabourCost,
      },
      materialConsumption: {
        consumptionEntries: defaultConsumption,
        totalMaterialCost,
      },
      qualitySitePhotos: {
        qualityInspections: defaultQuality,
        sitePhotos: defaultPhotos,
        passRatePercent: 100,
      },
      totalDprCount: defaultDpr.length,
      totalManHours,
      totalLabourCost,
      totalMaterialCost,
      totalPhotosCount: defaultPhotos.length,
      overallPassRate: 100,
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'inProgress',
          by: userId,
          reason: 'Stage 8 Construction Execution mobilized and initiated',
          at: new Date(),
        },
      ],
    });

    await record.save();
    await this.syncStage8(projectId);

    const populated = await this.getRecordById(record._id);
    return { constructionExecution: populated, created: true };
  }

  async updateSection(id, sectionKey, data, userId = null) {
    if (!CONSTRUCTION_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await ConstructionExecution.findById(id);
    if (!record) {
      const err = new Error('Construction Execution record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Cannot modify approved construction execution record');
      err.statusCode = 400;
      throw err;
    }

    if (sectionKey === 'dailyProgress') {
      if (data.dprLogs) {
        record.dailyProgress.dprLogs = data.dprLogs;
        record.totalDprCount = data.dprLogs.length;
      }
      if (data.remarks !== undefined) record.dailyProgress.remarks = data.remarks;
    } else if (sectionKey === 'labourTracking') {
      if (data.labourEntries) {
        record.labourTracking.labourEntries = data.labourEntries.map((l) => {
          const hours = Number(l.hoursPerWorker || 8);
          const head = Number(l.headCount || 1);
          const rate = Number(l.dailyWageRate || 0);
          const totalManHours = hours * head;
          const totalLabourCost = head * rate;
          return {
            ...l,
            totalManHours,
            totalLabourCost,
          };
        });

        const totalManHours = record.labourTracking.labourEntries.reduce(
          (sum, item) => sum + (item.totalManHours || 0),
          0
        );
        const totalLabourCost = record.labourTracking.labourEntries.reduce(
          (sum, item) => sum + (item.totalLabourCost || 0),
          0
        );
        record.labourTracking.totalManHours = totalManHours;
        record.labourTracking.totalLabourCost = totalLabourCost;
        record.totalManHours = totalManHours;
        record.totalLabourCost = totalLabourCost;
      }
      if (data.remarks !== undefined) record.labourTracking.remarks = data.remarks;
    } else if (sectionKey === 'materialConsumption') {
      if (data.consumptionEntries) {
        record.materialConsumption.consumptionEntries = data.consumptionEntries.map((m) => {
          const qty = Number(m.quantityConsumed || 0);
          const rate = Number(m.unitRate || 0);
          return {
            ...m,
            totalCost: qty * rate,
          };
        });

        const totalCost = record.materialConsumption.consumptionEntries.reduce(
          (sum, item) => sum + (item.totalCost || 0),
          0
        );
        record.materialConsumption.totalMaterialCost = totalCost;
        record.totalMaterialCost = totalCost;
      }
      if (data.remarks !== undefined) record.materialConsumption.remarks = data.remarks;
    } else if (sectionKey === 'qualitySitePhotos') {
      if (data.qualityInspections) {
        record.qualitySitePhotos.qualityInspections = data.qualityInspections;
        const totalChecks = data.qualityInspections.length;
        const passedChecks = data.qualityInspections.filter(
          (c) => c.verdict === 'Passed' || c.verdict === 'Conditional Pass'
        ).length;
        const passRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
        record.qualitySitePhotos.passRatePercent = passRate;
        record.overallPassRate = passRate;
      }
      if (data.sitePhotos) {
        record.qualitySitePhotos.sitePhotos = data.sitePhotos;
        record.totalPhotosCount = data.sitePhotos.length;
      }
      if (data.remarks !== undefined) record.qualitySitePhotos.remarks = data.remarks;
    }

    record.dailyProgress.status = record.dailyProgress.dprLogs.length > 0 ? 'completed' : 'inProgress';
    record.labourTracking.status = record.labourTracking.labourEntries.length > 0 ? 'completed' : 'inProgress';
    record.materialConsumption.status = record.materialConsumption.consumptionEntries.length > 0 ? 'completed' : 'inProgress';
    record.qualitySitePhotos.status =
      record.qualitySitePhotos.qualityInspections.length > 0 && record.qualitySitePhotos.sitePhotos.length > 0
        ? 'completed'
        : 'inProgress';

    await record.save();
    return this.getRecordById(record._id);
  }

  async completeSection(id, sectionKey, remarks = '', userId = null) {
    if (!CONSTRUCTION_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await ConstructionExecution.findById(id);
    if (!record) {
      const err = new Error('Construction Execution record not found');
      err.statusCode = 404;
      throw err;
    }

    record[sectionKey].status = 'completed';
    record[sectionKey].remarks = remarks || record[sectionKey].remarks;
    record[sectionKey].completedBy = userId;
    record[sectionKey].completedAt = new Date();

    const allSectionsDone = CONSTRUCTION_SECTION_KEYS.every(
      (k) => record[k].status === 'completed'
    );

    if (allSectionsDone && record.status === 'inProgress') {
      record.status = 'reviewPending';
      record.statusHistory.push({
        from: 'inProgress',
        to: 'reviewPending',
        by: userId,
        reason: `All execution sections completed. Ready for Project Manager certification.`,
        at: new Date(),
      });
    }

    await record.save();
    return this.getRecordById(record._id);
  }

  async requestApproval(id, userId = null) {
    const record = await ConstructionExecution.findById(id);
    if (!record) {
      const err = new Error('Construction Execution record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Construction Execution record is already approved');
      err.statusCode = 400;
      throw err;
    }

    if (record.dailyProgress.dprLogs.length === 0) {
      const err = new Error('Cannot request approval without any Daily Progress Reports (DPR)');
      err.statusCode = 400;
      throw err;
    }

    const from = record.status;
    record.status = 'reviewPending';
    record.statusHistory.push({
      from,
      to: 'reviewPending',
      by: userId,
      reason: 'Submitted for Stage 8 Construction Execution Sign-off',
      at: new Date(),
    });

    await record.save();
    return this.getRecordById(record._id);
  }

  async decideApproval(id, { decision, reason = '' }, userId = null) {
    const record = await ConstructionExecution.findById(id);
    if (!record) {
      const err = new Error('Construction Execution record not found');
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
        reason: reason || 'Stage 8 Construction Execution certified and approved',
        at: new Date(),
      });

      await record.save();

      // Sync stage 8 to project
      await this.syncStage8(record.project, true);
    } else {
      record.status = 'rejected';
      record.isApproved = false;
      record.rejectionReason = reason;

      record.statusHistory.push({
        from,
        to: 'rejected',
        by: userId,
        reason: reason || 'Construction execution rejected / revisions required',
        at: new Date(),
      });

      await record.save();
    }

    return this.getRecordById(record._id);
  }

  async syncStage8(projectId, isApproved = false) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage8 = project.stages?.find((s) => s.order === 8 || s.key === 'construction');
    if (!stage8) return;

    const cex = await ConstructionExecution.findOne({ project: projectId }).lean();
    if (!cex) return;

    // Stage 8 checklist: ['Daily Progress (DPR)', 'Labour & Material Use', 'Quality Check', 'Site Photos']
    const hasDpr = (cex.dailyProgress?.dprLogs?.length || 0) > 0;
    const hasLabourAndMaterial =
      (cex.labourTracking?.labourEntries?.length || 0) > 0 ||
      (cex.materialConsumption?.consumptionEntries?.length || 0) > 0;
    const hasQuality = (cex.qualitySitePhotos?.qualityInspections?.length || 0) > 0;
    const hasPhotos = (cex.qualitySitePhotos?.sitePhotos?.length || 0) > 0;
    const isOfficiallyApproved = isApproved || cex.status === 'approved' || cex.isApproved;

    if (stage8.checklist?.[0]) {
      stage8.checklist[0].done = hasDpr;
      stage8.checklist[0].auto = true;
    }
    if (stage8.checklist?.[1]) {
      stage8.checklist[1].done = hasLabourAndMaterial;
      stage8.checklist[1].auto = true;
    }
    if (stage8.checklist?.[2]) {
      stage8.checklist[2].done = hasQuality;
      stage8.checklist[2].auto = true;
    }
    if (stage8.checklist?.[3]) {
      stage8.checklist[3].done = hasPhotos;
      stage8.checklist[3].auto = true;
    }

    if (isOfficiallyApproved) {
      stage8.approved = true;
      stage8.approvedAt = new Date();
      project.stageOrder = Math.max(project.stageOrder || 8, 9);
    }

    await project.save();
  }
}

module.exports = new ConstructionExecutionService();
