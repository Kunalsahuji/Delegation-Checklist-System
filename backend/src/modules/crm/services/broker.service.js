const Broker = require('../models/broker.model');
const { BROKER_LEVELS, BROKER_LEVEL_NAMES } = require('../models/broker.model');
const Lead = require('../models/lead.model');
const Enquiry = require('../models/enquiry.model');
const User = require('../../auth/models/user.model');

/**
 * Get Broker Module KPIs
 */
const getKPIs = async () => {
  const baseFilter = { deletedAt: null, status: 'active' };

  const [totalBrokers, yardsAgg, seniorBrokers] = await Promise.all([
    Broker.countDocuments(baseFilter),
    Broker.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, totalYards: { $sum: '$totalYards' } } },
    ]),
    Broker.countDocuments({
      ...baseFilter,
      level: {
        $in: [
          'Sales Manager',
          'Senior Sales Manager',
          'Area Sales Manager',
          'Regional Sales Manager',
          'Assistant Sales Director',
          'Sales Director',
        ],
      },
    }),
  ]);

  const totalYards = yardsAgg[0]?.totalYards || 0;

  // Count broker-sourced active leads
  const brokerLeads = await Lead.countDocuments({
    source: 'broker',
    status: 'active',
  });

  return {
    totalBrokers,
    totalYards,
    activeBrokerLeads: brokerLeads,
    seniorPartners: seniorBrokers,
  };
};

/**
 * List Brokers with Filtering, Search, and Progression Stats
 */
