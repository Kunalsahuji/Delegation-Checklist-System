const mongoose = require('mongoose');
const config = require('../config');
const projectService = require('../modules/crm/services/project.service');
const User = require('../modules/auth/models/user.model');

async function test() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Testing CRM Project Service endpoints...');

    // 1. List Projects
    const list = await projectService.listProjects();
    console.log(`✓ List projects returned ${list.projects.length} projects.`);
    console.log('  KPIs:', list.kpis);
    if (!list.projects.length) throw new Error('Expected at least 1 project');

    // 2. Create Project
    const adminUser = await User.findOne();
    const created = await projectService.createProject(
      {
        name: `Automated Test Project ${Date.now()}`,
        code: `ATP${Math.floor(Math.random() * 1000)}`,
        location: 'Mansarovar, Jaipur',
        propertyType: 'Residential Plots',
        latitude: 26.8500,
        longitude: 75.7600,
        geoFenceRadius: 450,
        description: 'Test project for validation',
      },
      adminUser?._id
    );
    console.log(`✓ Created project: "${created.name}" (ID: ${created._id})`);

    // 3. Get Project By ID
    const fetched = await projectService.getProjectById(created._id);
    console.log(`✓ Fetched project by ID. Units count: ${fetched.units.length}`);

    // 4. Add Unit
    const addedUnit = await projectService.addUnit(created._id, {
      unitNumber: 'Plot-99',
      unitType: 'Residential Plot',
      area: '200 Sq. Yards',
      facing: 'North',
      price: 5500000,
      status: 'available',
    });
    console.log(`✓ Added unit: "${addedUnit.unitNumber}" with price ₹${addedUnit.price}`);

    // 5. Update Unit (Mark as Booked)
    const updatedUnit = await projectService.updateUnit(created._id, addedUnit._id.toString(), {
      status: 'booked',
      buyerName: 'Test Buyer',
      buyerPhone: '+91 99999 88888',
    });
    console.log(`✓ Updated unit status to "${updatedUnit.status}" for buyer "${updatedUnit.buyerName}"`);

    // 6. Delete Unit
    const deleteUnitRes = await projectService.deleteUnit(created._id, addedUnit._id.toString());
    console.log(`✓ ${deleteUnitRes.message}`);

    // 7. Soft Delete Project
    const deleteProjectRes = await projectService.deleteProject(created._id, adminUser?._id);
    console.log(`✓ ${deleteProjectRes.message}`);

    console.log('\nAll CRM Project Service tests PASSED successfully!');
  } catch (error) {
    console.error('Test FAILED:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

test();
