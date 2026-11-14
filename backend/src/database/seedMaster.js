const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');
const User = require('../modules/auth/models/user.model');
const Department = require('../modules/master/models/department.model');
const Project = require('../modules/master/models/project.model');

const DEFAULT_DEPARTMENTS = [
  { name: 'Accounts', key: 'accounts', order: 10 },
  { name: 'Supervisor', key: 'supervisor', order: 20 },
  { name: 'Loan', key: 'loan', order: 30 },
  { name: 'Technical', key: 'technical', order: 40 },
];

const DEFAULT_PROJECTS = [
  { name: 'DEMO — Green Valley Residency', code: 'GVR', location: 'Jaipur' },
  { name: 'Ram Chandra Raghunath', code: 'RCR', location: 'Jaipur' },
  { name: 'Blue water Houses', code: 'BWH', location: 'Jaipur' },
];

const DEFAULT_USERS = [
  {
    name: 'Administrator',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'Administrator',
    phone: '9999999999',
    permissions: ['*'],
  },
  {
    name: 'Demo Project Manager',
    email: 'pm@company.com',
    password: 'manager123',
    role: 'Manager',
    deptKey: 'technical',
    phone: '9888888881',
    permissions: [
      'checklist:read', 'checklist:create', 'checklist:update',
      'delegation:read', 'delegation:create', 'delegation:update', 'delegation:revise',
    ],
  },
  {
    name: 'Demo Site Engineer',
    email: 'engineer@company.com',
    password: 'engineer123',
    role: 'Employee',
    deptKey: 'supervisor',
    phone: '9888888882',
    permissions: ['checklist:read', 'delegation:read'],
  },
  {
    name: 'Demo Accounts',
    email: 'accounts@company.com',
    password: 'accounts123',
    role: 'Employee',
    deptKey: 'accounts',
    phone: '9888888883',
    permissions: ['checklist:read', 'delegation:read'],
  },
  {
    name: 'Demo Director',
    email: 'director@company.com',
    password: 'director123',
    role: 'Administrator',
    phone: '9888888884',
    permissions: ['*'],
  },
  {
    name: 'Aashish Rawat',
    email: 'aashish@company.com',
    password: 'user123',
    role: 'Employee',
    deptKey: 'technical',
    phone: '9888888885',
    permissions: ['checklist:read', 'delegation:read'],
  },
];

const seedMaster = async () => {
  try {
    logger.info('Connecting to MongoDB for Master Seeding...');
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB');

    // 1. Seed Departments
    logger.info('Seeding Departments...');
    const deptMap = {};
    for (const dept of DEFAULT_DEPARTMENTS) {
      const existing = await Department.findOne({ key: dept.key });
      if (!existing) {
        const created = await Department.create(dept);
        deptMap[dept.key] = created._id;
        logger.info(`Created department: ${dept.name}`);
      } else {
        deptMap[dept.key] = existing._id;
      }
    }

    // 2. Seed Projects
    logger.info('Seeding Projects...');
    for (const proj of DEFAULT_PROJECTS) {
      const existing = await Project.findOne({ code: proj.code });
      if (!existing) {
        await Project.create(proj);
        logger.info(`Created project: ${proj.name}`);
      }
    }

    // 3. Seed Users
    logger.info('Seeding Users...');
    for (const u of DEFAULT_USERS) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const departmentId = u.deptKey ? deptMap[u.deptKey] : null;
        await User.create({
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          phone: u.phone,
          department: departmentId,
          permissions: u.permissions,
        });
        logger.info(`Created user: ${u.name} (${u.email})`);
      }
    }

    logger.info('Master Seeding complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Master Seeding failed', { error: err.message });
    process.exit(1);
  }
};

if (require.main === module) {
  seedMaster();
}

module.exports = seedMaster;
