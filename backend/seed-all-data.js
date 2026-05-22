
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Category = require('./models/Category');
const Medicine = require('./models/Medicine');
const Batch = require('./models/Batch');
const Purchase = require('./models/Purchase');
const Sale = require('./models/Sale');
const logger = require('./utils/logger');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedUsers = [];

const seedMedicines = [
  { name: 'Amoxicillin 500mg', manufacturer: 'GSK Pharma', category: 'Antibiotic', price: 150, quantity: 150, description: 'Antibiotic for bacterial infections' },
  { name: 'Aspirin Plus', manufacturer: 'Bayer', category: 'Painkiller', price: 120, quantity: 200, description: 'Pain relief and fever reduction' },
  { name: 'Atorvastatin 10mg', manufacturer: 'Cipla', category: 'Heart', price: 180, quantity: 80, description: 'Cholesterol management' },
  { name: 'Cetirizine 10mg', manufacturer: 'Dr. Reddy', category: 'Antihistamine', price: 100, quantity: 120, description: 'Allergy relief medication' },
  { name: 'Lisinopril 10mg', manufacturer: 'Lupin', category: 'Blood Pressure', price: 140, quantity: 90, description: 'Blood pressure management' },
  { name: 'Metformin 500mg', manufacturer: 'Sun Pharma', category: 'Diabetes', price: 90, quantity: 250, description: 'Diabetes control medication' },
  { name: 'Omeprazole 20mg', manufacturer: 'Abbott', category: 'Antacid', price: 110, quantity: 110, description: 'Gastric acid reduction' },
  { name: 'Vitamin C 1000mg', manufacturer: 'Wellness', category: 'Vitamin', price: 80, quantity: 300, description: 'Immune system support' },
  { name: 'Paracetamol 500mg', manufacturer: 'GSK', category: 'Painkiller', price: 40, quantity: 400, description: 'Common pain and fever relief' },
  { name: 'Azithromycin 250mg', manufacturer: 'Pfizer', category: 'Antibiotic', price: 210, quantity: 60, description: 'Antibiotic for respiratory infections' },
  { name: 'Ibuprofen 400mg', manufacturer: 'Advil', category: 'Painkiller', price: 130, quantity: 180, description: 'Nonsteroidal anti-inflammatory' },
  { name: 'Doxycycline 100mg', manufacturer: 'Apotex', category: 'Antibiotic', price: 175, quantity: 85, description: 'Antibiotic for various infections' },
  { name: 'Losartan 50mg', manufacturer: 'Merck', category: 'Blood Pressure', price: 160, quantity: 120, description: 'Hypertension treatment' },
  { name: 'Amlodipine 5mg', manufacturer: 'Zydus', category: 'Blood Pressure', price: 120, quantity: 140, description: 'Calcium channel blocker' },
  { name: 'Gliclazide 80mg', manufacturer: 'Servier', category: 'Diabetes', price: 155, quantity: 110, description: 'Anti-diabetic medication' },
  { name: 'Pantoprazole 40mg', manufacturer: 'Takeda', category: 'Antacid', price: 125, quantity: 95, description: 'PPI for stomach issues' },
  { name: 'Montelukast 10mg', manufacturer: 'Organon', category: 'Other', price: 190, quantity: 70, description: 'Asthma and allergy prevention' },
  { name: 'Levocetirizine 5mg', manufacturer: 'UCB', category: 'Antihistamine', price: 115, quantity: 130, description: 'Advanced allergy relief' },
  { name: 'Multivitamin Gold', manufacturer: 'NatureMade', category: 'Vitamin', price: 350, quantity: 50, description: 'Daily essential multivitamin' },
  { name: 'Insulin Glargine', manufacturer: 'Sanofi', category: 'Diabetes', price: 850, quantity: 30, description: 'Long-acting insulin' },
];

