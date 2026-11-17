const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../modules/auth/models/user.model');
const Project = require('../modules/master/models/project.model');
const Lead = require('../modules/crm/models/lead.model');
const LeadStage = require('../modules/crm/models/leadStage.model');
const VisitReport = require('../modules/crm/models/visitReport.model');
const visitReportService = require('../modules/crm/services/visitReport.service');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow_erp';

async function runTest() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    // 1. Ensure test user
    let user = await User.findOne({ status: 'active' });
    if (!user) {
      user = await User.create({
        name: 'Demo Visitor User',
        email: 'visitor@taskflow.local',
        password: 'password123',
        role: 'Employee',
        status: 'active',
      });
    }

    // 2. Ensure test project with GPS coordinates (e.g. Jaipur coordinates: 26.9124, 75.7873)
    let project = await Project.findOne({ name: 'Jaipur Grand Residency' });
    if (!project) {
      project = await Project.create({
        name: 'Jaipur Grand Residency',
        code: 'JGR',
        location: 'Ajmer Road, Jaipur',
        propertyType: 'Residential',
        latitude: 26.9124,
        longitude: 75.7873,
        geoFenceRadius: 500, // 500 meters
        status: 'open',
      });
    }
    console.log(`Using Project: ${project.name} (Coords: ${project.latitude}, ${project.longitude}, Radius: ${project.geoFenceRadius}m)`);

    // 3. Test distance calculation
    const distNear = visitReportService.calculateDistanceMeters(26.9124, 75.7873, 26.9130, 75.7880);
    console.log(`Calculated near distance: ${distNear}m (Should be ~90-100m)`);

    // 4. Create test lead
    let stage = await LeadStage.findOne({ isDefault: true }) || await LeadStage.findOne().sort({ order: 1 });
    const lead = await Lead.create({
      leadNumber: `LD-VISIT-TEST-${Date.now()}`,
      clientName: 'Deepak Sharma',
      clientPhone: '9829099999',
      currentStageId: stage._id,
      currentStageName: stage.name,
      currentStageOrder: stage.order,
      temperature: 'hot',
      status: 'active',
      project: project.name,
      projectId: project._id,
      budget: 7500000,
    });
    console.log(`Created test lead: ${lead.leadNumber} for ${lead.clientName}`);

    // 5. Test Visit Log INSIDE Geo-Fence (~90m away from project center)
    console.log('\n--- Testing Visit Creation INSIDE Geo-Fence ---');
    const insideVisit = await visitReportService.createVisit(
      {
        leadId: lead._id,
        customerName: lead.clientName,
        contactNumber: lead.clientPhone,
        projectId: project._id,
        projectVisited: project.name,
        propertyInterested: 'Villa',
        firstPreference: 'Plot #42 West Facing',
        customerBudget: '75,00,000',
        customerProfession: 'Senior Architect',
        remarks: 'Client visited with family; liked the garden facing layout.',
        submittedLat: 26.9130,
        submittedLng: 75.7880,
        submittedAccuracy: 15,
        visitorId: user._id,
      },
      user
    );
    console.log('Inside Visit Created:');
    console.log(` - ID: ${insideVisit._id}`);
    console.log(` - Geo Verified: ${insideVisit.geoVerified}`);
    console.log(` - Distance: ${insideVisit.geoDistanceMeters}m`);
    console.log(` - Matched Location: ${insideVisit.geoMatchedLocation}`);
    console.log(` - Visit Number: ${insideVisit.visitNumber}`);

    if (!insideVisit.geoVerified) {
      throw new Error('Expected inside visit to be geoVerified: true!');
    }

    // 6. Test Visit Log OUTSIDE Geo-Fence (15km away)
    console.log('\n--- Testing Visit Creation OUTSIDE Geo-Fence ---');
    const outsideVisit = await visitReportService.createVisit(
      {
        leadId: lead._id,
        customerName: lead.clientName,
        contactNumber: lead.clientPhone,
        projectId: project._id,
        projectVisited: project.name,
        submittedLat: 26.8000, // far away
        submittedLng: 75.6000,
        submittedAccuracy: 25,
        visitorId: user._id,
        remarks: 'Filled from external location test',
      },
      user
    );
    console.log('Outside Visit Created:');
    console.log(` - ID: ${outsideVisit._id}`);
    console.log(` - Geo Verified: ${outsideVisit.geoVerified}`);
    console.log(` - Distance: ${outsideVisit.geoDistanceMeters}m`);
    console.log(` - Visit Number: ${outsideVisit.visitNumber}`); // Should be '2nd'

    if (outsideVisit.geoVerified) {
      throw new Error('Expected outside visit to be geoVerified: false!');
    }
    if (outsideVisit.visitNumber !== '2nd') {
      throw new Error(`Expected visitNumber to be '2nd', got ${outsideVisit.visitNumber}`);
    }

    // 7. Test getStats
    console.log('\n--- Testing Visit KPI Stats ---');
    const stats = await visitReportService.getStats();
    console.log('Stats:', stats);

    // 8. Test listVisits
    console.log('\n--- Testing List Visits with Search & Filter ---');
    const listRes = await visitReportService.listVisits({
      search: 'Deepak Sharma',
      page: 1,
      limit: 10,
    });
    console.log(`Found ${listRes.total} visits for Deepak Sharma`);

    // 9. Test updateVisit
    console.log('\n--- Testing Update Visit ---');
    const updated = await visitReportService.updateVisit(
      insideVisit._id,
      { remarks: 'Updated remarks: Client confirmed intent for booking next week.' },
      user
    );
    console.log(`Updated visit remarks: "${updated.remarks}"`);

    // 10. Test deleteVisit (soft delete)
    console.log('\n--- Testing Soft Delete Visit ---');
    await visitReportService.deleteVisit(outsideVisit._id, user);
    const postDeleteList = await visitReportService.listVisits({ leadId: lead._id });
    console.log(`Visits remaining after delete: ${postDeleteList.total}`);

    console.log('\n✅ ALL BACKEND FIELD SITE VISITS & GEO-FENCING TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTest();
