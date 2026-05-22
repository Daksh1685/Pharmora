
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const logger = require('./utils/logger');

const seedUsers = [];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('✅ MongoDB connected for seeding');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seed = async () => {
  try {
    
    await User.deleteMany({ email: { $in: seedUsers.map(u => u.email) } });
    logger.info('Cleared existing demo users');

    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    logger.info(`✅ Created ${createdUsers.length} demo users`);

    createdUsers.forEach(user => {
      logger.info(`   - ${user.email} (${user.role})`);
    });

    console.log('\n📝 Demo Credentials:');
    console.log('   Admin: admin@pharmora.com / password123');
    console.log('   Manager: manager@pharmora.com / password123');
    console.log('   Staff: staff@pharmora.com / password123\n');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed script error:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => seed());
