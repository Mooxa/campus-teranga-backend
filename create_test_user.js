const mongoose = require('mongoose');
const User = require('./models/User');

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_teranga', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ phoneNumber: '+221771234567' });
    if (existingUser) {
      console.log('Test user already exists:', existingUser.fullName);
    } else {
      // Create test user
      const testUser = new User({
        fullName: 'Mouhamed Dieye',
        phoneNumber: '+221771234567',
        email: 'mouhamed@test.com',
        password: 'password123',
        country: 'Sénégal',
        university: 'UCAD',
        role: 'user'
      });

      await testUser.save();
      console.log('✅ Test user created successfully!');
      console.log('📱 Phone: +221771234567');
      console.log('🔑 Password: password123');
      console.log('👤 Name: Mouhamed Dieye');
      console.log('📧 Email: mouhamed@test.com');
    }

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ phoneNumber: '+221771234568' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.fullName);
    } else {
      // Create admin user
      const adminUser = new User({
        fullName: 'Admin User',
        phoneNumber: '+221771234568',
        email: 'admin@campus-teranga.com',
        password: 'admin123',
        country: 'Sénégal',
        university: 'Campus Teranga',
        role: 'admin'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('📱 Phone: +221771234568');
      console.log('🔑 Password: admin123');
      console.log('👤 Name: Admin User');
      console.log('📧 Email: admin@campus-teranga.com');
      console.log('🔐 Role: Admin');
    }

    // Check if super admin user already exists
    const existingSuperAdmin = await User.findOne({ phoneNumber: '+221771234569' });
    if (existingSuperAdmin) {
      console.log('Super admin user already exists:', existingSuperAdmin.fullName);
    } else {
      // Create super admin user
      const superAdminUser = new User({
        fullName: 'Super Admin',
        phoneNumber: '+221771234569',
        email: 'superadmin@campus-teranga.com',
        password: 'superadmin123',
        country: 'Sénégal',
        university: 'Campus Teranga',
        role: 'super_admin'
      });

      await superAdminUser.save();
      console.log('✅ Super admin user created successfully!');
      console.log('📱 Phone: +221771234569');
      console.log('🔑 Password: superadmin123');
      console.log('👤 Name: Super Admin');
      console.log('📧 Email: superadmin@campus-teranga.com');
      console.log('🔐 Role: Super Admin');
    }

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestUsers();
