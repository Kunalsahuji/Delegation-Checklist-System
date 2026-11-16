const mongoose = require('mongoose');

const PROJECT_STATUS = ['open', 'hold', 'soldOut'];
const UNIT_STATUS = ['available', 'reserved', 'held', 'booked'];

const unitSchema = new mongoose.Schema(
  {
    unitNumber: { type: String, required: true, trim: true },
    unitType: { type: String, trim: true, default: 'Villa' },
    area: { type: String, trim: true, default: '' },
    facing: { type: String, trim: true, default: '' },
    price: { type: Number, default: 0 },
    status: { type: String, enum: UNIT_STATUS, default: 'available', index: true },
    notes: { type: String, trim: true, default: '' },
    buyerName: { type: String, trim: true, default: '' },
    buyerPhone: { type: String, trim: true, default: '' },
    bookedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    code: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    location: { type: String, trim: true, default: '' },
    propertyType: { type: String, trim: true, default: 'Residential' },
    status: { type: String, enum: PROJECT_STATUS, default: 'open', index: true },
    description: { type: String, trim: true, default: '' },

    // GPS Geo-coordinates for Field Site Visit Verification
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    geoFenceRadius: { type: Number, default: 500 }, // in meters (default 500m radius around site)

    // Map links and external collateral
    googleMapLink: { type: String, trim: true, default: '' },
    sitePlanUrl: { type: String, trim: true, default: '' },

    // Sellable units / inventory inside project
    units: { type: [unitSchema], default: [] },

    active: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_STATUS = PROJECT_STATUS;
module.exports.UNIT_STATUS = UNIT_STATUS;
