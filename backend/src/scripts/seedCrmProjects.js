const mongoose = require('mongoose');
const config = require('../config');
const Project = require('../modules/master/models/project.model');

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB for CRM project seeding...');

    // Update Green Valley Residency
    await Project.updateOne(
      { name: { $regex: 'Green Valley', $options: 'i' } },
      {
        $set: {
          propertyType: 'Luxury Villas',
          location: 'Ajmer Road, Jaipur',
          latitude: 26.8530,
          longitude: 75.8050,
          geoFenceRadius: 500,
          googleMapLink: 'https://maps.google.com/?q=26.8530,75.8050',
          description: 'Premium gated villa community with clubhouse, landscaped gardens and 24/7 security.',
          status: 'open',
          units: [
            { unitNumber: 'Villa-101', unitType: '4 BHK Luxury Villa', area: '250 Sq. Yards', facing: 'East', price: 12500000, status: 'available' },
            { unitNumber: 'Villa-102', unitType: '4 BHK Luxury Villa', area: '250 Sq. Yards', facing: 'East', price: 12500000, status: 'booked', buyerName: 'Rajesh Sharma', buyerPhone: '+91 98290 12345', bookedAt: new Date() },
            { unitNumber: 'Villa-103', unitType: '3 BHK Villa', area: '200 Sq. Yards', facing: 'North', price: 9500000, status: 'available' },
            { unitNumber: 'Villa-104', unitType: '3 BHK Villa', area: '200 Sq. Yards', facing: 'North', price: 9500000, status: 'held', notes: 'Held for Mr. Singhania until Friday' },
            { unitNumber: 'Villa-105', unitType: '3 BHK Villa', area: '200 Sq. Yards', facing: 'West', price: 9200000, status: 'available' },
            { unitNumber: 'Villa-106', unitType: '4 BHK Luxury Villa', area: '300 Sq. Yards', facing: 'North-East', price: 16000000, status: 'booked', buyerName: 'Anil Agarwal', buyerPhone: '+91 94140 88990', bookedAt: new Date() },
          ],
        },
      }
    );

    // Update Blue water Houses
    await Project.updateOne(
      { name: { $regex: 'Blue water', $options: 'i' } },
      {
        $set: {
          propertyType: 'Residential Plots',
          location: 'Jagatpura, Jaipur',
          latitude: 26.8200,
          longitude: 75.8400,
          geoFenceRadius: 600,
          googleMapLink: 'https://maps.google.com/?q=26.8200,75.8400',
          description: 'Lakeside residential plots with wide bitumen roads and underground electrification.',
          status: 'open',
          units: [
            { unitNumber: 'Plot-A1', unitType: 'Residential Plot', area: '166 Sq. Yards', facing: 'East', price: 4980000, status: 'available' },
            { unitNumber: 'Plot-A2', unitType: 'Residential Plot', area: '166 Sq. Yards', facing: 'East', price: 4980000, status: 'available' },
            { unitNumber: 'Plot-A3', unitType: 'Corner Plot', area: '200 Sq. Yards', facing: 'North-East', price: 6500000, status: 'reserved' },
            { unitNumber: 'Plot-A4', unitType: 'Residential Plot', area: '150 Sq. Yards', facing: 'North', price: 4500000, status: 'available' },
            { unitNumber: 'Plot-A5', unitType: 'Residential Plot', area: '150 Sq. Yards', facing: 'South', price: 4200000, status: 'booked', buyerName: 'Deepak Verma', buyerPhone: '+91 97840 55667', bookedAt: new Date() },
          ],
        },
      }
    );

    // Update Ram Chandra Raghunath
    await Project.updateOne(
      { name: { $regex: 'Ram Chandra', $options: 'i' } },
      {
        $set: {
          propertyType: 'Commercial & Retail',
          location: 'Tonk Road, Jaipur',
          latitude: 26.8800,
          longitude: 75.7900,
          geoFenceRadius: 400,
          googleMapLink: 'https://maps.google.com/?q=26.8800,75.7900',
          description: 'Prime commercial spaces and retail showrooms with high footfall on main highway.',
          status: 'open',
          units: [
            { unitNumber: 'Shop-G1', unitType: 'Ground Floor Retail', area: '450 Sq. Ft.', facing: 'Main Road', price: 7500000, status: 'booked', buyerName: 'Pooja Textiles', buyerPhone: '+91 99280 11223', bookedAt: new Date() },
            { unitNumber: 'Shop-G2', unitType: 'Ground Floor Retail', area: '450 Sq. Ft.', facing: 'Main Road', price: 7500000, status: 'available' },
            { unitNumber: 'Office-101', unitType: 'First Floor Office', area: '800 Sq. Ft.', facing: 'East', price: 6800000, status: 'available' },
          ],
        },
      }
    );

    console.log('CRM Projects enriched successfully with GPS coordinates and units inventory!');
  } catch (err) {
    console.error('Error seeding CRM projects:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
