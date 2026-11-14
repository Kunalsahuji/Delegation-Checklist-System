const mongoose = require('mongoose');
const { CHECKLIST_FREQUENCIES } = require('../../../utils/recurrence');

const checklistTaskSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. CHK-000001
    title: { type: String, required: true, trim: true, maxlength: 240 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedToName: { type: String, trim: true, default: '' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    departmentName: { type: String, trim: true, default: '' },
    frequency: { type: String, enum: CHECKLIST_FREQUENCIES, required: true, index: true },
    anchorDate: { type: Date, required: true },
    startOn: { type: Date, required: true },
    endOn: { type: Date, default: null },
    dueTime: { type: String, trim: true, default: '18:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    skipSundays: { type: Boolean, default: false },
    skipHolidays: { type: Boolean, default: false },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    active: { type: Boolean, default: true, index: true },
    comments: [
      {
        author: { type: String, trim: true, default: 'Administrator' },
        text: { type: String, trim: true, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    attachments: [
      {
        name: { type: String, trim: true, required: true },
        size: { type: Number, default: 0 },
        url: { type: String, default: '#' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    materialisedThrough: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

checklistTaskSchema.index({ active: 1, assignedTo: 1 });
checklistTaskSchema.index({ active: 1, department: 1 });
checklistTaskSchema.index({ active: 1, materialisedThrough: 1 });

module.exports = mongoose.model('ChecklistTask', checklistTaskSchema);
