const MetaLead = require('../models/metaLead.model');
const Enquiry = require('../models/enquiry.model');
const User = require('../../auth/models/user.model');
const enquiryService = require('./enquiry.service');

class MetaLeadService {
  /**
   * Helper to normalize phone number to last 10 digits
   */
  normalizePhone(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  /**
   * Get KPI counts for Meta holding area
   */
  async getKPIs() {
    const [total, pending, assigned, skipped] = await Promise.all([
      MetaLead.countDocuments(),
      MetaLead.countDocuments({ status: 'pending' }),
      MetaLead.countDocuments({ status: 'assigned' }),
      MetaLead.countDocuments({ status: 'skipped' }),
    ]);

    return {
      total,
      pending,
      assigned,
      skipped,
    };
  }

  /**
   * List Meta leads with filter, search, pagination
   */
  async listLeads({ status = '', search = '', page = 1, limit = 15 } = {}) {
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { clientName: { $regex: term, $options: 'i' } },
        { clientPhone: { $regex: term, $options: 'i' } },
        { formName: { $regex: term, $options: 'i' } },
        { campaignName: { $regex: term, $options: 'i' } },
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (currentPage - 1) * perPage;

    const [rows, total] = await Promise.all([
      MetaLead.find(query)
        .populate('assignedTo', 'name email role')
        .populate('assignedBy', 'name email')
        .populate('enquiryId', 'enquiryNumber status temperature')
        .sort({ metaCreatedAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      MetaLead.countDocuments(query),
    ]);

    return {
      data: rows,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }

  /**
   * Classify lead upon intake
   */
  async classify(phone) {
    const cleanPhone = this.normalizePhone(phone);
    if (!cleanPhone) {
      return { status: 'pending', skipReason: '' };
    }

    // Check if phone already in CRM enquiries
    const inCrm = await Enquiry.findOne({
      deletedAt: null,
      clientPhone: { $regex: cleanPhone },
    }).lean();

    if (inCrm) {
      return {
        status: 'assigned',
        skipReason: '',
        enquiryId: inCrm._id,
        assignedTo: inCrm.assignedTo || null,
      };
    }

    // Check if duplicate on Meta
    const duplicateOnMeta = await MetaLead.findOne({
      clientPhone: { $regex: cleanPhone },
    }).lean();

    if (duplicateOnMeta) {
      return { status: 'skipped', skipReason: 'duplicateOnMeta' };
    }

    return { status: 'pending', skipReason: '' };
  }

  /**
   * Create or ingest a lead (e.g. via webhook or manual demo generator)
   */
  async createLead(data, actorId = null) {
    const leadgenId =
      data.leadgenId || `META-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { status, skipReason, enquiryId = null, assignedTo = null } = await this.classify(
      data.clientPhone
    );

    const lead = await MetaLead.create({
      leadgenId,
      formId: data.formId || 'FORM_META_01',
      formName: data.formName || 'Jaipur Luxury Plots & Villas Campaign',
      pageId: data.pageId || 'PAGE_TASKFLOW_REALTY',
      adId: data.adId || 'AD_INSTA_FEED_01',
      adName: data.adName || 'Instagram Feed Sponsored Ad',
      campaignName: data.campaignName || 'Meta Leads LeadGen 2026',
      clientName: data.clientName || 'Prospective Buyer',
      clientPhone: data.clientPhone || '',
      clientEmail: data.clientEmail || '',
      requirement: data.requirement || '3 BHK Luxury Villa / 200 Sq.Yd Plot',
      budget: data.budget || '₹60-90 lakhs',
      city: data.city || 'Jaipur',
      rawFields: data.rawFields || {},
      metaCreatedAt: data.metaCreatedAt ? new Date(data.metaCreatedAt) : new Date(),
      status: data.status || status,
      skipReason: data.skipReason || skipReason,
      enquiryId,
      assignedTo,
      assignedBy: actorId,
      assignedAt: status === 'assigned' ? new Date() : null,
    });

    return lead;
  }

  /**
   * Sync leads: checks pending leads against CRM enquiries to mark any already added
   */
  async syncLeads() {
    const pendingLeads = await MetaLead.find({ status: 'pending' });
    let linked = 0;

    for (const lead of pendingLeads) {
      const cleanPhone = this.normalizePhone(lead.clientPhone);
      if (!cleanPhone) continue;

      const inCrm = await Enquiry.findOne({
        deletedAt: null,
        clientPhone: { $regex: cleanPhone },
      }).lean();

      if (inCrm) {
        lead.status = 'assigned';
        lead.enquiryId = inCrm._id;
        lead.assignedTo = inCrm.assignedTo || null;
        lead.assignedAt = new Date();
        await lead.save();
        linked += 1;
      }
    }

    return {
      syncedAt: new Date(),
      pendingChecked: pendingLeads.length,
      linkedToExistingEnquiry: linked,
    };
  }

  /**
   * Round-robin batch assignment of selected pending Meta leads to sales team
   */
  async assignLeads({ leadIds = [], userIds = [], actorId = null }) {
    if (!leadIds || !leadIds.length) {
      const err = new Error('No leads selected for assignment');
      err.status = 400;
      throw err;
    }

    const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))];
    if (!uniqueUserIds.length) {
      const err = new Error('Please select at least one sales representative');
      err.status = 400;
      throw err;
    }

    const users = await User.find({ _id: { $in: uniqueUserIds } }).select('_id name email role');
    if (!users.length) {
      const err = new Error('Selected sales representatives not found');
      err.status = 404;
      throw err;
    }

    const leads = await MetaLead.find({
      _id: { $in: leadIds },
      status: 'pending',
    }).sort({ metaCreatedAt: 1 });

    let assigned = 0;
    const failed = [];
    const perUser = new Map();
    users.forEach((u) => perUser.set(String(u._id), { name: u.name, count: 0 }));

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const targetUser = users[i % users.length];

      try {
        // Create full Enquiry record in CRM
        const enquiry = await enquiryService.createEnquiry(
          {
            clientName: lead.clientName || 'Meta Lead',
            clientPhone: lead.clientPhone,
            clientEmail: lead.clientEmail,
            city: lead.city || 'Jaipur',
            source: 'metaAds',
            referenceName: `Meta Ad: ${lead.campaignName || lead.formName}`,
            propertyType: 'Luxury Villas',
            remarks: `Imported from Meta Lead Ad. Requirement: ${lead.requirement || 'N/A'}. Budget: ${lead.budget || 'N/A'}`,
            assignedTo: targetUser._id,
            temperature: 'warm',
            status: 'new',
          },
          actorId
        );

        lead.status = 'assigned';
        lead.assignedTo = targetUser._id;
        lead.assignedBy = actorId;
        lead.assignedAt = new Date();
        lead.enquiryId = enquiry._id;
        await lead.save();

        assigned += 1;
        const entry = perUser.get(String(targetUser._id));
        if (entry) entry.count += 1;
      } catch (err) {
        failed.push({
          leadId: lead._id,
          name: lead.clientName,
          phone: lead.clientPhone,
          user: targetUser.name,
          reason: err.message || 'Failed to create enquiry',
        });
      }
    }

    return {
      assignedCount: assigned,
      distribution: Array.from(perUser.values()),
      failed,
    };
  }

  /**
   * Mark a lead as skipped
   */
  async skipLead(id, reason = 'other') {
    const lead = await MetaLead.findById(id);
    if (!lead) {
      const err = new Error('Meta lead not found');
      err.status = 404;
      throw err;
    }

    lead.status = 'skipped';
    lead.skipReason = reason;
    await lead.save();

    return lead;
  }

  /**
   * Delete lead
   */
  async deleteLead(id) {
    const lead = await MetaLead.findByIdAndDelete(id);
    if (!lead) {
      const err = new Error('Meta lead not found');
      err.status = 404;
      throw err;
    }
    return lead;
  }
}

module.exports = new MetaLeadService();
