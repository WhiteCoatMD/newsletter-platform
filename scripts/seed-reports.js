// Quick script to create test reports for moderation panel demo
const { MongoClient } = require('mongodb');

async function seedReports() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    // Get collections
    const users = db.collection('users');
    const posts = db.collection('communityposts');
    const reports = db.collection('moderationreports');

    // Find or create a demo user
    let demoUser = await users.findOne({ email: 'demo@newsbuildr.com' });
    if (!demoUser) {
      const result = await users.insertOne({
        email: 'demo@newsbuildr.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'subscriber',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      demoUser = { _id: result.insertedId, ...demoUser };
    }

    // Find or create a demo reporter
    let reporter = await users.findOne({ email: 'reporter@newsbuildr.com' });
    if (!reporter) {
      const result = await users.insertOne({
        email: 'reporter@newsbuildr.com',
        firstName: 'Sarah',
        lastName: 'Reporter',
        role: 'subscriber',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=40&h=40&fit=crop&crop=face',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      reporter = { _id: result.insertedId, ...reporter };
    }

    // Find existing posts or create demo posts
    let demoPost = await posts.findOne();
    if (!demoPost) {
      const result = await posts.insertOne({
        title: 'Check out my amazing product!',
        content: 'This is a promotional post that violates community guidelines...',
        authorId: demoUser._id,
        category: 'General',
        tags: ['spam', 'promotion'],
        createdAt: new Date(),
        updatedAt: new Date(),
        viewsCount: 0,
        likesCount: 0,
        dislikesCount: 0,
        repliesCount: 0,
        lastActivityAt: new Date(),
        isPinned: false,
        isLocked: false,
        isFeatured: false,
        isDeleted: false
      });
      demoPost = { _id: result.insertedId };
    }

    // Clear existing reports
    await reports.deleteMany({});

    // Create test reports
    const testReports = [
      {
        targetType: 'post',
        targetId: demoPost._id,
        reporterId: reporter._id,
        reason: 'Spam Content',
        description: 'User posting promotional content repeatedly without adding value to community',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        targetType: 'post',
        targetId: demoPost._id,
        reporterId: reporter._id,
        reason: 'Inappropriate Language',
        description: 'Content contains offensive language and aggressive tone',
        priority: 'high',
        status: 'reviewing',
        createdAt: new Date(Date.now() - 60000), // 1 minute ago
        updatedAt: new Date()
      },
      {
        targetType: 'user',
        targetId: demoUser._id,
        reporterId: reporter._id,
        reason: 'Content Removal Appeal',
        description: 'User appealing previous content removal decision',
        priority: 'low',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date()
      }
    ];

    await reports.insertMany(testReports);

    console.log('✅ Test reports created successfully');
    console.log(`Created ${testReports.length} reports for testing moderation panel`);

  } catch (error) {
    console.error('❌ Error seeding reports:', error);
  } finally {
    await client.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  seedReports().catch(console.error);
}

module.exports = { seedReports };