const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
// Try to load environment variables from config.env if it exists
try {
  require('dotenv').config({ path: './config.env' });
} catch (e) {
  // If config.env doesn't exist, try to load from .env
  require('dotenv').config();
}

// Import Community model
const Community = require('./src/models/Community');
const User = require('./src/models/User');

/**
 * Extract community data from MongoDB database
 * Usage: node extract_communities.js [output_file]
 */

const extractCommunities = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_teranga';
    
    console.log('🔌 Connecting to MongoDB...');
    console.log('URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully\n');

    // Extract all communities with populated data
    console.log('📊 Extracting community data...');
    
    const communities = await Community.find({})
      .populate('creator', 'fullName email phoneNumber')
      .populate('members.user', 'fullName email phoneNumber')
      .populate('posts.author', 'fullName email phoneNumber')
      .populate('posts.likes', 'fullName email')
      .populate('posts.comments.author', 'fullName email phoneNumber')
      .lean()
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${communities.length} communities\n`);

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCommunities: communities.length,
      communities: communities.map(community => ({
        _id: community._id,
        name: community.name,
        description: community.description,
        image: community.image,
        category: community.category,
        creator: community.creator ? {
          _id: community.creator._id,
          fullName: community.creator.fullName,
          email: community.creator.email,
          phoneNumber: community.creator.phoneNumber
        } : null,
        members: community.members.map(member => ({
          user: member.user ? {
            _id: member.user._id,
            fullName: member.user.fullName,
            email: member.user.email,
            phoneNumber: member.user.phoneNumber
          } : null,
          role: member.role,
          joinedAt: member.joinedAt
        })),
        posts: community.posts.map(post => ({
          _id: post._id,
          author: post.author ? {
            _id: post.author._id,
            fullName: post.author.fullName,
            email: post.author.email,
            phoneNumber: post.author.phoneNumber
          } : null,
          content: post.content,
          image: post.image,
          likes: post.likes ? post.likes.map(like => ({
            _id: like._id,
            fullName: like.fullName,
            email: like.email
          })) : [],
          likesCount: post.likes ? post.likes.length : 0,
          comments: post.comments ? post.comments.map(comment => ({
            _id: comment._id,
            author: comment.author ? {
              _id: comment.author._id,
              fullName: comment.author.fullName,
              email: comment.author.email,
              phoneNumber: comment.author.phoneNumber
            } : null,
            content: comment.content,
            createdAt: comment.createdAt
          })) : [],
          commentsCount: post.comments ? post.comments.length : 0,
          createdAt: post.createdAt
        })),
        postsCount: community.posts ? community.posts.length : 0,
        membersCount: community.members ? community.members.length : 0,
        isPublic: community.isPublic,
        isActive: community.isActive,
        createdAt: community.createdAt,
        updatedAt: community.updatedAt
      }))
    };

    // Calculate statistics
    const stats = {
      totalCommunities: communities.length,
      byCategory: {},
      active: 0,
      public: 0,
      totalMembers: 0,
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0
    };

    communities.forEach(community => {
      // Category stats
      stats.byCategory[community.category] = (stats.byCategory[community.category] || 0) + 1;
      
      // Active/Public stats
      if (community.isActive) stats.active++;
      if (community.isPublic) stats.public++;
      
      // Member stats
      stats.totalMembers += community.members ? community.members.length : 0;
      
      // Post stats
      if (community.posts) {
        stats.totalPosts += community.posts.length;
        community.posts.forEach(post => {
          stats.totalLikes += post.likes ? post.likes.length : 0;
          stats.totalComments += post.comments ? post.comments.length : 0;
        });
      }
    });

    exportData.statistics = stats;

    // Display summary
    console.log('📈 Community Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Communities: ${stats.totalCommunities}`);
    console.log(`Active: ${stats.active} | Public: ${stats.public}`);
    console.log(`Total Members: ${stats.totalMembers}`);
    console.log(`Total Posts: ${stats.totalPosts}`);
    console.log(`Total Likes: ${stats.totalLikes}`);
    console.log(`Total Comments: ${stats.totalComments}`);
    console.log('\nBy Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get output file path
    const outputFile = process.argv[2] || `communities_export_${Date.now()}.json`;
    const outputPath = path.resolve(outputFile);

    // Write to file
    console.log(`💾 Saving to: ${outputPath}`);
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`✅ Data exported successfully to ${outputPath}\n`);

    // Also create a CSV summary
    const csvPath = outputPath.replace('.json', '_summary.csv');
    const csvLines = [
      'Name,Category,Creator,Members,Posts,Likes,Comments,Is Active,Is Public,Created At'
    ];

    exportData.communities.forEach(community => {
      const postsLikes = community.posts.reduce((sum, post) => sum + post.likesCount, 0);
      const postsComments = community.posts.reduce((sum, post) => sum + post.commentsCount, 0);
      
      csvLines.push([
        `"${community.name}"`,
        community.category,
        community.creator ? `"${community.creator.fullName}"` : 'N/A',
        community.membersCount,
        community.postsCount,
        postsLikes,
        postsComments,
        community.isActive ? 'Yes' : 'No',
        community.isPublic ? 'Yes' : 'No',
        new Date(community.createdAt).toLocaleDateString()
      ].join(','));
    });

    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
    console.log(`📊 CSV summary saved to: ${csvPath}\n`);

    // Close connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    console.log('\n✨ Extraction completed successfully!');

  } catch (error) {
    console.error('❌ Error extracting communities:', error);
    process.exit(1);
  }
};

// Run extraction
extractCommunities();

