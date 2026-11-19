const BulkCampaign = require('../models/bulkCampaign.model');
const Enquiry = require('../models/enquiry.model');
const Lead = require('../models/lead.model');
const Broker = require('../models/broker.model');
const Project = require('../../master/models/project.model');
const User = require('../../auth/models/user.model');

const TEMPLATES = [
  {
    id: 'festive_luxury_villas',
    name: 'Festive Luxury Villa Offer',
    category: 'MARKETING',
    description: 'Promotional blast for luxury villas with private garden & clubhouse access',
    sampleText:
      'Namaste {{name}}! Exclusive festive pricing on luxury villas in Jaipur. Enjoy zero registration charges for bookings this week. Reply YES to schedule a private site tour.',
    variables: ['name'],
  },
  {
    id: 'new_phase_plots_launch',
    name: 'New Phase Plot Launch',
    category: 'NEW_LAUNCH',
    description: 'Announcement of fresh residential & gated township plot releases',
    sampleText:
      'Hello {{name}}! We are thrilled to announce Phase-2 premium gated residential plots (150-300 Sq.Yd) now open for booking with flexible EMI options.',
    variables: ['name'],
  },
  {
    id: 'site_visit_invitation',
    name: 'Weekend Site Visit Invitation',
    category: 'UTILITY',
    description: 'Personalized invitation for client walkthrough and complimentary transport',
    sampleText:
      'Dear {{name}}, your dream home awaits! We invite you for a guided site walkthrough of our sample luxury villas this Saturday/Sunday. Free cab pick & drop available.',
    variables: ['name'],
  },
  {
    id: 'price_revision_alert',
    name: 'Price Revision & Base Rate Alert',
    category: 'URGENT',
    description: 'Urgency alert informing prospective buyers of upcoming price increase',
    sampleText:
      'Important Notice: Property rates in Jaipur Prime Corridors are escalating by ₹300/Sq.Yd from next month. Lock in your preferred unit at current pre-hike rates today.',
    variables: ['name'],
  },
  {
    id: 'channel_partner_incentive',
    name: 'Broker & Associate Commission Blast',
    category: 'PARTNER',
    description: 'High-commission incentive announcement for channel partners and associates',
    sampleText:
      'Dear Associate {{name}}! Supercharge your earnings with our Month-End Bonanza. Earn additional 0.5% incentive on all verified plot and villa bookings.',
    variables: ['name'],
  },
];

class BulkMessageService {
  /**
   * Helper to normalize 10-digit phone
   */
  normalizePhone(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  /**
   * Get available templates
   */
  getTemplates() {
    return TEMPLATES;
  }

  /**
   * Get KPI statistics for campaigns
   */
  async getKPIs() {
    const campaigns = await BulkCampaign.find({ deletedAt: null }).lean();

    const totalCampaigns = campaigns.length;
    const totalSent = campaigns.reduce((acc, c) => acc + (c.sent || 0), 0);
    const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivered || 0), 0);

    const activeQueued = campaigns.filter((c) => ['queued', 'running'].includes(c.status)).length;
    const successRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;

    // Audience reachable count
    const [enqCount, leadCount] = await Promise.all([
      Enquiry.countDocuments({ deletedAt: null, clientPhone: { $exists: true, $ne: '' } }),
      Lead.countDocuments({ deletedAt: null, clientPhone: { $exists: true, $ne: '' } }),
    ]);

