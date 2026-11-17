const mongoose = require('mongoose');

const STATUS = ['pending', 'assigned', 'skipped'];
const SKIP_REASONS = ['', 'duplicateOnMeta', 'alreadyInCrm', 'invalidPhone', 'other'];

const metaLeadSchema = new mongoose.Schema(
  {
    leadgenId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    formId: { type: String, trim: true, default: '', index: true },
    formName: { type: String, trim: true, default: 'Meta Lead Ad Campaign' },
    pageId: { type: String, trim: true, default: '' },
    adId: { type: String, trim: true, default: '' },
    adName: { type: String, trim: true, default: '' },
    campaignName: { type: String, trim: true, default: '' },

    clientName: { type: String, trim: true, default: 'Prospective Client' },
    clientPhone: { type: String, trim: true, default: '', index: true },
    clientEmail: { type: String, trim: true, lowercase: true, default: '' },

    requirement: { type: String, trim: true, default: '' },
    budget: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: 'Jaipur' },
    rawFields: { type: mongoose.Schema.Types.Mixed, default: {} },

    metaCreatedAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: STATUS, default: 'pending', index: true },
    skipReason: { type: String, enum: SKIP_REASONS, default: '' },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },

    enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', default: null },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  },
  { timestamps: true }
);

metaLeadSchema.index({ status: 1, metaCreatedAt: -1 });

module.exports = mongoose.model('MetaLead', metaLeadSchema);
module.exports.STATUS = STATUS;
module.exports.SKIP_REASONS = SKIP_REASONS;
