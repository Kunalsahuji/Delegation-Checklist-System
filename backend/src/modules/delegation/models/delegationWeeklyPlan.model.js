const mongoose = require('mongoose');

const pct = { type: Number, min: 0, max: 100, default: null };

const delegationWeeklyPlanSchema = new mongoose.Schema(
  {
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStart: { type: Date, required: true }, // Civil Sunday opening the week
    weekNumber: { type: Number, required: true, min: 1 },
    next: {
      red: pct,
      yellow: pct,
      green: pct,
    },
    actual: {
      total: { type: Number, default: 0 },
      red: { type: Number, default: null },
      yellow: { type: Number, default: null },
      green: { type: Number, default: null },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

delegationWeeklyPlanSchema.index({ assignedTo: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('DelegationWeeklyPlan', delegationWeeklyPlanSchema);
