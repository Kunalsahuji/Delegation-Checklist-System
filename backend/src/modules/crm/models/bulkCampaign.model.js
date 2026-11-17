const mongoose = require('mongoose');

const CAMPAIGN_STATUS = ['queued', 'running', 'paused', 'completed', 'failed'];
const RECIPIENT_STATUS = ['pending', 'sent', 'delivered', 'failed', 'skipped'];

const recipientSchema = new mongoose.Schema(
  {
    enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', default: null },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', default: null },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    status: { type: String, enum: RECIPIENT_STATUS, default: 'pending' },
    error: { type: String, trim: true, default: '' },
    sentAt: { type: Date, default: null },
  },
  { _id: false }
);

const bulkCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    templateName: { type: String, trim: true, required: true },
    templateCategory: { type: String, trim: true, default: 'MARKETING' },
    languageCode: { type: String, trim: true, default: 'en' },
    bodyText: { type: String, trim: true, default: '', maxlength: 2000 },
    mediaUrl: { type: String, trim: true, default: '' },
    mediaType: { type: String, enum: ['', 'image', 'video', 'document'], default: '' },

    selection: {
      mode: {
        type: String,
        enum: ['all', 'status', 'lead', 'project', 'brokers', 'pick'],
        default: 'all',
      },
      statuses: { type: [String], default: [] },
      leadStatuses: { type: [String], default: [] },
      project: { type: String, default: '' },
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    },

    status: { type: String, enum: CAMPAIGN_STATUS, default: 'queued', index: true },
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },

    recipients: { type: [recipientSchema], default: [] },

    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

bulkCampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BulkCampaign', bulkCampaignSchema);
module.exports.CAMPAIGN_STATUS = CAMPAIGN_STATUS;
module.exports.RECIPIENT_STATUS = RECIPIENT_STATUS;
