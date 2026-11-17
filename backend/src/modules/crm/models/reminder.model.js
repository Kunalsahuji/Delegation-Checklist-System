const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    referenceType: {
      type: String,
      enum: ['enquiry', 'lead', 'qualification', 'personal'],
      required: true,
      index: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ['followup', 'reminder', 'plannedDate'],
      default: 'followup',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },

    reminderDate: { type: Date, required: true },
    reminderTime: { type: String, trim: true, default: '' },
    reminderAt: { type: Date, required: true, index: true },

    status: {
      type: String,
      enum: ['pending', 'completed', 'missed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    completedAt: { type: Date, default: null },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completionRemarks: { type: String, trim: true, default: '' },

    overdueNotifiedAt: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

reminderSchema.index({ assignedTo: 1, status: 1, reminderAt: 1 });
reminderSchema.index({ referenceType: 1, referenceId: 1, category: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
