const mongoose = require('mongoose');
const QualityControl = require('../models/qualityControl.model');
const PmsProject = require('../models/pmsProject.model');
const {
  QUALITY_SECTION_KEYS,
  QUALITY_STATUS,
} = require('../constants/pms.constants');

class QualityControlService {
  async getKPIs() {
    const [agg] = await QualityControl.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          inProgress: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    ['inProgress', 'inspectionPending', 'snaggingActive', 'rectificationUnderway'],
                  ],
                },
                1,
                0,
              ],
            },
          },
          reviewPending: {
            $sum: { $cond: [{ $eq: ['$status', 'approvalPending'] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          totalInspections: { $sum: '$totalInspectionsCount' },
          totalSnags: { $sum: '$totalSnags' },
          openSnags: { $sum: '$openSnags' },
          rectifiedSnags: { $sum: '$rectifiedSnags' },
        },
      },
    ]);

    const total = agg?.total || 0;
    const totalSnags = agg?.totalSnags || 0;
    const rectifiedSnags = agg?.rectifiedSnags || 0;
    const avgClosureRate = totalSnags > 0 ? Math.round((rectifiedSnags / totalSnags) * 100) : 100;

    return {
      total,
      inProgress: agg?.inProgress || 0,
      reviewPending: agg?.reviewPending || 0,
      approved: agg?.approved || 0,
      totalInspections: agg?.totalInspections || 0,
      totalSnags,
      openSnags: agg?.openSnags || 0,
      rectifiedSnags,
      avgClosureRate,
    };
  }

  async listRecords(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      projectId,
      hasOpenSnags,
      hasInspections,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status && status !== 'all') {
      if (status === 'inProgress') {
        filter.status = {
          $in: ['inProgress', 'inspectionPending', 'snaggingActive', 'rectificationUnderway'],
        };
      } else if (status === 'hasOpenSnags') {
        filter.openSnags = { $gt: 0 };
      } else if (status === 'hasInspections') {
        filter.totalInspectionsCount = { $gt: 0 };
      } else {
        filter.status = status;
      }
    }

    if (projectId) {
      filter.project = projectId;
    }

    if (hasOpenSnags === true || hasOpenSnags === 'true') {
      filter.openSnags = { $gt: 0 };
    }

    if (hasInspections === true || hasInspections === 'true') {
      filter.totalInspectionsCount = { $gt: 0 };
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
      QualityControl.find(filter)
        .populate('project', 'name code location status stageOrder baselineLocked')
        .populate('approvedBy', 'name email role')
        .populate('createdBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      QualityControl.countDocuments(filter),
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
      const err = new Error('Invalid Quality Control ID');
      err.statusCode = 400;
      throw err;
    }

    const record = await QualityControl.findById(id)
      .populate('project', 'name code location status stageOrder baselineLocked')
      .populate('approvedBy', 'name email role')
      .populate('createdBy', 'name email')
      .populate('stageInspection.completedBy', 'name email')
      .populate('engineerApproval.completedBy', 'name email')
      .populate('snagList.completedBy', 'name email')
      .populate('rectification.completedBy', 'name email')
      .populate('statusHistory.by', 'name email');

    if (!record) {
      const err = new Error('Quality Control record not found');
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
    let record = await QualityControl.findOne({ project: projectId });
    if (record) {
      return { qualityControl: await this.getRecordById(record._id), created: false };
    }

    // Generate code
    const count = await QualityControl.countDocuments();
    const code = `QC-${String(count + 1).padStart(6, '0')}`;

    // Sample default Inspections
    const defaultInspections = [
      {
        stage: 'RCC Superstructure & Slab Casting',
        locationOrElement: 'First Floor Slab & Beams B1-B12',
        inspectionDate: new Date(),
        inspector: 'Er. Sandeep Rathore',
        standardCode: 'IS 456:2000',
        tolerancePermitted: '±3mm',
        toleranceMeasured: '+1.5mm',
        result: 'Pass',
        notes: 'Reinforcement cover blocks checked (25mm slab, 30mm beams). Concrete slump test 120mm achieved.',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80',
      },
      {
        stage: 'Masonry & Brickwork',
        locationOrElement: 'Ground Floor External Perimeter Walls',
        inspectionDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        inspector: 'Er. Sandeep Rathore',
        standardCode: 'IS 2212:1991',
        tolerancePermitted: '±5mm vertical plumb',
        toleranceMeasured: '+2mm',
        result: 'Pass',
        notes: 'Red clay bricks soaked before laying. Mortar ratio 1:5 verified. Proper racking of joints.',
        photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      },
      {
        stage: 'Plumbing Pressure & Hydro Testing',
        locationOrElement: 'Water Supply Riser Lines & Toilet Core',
        inspectionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        inspector: 'Er. Sandeep Rathore',
        standardCode: 'IS 2065:1983',
        tolerancePermitted: '10 kg/cm2 for 4 hours',
        toleranceMeasured: '10 kg/cm2 steady',
        result: 'Pass',
        notes: 'Hydrostatic pressure test successfully conducted on CPVC pipes. Zero pressure drop observed.',
        photoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
      },
    ];

    // Default Checklist Verifications
    const defaultVerifications = [
      {
        criteria: 'Concrete cube compressive strength 28-day lab test report verified (>= M25)',
        verified: true,
        engineerRemarks: 'Average strength achieved 29.4 N/mm2. Approved.',
        verifiedDate: new Date(),
      },
      {
        criteria: 'Steel rebar mill test certification (Fe 550D) batch test verified',
        verified: true,
        engineerRemarks: 'Yield strength and elongation within BIS specifications.',
        verifiedDate: new Date(),
      },
      {
        criteria: 'Formwork deshirring and line level survey conducted post de-shuttering',
        verified: true,
        engineerRemarks: 'Surface level tolerances within allowable limits.',
        verifiedDate: new Date(),
      },
      {
        criteria: 'Waterproofing ponding test (72 hours standing water check)',
        verified: true,
        engineerRemarks: 'Zero dampness or seepage detected on soffits.',
        verifiedDate: new Date(),
      },
    ];

    // Default Initial Snags
    const defaultSnags = [
      {
        snagCode: `SNG-${project.code || 'PRJ'}-001`,
        category: 'Civil & Structural',
        description: 'Honeycombing observed near beam-column junction B4 on First Floor.',
        location: 'First Floor Grid B-4',
        severity: 'Medium',
        assignedContractor: 'Apex Civil Infra & RCC Contractors',
        targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'rectified',
        photoBefore: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        dateIdentified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        snagCode: `SNG-${project.code || 'PRJ'}-002`,
        category: 'Plumbing & Drainage',
        description: 'Cleanout plug thread loose on rainwater vertical downpipe stack.',
        location: 'Shaft 2 - Ground Floor',
        severity: 'Low',
        assignedContractor: 'Supreme Pipes & Plumbing Works',
        targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'verifiedClosed',
        photoBefore: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
        dateIdentified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        snagCode: `SNG-${project.code || 'PRJ'}-003`,
        category: 'Painting & Finishing',
        description: 'Plaster waviness and uneven trowel marks on exterior boundary wall.',
        location: 'East Boundary Wall Bay 3',
        severity: 'Low',
        assignedContractor: 'Apex Civil Infra & RCC Contractors',
        targetDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        status: 'inProgress',
        photoBefore: '',
        dateIdentified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    // Default Rectifications
    const defaultClosures = [
      {
        snagCode: `SNG-${project.code || 'PRJ'}-001`,
        rectificationDate: new Date(),
        contractorNotes: 'Chipped off loose aggregate, cleaned with air blow, and applied non-shrink epoxy grout (Fosroc Conbextra GP).',
        photoAfter: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        verifiedBy: 'Er. Sandeep Rathore',
        isApprovedClosure: true,
        closureNotes: 'Grout cured and sound hammer test performed. Approved.',
      },
      {
        snagCode: `SNG-${project.code || 'PRJ'}-002`,
        rectificationDate: new Date(),
        contractorNotes: 'Replaced defective threaded plug with brass end cap and Teflon sealing tape.',
        photoAfter: '',
        verifiedBy: 'Er. Sandeep Rathore',
        isApprovedClosure: true,
        closureNotes: 'Leak test re-conducted. Passed.',
      },
    ];

    const totalInspectionsCount = defaultInspections.length;
    const totalSnags = defaultSnags.length;
    const openSnags = defaultSnags.filter((s) => s.status === 'identified' || s.status === 'inProgress').length;
    const rectifiedSnags = defaultSnags.filter((s) => s.status === 'rectified' || s.status === 'verifiedClosed').length;
    const snagClosureRate = totalSnags > 0 ? Math.round((rectifiedSnags / totalSnags) * 100) : 100;

    record = new QualityControl({
      code,
      project: projectId,
      status: 'inProgress',
      stageInspection: {
        inspections: defaultInspections,
      },
      engineerApproval: {
        checklistVerifications: defaultVerifications,
        leadEngineerName: 'Er. Sandeep Rathore',
        signOffVerdict: 'Approved',
      },
      snagList: {
        snags: defaultSnags,
        totalSnagsCount: totalSnags,
        openSnagsCount: openSnags,
      },
      rectification: {
        closures: defaultClosures,
        rectifiedCount: rectifiedSnags,
        closureRatePercent: snagClosureRate,
      },
      totalInspectionsCount,
      inspectionPassRate: 100,
      totalSnags,
      openSnags,
      rectifiedSnags,
      snagClosureRate,
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'inProgress',
          by: userId,
          reason: 'Stage 9 Quality Control & Snag Register initiated',
          at: new Date(),
        },
      ],
    });

    await record.save();
    await this.syncStage9(projectId);

    const populated = await this.getRecordById(record._id);
    return { qualityControl: populated, created: true };
  }

  async updateSection(id, sectionKey, data, userId = null) {
    if (!QUALITY_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await QualityControl.findById(id);
    if (!record) {
      const err = new Error('Quality Control record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Cannot modify approved quality control record');
      err.statusCode = 400;
      throw err;
    }

    if (sectionKey === 'stageInspection') {
      if (data.inspections) {
        record.stageInspection.inspections = data.inspections;
        const total = data.inspections.length;
        const passed = data.inspections.filter(
          (i) => i.result === 'Pass' || i.result === 'Conditional Pass'
        ).length;
        record.totalInspectionsCount = total;
        record.inspectionPassRate = total > 0 ? Math.round((passed / total) * 100) : 100;
      }
      if (data.remarks !== undefined) record.stageInspection.remarks = data.remarks;
    } else if (sectionKey === 'engineerApproval') {
      if (data.checklistVerifications) {
        record.engineerApproval.checklistVerifications = data.checklistVerifications;
      }
      if (data.leadEngineerName) record.engineerApproval.leadEngineerName = data.leadEngineerName;
      if (data.signOffVerdict) record.engineerApproval.signOffVerdict = data.signOffVerdict;
      if (data.remarks !== undefined) record.engineerApproval.remarks = data.remarks;
    } else if (sectionKey === 'snagList') {
      if (data.snags) {
        record.snagList.snags = data.snags;
        const totalSnags = data.snags.length;
        const openSnags = data.snags.filter(
          (s) => s.status === 'identified' || s.status === 'inProgress'
        ).length;
        const rectifiedSnags = data.snags.filter(
          (s) => s.status === 'rectified' || s.status === 'verifiedClosed'
        ).length;
        const closureRate = totalSnags > 0 ? Math.round((rectifiedSnags / totalSnags) * 100) : 100;

        record.snagList.totalSnagsCount = totalSnags;
        record.snagList.openSnagsCount = openSnags;
        record.totalSnags = totalSnags;
        record.openSnags = openSnags;
        record.rectifiedSnags = rectifiedSnags;
        record.snagClosureRate = closureRate;
      }
      if (data.remarks !== undefined) record.snagList.remarks = data.remarks;
    } else if (sectionKey === 'rectification') {
      if (data.closures) {
        record.rectification.closures = data.closures;

        // Auto-update status of matching snags in snagList
        const closedCodes = new Set(data.closures.map((c) => c.snagCode));
        record.snagList.snags.forEach((s) => {
          if (closedCodes.has(s.snagCode)) {
            s.status = 'verifiedClosed';
          }
        });

        const totalSnags = record.snagList.snags.length;
        const openSnags = record.snagList.snags.filter(
          (s) => s.status === 'identified' || s.status === 'inProgress'
        ).length;
        const rectifiedSnags = record.snagList.snags.filter(
          (s) => s.status === 'rectified' || s.status === 'verifiedClosed'
        ).length;
        const closureRate = totalSnags > 0 ? Math.round((rectifiedSnags / totalSnags) * 100) : 100;

        record.snagList.totalSnagsCount = totalSnags;
        record.snagList.openSnagsCount = openSnags;
        record.rectification.rectifiedCount = rectifiedSnags;
        record.rectification.closureRatePercent = closureRate;
        record.totalSnags = totalSnags;
        record.openSnags = openSnags;
        record.rectifiedSnags = rectifiedSnags;
        record.snagClosureRate = closureRate;
      }
      if (data.remarks !== undefined) record.rectification.remarks = data.remarks;
    }

    record.stageInspection.status =
      record.stageInspection.inspections.length > 0 ? 'completed' : 'inProgress';
    record.engineerApproval.status =
      record.engineerApproval.checklistVerifications.length > 0 ? 'completed' : 'inProgress';
    record.snagList.status = record.snagList.snags.length > 0 ? 'completed' : 'inProgress';
    record.rectification.status =
      record.rectification.closures.length > 0 ? 'completed' : 'inProgress';

    await record.save();
    return this.getRecordById(record._id);
  }

  async completeSection(id, sectionKey, remarks = '', userId = null) {
    if (!QUALITY_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await QualityControl.findById(id);
    if (!record) {
      const err = new Error('Quality Control record not found');
      err.statusCode = 404;
      throw err;
    }

    record[sectionKey].status = 'completed';
    record[sectionKey].remarks = remarks || record[sectionKey].remarks;
    record[sectionKey].completedBy = userId;
    record[sectionKey].completedAt = new Date();

    const allSectionsDone = QUALITY_SECTION_KEYS.every(
      (k) => record[k].status === 'completed'
    );

    if (allSectionsDone && record.status === 'inProgress') {
      record.status = 'approvalPending';
      record.statusHistory.push({
        from: 'inProgress',
        to: 'approvalPending',
        by: userId,
        reason: 'All Quality & Snag sections completed. Submitted for PM Quality Sign-off.',
        at: new Date(),
      });
    }

    await record.save();
    return this.getRecordById(record._id);
  }

  async requestApproval(id, userId = null) {
    const record = await QualityControl.findById(id);
    if (!record) {
      const err = new Error('Quality Control record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Quality Control record is already approved');
      err.statusCode = 400;
      throw err;
    }

    if (record.stageInspection.inspections.length === 0) {
      const err = new Error('Cannot request approval without completing any Stage Inspections');
      err.statusCode = 400;
      throw err;
    }

    const from = record.status;
    record.status = 'approvalPending';
    record.statusHistory.push({
      from,
      to: 'approvalPending',
      by: userId,
      reason: 'Submitted for Stage 9 Quality Control Certification',
      at: new Date(),
    });

    await record.save();
    return this.getRecordById(record._id);
  }

  async decideApproval(id, { decision, reason = '' }, userId = null) {
    const record = await QualityControl.findById(id);
    if (!record) {
      const err = new Error('Quality Control record not found');
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
        reason: reason || 'Stage 9 Quality Control & Snags certified and approved',
        at: new Date(),
      });

      await record.save();

      // Sync stage 9 to project
      await this.syncStage9(record.project, true);
    } else {
      record.status = 'rejected';
      record.isApproved = false;
      record.rejectionReason = reason;

      record.statusHistory.push({
        from,
        to: 'rejected',
        by: userId,
        reason: reason || 'Quality control rejected / rectification incomplete',
        at: new Date(),
      });

      await record.save();
    }

    return this.getRecordById(record._id);
  }

  async syncStage9(projectId, isApproved = false) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage9 = project.stages?.find((s) => s.order === 9 || s.key === 'qualityControl');
    if (!stage9) return;

    const qc = await QualityControl.findOne({ project: projectId }).lean();
    if (!qc) return;

    // Stage 9 checklist: ['Stage Inspection', 'Engineer Approval', 'Snag List', 'Rectification']
    const hasInspection = (qc.stageInspection?.inspections?.length || 0) > 0;
    const hasApproval = (qc.engineerApproval?.checklistVerifications?.length || 0) > 0;
    const hasSnagList = (qc.snagList?.snags?.length || 0) > 0;
    const hasRectification = (qc.rectification?.closures?.length || 0) > 0;
    const isOfficiallyApproved = isApproved || qc.status === 'approved' || qc.isApproved;

    if (stage9.checklist?.[0]) {
      stage9.checklist[0].done = hasInspection;
      stage9.checklist[0].auto = true;
    }
    if (stage9.checklist?.[1]) {
      stage9.checklist[1].done = hasApproval;
      stage9.checklist[1].auto = true;
    }
    if (stage9.checklist?.[2]) {
      stage9.checklist[2].done = hasSnagList;
      stage9.checklist[2].auto = true;
    }
    if (stage9.checklist?.[3]) {
      stage9.checklist[3].done = hasRectification;
      stage9.checklist[3].auto = true;
    }

    if (isOfficiallyApproved) {
      stage9.approved = true;
      stage9.approvedAt = new Date();
      // Advance project to Stage 10: projectControl
      project.stageOrder = Math.max(project.stageOrder || 9, 10);
    }

    await project.save();
  }
}

module.exports = new QualityControlService();
