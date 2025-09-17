// Quick script to create an admin user for testing moderation panel
const { MongoClient } = require('mongodb');

async function createAdminUser() {
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

    // Find or create an admin user
    let adminUser = await users.findOne({ role: 'admin' });

    if (!adminUser) {
      const result = await users.insertOne({
        email: 'admin@newsbuildr.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff',
        bio: 'System Administrator',
        reputationScore: 1000,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      adminUser = { _id: result.insertedId };
      console.log('✅ Created new admin user with ID:', adminUser._id);
    } else {
      console.log('✅ Admin user already exists with ID:', adminUser._id);
    }

    console.log('Admin user email: admin@newsbuildr.com');
    console.log('Admin user ID (use as token):', adminUser._id.toString());

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  createAdminUser().catch(console.error);
}

module.exports = { createAdminUser };