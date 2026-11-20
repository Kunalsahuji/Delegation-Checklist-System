const mongoose = require('mongoose');
const ProjectControl = require('../models/projectControl.model');
const PmsProject = require('../models/pmsProject.model');
const BaselinePlanning = require('../models/baselinePlanning.model');
const ConstructionExecution = require('../models/constructionExecution.model');
const ProcurementInventory = require('../models/procurementInventory.model');
const {
  CONTROL_SECTION_KEYS,
  PROJECT_CONTROL_STATUS,
} = require('../constants/pms.constants');

class ProjectControlService {
  async getKPIs() {
    const [agg] = await ProjectControl.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withinBudget: {
            $sum: { $cond: [{ $eq: ['$isWithinBudget', true] }, 1, 0] },
          },
          costOverrun: {
            $sum: { $cond: [{ $eq: ['$isWithinBudget', false] }, 1, 0] },
          },
          scheduleDelayed: {
            $sum: { $cond: [{ $eq: ['$isScheduleDelayed', true] }, 1, 0] },
          },
          totalCostVariance: { $sum: '$overallCostVariance' },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          avgCpi: { $avg: '$cpi' },
          avgSpi: { $avg: '$spi' },
        },
      },
    ]);

    return {
      total: agg?.total || 0,
      withinBudget: agg?.withinBudget || 0,
      costOverrun: agg?.costOverrun || 0,
      scheduleDelayed: agg?.scheduleDelayed || 0,
      totalCostVariance: agg?.totalCostVariance || 0,
      approved: agg?.approved || 0,
      avgCpi: agg?.avgCpi ? Number(agg.avgCpi.toFixed(2)) : 1.0,
      avgSpi: agg?.avgSpi ? Number(agg.avgSpi.toFixed(2)) : 1.0,
    };
  }

  async listRecords(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      projectId,
      withinBudget,
      costOverrun,
      scheduleDelayed,
      hasVariance,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (withinBudget === true || withinBudget === 'true') {
      filter.isWithinBudget = true;
    }

    if (costOverrun === true || costOverrun === 'true') {
      filter.isWithinBudget = false;
    }

    if (scheduleDelayed === true || scheduleDelayed === 'true') {
      filter.isScheduleDelayed = true;
    }

    if (hasVariance === true || hasVariance === 'true') {
      filter.$or = [
        { overallCostVariance: { $ne: 0 } },
        { 'materialVariance.items.0': { $exists: true } },
      ];
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
        { project: { $in: projectIds } },
      ];
    }

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (numericPage - 1) * numericLimit;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [records, total] = await Promise.all([
      ProjectControl.find(filter)
        .populate('project', 'name code location status stageOrder baselineLocked')
        .populate('approvedBy', 'name email role')
        .populate('createdBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      ProjectControl.countDocuments(filter),
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
      const err = new Error('Invalid Project Control ID');
      err.statusCode = 400;
      throw err;
    }

    const record = await ProjectControl.findById(id)
      .populate('project', 'name code location status stageOrder baselineLocked')
      .populate('approvedBy', 'name email role')
      .populate('createdBy', 'name email')
      .populate('materialVariance.completedBy', 'name email')
      .populate('labourVariance.completedBy', 'name email')
      .populate('timeVariance.completedBy', 'name email')
      .populate('costVariance.completedBy', 'name email')
      .populate('statusHistory.by', 'name email');

    if (!record) {
      const err = new Error('Project Control record not found');
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
    let record = await ProjectControl.findOne({ project: projectId });
    if (record) {
      return { projectControl: await this.getRecordById(record._id), created: false };
    }

    // Retrieve baseline and execution records to seed realistic variances
    const [baseline, construction, procurement] = await Promise.all([
      BaselinePlanning.findOne({ project: projectId }).lean(),
      ConstructionExecution.findOne({ project: projectId }).lean(),
      ProcurementInventory.findOne({ project: projectId }).lean(),
    ]);

    const count = await ProjectControl.countDocuments();
    const code = `PC-${String(count + 1).padStart(6, '0')}`;

    // 1. Material Variance Items
    const defaultMaterials = [
      {
        materialName: 'OPC 53 Grade Cement',
        category: 'cement',
        unit: 'Bags',
        baselineQty: 2500,
        actualQty: 2420,
        qtyVariance: -80,
        baselineRate: 380,
        actualRate: 380,
        rateVariance: 0,
        baselineCost: 950000,
        actualCost: 919600,
        costVariance: -30400,
        varianceType: 'Favorable',
        remarks: 'Optimal slump achieved with water-reducing plasticizer, saving 80 bags.',
      },
      {
        materialName: 'Fe 550D TMT Reinforcement Steel',
        category: 'steel',
        unit: 'MT',
        baselineQty: 40,
        actualQty: 41.5,
        qtyVariance: 1.5,
        baselineRate: 62000,
        actualRate: 63500,
        rateVariance: 1500,
        baselineCost: 2480000,
        actualCost: 2635250,
        costVariance: 155250,
        varianceType: 'Adverse',
        remarks: 'Market price inflation +2.4% and additional lap length requirement on foundations.',
      },
      {
        materialName: 'Coarse River Sand',
        category: 'sand',
        unit: 'MT',
        baselineQty: 200,
        actualQty: 195,
        qtyVariance: -5,
        baselineRate: 1400,
        actualRate: 1350,
        rateVariance: -50,
        baselineCost: 280000,
        actualCost: 263250,
        costVariance: -16750,
        varianceType: 'Favorable',
        remarks: 'Bulk quarry direct discount secured.',
      },
      {
        materialName: '20mm Blue Metal Basalt',
        category: 'aggregate',
        unit: 'MT',
        baselineQty: 280,
        actualQty: 285,
        qtyVariance: 5,
        baselineRate: 950,
        actualRate: 950,
        rateVariance: 0,
        baselineCost: 266000,
        actualCost: 270750,
        costVariance: 4750,
        varianceType: 'Adverse',
        remarks: 'Slightly higher compaction allowance on sub-base.',
      },
    ];

    const totalBaselineMaterialCost = defaultMaterials.reduce((sum, i) => sum + i.baselineCost, 0);
    const totalActualMaterialCost = defaultMaterials.reduce((sum, i) => sum + i.actualCost, 0);
    const netMaterialVariance = totalActualMaterialCost - totalBaselineMaterialCost;

    // 2. Labour Variance Items
    const defaultLabour = [
      {
        trade: 'Civil & Masonry Gang',
        contractorName: 'Apex Civil Infra & RCC Contractors',
        baselineManHours: 800,
        actualManHours: 820,
        manHoursVariance: 20,
        baselineRate: 100,
        actualRate: 100,
        baselineCost: 80000,
        actualCost: 82000,
        costVariance: 2000,
        varianceType: 'Adverse',
        remarks: 'Additional curing shifts assigned during summer days.',
      },
      {
        trade: 'Bar Bending & Steel Gang',
        contractorName: 'Apex Civil Infra & RCC Contractors',
        baselineManHours: 500,
        actualManHours: 480,
        manHoursVariance: -20,
        baselineRate: 110,
        actualRate: 110,
        baselineCost: 55000,
        actualCost: 52800,
        costVariance: -2200,
        varianceType: 'Favorable',
        remarks: 'Rebar cutting machine improved throughput speed.',
      },
      {
        trade: 'Shuttering & Formwork Gang',
        contractorName: 'Royal Shuttering Works',
        baselineManHours: 500,
        actualManHours: 490,
        manHoursVariance: -10,
        baselineRate: 105,
        actualRate: 105,
        baselineCost: 52500,
        actualCost: 51450,
        costVariance: -1050,
        varianceType: 'Favorable',
        remarks: 'Modular shuttering panels reduced cycle time.',
      },
    ];

    const totalBaselineLabourCost = defaultLabour.reduce((sum, i) => sum + i.baselineCost, 0);
    const totalActualLabourCost = defaultLabour.reduce((sum, i) => sum + i.actualCost, 0);
    const netLabourVariance = totalActualLabourCost - totalBaselineLabourCost;

    // 3. Time Milestones
    const defaultMilestones = [
      {
        milestoneName: 'Site Mobilization & Excavation',
        baselineStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        baselineEnd: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        actualStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        actualEnd: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        varianceDays: -2,
        status: 'Ahead',
        criticalPathImpact: false,
        mitigationAction: 'Completed 2 days ahead of schedule.',
      },
      {
        milestoneName: 'Foundation PCC & Column Footings Pouring',
        baselineStart: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        baselineEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        actualStart: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        actualEnd: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        varianceDays: 1,
        status: 'On Schedule',
        criticalPathImpact: false,
        mitigationAction: 'Within 1 day variance buffer.',
      },
      {
        milestoneName: 'Plinth Beam Casting & Backfilling',
        baselineStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        baselineEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        actualStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        actualEnd: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        varianceDays: 2,
        status: 'On Schedule',
        criticalPathImpact: false,
        mitigationAction: 'Night shift curing deployed to maintain cycle.',
      },
    ];

    // 4. Overall Cost Variance
    const baselineBudgetTotal = totalBaselineMaterialCost + totalBaselineLabourCost + 500000; // adding plant/machinery
    const actualCostToDate = totalActualMaterialCost + totalActualLabourCost + 490000;
    const costVarianceAmount = actualCostToDate - baselineBudgetTotal;
    const cpi = Number((baselineBudgetTotal / actualCostToDate).toFixed(2));
    const spi = 1.0;
    const isWithinBudget = costVarianceAmount <= 150000; // within 3% tolerance buffer

    record = new ProjectControl({
      code,
      project: projectId,
      status: 'monitoring',
      materialVariance: {
        items: defaultMaterials,
        totalBaselineMaterialCost,
        totalActualMaterialCost,
        netMaterialVariance,
      },
      labourVariance: {
        items: defaultLabour,
        totalBaselineLabourCost,
        totalActualLabourCost,
        netLabourVariance,
      },
      timeVariance: {
        milestones: defaultMilestones,
        overallScheduleDelayDays: 1,
      },
      costVariance: {
        baselineBudgetTotal,
        actualCostToDate,
        costVarianceAmount,
        cpi,
        spi,
        estimateAtCompletion: actualCostToDate + 1200000,
        costStatus: isWithinBudget ? 'Within Budget' : 'Moderate Overrun',
        mitigationPlan: 'Rate contract locked for remaining steel and bulk purchase negotiated.',
      },
      overallCostVariance: costVarianceAmount,
      isWithinBudget,
      isScheduleDelayed: false,
      cpi,
      spi,
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'monitoring',
          by: userId,
          reason: 'Stage 10 Project Control & Variance Monitor initiated',
          at: new Date(),
        },
      ],
    });

    await record.save();
    await this.syncStage10(projectId);

    const populated = await this.getRecordById(record._id);
    return { projectControl: populated, created: true };
  }

  async updateSection(id, sectionKey, data, userId = null) {
    if (!CONTROL_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await ProjectControl.findById(id);
    if (!record) {
      const err = new Error('Project Control record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Cannot modify approved project control record');
      err.statusCode = 400;
      throw err;
    }

    if (sectionKey === 'materialVariance') {
      if (data.items) {
        record.materialVariance.items = data.items.map((i) => {
          const bQty = Number(i.baselineQty || 0);
          const aQty = Number(i.actualQty || 0);
          const bRate = Number(i.baselineRate || 0);
          const aRate = Number(i.actualRate || 0);
          const bCost = bQty * bRate;
          const aCost = aQty * aRate;
          const costVar = aCost - bCost;
          return {
            ...i,
            qtyVariance: aQty - bQty,
            rateVariance: aRate - bRate,
            baselineCost: bCost,
            actualCost: aCost,
            costVariance: costVar,
            varianceType: costVar > 0 ? 'Adverse' : costVar < 0 ? 'Favorable' : 'Neutral',
          };
        });

        const totalB = record.materialVariance.items.reduce((sum, item) => sum + item.baselineCost, 0);
        const totalA = record.materialVariance.items.reduce((sum, item) => sum + item.actualCost, 0);
        record.materialVariance.totalBaselineMaterialCost = totalB;
        record.materialVariance.totalActualMaterialCost = totalA;
        record.materialVariance.netMaterialVariance = totalA - totalB;
      }
      if (data.remarks !== undefined) record.materialVariance.remarks = data.remarks;
    } else if (sectionKey === 'labourVariance') {
      if (data.items) {
        record.labourVariance.items = data.items.map((i) => {
          const bHours = Number(i.baselineManHours || 0);
          const aHours = Number(i.actualManHours || 0);
          const bRate = Number(i.baselineRate || 0);
          const aRate = Number(i.actualRate || 0);
          const bCost = bHours * bRate;
          const aCost = aHours * aRate;
          const costVar = aCost - bCost;
          return {
            ...i,
            manHoursVariance: aHours - bHours,
            baselineCost: bCost,
            actualCost: aCost,
            costVariance: costVar,
            varianceType: costVar > 0 ? 'Adverse' : costVar < 0 ? 'Favorable' : 'Neutral',
          };
        });

        const totalB = record.labourVariance.items.reduce((sum, item) => sum + item.baselineCost, 0);
        const totalA = record.labourVariance.items.reduce((sum, item) => sum + item.actualCost, 0);
        record.labourVariance.totalBaselineLabourCost = totalB;
        record.labourVariance.totalActualLabourCost = totalA;
        record.labourVariance.netLabourVariance = totalA - totalB;
      }
      if (data.remarks !== undefined) record.labourVariance.remarks = data.remarks;
    } else if (sectionKey === 'timeVariance') {
      if (data.milestones) {
        record.timeVariance.milestones = data.milestones;
        const delayed = data.milestones.some((m) => m.varianceDays > 7);
        const totalDelay = data.milestones.reduce((max, m) => Math.max(max, m.varianceDays || 0), 0);
        record.timeVariance.overallScheduleDelayDays = totalDelay;
        record.isScheduleDelayed = delayed;
      }
      if (data.remarks !== undefined) record.timeVariance.remarks = data.remarks;
    } else if (sectionKey === 'costVariance') {
      if (data.baselineBudgetTotal !== undefined) {
        record.costVariance.baselineBudgetTotal = Number(data.baselineBudgetTotal);
      }
      if (data.actualCostToDate !== undefined) {
        record.costVariance.actualCostToDate = Number(data.actualCostToDate);
      }
      if (data.mitigationPlan !== undefined) {
        record.costVariance.mitigationPlan = data.mitigationPlan;
      }

      const totalB = record.costVariance.baselineBudgetTotal;
      const totalA = record.costVariance.actualCostToDate;
      const variance = totalA - totalB;
      const cpi = totalA > 0 ? Number((totalB / totalA).toFixed(2)) : 1.0;

      record.costVariance.costVarianceAmount = variance;
      record.costVariance.cpi = cpi;
      record.costVariance.estimateAtCompletion = totalA + (totalB - totalA > 0 ? totalB - totalA : 0);
      record.overallCostVariance = variance;
      record.cpi = cpi;
      record.isWithinBudget = cpi >= 0.95;
      record.costVariance.costStatus =
        cpi >= 1.0 ? 'Within Budget' : cpi >= 0.9 ? 'Moderate Overrun' : 'Critical Overrun';

      if (data.remarks !== undefined) record.costVariance.remarks = data.remarks;
    }

    record.materialVariance.status =
      record.materialVariance.items.length > 0 ? 'completed' : 'inProgress';
    record.labourVariance.status =
      record.labourVariance.items.length > 0 ? 'completed' : 'inProgress';
    record.timeVariance.status =
      record.timeVariance.milestones.length > 0 ? 'completed' : 'inProgress';
    record.costVariance.status =
      record.costVariance.actualCostToDate > 0 ? 'completed' : 'inProgress';

    await record.save();
    return this.getRecordById(record._id);
  }

  async completeSection(id, sectionKey, remarks = '', userId = null) {
    if (!CONTROL_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await ProjectControl.findById(id);
    if (!record) {
      const err = new Error('Project Control record not found');
      err.statusCode = 404;
      throw err;
    }

    record[sectionKey].status = 'completed';
    record[sectionKey].remarks = remarks || record[sectionKey].remarks;
    record[sectionKey].completedBy = userId;
    record[sectionKey].completedAt = new Date();

    const allSectionsDone = CONTROL_SECTION_KEYS.every(
      (k) => record[k].status === 'completed'
    );

    if (allSectionsDone && record.status === 'monitoring') {
      record.status = 'approvalPending';
      record.statusHistory.push({
        from: 'monitoring',
        to: 'approvalPending',
        by: userId,
        reason: 'All Variance & Control sections analyzed. Submitted for Management Sign-off.',
        at: new Date(),
      });
    }

    await record.save();
    return this.getRecordById(record._id);
  }

  async requestApproval(id, userId = null) {
    const record = await ProjectControl.findById(id);
    if (!record) {
      const err = new Error('Project Control record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Project Control record is already approved');
      err.statusCode = 400;
      throw err;
    }

    const from = record.status;
    record.status = 'approvalPending';
    record.statusHistory.push({
      from,
      to: 'approvalPending',
      by: userId,
      reason: 'Submitted for Stage 10 Variance & Project Control Certification',
      at: new Date(),
    });

    await record.save();
    return this.getRecordById(record._id);
  }

  async decideApproval(id, { decision, reason = '' }, userId = null) {
    const record = await ProjectControl.findById(id);
    if (!record) {
      const err = new Error('Project Control record not found');
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
        reason: reason || 'Stage 10 Variance & Cost Control certified and approved',
        at: new Date(),
      });

      await record.save();

      // Sync stage 10 to project
      await this.syncStage10(record.project, true);
    } else {
      record.status = 'rejected';
      record.isApproved = false;
      record.rejectionReason = reason;

      record.statusHistory.push({
        from,
        to: 'rejected',
        by: userId,
        reason: reason || 'Project control rejected / mitigation plan required',
        at: new Date(),
      });

      await record.save();
    }

    return this.getRecordById(record._id);
  }

  async syncStage10(projectId, isApproved = false) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage10 = project.stages?.find((s) => s.order === 10 || s.key === 'projectControl');
    if (!stage10) return;

    const pc = await ProjectControl.findOne({ project: projectId }).lean();
    if (!pc) return;

    // Stage 10 checklist: ['Material Variance', 'Labour Variance', 'Time Variance', 'Cost Variance']
    const hasMatVar = (pc.materialVariance?.items?.length || 0) > 0;
    const hasLabVar = (pc.labourVariance?.items?.length || 0) > 0;
    const hasTimeVar = (pc.timeVariance?.milestones?.length || 0) > 0;
    const hasCostVar = (pc.costVariance?.actualCostToDate || 0) > 0;
    const isOfficiallyApproved = isApproved || pc.status === 'approved' || pc.isApproved;

    if (stage10.checklist?.[0]) {
      stage10.checklist[0].done = hasMatVar;
      stage10.checklist[0].auto = true;
    }
    if (stage10.checklist?.[1]) {
      stage10.checklist[1].done = hasLabVar;
      stage10.checklist[1].auto = true;
    }
    if (stage10.checklist?.[2]) {
      stage10.checklist[2].done = hasTimeVar;
      stage10.checklist[2].auto = true;
    }
    if (stage10.checklist?.[3]) {
      stage10.checklist[3].done = hasCostVar;
      stage10.checklist[3].auto = true;
    }

    if (isOfficiallyApproved) {
      stage10.approved = true;
      stage10.approvedAt = new Date();
      // Advance project to Stage 11: finance
      project.stageOrder = Math.max(project.stageOrder || 10, 11);
    }

    await project.save();
  }
}

module.exports = new ProjectControlService();
