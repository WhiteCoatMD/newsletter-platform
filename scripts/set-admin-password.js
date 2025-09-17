// Script to set password for admin user
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function setAdminPassword() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const users = db.collection('users');

    // Set a default password for your admin account
    const password = 'admin123'; // You can change this to whatever you want
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update your admin user with the password
    const result = await users.updateOne(
      { email: 'mitch@whitecoat-md.com' },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount > 0) {
      console.log('✅ Password set for admin user');
      console.log('Email: mitch@whitecoat-md.com');
      console.log('Password: admin123');
      console.log('');
      console.log('🚨 IMPORTANT: Change this password after first login!');
    } else {
      console.log('❌ Admin user not found. Please run update-admin.js first.');
    }

  } catch (error) {
    console.error('❌ Error setting admin password:', error);
  } finally {
    await client.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  require('dotenv').config({ path: './backend/.env' });
  setAdminPassword().catch(console.error);
}

module.exports = { setAdminPassword };