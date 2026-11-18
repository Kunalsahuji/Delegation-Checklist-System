const mongoose = require('mongoose');

const leadStageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, required: true, unique: true, min: 1 },
    color: { type: String, trim: true, default: '#3B82F6' },
    description: { type: String, trim: true, default: '' },
    assignedRoles: [{ type: String, trim: true }],
    requiredFields: [{ type: String, trim: true }],
    slaHours: { type: Number, min: 0, default: 24 },
    isActive: { type: Boolean, default: true, index: true },
    isInitial: { type: Boolean, default: false },
    isFinal: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

leadStageSchema.virtual('colorHex').get(function () {
  return this.color;
});

leadStageSchema.set('toObject', { virtuals: true });
leadStageSchema.set('toJSON', { virtuals: true });

leadStageSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('LeadStage', leadStageSchema);
