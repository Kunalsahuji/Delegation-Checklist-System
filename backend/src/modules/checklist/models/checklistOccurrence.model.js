const mongoose = require('mongoose');
const { CHECKLIST_FREQUENCIES } = require('../../../utils/recurrence');

const progressRemarkSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    byName: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, required: true, maxlength: 1000 },
    expectedDate: { type: Date, required: true },
    plannedDate: { type: Date, default: null },
  },
  { _id: true }
);

const reassignmentSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromUserName: { type: String, trim: true, default: '' },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserName: { type: String, trim: true, default: '' },
    reason: { type: String, trim: true, default: '', maxlength: 500 },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const checklistOccurrenceSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'ChecklistTask', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 240 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedToName: { type: String, trim: true, default: '' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    departmentName: { type: String, trim: true, default: '' },
    frequency: { type: String, enum: CHECKLIST_FREQUENCIES, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },

    plannedOn: { type: Date, required: true }, // Civil Date at UTC midnight
    plannedAt: { type: Date, required: true }, // Exact deadline instant in IST

    status: {
      type: String,
      enum: ['pending', 'done', 'skipped'],
      default: 'pending',
      index: true,
    },

    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedByName: { type: String, trim: true, default: '' },

    remarks: { type: String, trim: true, default: '', maxlength: 1000 },

    progressRemarks: { type: [progressRemarkSchema], default: [] },
    progressCount: { type: Number, default: 0, min: 0 },
    latestProgress: {
      at: { type: Date, default: null },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      byName: { type: String, trim: true, default: '' },
      note: { type: String, trim: true, default: '' },
      expectedDate: { type: Date, default: null },
    },

    reassignments: { type: [reassignmentSchema], default: [] },
    reassignmentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Idempotency: exact same task cannot have two rows on the same civil date
checklistOccurrenceSchema.index({ task: 1, plannedOn: 1 }, { unique: true });
checklistOccurrenceSchema.index({ assignedTo: 1, status: 1, plannedOn: 1 });
checklistOccurrenceSchema.index({ department: 1, status: 1 });
checklistOccurrenceSchema.index({ status: 1, plannedAt: 1 });

module.exports = mongoose.model('ChecklistOccurrence', checklistOccurrenceSchema);