const listBrokers = async (query = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    level = '',
    status = 'active',
    managedBy = '',
  } = query;

  const filter = { deletedAt: null };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (level && level !== 'all') {
    filter.level = level;
  }

  if (managedBy) {
    filter.managedBy = managedBy;
  }

  if (search && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { agencyName: { $regex: term, $options: 'i' } },
      { city: { $regex: term, $options: 'i' } },
      { brokerCode: { $regex: term, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [rawBrokers, total] = await Promise.all([
    Broker.find(filter)
      .populate('managedBy', 'name email role')
      .populate('seniorBrokerId', 'name level brokerCode')
      .sort({ totalYards: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Broker.countDocuments(filter),
  ]);

  const brokers = rawBrokers.map((b) => {
    const doc = b.toObject();
    return {
      ...doc,
      progress: b.calculateProgress(),
    };
  });

  return {
    brokers,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * Get Broker Details by ID with Referred Leads
 */
const getBrokerById = async (id) => {
  const broker = await Broker.findOne({ _id: id, deletedAt: null })
    .populate('managedBy', 'name email role')
    .populate('seniorBrokerId', 'name level brokerCode');

  if (!broker) {
    const err = new Error('Broker partner not found');
    err.status = 404;
    throw err;
  }

  // Find referred enquiries & leads
  const [referredEnquiries, referredLeads] = await Promise.all([
    Enquiry.find({
      $or: [{ brokerId: broker._id }, { brokerName: broker.name }],
    })
      .select('enquiryNumber clientName clientPhone project status createdAt')
      .lean(),
    Lead.find({
      $or: [{ clientName: broker.name }, { project: broker.name }], // fallback
    })
      .select('leadNumber clientName clientPhone project currentStageName status')
      .lean(),
  ]);

  return {
    broker: {
      ...broker.toObject(),
      progress: broker.calculateProgress(),
    },
    referrals: {
      enquiries: referredEnquiries,
      totalEnquiries: referredEnquiries.length,
      leads: referredLeads,
      totalLeads: referredLeads.length,
    },
  };
};

/**
 * Create a new Channel Partner / Broker
 */
const createBroker = async (data, actor = null) => {
  const { name, phone, email, agencyName, city, address, level, commissionRate, managedBy, notes } = data;

  if (!name || !name.trim()) {
    const err = new Error('Partner name is required');
    err.status = 400;
    throw err;
  }

  if (!phone || !phone.trim()) {
    const err = new Error('Contact phone is required');
    err.status = 400;
    throw err;
  }

  // Check duplicate phone
  const existing = await Broker.findOne({ phone: phone.trim(), deletedAt: null });
  if (existing) {
    const err = new Error(`Broker with phone ${phone} already registered (${existing.name})`);
    err.status = 400;
    throw err;
  }

  // Generate sequence code
  const count = await Broker.countDocuments();
  const brokerCode = `BRK-${String(count + 1).padStart(5, '0')}`;

  let managerName = '';
  if (managedBy) {
    const mgr = await User.findById(managedBy);
    if (mgr) managerName = mgr.name;
  }

  const broker = await Broker.create({
    brokerCode,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
    agencyName: agencyName ? agencyName.trim() : '',
    city: city ? city.trim() : '',
    address: address ? address.trim() : '',
    level: level || 'Associate',
    totalYards: Number(data.totalYards) || 0,
    commissionRate: Number(commissionRate) || 2,
    managedBy: managedBy || null,
    managedByName: managerName,
    notes: notes || '',
    createdBy: actor?._id || null,
  });

  return Broker.findById(broker._id).populate('managedBy', 'name email role');
};

/**
 * Update Broker Partner
 */
const updateBroker = async (id, data, actor = null) => {
  const broker = await Broker.findOne({ _id: id, deletedAt: null });
  if (!broker) {
    const err = new Error('Broker partner not found');
    err.status = 404;
    throw err;
  }

  const allowedFields = [
    'name',
    'phone',
    'alternatePhone',
    'email',
    'agencyName',
    'city',
    'address',
    'level',
    'commissionRate',
    'managedBy',
    'totalYards',
    'status',
    'notes',
  ];

  allowedFields.forEach((f) => {
    if (data[f] !== undefined) broker[f] = data[f];
  });

  if (data.managedBy) {
    const mgr = await User.findById(data.managedBy);
    if (mgr) broker.managedByName = mgr.name;
  }

  broker.updatedBy = actor?._id || null;
  await broker.save();

  return Broker.findById(broker._id).populate('managedBy', 'name email role');
};

/**
 * Soft delete Broker
 */
const deleteBroker = async (id, actor = null) => {
  const broker = await Broker.findOne({ _id: id, deletedAt: null });
  if (!broker) {
    const err = new Error('Broker partner not found');
    err.status = 404;
    throw err;
  }

  broker.deletedAt = new Date();
  broker.deletedBy = actor?._id || null;
  await broker.save();

  return { message: 'Broker partner deleted successfully' };
};

/**
 * Get Hierarchical Network Structure (Levels -> Partners)
 */
const getNetworkHierarchy = async () => {
  const brokers = await Broker.find({ deletedAt: null, status: 'active' })
    .populate('managedBy', 'name email role')
    .sort({ totalYards: -1 })
    .lean();

  // Group by level
  const hierarchy = BROKER_LEVELS.slice().reverse().map((tier) => {
    const members = brokers.filter((b) => b.level === tier.name);
    const tierYards = members.reduce((acc, curr) => acc + (curr.totalYards || 0), 0);

    return {
      levelName: tier.name,
      minYards: tier.min,
      maxYards: tier.max,
      memberCount: members.length,
      totalYards: tierYards,
      members: members.map((m) => ({
        _id: m._id,
        brokerCode: m.brokerCode,
        name: m.name,
        phone: m.phone,
        agencyName: m.agencyName,
        city: m.city,
        totalYards: m.totalYards || 0,
        manager: m.managedBy?.name || m.managedByName || 'General',
      })),
    };
  });

  return hierarchy;
};

module.exports = {
  getKPIs,
  listBrokers,
  getBrokerById,
  createBroker,
  updateBroker,
  deleteBroker,
  getNetworkHierarchy,
  BROKER_LEVELS,
};