const seed = async () => {
  try {
    
    logger.info('🧑 Seeding users...');
    await User.deleteMany({ email: { $in: seedUsers.map(u => u.email) } });
    
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    
    let adminId;
    if (createdUsers.length > 0) {
      adminId = createdUsers[0]._id;
    } else {
      
      const existingUser = await User.findOne({});
      if (!existingUser) {
        logger.warn('⚠️ No users found in database. Seeding categories and medicines will be skipped or may fail.');
        
      } else {
        adminId = existingUser._id;
        logger.info(`ℹ️ Using existing user for seeding: ${existingUser.email}`);
      }
    }
    
    if (!adminId) {
       logger.error('❌ Could not find an admin user for seeding. Please register a user first.');
       process.exit(1);
    }
    
    logger.info(`✅ Using Admin ID: ${adminId}`);

    logger.info('📂 Seeding categories...');
    await Category.deleteMany({});
    const categoryNames = [...new Set(seedMedicines.map(m => m.category))];
    const categoryDocs = categoryNames.map(name => ({ 
      name, 
      description: `Medicines for ${name}`,
      userId: adminId 
    }));
    const createdCategories = await Category.insertMany(categoryDocs);
    logger.info(`✅ Created ${createdCategories.length} categories`);

    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    logger.info('💊 Seeding medicines...');
    await Medicine.deleteMany({});
    const medicinesWithCatIds = seedMedicines.map(m => ({
      ...m,
      category: categoryMap[m.category],
      addedBy: adminId
    }));
    const createdMedicines = await Medicine.insertMany(medicinesWithCatIds);
    logger.info(`✅ Created ${createdMedicines.length} medicines`);

    logger.info('📦 Seeding batches...');
    await Batch.deleteMany({});
    const createdBatches = [];
    for (const medicine of createdMedicines) {
      const batchNumbers = ['BATCH001', 'BATCH002'];
      for (let i = 0; i < 2; i++) {
        const purchasePrice = 50 + Math.random() * 100;
        const sellingPrice = purchasePrice + (purchasePrice * 0.3);
        const batch = await Batch.create({
          medicineId: medicine._id,
          batchNumber: `${medicine.name.replace(/\s+/g, '')}-${batchNumbers[i]}`,
          quantity: Math.floor(medicine.quantity / 2),
          purchasePrice: purchasePrice,
          sellingPrice: sellingPrice,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'active',
          addedBy: adminId
        });
        createdBatches.push(batch);
      }
    }
    logger.info(`✅ Created ${createdBatches.length} batches`);

    logger.info('🛒 Seeding purchases...');
    await Purchase.deleteMany({});
    const createdPurchases = [];
    for (let i = 0; i < 5; i++) {
      const randomMedicines = createdMedicines.slice(0, 3);
      const medicines = randomMedicines.map(med => ({
        medicineId: med._id,
        medicineName: med.name,
        batchNumber: `PBATCH-${i}-${Math.floor(Math.random() * 1000)}`,
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
        quantity: 50,
        purchasePrice: 60,
        subtotal: 3000,
      }));

      const purchase = await Purchase.create({
        supplierName: `Supplier ${i + 1}`,
        medicines,
        totalAmount: medicines.reduce((sum, m) => sum + m.subtotal, 0),
        paymentMethod: 'bank_transfer',
        paymentStatus: 'completed',
        createdBy: adminId,
        status: 'received',
      });
      createdPurchases.push(purchase);
    }
    logger.info(`✅ Created ${createdPurchases.length} purchases`);

    logger.info('💰 Seeding sales (Targeting ~221k)...');
    await Sale.deleteMany({});
    const createdSales = [];
    const customerNames = [
      'Preethi', 'Daksh', 'Arsalaan', 'Sneha Reddy', 
      'Vikram Rao', 'Anjali Gupta', 'Deepak Verma', 'Megha Das', 
      'Suresh Iyer', 'Kavita Nair', 'Rajesh Kumar', 'Pooja Joshi',
      'Arun Menon', 'Sunita Desai', 'Manoj Tiwari', 'Ritu Bansal', 'Sanjay Shah'
    ];
    
    for (let i = 0; i < customerNames.length; i++) {
      const sale = await Sale.create({
        medicines: [{
          medicineId: createdMedicines[0]._id,
          medicineName: createdMedicines[0].name,
          quantity: 30,
          price: 216,
          batchDetails: [{
            batchNumber: `SBATCH-${i}`,
            quantityFromBatch: 30,
            costFromBatch: 30 * 216
          }],
          subtotal: 30 * 216 * 2 
        }],
        totalAmount: 13000, 
        paymentMethod: 'upi',
        paymentStatus: 'completed',
        customerName: customerNames[i],
        soldBy: adminId,
        status: 'completed',
      });
      createdSales.push(sale);
    }
    logger.info(`✅ Created ${createdSales.length} sales`);

    logger.info('🚀 DATABASE SEEDING COMPLETED FOR MULTI-TENANCY');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed script error:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => seed());
