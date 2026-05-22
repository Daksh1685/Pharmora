
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Medicine = require('./models/Medicine');
const logger = require('./utils/logger');

const seedCategories = [
  { name: 'Antibiotic', description: 'Antibiotics and antimicrobial agents' },
  { name: 'Painkiller', description: 'Pain relief and analgesic medicines' },
  { name: 'Vitamin', description: 'Vitamins and nutritional supplements' },
  { name: 'Antacid', description: 'Antacids and digestive aids' },
  { name: 'Antihistamine', description: 'Antihistamines and allergy relief' },
  { name: 'Cough Syrup', description: 'Cough and cold remedies' },
  { name: 'Fever', description: 'Fever reducer and antipyretics' },
  { name: 'Blood Pressure', description: 'Blood pressure management medicines' },
  { name: 'Diabetes', description: 'Diabetes and glucose control medicines' },
  { name: 'Heart', description: 'Cardiac and heart condition medicines' },
  { name: 'Other', description: 'Other medicines and health products' }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('✅ MongoDB connected for category seeding');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seed = async () => {
  try {
    
    logger.info('📊 Analyzing current medicines...');
    const medicines = await Medicine.find();
    const uniqueCategories = [...new Set(medicines.map(m => m.category))];
    logger.info(`   Found medicines with categories: ${uniqueCategories.join(', ')}`);

    logger.info('📝 Creating/updating categories...');
    const categoryMap = new Map();
    
    for (const categoryData of seedCategories) {
      let category = await Category.findOne({ name: categoryData.name });
      
      if (!category) {
        category = await Category.create(categoryData);
        logger.info(`   ✅ Created category: ${categoryData.name}`);
      } else {
        logger.info(`   ℹ️  Category already exists: ${categoryData.name}`);
      }
      
      categoryMap.set(categoryData.name, category._id);
    }

    logger.info('🔄 Updating medicines to reference new categories...');
    let updateCount = 0;
    let errorCount = 0;

    for (const medicine of medicines) {
      try {
        if (typeof medicine.category === 'string') {
          const categoryId = categoryMap.get(medicine.category);
          
          if (categoryId) {
            medicine.category = categoryId;
            await medicine.save();
            updateCount++;
          } else {
            
            medicine.category = categoryMap.get('Other');
            await medicine.save();
            updateCount++;
            logger.warn(`   ⚠️  Medicine "${medicine.name}" had unknown category "${medicine.category}", assigned to 'Other'`);
          }
        }
      } catch (error) {
        errorCount++;
        logger.error(`   ❌ Error updating medicine ${medicine._id}: ${error.message}`);
      }
    }

    logger.info(`   ✅ Updated ${updateCount} medicines`);
    if (errorCount > 0) {
      logger.warn(`   ⚠️  Failed to update ${errorCount} medicines`);
    }

    logger.info('');
    logger.info('✅ Category seeding completed successfully!');
    logger.info(`   - Total categories: ${seedCategories.length}`);
    logger.info(`   - Updated medicines: ${updateCount}`);
    logger.info('');
    logger.info('📋 Available categories:');
    seedCategories.forEach(cat => {
      logger.info(`   • ${cat.name}`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed script error:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
};

connectDB().then(() => seed());
