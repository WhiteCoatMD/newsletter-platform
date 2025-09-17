// Script to update admin user to use mitch@whitecoat-md.com
const { MongoClient } = require('mongodb');

async function updateAdminUser() {
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

    // Find existing admin user and update to your email
    let adminUser = await users.findOne({ role: 'admin' });

    if (adminUser) {
      // Update existing admin user
      const result = await users.updateOne(
        { _id: adminUser._id },
        {
          $set: {
            email: 'mitch@whitecoat-md.com',
            firstName: 'Mitch',
            lastName: 'Bratton',
            role: 'admin',
            avatarUrl: 'https://ui-avatars.com/api/?name=Mitch+Bratton&background=dc2626&color=fff',
            bio: 'System Administrator',
            reputationScore: 1000,
            isBanned: false,
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Updated existing admin user');
    } else {
      // Create new admin user
      const result = await users.insertOne({
        email: 'mitch@whitecoat-md.com',
        firstName: 'Mitch',
        lastName: 'Bratton',
        role: 'admin',
        avatarUrl: 'https://ui-avatars.com/api/?name=Mitch+Bratton&background=dc2626&color=fff',
        bio: 'System Administrator',
        reputationScore: 1000,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      adminUser = { _id: result.insertedId };
      console.log('✅ Created new admin user');
    }

    // Also check if there's an existing user with your email and make them admin
    const existingUser = await users.findOne({ email: 'mitch@whitecoat-md.com' });
    if (existingUser && existingUser._id.toString() !== adminUser._id.toString()) {
      await users.updateOne(
        { email: 'mitch@whitecoat-md.com' },
        {
          $set: {
            role: 'admin',
            reputationScore: 1000,
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Updated existing user with your email to admin role');
      adminUser = existingUser;
    }

    console.log('✅ Admin setup complete!');
    console.log('Admin email: mitch@whitecoat-md.com');
    console.log('Admin user ID (use as token):', adminUser._id.toString());

  } catch (error) {
    console.error('❌ Error updating admin user:', error);
  } finally {
    await client.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  require('dotenv').config({ path: './backend/.env' });
  updateAdminUser().catch(console.error);
}

module.exports = { updateAdminUser };