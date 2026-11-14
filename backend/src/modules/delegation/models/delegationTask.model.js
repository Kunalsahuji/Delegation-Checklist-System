const mongoose = require('mongoose');

const dateRevisionSchema = new mongoose.Schema(
  {
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, trim: true, required: true, maxlength: 500 },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    changedByName: { type: String, trim: true, default: '' },
    changedAt: { type: Date, default: Date.now },
    kind: { type: String, enum: ['revise', 'weekShift'], default: 'revise' },
  },
  { _id: true }
);

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

const followUpEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, default: '', maxlength: 1000 },
    nextOn: { type: Date, default: null },
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

const delegationTaskSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. DLG-000001
    legacyCode: { type: String, trim: true, default: '', maxlength: 32, index: true },
    title: { type: String, required: true, trim: true, maxlength: 240 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedToName: { type: String, trim: true, default: '', maxlength: 160 },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedByName: { type: String, trim: true, default: '', maxlength: 160 },
    assignedAt: { type: Date, default: Date.now },

    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    departmentName: { type: String, trim: true, default: '', maxlength: 120 },

    /**
     * THE IMMUTABLE ORIGINAL DATE
     * Set once at creation and never overwritten.
     */
    originalDueDate: { type: Date, required: true },

    /**
     * CURRENT DEADLINE
     * Updated only via the revise path which appends to revisions[].
     */
    dueDate: { type: Date, required: true, index: true },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },

    startDate: { type: Date, default: null },

    proofRequired: { type: Boolean, default: false },
    verificationRequired: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['none', 'submitted', 'verified', 'returned'],
      default: 'none',
    },

    revisions: { type: [dateRevisionSchema], default: [] },
    revisionCount: { type: Number, default: 0, min: 0, index: true },

    followUp: {
      required: { type: Boolean, default: false },
      nextOn: { type: Date, default: null },
      lastAt: { type: Date, default: null },
      count: { type: Number, default: 0, min: 0 },
      entries: { type: [followUpEntrySchema], default: [] },
    },

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

    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'weekShifted'],
      default: 'pending',
      index: true,
    },

    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedByName: { type: String, trim: true, default: '' },
    cancelReason: { type: String, trim: true, default: '', maxlength: 500 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

delegationTaskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
delegationTaskSchema.index({ status: 1, dueDate: 1 });
delegationTaskSchema.index({ project: 1, status: 1 });
delegationTaskSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('DelegationTask', delegationTaskSchema);
