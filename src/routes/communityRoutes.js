const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all communities
router.get('/', async (req, res) => {
  try {
    const { category, search, isPublic = true, isActive = true } = req.query;
    let query = { isActive: isActive === 'true' || isActive === true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isPublic !== 'false') {
      query.isPublic = true;
    }

    const communities = await Community.find(query)
      .populate('creator', 'fullName email')
      .populate('members.user', 'fullName email')
      .lean()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching communities',
      error: error.message 
    });
  }
});

// Get single community
router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'fullName email')
      .populate('members.user', 'fullName email')
      .populate('posts.author', 'fullName email')
      .populate('posts.comments.author', 'fullName email')
      .lean();
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching community',
      error: error.message 
    });
  }
});

// Create community (authenticated)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, image, category } = req.body;
    
    // Check if community name already exists
    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({
        success: false,
        message: 'A community with this name already exists'
      });
    }
    
    const community = new Community({
      name,
      description,
      image: image || '',
      category: category || 'social',
      creator: req.user.userId,
      members: [{
        user: req.user.userId,
        role: 'owner',
        joinedAt: new Date()
      }]
    });
    
    await community.save();
    
    const populatedCommunity = await Community.findById(community._id)
      .populate('creator', 'fullName email')
      .populate('members.user', 'fullName email')
      .lean();
    
    res.status(201).json({
      success: true,
      message: 'Community created successfully',
      data: populatedCommunity
    });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating community',
      error: error.message 
    });
  }
});

// Join community
router.post('/:id/join', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    // Check if user is already a member
    const isMember = community.members.some(m => m.user.toString() === req.user.userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this community'
      });
    }
    
    // Add user as member
    community.members.push({
      user: req.user.userId,
      role: 'member',
      joinedAt: new Date()
    });
    
    await community.save();
    
    res.json({
      success: true,
      message: 'Successfully joined community'
    });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error joining community',
      error: error.message 
    });
  }
});

// Create post in community
router.post('/:id/posts', auth, async (req, res) => {
  try {
    const { content, image } = req.body;
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    // Check if user is a member
    const isMember = community.members.some(m => m.user.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member to post in this community'
      });
    }
    
    community.posts.push({
      author: req.user.userId,
      content,
      image: image || '',
      likes: [],
      comments: []
    });
    
    await community.save();
    
    const updatedCommunity = await Community.findById(community._id)
      .populate('posts.author', 'fullName email')
      .lean();
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: updatedCommunity.posts[updatedCommunity.posts.length - 1]
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating post',
      error: error.message 
    });
  }
});

module.exports = router;

