const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    code: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    location: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
