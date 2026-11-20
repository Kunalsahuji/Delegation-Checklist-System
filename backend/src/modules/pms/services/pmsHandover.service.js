const mongoose = require('mongoose');
const PmsHandover = require('../models/pmsHandover.model');
const PmsProject = require('../models/pmsProject.model');
const QualityControl = require('../models/qualityControl.model');
const {
  HANDOVER_SECTION_KEYS,
  HANDOVER_STATUS,
  CLEANING_CHECKLIST_ITEMS,
} = require('../constants/pms.constants');

class PmsHandoverService {
  async getKPIs() {
    const [agg] = await PmsHandover.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          possessionCompleted: {
            $sum: { $cond: [{ $eq: ['$possessionCompleted', true] }, 1, 0] },
          },
          zeroSnagVerified: {
            $sum: { $cond: [{ $eq: ['$zeroSnagVerified', true] }, 1, 0] },
          },
          pendingSnagsTotal: { $sum: '$pendingSnagsCount' },
          inspectionsCleared: {
            $sum: { $cond: [{ $eq: ['$inspectionsCleared', true] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      total: agg?.total || 0,
      possessionCompleted: agg?.possessionCompleted || 0,
      zeroSnagVerified: agg?.zeroSnagVerified || 0,
      pendingSnagsTotal: agg?.pendingSnagsTotal || 0,
      inspectionsCleared: agg?.inspectionsCleared || 0,
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
      possessionCompleted,
      zeroSnagVerified,
      hasPendingSnags,
      inspectionsCleared,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (possessionCompleted === true || possessionCompleted === 'true') {
      filter.possessionCompleted = true;
    }

    if (zeroSnagVerified === true || zeroSnagVerified === 'true') {
      filter.zeroSnagVerified = true;
    }

    if (hasPendingSnags === true || hasPendingSnags === 'true') {
      filter.pendingSnagsCount = { $gt: 0 };
    }

    if (inspectionsCleared === true || inspectionsCleared === 'true') {
      filter.inspectionsCleared = true;
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
        { 'customerHandover.customerName': { $regex: term, $options: 'i' } },
        { 'customerHandover.unitNumber': { $regex: term, $options: 'i' } },
        { project: { $in: projectIds } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [records, total] = await Promise.all([
      PmsHandover.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('project', 'name code locality city stageOrder stages')
        .populate('createdBy', 'name email role')
        .populate('approvedBy', 'name email role')
        .lean(),
      PmsHandover.countDocuments(filter),
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
      const err = new Error('Invalid Handover ID');
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsHandover.findById(id)
      .populate('project', 'name code locality city stageOrder stages baseline')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('finalInspection.completedBy', 'name email')
      .populate('snagClosure.completedBy', 'name email')
      .populate('deepCleaning.completedBy', 'name email')
      .populate('customerHandover.completedBy', 'name email')
      .populate('statusHistory.by', 'name email role')
      .lean();

    if (!record) {
      const err = new Error('Handover record not found');
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
    let record = await PmsHandover.findOne({ project: projectId });
    if (record) {
      return { pmsHandover: await this.getRecordById(record._id), created: false };
    }

    const count = await PmsHandover.countDocuments();
    const code = `HND-${String(count + 1).padStart(6, '0')}`;

    // Read Quality snags if available
    let totalSnags = 6;
    let snagsRectified = 5;
    let pendingSnags = 1;
    try {
      const quality = await QualityControl.findOne({ project: projectId }).lean();
      if (quality?.snagList?.snags?.length) {
        totalSnags = quality.snagList.snags.length;
        snagsRectified = quality.snagList.snags.filter((s) => s.status === 'closed').length;
        pendingSnags = totalSnags - snagsRectified;
      }
    } catch (e) {
      // ignore
    }

    const defaultCleaningAreas = CLEANING_CHECKLIST_ITEMS.map((item) => ({
      area: item,
      status: 'pending',
      cleanedAt: null,
      inspectedBy: 'Deep Cleaning Supervisor',
    }));

    record = new PmsHandover({
      code,
      project: projectId,
      status: 'preHandoverInspection',
      finalInspection: {
        inspectorName: 'Er. Sandeep Rathore',
        inspectionDate: new Date(),
        structuralIntegrityApproved: true,
        mepServicesCertified: true,
        finishingApproved: false,
        allInspectionsCleared: false,
        status: 'inProgress',
        remarks: 'Structural & MEP clear; final finishing snag clearance underway.',
      },
      snagClosure: {
        totalSnagsIdentified: totalSnags,
        snagsRectified: snagsRectified,
        pendingSnags: pendingSnags,
        zeroSnagCertificateIssued: pendingSnags === 0,
        deSnaggingEngineer: 'Er. Rajesh Kumar',
        status: pendingSnags === 0 ? 'completed' : 'inProgress',
        remarks: pendingSnags === 0 ? 'All snags closed.' : `${pendingSnags} touch-up snags pending closure.`,
      },
      deepCleaning: {
        areasCleaned: defaultCleaningAreas,
        deepCleaningContractor: 'Sparkle Facilities & Services',
        signOffDate: null,
        allAreasCleaned: false,
        status: 'pending',
        remarks: 'Deep cleaning schedule locked for final possession handover.',
      },
      customerHandover: {
        customerName: 'Prime Allottee / Homebuyer',
        unitNumber: 'Unit-101 (Wing A)',
        possessionLetterIssued: false,
        keysHandedOver: false,
        meterReadings: {
          electricity: '00124.5 kWh',
          water: '00045.0 L',
        },
        welcomeKitHanded: false,
        handoverDate: null,
        satisfactionRating: 5,
        status: 'pending',
        remarks: 'Ready for possession once final sign-off is cleared.',
      },
      possessionCompleted: false,
      zeroSnagVerified: pendingSnags === 0,
      pendingSnagsCount: pendingSnags,
      inspectionsCleared: false,
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'preHandoverInspection',
          by: userId,
          reason: 'Stage 12 Handover & Snag Closure register initiated',
          at: new Date(),
        },
      ],
    });

    await record.save();
    await this.syncStage12(projectId);

    const populated = await this.getRecordById(record._id);
    return { pmsHandover: populated, created: true };
  }

  async updateSection(id, sectionKey, data, userId = null) {
    if (!HANDOVER_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsHandover.findById(id);
    if (!record) {
      const err = new Error('Handover record not found');
      err.statusCode = 404;
      throw err;
    }

    if (sectionKey === 'finalInspection') {
      if (data.inspectorName !== undefined) record.finalInspection.inspectorName = data.inspectorName;
      if (data.inspectionDate !== undefined) record.finalInspection.inspectionDate = data.inspectionDate;
      if (data.structuralIntegrityApproved !== undefined) {
        record.finalInspection.structuralIntegrityApproved = Boolean(data.structuralIntegrityApproved);
      }
      if (data.mepServicesCertified !== undefined) {
        record.finalInspection.mepServicesCertified = Boolean(data.mepServicesCertified);
      }
      if (data.finishingApproved !== undefined) {
        record.finalInspection.finishingApproved = Boolean(data.finishingApproved);
      }
      const allDone =
        record.finalInspection.structuralIntegrityApproved &&
        record.finalInspection.mepServicesCertified &&
        record.finalInspection.finishingApproved;

      record.finalInspection.allInspectionsCleared = allDone;
      record.inspectionsCleared = allDone;
      if (data.remarks !== undefined) record.finalInspection.remarks = data.remarks;
      record.finalInspection.status = allDone ? 'completed' : 'inProgress';
    }

    if (sectionKey === 'snagClosure') {
      if (data.totalSnagsIdentified !== undefined) {
        record.snagClosure.totalSnagsIdentified = Number(data.totalSnagsIdentified) || 0;
      }
      if (data.snagsRectified !== undefined) {
        record.snagClosure.snagsRectified = Number(data.snagsRectified) || 0;
      }
      const pending = Math.max(
        0,
        record.snagClosure.totalSnagsIdentified - record.snagClosure.snagsRectified
      );
      record.snagClosure.pendingSnags = pending;
      record.pendingSnagsCount = pending;

      if (data.zeroSnagCertificateIssued !== undefined) {
        record.snagClosure.zeroSnagCertificateIssued = Boolean(data.zeroSnagCertificateIssued);
      } else {
        record.snagClosure.zeroSnagCertificateIssued = pending === 0;
      }
      record.zeroSnagVerified = record.snagClosure.zeroSnagCertificateIssued;

      if (data.deSnaggingEngineer !== undefined) {
        record.snagClosure.deSnaggingEngineer = data.deSnaggingEngineer;
      }
      if (data.remarks !== undefined) record.snagClosure.remarks = data.remarks;
      record.snagClosure.status = pending === 0 ? 'completed' : 'inProgress';
    }

    if (sectionKey === 'deepCleaning') {
      if (Array.isArray(data.areasCleaned)) {
        record.deepCleaning.areasCleaned = data.areasCleaned;
      }
      if (data.deepCleaningContractor !== undefined) {
        record.deepCleaning.deepCleaningContractor = data.deepCleaningContractor;
      }
      if (data.signOffDate !== undefined) record.deepCleaning.signOffDate = data.signOffDate;
      if (data.remarks !== undefined) record.deepCleaning.remarks = data.remarks;

      const allAreasDone =
        record.deepCleaning.areasCleaned.length > 0 &&
        record.deepCleaning.areasCleaned.every((a) => a.status === 'completed');
      record.deepCleaning.allAreasCleaned = allAreasDone;
      record.deepCleaning.status = allAreasDone ? 'completed' : 'inProgress';
    }

    if (sectionKey === 'customerHandover') {
      if (data.customerName !== undefined) record.customerHandover.customerName = data.customerName;
      if (data.unitNumber !== undefined) record.customerHandover.unitNumber = data.unitNumber;
      if (data.possessionLetterIssued !== undefined) {
        record.customerHandover.possessionLetterIssued = Boolean(data.possessionLetterIssued);
      }
      if (data.keysHandedOver !== undefined) {
        record.customerHandover.keysHandedOver = Boolean(data.keysHandedOver);
      }
      if (data.meterReadings) {
        if (data.meterReadings.electricity !== undefined) {
          record.customerHandover.meterReadings.electricity = data.meterReadings.electricity;
        }
        if (data.meterReadings.water !== undefined) {
          record.customerHandover.meterReadings.water = data.meterReadings.water;
        }
      }
      if (data.welcomeKitHanded !== undefined) {
        record.customerHandover.welcomeKitHanded = Boolean(data.welcomeKitHanded);
      }
      if (data.handoverDate !== undefined) record.customerHandover.handoverDate = data.handoverDate;
      if (data.satisfactionRating !== undefined) {
        record.customerHandover.satisfactionRating = Number(data.satisfactionRating) || 5;
      }
      if (data.remarks !== undefined) record.customerHandover.remarks = data.remarks;

      const possessionDone =
        record.customerHandover.possessionLetterIssued && record.customerHandover.keysHandedOver;
      record.possessionCompleted = possessionDone;
      record.customerHandover.status = possessionDone ? 'completed' : 'inProgress';
    }

    // Auto promote status based on stage milestones
    if (record.status !== 'approved' && record.status !== 'approvalPending') {
      if (record.possessionCompleted) {
        record.status = 'possessionCompleted';
      } else if (record.deepCleaning.allAreasCleaned) {
        record.status = 'readyForHandover';
      } else if (record.zeroSnagVerified) {
        record.status = 'cleaningVerification';
      } else if (record.inspectionsCleared) {
        record.status = 'deSnaggingInProgress';
      } else {
        record.status = 'preHandoverInspection';
      }
    }

    await record.save();
    await this.syncStage12(record.project);

    return this.getRecordById(record._id);
  }

  async completeSection(id, sectionKey, remarks = '', userId = null) {
    if (!HANDOVER_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsHandover.findById(id);
    if (!record) {
      const err = new Error('Handover record not found');
      err.statusCode = 404;
      throw err;
    }

    record[sectionKey].status = 'completed';
    record[sectionKey].remarks = remarks || record[sectionKey].remarks;
    record[sectionKey].completedBy = userId;
    record[sectionKey].completedAt = new Date();

    if (sectionKey === 'finalInspection') {
      record.finalInspection.structuralIntegrityApproved = true;
      record.finalInspection.mepServicesCertified = true;
      record.finalInspection.finishingApproved = true;
      record.finalInspection.allInspectionsCleared = true;
      record.inspectionsCleared = true;
    }

    if (sectionKey === 'snagClosure') {
      record.snagClosure.snagsRectified = record.snagClosure.totalSnagsIdentified;
      record.snagClosure.pendingSnags = 0;
      record.snagClosure.zeroSnagCertificateIssued = true;
      record.zeroSnagVerified = true;
      record.pendingSnagsCount = 0;
    }

    if (sectionKey === 'deepCleaning') {
      record.deepCleaning.areasCleaned.forEach((a) => {
        a.status = 'completed';
        a.cleanedAt = new Date();
      });
      record.deepCleaning.allAreasCleaned = true;
      record.deepCleaning.signOffDate = new Date();
    }

    if (sectionKey === 'customerHandover') {
      record.customerHandover.possessionLetterIssued = true;
      record.customerHandover.keysHandedOver = true;
      record.customerHandover.welcomeKitHanded = true;
      record.customerHandover.handoverDate = new Date();
      record.possessionCompleted = true;
    }

    const allSectionsDone = HANDOVER_SECTION_KEYS.every(
      (k) => record[k].status === 'completed'
    );

    if (allSectionsDone && record.status !== 'approved' && record.status !== 'approvalPending') {
      record.status = 'approvalPending';
      record.statusHistory.push({
        from: record.status,
        to: 'approvalPending',
        by: userId,
        reason: 'All handover prerequisites completed. Submitted for Final Handover Approval.',
        at: new Date(),
      });
    }

    await record.save();
    await this.syncStage12(record.project);

    return this.getRecordById(record._id);
  }

  async requestApproval(id, userId = null) {
    const record = await PmsHandover.findById(id);
    if (!record) {
      const err = new Error('Handover record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Handover is already approved');
      err.statusCode = 400;
      throw err;
    }

    const from = record.status;
    record.status = 'approvalPending';
    record.statusHistory.push({
      from,
      to: 'approvalPending',
      by: userId,
      reason: 'Submitted for Stage 12 Handover Certification & Clearance',
      at: new Date(),
    });

    await record.save();
    return this.getRecordById(record._id);
  }

  async decideApproval(id, { decision, reason = '' }, userId = null) {
    const record = await PmsHandover.findById(id);
    if (!record) {
      const err = new Error('Handover record not found');
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
        reason: reason || 'Stage 12 Handover & Possession certified and approved',
        at: new Date(),
      });

      await record.save();

      // Sync stage 12 to project
      await this.syncStage12(record.project, true);
    } else {
      record.status = 'rejected';
      record.isApproved = false;
      record.rejectionReason = reason;

      record.statusHistory.push({
        from,
        to: 'rejected',
        by: userId,
        reason: reason || 'Handover rejected / re-inspection or deep cleaning required',
        at: new Date(),
      });

      await record.save();
    }

    return this.getRecordById(record._id);
  }

  async syncStage12(projectId, isApproved = false) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage12 = project.stages?.find((s) => s.order === 12 || s.key === 'handover');
    if (!stage12) return;

    const handover = await PmsHandover.findOne({ project: projectId }).lean();
    if (!handover) return;

    // Stage 12 checklist: ['Final Inspection', 'Snag Closure', 'Deep Cleaning', 'Customer Handover']
    const hasFinalInspection = Boolean(handover.inspectionsCleared || handover.finalInspection?.status === 'completed');
    const hasSnagClosure = Boolean(handover.zeroSnagVerified || handover.snagClosure?.status === 'completed');
    const hasDeepCleaning = Boolean(handover.deepCleaning?.allAreasCleaned || handover.deepCleaning?.status === 'completed');
    const hasCustomerHandover = Boolean(handover.possessionCompleted || handover.customerHandover?.status === 'completed');
    const isOfficiallyApproved = isApproved || handover.status === 'approved' || handover.isApproved;

    if (stage12.checklist?.[0]) {
      stage12.checklist[0].done = hasFinalInspection;
      stage12.checklist[0].auto = true;
    }
    if (stage12.checklist?.[1]) {
      stage12.checklist[1].done = hasSnagClosure;
      stage12.checklist[1].auto = true;
    }
    if (stage12.checklist?.[2]) {
      stage12.checklist[2].done = hasDeepCleaning;
      stage12.checklist[2].auto = true;
    }
    if (stage12.checklist?.[3]) {
      stage12.checklist[3].done = hasCustomerHandover;
      stage12.checklist[3].auto = true;
    }

    if (isOfficiallyApproved) {
      stage12.approved = true;
      stage12.approvedAt = new Date();
      // Advance project to Stage 13: afterSales
      project.stageOrder = Math.max(project.stageOrder || 12, 13);
    }

    await project.save();
  }
}

module.exports = new PmsHandoverService();
