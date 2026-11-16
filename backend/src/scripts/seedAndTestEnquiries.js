const mongoose = require('mongoose');
const config = require('../config');
const enquiryService = require('../modules/crm/services/enquiry.service');
const Enquiry = require('../modules/crm/models/enquiry.model');
const User = require('../modules/auth/models/user.model');
const Project = require('../modules/master/models/project.model');

async function run() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB. Seeding and verifying CRM Enquiries...');

    const admin = await User.findOne();
    const gvProject = await Project.findOne({ name: { $regex: 'Green Valley', $options: 'i' } });
    const bwProject = await Project.findOne({ name: { $regex: 'Blue water', $options: 'i' } });

    // Ensure clean state if test seed already run
    const existingCount = await Enquiry.countDocuments({ deletedAt: null });

    if (existingCount < 3) {
      console.log('Seeding initial realistic enquiries...');
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // 1. Qualified
      await enquiryService.createEnquiry(
        {
          clientName: 'Ramesh Patel',
          clientPhone: '+91 98290 44556',
          clientEmail: 'ramesh.patel@gmail.com',
          city: 'Jaipur',
          source: 'walkIn',
          propertyType: 'Luxury Villas',
          project: gvProject?.name || 'Green Valley Residency',
          projectId: gvProject?._id,
          budgetMin: 10000000,
          budgetMax: 15000000,
          temperature: 'hot',
          status: 'qualified',
          nextFollowupAt: tomorrow,
          followupTime: '11:00 AM',
          remarks: 'Client visited office, highly interested in 4 BHK East facing villa. Site visit scheduled.',
          qualification: {
            status: 'qualified',
            budgetFit: true,
            timeline: 'Immediate within 15 days',
            preferredVisitDate: tomorrow,
            notes: 'Budget verified. Payment through own funds.',
            qualifiedAt: new Date(),
            qualifiedBy: admin?._id,
          },
          specialFollowUp: true,
        },
        admin?._id
      );

      // 2. Pending - Due Today
      await enquiryService.createEnquiry(
        {
          clientName: 'Priya Sharma',
          clientPhone: '+91 94140 11223',
          clientEmail: 'priya.s@yahoo.com',
          city: 'Jaipur',
          source: 'phone',
          propertyType: 'Residential Plots',
          project: bwProject?.name || 'Blue water Houses',
          projectId: bwProject?._id,
          budgetMin: 4500000,
          budgetMax: 6500000,
          temperature: 'warm',
          status: 'contacted',
          nextFollowupAt: today,
          followupTime: '03:30 PM',
          remarks: 'Discussed plot sizes. Call back today at 3:30 PM to confirm weekend visit.',
        },
        admin?._id
      );

      // 3. Pending - Overdue
      await enquiryService.createEnquiry(
        {
          clientName: 'Vikramaditya Rathore',
          clientPhone: '+91 97840 99887',
          city: 'Jodhpur',
          source: 'reference',
          referenceName: 'Col. KS Shekhawat',
          propertyType: 'Luxury Villas',
          project: gvProject?.name || 'Green Valley Residency',
          projectId: gvProject?._id,
          budgetMin: 12000000,
          budgetMax: 18000000,
          temperature: 'hot',
          status: 'new',
          nextFollowupAt: yesterday,
          followupTime: '04:00 PM',
          remarks: 'High net-worth reference. Missed yesterday call, need immediate follow-up.',
          specialFollowUp: true,
        },
        admin?._id
      );

      // 4. New from Meta Ads
      await enquiryService.createEnquiry(
        {
          clientName: 'Sunita Meena',
          clientPhone: '+91 99280 77665',
          city: 'Jaipur',
          source: 'metaAds',
          propertyType: 'Residential Plots',
          project: bwProject?.name || 'Blue water Houses',
          budgetMin: 4000000,
          budgetMax: 5000000,
          temperature: 'warm',
          status: 'new',
          nextFollowupAt: today,
          followupTime: '05:00 PM',
          remarks: 'Submitted Facebook lead form for Lakeside Plots.',
        },
        admin?._id
      );

      // 5. Rejected / Not Qualified
      await enquiryService.createEnquiry(
        {
          clientName: 'Amit Kumar',
          clientPhone: '+91 96020 33445',
          city: 'Kota',
          source: 'website',
          propertyType: 'Apartments',
          budgetMin: 1500000,
          budgetMax: 2000000,
          temperature: 'cold',
          status: 'rejected',
          remarks: 'Looking for 20 Lakh apartment. Project starts at 45 Lakhs. Not qualified.',
          qualification: {
            status: 'rejected',
            rejectReason: 'Budget significantly below minimum project inventory pricing.',
            qualifiedAt: new Date(),
            qualifiedBy: admin?._id,
          },
        },
        admin?._id
      );

      console.log('Sample enquiries seeded successfully!');
    }

    // Automated Verification Test
    console.log('\n--- Running Automated Verification ---');
    const listRes = await enquiryService.listEnquiries();
    console.log(`✓ List enquiries returned ${listRes.enquiries.length} items.`);
    console.log('  KPIs:', listRes.kpis);

    if (listRes.kpis.totalEnquiries === 0) throw new Error('Expected enquiries in DB');

    // Test duplicate phone check
    const dupCheck = await enquiryService.checkPhoneDuplicate('+91 98290 44556');
    console.log(`✓ Phone duplicate check returned: ${dupCheck ? dupCheck.enquiryNumber : 'null'}`);
    if (!dupCheck) throw new Error('Expected duplicate phone match');

    // Test Add Remark
    const firstEnq = listRes.enquiries[0];
    const withRemark = await enquiryService.addRemark(firstEnq._id, 'Automated test remark logging verified.', admin?._id);
    console.log(`✓ Added remark to ${withRemark.enquiryNumber}. Total remarks: ${withRemark.remarksHistory.length}`);

    console.log('\nAll CRM Enquiry Service tests PASSED successfully!');
  } catch (err) {
    console.error('Test FAILED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
