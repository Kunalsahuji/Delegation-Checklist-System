const Enquiry = require('../models/enquiry.model');

const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

class EnquiryService {
  /**
   * Helper to get IST-anchored day boundaries
   */
  getDayBoundaries(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Generate next sequential enquiry code
   */
  async generateEnquiryNumber() {
    const count = await Enquiry.countDocuments();
    return `ENQ-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Check if a phone number already exists
   */
  async checkPhoneDuplicate(phone, excludeId = null) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
    if (!last10) return null;

    const flexiblePattern = last10.split('').join('[\\s-]*');

    const filter = {
      deletedAt: null,
      $or: [
        { clientPhone: { $regex: flexiblePattern, $options: 'i' } },
        { alternatePhone: { $regex: flexiblePattern, $options: 'i' } },
      ],
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const match = await Enquiry.findOne(filter)
      .select('clientName clientPhone status enquiryNumber createdAt')
      .lean();
    return match;
  }

  /**
   * List enquiries with search, filters, pagination, and KPI strip metrics
   */
  async listEnquiries({
    search = '',
    status = 'all',
    temperature = 'all',
    source = 'all',
    followup = 'all', // 'all' | 'today' | 'overdue' | 'upcoming'
    special = false,
    page = 1,
    limit = 50,
  } = {}) {
    const filter = { deletedAt: null };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (temperature && temperature !== 'all') {
      filter.temperature = temperature;
    }

    if (source && source !== 'all') {
      filter.source = source;
    }

    if (special === true || special === 'true') {
      filter.specialFollowUp = true;
    }

    const { start: todayStart, end: todayEnd } = this.getDayBoundaries();

    if (followup === 'today') {
      filter.nextFollowupAt = { $gte: todayStart, $lte: todayEnd };
    } else if (followup === 'overdue') {
      filter.nextFollowupAt = { $lt: todayStart };
      filter.status = { $nin: ['qualified', 'converted', 'rejected'] };
    } else if (followup === 'upcoming') {
      filter.nextFollowupAt = { $gt: todayEnd };
    }

    if (search && search.trim()) {
      const q = escapeRegex(search.trim());
      filter.$or = [
        { clientName: { $regex: q, $options: 'i' } },
        { clientPhone: { $regex: q, $options: 'i' } },
        { enquiryNumber: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { project: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [enquiries, totalCount, allActive] = await Promise.all([
      Enquiry.find(filter)
        .populate('assignedTo', 'name email phone')
        .populate('createdBy', 'name email')
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Enquiry.countDocuments(filter),
      Enquiry.find({ deletedAt: null }).select('status nextFollowupAt temperature specialFollowUp').lean(),
    ]);

    // Calculate Global KPIs matching Checklist & Delegation format
    let totalEnquiries = allActive.length;
    let qualifiedCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let dueTodayCount = 0;

    for (const item of allActive) {
      if (item.status === 'qualified' || item.status === 'converted') {
        qualifiedCount++;
      } else if (['new', 'contacted', 'hold'].includes(item.status)) {
        pendingCount++;
      }

      if (item.nextFollowupAt) {
        const fDate = new Date(item.nextFollowupAt);
        if (fDate >= todayStart && fDate <= todayEnd) {
          dueTodayCount++;
        } else if (fDate < todayStart && !['qualified', 'converted', 'rejected'].includes(item.status)) {
          overdueCount++;
        }
      }
    }

    return {
      enquiries,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take) || 1,
      kpis: {
        totalEnquiries,
        qualifiedCount,
        pendingCount,
        overdueCount,
        dueTodayCount,
      },
    };
  }

  /**
   * Get single enquiry details by ID
   */
  async getEnquiryById(id) {
    const enquiry = await Enquiry.findOne({ _id: id, deletedAt: null })
      .populate('assignedTo', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('remarksHistory.by', 'name email')
      .populate('qualification.qualifiedBy', 'name email');

    if (!enquiry) {
      const err = new Error('Enquiry not found');
      err.status = 404;
      throw err;
    }
    return enquiry;
  }

  /**
   * Create new enquiry
   */
  async createEnquiry(data, actorId) {
    const { clientName, clientPhone } = data;

    if (!clientName || !clientName.trim()) {
      const err = new Error('Client name is required');
      err.status = 400;
      throw err;
    }

    if (!clientPhone || !clientPhone.trim()) {
      const err = new Error('Client phone number is required');
      err.status = 400;
      throw err;
    }

    // Duplicate check
    const existing = await this.checkPhoneDuplicate(clientPhone);
    if (existing && !['rejected', 'converted'].includes(existing.status)) {
      const err = new Error(
        `Phone ${clientPhone} is already active on enquiry ${existing.enquiryNumber} (${existing.clientName})`
      );
      err.status = 409;
      throw err;
    }

    const enquiryNumber = data.enquiryNumber || (await this.generateEnquiryNumber());

    const initialRemarks = [];
    if (data.remarks && data.remarks.trim()) {
      initialRemarks.push({
        text: data.remarks.trim(),
        by: actorId || null,
        at: new Date(),
      });
    }

    const enquiry = await Enquiry.create({
      enquiryNumber,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      alternatePhone: data.alternatePhone ? data.alternatePhone.trim() : '',
      clientEmail: data.clientEmail ? data.clientEmail.trim().toLowerCase() : '',
      city: data.city ? data.city.trim() : '',
      source: data.source || 'phone',
      referenceName: data.referenceName ? data.referenceName.trim() : '',
      brokerName: data.brokerName ? data.brokerName.trim() : '',
      brokerId: data.brokerId || null,
      propertyType: data.propertyType || 'Luxury Villas',
      project: data.project ? data.project.trim() : '',
      projectId: data.projectId || null,
      budgetMin: Number(data.budgetMin) || 0,
      budgetMax: Number(data.budgetMax) || 0,
      temperature: data.temperature || 'warm',
      status: data.status || 'new',
      nextFollowupAt: data.nextFollowupAt ? new Date(data.nextFollowupAt) : null,
      followupTime: data.followupTime ? data.followupTime.trim() : '',
      assignedTo: data.assignedTo || null,
      remarks: data.remarks ? data.remarks.trim() : '',
      remarksHistory: initialRemarks,
      lastCommentAt: new Date(),
      specialFollowUp: Boolean(data.specialFollowUp),
      isWalkIn: Boolean(data.isWalkIn),
      createdBy: actorId || null,
      updatedBy: actorId || null,
    });

    return enquiry;
  }

  /**
   * Update enquiry
   */
  async updateEnquiry(id, data, actorId) {
    const enquiry = await Enquiry.findOne({ _id: id, deletedAt: null });
    if (!enquiry) {
      const err = new Error('Enquiry not found');
      err.status = 404;
      throw err;
    }

    if (data.clientPhone && data.clientPhone.trim() !== enquiry.clientPhone) {
      const duplicate = await this.checkPhoneDuplicate(data.clientPhone, id);
      if (duplicate && !['rejected', 'converted'].includes(duplicate.status)) {
        const err = new Error(
          `Phone ${data.clientPhone} is already active on enquiry ${duplicate.enquiryNumber} (${duplicate.clientName})`
        );
        err.status = 409;
        throw err;
      }
      enquiry.clientPhone = data.clientPhone.trim();
    }

    if (data.clientName !== undefined) enquiry.clientName = data.clientName.trim();
    if (data.alternatePhone !== undefined) enquiry.alternatePhone = data.alternatePhone.trim();
    if (data.clientEmail !== undefined) enquiry.clientEmail = data.clientEmail.trim().toLowerCase();
    if (data.city !== undefined) enquiry.city = data.city.trim();
    if (data.source !== undefined) enquiry.source = data.source;
    if (data.referenceName !== undefined) enquiry.referenceName = data.referenceName.trim();
    if (data.brokerName !== undefined) enquiry.brokerName = data.brokerName.trim();
    if (data.brokerId !== undefined) enquiry.brokerId = data.brokerId || null;
    if (data.propertyType !== undefined) enquiry.propertyType = data.propertyType;
    if (data.project !== undefined) enquiry.project = data.project.trim();
    if (data.projectId !== undefined) enquiry.projectId = data.projectId || null;
    if (data.budgetMin !== undefined) enquiry.budgetMin = Number(data.budgetMin) || 0;
    if (data.budgetMax !== undefined) enquiry.budgetMax = Number(data.budgetMax) || 0;
    if (data.temperature !== undefined) enquiry.temperature = data.temperature;
    if (data.status !== undefined) enquiry.status = data.status;
    if (data.nextFollowupAt !== undefined) enquiry.nextFollowupAt = data.nextFollowupAt ? new Date(data.nextFollowupAt) : null;
    if (data.followupTime !== undefined) enquiry.followupTime = data.followupTime ? data.followupTime.trim() : '';
    if (data.assignedTo !== undefined) enquiry.assignedTo = data.assignedTo || null;
    if (data.specialFollowUp !== undefined) enquiry.specialFollowUp = Boolean(data.specialFollowUp);

    enquiry.updatedBy = actorId || null;
    await enquiry.save();

    return enquiry;
  }

  /**
   * Append remark to history
   */
  async addRemark(id, text, actorId) {
    const enquiry = await Enquiry.findOne({ _id: id, deletedAt: null });
    if (!enquiry) {
      const err = new Error('Enquiry not found');
      err.status = 404;
      throw err;
    }

    if (!text || !text.trim()) {
      const err = new Error('Remark text is required');
      err.status = 400;
      throw err;
    }

    const newRemark = {
      text: text.trim(),
      by: actorId || null,
      at: new Date(),
    };

    enquiry.remarksHistory.push(newRemark);
    enquiry.remarks = text.trim();
    enquiry.lastCommentAt = new Date();
    enquiry.updatedBy = actorId || null;
    await enquiry.save();

    return enquiry;
  }

  /**
   * Qualify enquiry
   */
  async qualifyEnquiry(id, data, actorId) {
    const enquiry = await Enquiry.findOne({ _id: id, deletedAt: null });
    if (!enquiry) {
      const err = new Error('Enquiry not found');
      err.status = 404;
      throw err;
    }

    enquiry.status = 'qualified';
    enquiry.qualification = {
      status: 'qualified',
      budgetFit: data.budgetFit !== undefined ? Boolean(data.budgetFit) : true,
      timeline: data.timeline || '',
      preferredVisitDate: data.preferredVisitDate ? new Date(data.preferredVisitDate) : null,
      notes: data.notes || '',
      qualifiedAt: new Date(),
      qualifiedBy: actorId || null,
      rejectReason: '',
    };

    enquiry.remarksHistory.push({
      text: `Enquiry Qualified! Notes: ${data.notes || 'Buyer verified.'}`,
      by: actorId || null,
      at: new Date(),
    });

    enquiry.updatedBy = actorId || null;
    await enquiry.save();
    return enquiry;
  }

  /**
   * Reject enquiry (Not Qualified)
   */
  async rejectEnquiry(id, { rejectReason }, actorId) {
    const enquiry = await Enquiry.findOne({ _id: id, deletedAt: null });
    if (!enquiry) {
      const err = new Error('Enquiry not found');
      err.status = 404;
      throw err;
    }

    enquiry.status = 'rejected';
    enquiry.qualification = {
      status: 'rejected',
      rejectReason: rejectReason || 'Budget / Requirement mismatch',
      qualifiedAt: new Date(),
      qualifiedBy: actorId || null,
    };

    enquiry.remarksHistory.push({
      text: `Marked Not Qualified. Reason: ${rejectReason || 'Not specified'}`,
      by: actorId || null,
      at: new Date(),
    });

    enquiry.updatedBy = actorId || null;
    await enquiry.save();
    return enquiry;
  }

  /**
   * Toggle special follow-up flag
   */
  async toggleSpecialFollowup(id, actorId) {
    const enquiry = await Enquiry.findOne({ _id: id, deletedAt: null });
    if (!enquiry) {
      const err = new Error('Enquiry not found');
      err.status = 404;
      throw err;
    }

    enquiry.specialFollowUp = !enquiry.specialFollowUp;
    enquiry.updatedBy = actorId || null;
    await enquiry.save();
    return enquiry;
  }

  /**
   * Soft delete enquiry
   */
  async deleteEnquiry(id, actorId) {
    const enquiry = await Enquiry.findOne({ _id: id, deletedAt: null });
    if (!enquiry) {
      const err = new Error('Enquiry not found');
      err.status = 404;
      throw err;
    }

    enquiry.deletedAt = new Date();
    enquiry.deletedBy = actorId || null;
    await enquiry.save();
    return { message: 'Enquiry deleted successfully', id };
  }
}

module.exports = new EnquiryService();
