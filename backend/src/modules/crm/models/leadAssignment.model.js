const mongoose = require('mongoose');

const leadAssignmentSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedToName: { type: String, trim: true, default: '' },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedByName: { type: String, trim: true, default: '' },
    previousAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    previousAssigneeName: { type: String, trim: true, default: '' },
    assignedAt: { type: Date, default: Date.now, index: true },
    autoAssigned: { type: Boolean, default: false, index: true },
    triggerType: {
      type: String,
      enum: ['manual', 'bulk', 'roundRobin', 'auto24h', 'reassign', 'unassign'],
      default: 'manual',
      index: true,
    },
    assignmentReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

leadAssignmentSchema.index({ leadId: 1, assignedAt: -1 });

module.exports = mongoose.model('LeadAssignment', leadAssignmentSchema);
