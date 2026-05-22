
require('dotenv').config();
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');
const Batch = require('./models/Batch');
const User = require('./models/User');
const logger = require('./utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('✅ MongoDB connected for medicine seeding');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedMedicines = async () => {
  const testMedicines = [
    {
      name: 'Vitamin C 100mg',
      manufacturer: 'Pharma Labs',
      category: 'Vitamin',
      price: 50,
      quantity: 150,
      description: 'Essential vitamin for immune system support'
    },
    {
      name: 'Vitamin C 500mg',
      manufacturer: 'Pharma Labs',
      category: 'Vitamin',
      price: 150,
      quantity: 20,
      description: 'Essential vitamin for immune system support'
    },
    {
      name: 'Aspirin Plus',
      manufacturer: 'MediCare',
      category: 'Painkiller',
      price: 80,
      quantity: 50,
      description: 'Effective pain relief and fever reduction'
    },
    {
      name: 'Amoxicillin 500mg',
      manufacturer: 'BioPharm',
      category: 'Antibiotic',
      price: 120,
      quantity: 100,
      description: 'Broad-spectrum antibiotic'
    },
    {
      name: 'Metformin 500mg',
      manufacturer: 'DiabetesCare',
      category: 'Diabetes',
      price: 200,
      quantity: 75,
      description: 'For type 2 diabetes management'
    },
    {
      name: 'Lisinopril 10mg',
      manufacturer: 'CardioHealth',
      category: 'Blood Pressure',
      price: 180,
      quantity: 40,
      description: 'ACE inhibitor for hypertension'
    },
    {
      name: 'Omeprazole 20mg',
      manufacturer: 'GastroMed',
      category: 'Antacid',
      price: 95,
      quantity: 60,
      description: 'Proton pump inhibitor for acid reflux'
    },
    {
      name: 'Cetirizine 10mg',
      manufacturer: 'AllergyFree',
      category: 'Antihistamine',
      price: 110,
      quantity: 85,
      description: 'Fast-acting allergy relief'
    },
    {
      name: 'Atorvastatin 20mg',
      manufacturer: 'LipidControl',
      category: 'Heart',
      price: 220,
      quantity: 45,
      description: 'Statin for cholesterol management'
    },
  ];

  try {
    
    await Medicine.deleteMany({});
    await Batch.deleteMany({});
    logger.info('Cleared existing medicines and batches');

    const createdMedicines = await Medicine.insertMany(testMedicines);
    logger.info(`✅ Created ${createdMedicines.length} test medicines`);

    const adminUser = await User.findOne({ role: 'admin' });

    const batches = [];
    for (const medicine of createdMedicines) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2); 

      batches.push({
        medicineId: medicine._id,
        batchNumber: `BATCH-${medicine.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`,
        expiryDate,
        quantity: medicine.quantity,
        purchasePrice: (medicine.price * 0.6).toFixed(2), 
        sellingPrice: medicine.price,
        status: 'active',
        addedBy: adminUser._id
      });
    }

    const createdBatches = await Batch.insertMany(batches);
    logger.info(`✅ Created ${createdBatches.length} batches`);

    console.log('\n📊 Seeds Summary:');
    console.log(`✅ Medicines: ${createdMedicines.length}`);
    console.log(`✅ Batches: ${createdBatches.length}`);
    console.log('\nMedicines List:');
    createdMedicines.forEach((med, idx) => {
      console.log(`  ${idx + 1}. ${med.name} - ₹${med.price} (Qty: ${med.quantity})`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding medicines:', error.message);
    console.error(error);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();
  await seedMedicines();
};

seed();
