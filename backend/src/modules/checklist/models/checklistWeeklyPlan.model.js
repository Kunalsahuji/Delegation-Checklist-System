const mongoose = require('mongoose');

const pct = { type: Number, min: 0, max: 100, default: null };

const checklistWeeklyPlanSchema = new mongoose.Schema(
  {
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStart: { type: Date, required: true }, // The civil Monday that opens the week (UTC midnight)
    weekNumber: { type: Number, required: true, min: 1 },
    next: {
      notDone: pct,
      notDoneOnTime: pct,
    },
    actual: {
      total: { type: Number, default: 0 },
      notDone: { type: Number, default: null },
      notDoneOnTime: { type: Number, default: null },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

checklistWeeklyPlanSchema.index({ assignedTo: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('ChecklistWeeklyPlan', checklistWeeklyPlanSchema);