    return {
      totalCampaigns,
      totalSent,
      activeQueued,
      successRate,
      estimatedAudience: enqCount + leadCount,
    };
  }

  /**
   * Collect and deduplicate recipients based on audience selection criteria
   */
  async collectRecipients(selection = {}) {
    const { mode = 'all', statuses = [], leadStatuses = [], project = '' } = selection;
    const phoneMap = new Map();

    if (mode === 'all') {
      const [enquiries, leads] = await Promise.all([
        Enquiry.find({ deletedAt: null, clientPhone: { $exists: true, $ne: '' } })
          .select('clientName clientPhone project status enquiryNumber createdAt')
          .lean(),
        Lead.find({ deletedAt: null, clientPhone: { $exists: true, $ne: '' } })
          .populate('currentStageId', 'name')
          .select('clientName clientPhone project status currentStageName currentStageId leadNumber createdAt')
          .lean(),
      ]);

      enquiries.forEach((e) => {
        const p = this.normalizePhone(e.clientPhone);
        if (p && !phoneMap.has(p)) {
          phoneMap.set(p, {
            enquiryId: e._id,
            name: e.clientName || 'Prospective Buyer',
            phone: p,
            type: 'Enquiry',
            code: e.enquiryNumber || 'ENQ',
            project: e.project || 'General Inquiry',
            status: e.status || 'New',
            createdAt: e.createdAt,
          });
        }
      });

      leads.forEach((l) => {
        const p = this.normalizePhone(l.clientPhone);
        if (p && !phoneMap.has(p)) {
          phoneMap.set(p, {
            leadId: l._id,
            name: l.clientName || 'Qualified Lead',
            phone: p,
            type: 'Lead',
            code: l.leadNumber || 'LD',
            project: l.project || 'General Lead',
            status: l.currentStageName || l.currentStageId?.name || l.status || 'Active',
            createdAt: l.createdAt,
          });
        }
      });
    } else if (mode === 'status') {
      const query = { deletedAt: null, clientPhone: { $exists: true, $ne: '' } };
      if (statuses.length) {
        query.status = { $in: statuses };
      }
      const enquiries = await Enquiry.find(query)
        .select('clientName clientPhone project status enquiryNumber createdAt')
        .lean();
      enquiries.forEach((e) => {
        const p = this.normalizePhone(e.clientPhone);
        if (p && !phoneMap.has(p)) {
          phoneMap.set(p, {
            enquiryId: e._id,
            name: e.clientName || 'Prospective Buyer',
            phone: p,
            type: 'Enquiry',
            code: e.enquiryNumber || 'ENQ',
            project: e.project || 'General Inquiry',
            status: e.status || 'New',
            createdAt: e.createdAt,
          });
        }
      });
    } else if (mode === 'lead') {
      const query = { deletedAt: null, clientPhone: { $exists: true, $ne: '' } };
      if (leadStatuses.length) {
        query.status = { $in: leadStatuses };
      }
      const leads = await Lead.find(query)
        .populate('currentStageId', 'name')
        .select('clientName clientPhone project status currentStageName currentStageId leadNumber createdAt')
        .lean();
      leads.forEach((l) => {
        const p = this.normalizePhone(l.clientPhone);
        if (p && !phoneMap.has(p)) {
          phoneMap.set(p, {
            leadId: l._id,
            name: l.clientName || 'Qualified Lead',
            phone: p,
            type: 'Lead',
            code: l.leadNumber || 'LD',
            project: l.project || 'General Lead',
            status: l.currentStageName || l.currentStageId?.name || l.status || 'Active',
            createdAt: l.createdAt,
          });
        }
      });
        query.status = { $in: leadStatuses };
      }
      const leads = await Lead.find(query).select('clientName clientPhone').lean();
      leads.forEach((l) => {
        const p = this.normalizePhone(l.clientPhone);
        if (p && !phoneMap.has(p)) {
          phoneMap.set(p, { leadId: l._id, name: l.clientName || 'Client', phone: p });
        }
      });
    } else if (mode === 'project') {
      const projectName = String(project).trim();
      const enquiries = await Enquiry.find({
        deletedAt: null,
        clientPhone: { $exists: true, $ne: '' },
        ...(projectName ? { project: { $regex: projectName, $options: 'i' } } : {}),
      })
        .select('clientName clientPhone')
        .lean();

      enquiries.forEach((e) => {
        const p = this.normalizePhone(e.clientPhone);
        if (p && !phoneMap.has(p)) {
          phoneMap.set(p, { enquiryId: e._id, name: e.clientName || 'Client', phone: p });
        }
      });
    } else if (mode === 'brokers') {
      const brokers = await Broker.find({
        status: { $ne: 'Inactive' },
        phone: { $exists: true, $ne: '' },
      })
        .select('name phone')
        .lean();

      brokers.forEach((b) => {
        const p = this.normalizePhone(b.phone);
        if (p && !phoneMap.has(p)) {
          phoneMap.set(p, { brokerId: b._id, name: b.name || 'Partner', phone: p });
        }
      });
    }

    return Array.from(phoneMap.values());
  }

  /**
   * Preview audience numbers before sending
   */
  async previewAudience(selection = {}) {
    const recipients = await this.collectRecipients(selection);
    return {
      reachable: recipients.length,
      matched: recipients.length,
      skipped: 0,
      recipients,
    };
  }

  /**
   * Create and launch a bulk campaign
   */
  async createCampaign(data, actorId = null) {
    if (!data.name || !data.name.trim()) {
      const err = new Error('Campaign name is required');
      err.status = 400;
      throw err;
    }

    const template = TEMPLATES.find((t) => t.id === data.templateName) || TEMPLATES[0];

    const recipients = await this.collectRecipients(data.selection || {});
    if (!recipients.length) {
      const err = new Error('No reachable contacts found for the selected audience');
      err.status = 400;
      throw err;
    }

    // Prepare recipient records
    const recipientRecords = recipients.map((r) => ({
      ...r,
      status: 'pending',
    }));

    const campaign = await BulkCampaign.create({
      name: data.name.trim(),
      createdBy: actorId,
      templateName: template.id,
      templateCategory: template.category,
      bodyText: data.bodyText || template.sampleText,
      mediaUrl: data.mediaUrl || '',
      mediaType: data.mediaType || '',
      selection: data.selection || {},
      status: 'queued',
      total: recipientRecords.length,
      recipients: recipientRecords,
      startedAt: new Date(),
    });

    // Execute simulated send asynchronously
    setImmediate(async () => {
      try {
        campaign.status = 'running';
        await campaign.save();

        let sentCount = 0;
        let deliveredCount = 0;

        for (const recipient of campaign.recipients) {
          recipient.status = 'sent';
          recipient.sentAt = new Date();
          sentCount += 1;
          deliveredCount += 1;
        }

        campaign.status = 'completed';
        campaign.sent = sentCount;
        campaign.delivered = deliveredCount;
        campaign.finishedAt = new Date();
        await campaign.save();
      } catch (err) {
        console.error('Failed to dispatch campaign:', err);
        campaign.status = 'failed';
        await campaign.save();
      }
    });

    return campaign;
  }

  /**
   * List campaigns
   */
  async listCampaigns({ page = 1, limit = 15, search = '', status = '' } = {}) {
    const query = { deletedAt: null };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (currentPage - 1) * perPage;

    const [campaigns, total] = await Promise.all([
      BulkCampaign.find(query)
        .populate('createdBy', 'name email role')
        .select({
          recipients: { $slice: 5 },
          name: 1,
          templateName: 1,
          templateCategory: 1,
          bodyText: 1,
          selection: 1,
          status: 1,
          total: 1,
          sent: 1,
          delivered: 1,
          failed: 1,
          createdAt: 1,
          startedAt: 1,
          finishedAt: 1,
          createdBy: 1,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      BulkCampaign.countDocuments(query),
    ]);

    return {
      data: campaigns,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }

  /**
   * Get single campaign by ID
   */
  async getCampaignById(id) {
    const campaign = await BulkCampaign.findOne({ _id: id, deletedAt: null })
      .populate('createdBy', 'name email role')
      .lean();

    if (!campaign) {
      const err = new Error('Campaign not found');
      err.status = 404;
      throw err;
    }

    return campaign;
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id) {
    const campaign = await BulkCampaign.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!campaign) {
      const err = new Error('Campaign not found');
      err.status = 404;
      throw err;
    }
    return campaign;
  }
}

module.exports = new BulkMessageService();
