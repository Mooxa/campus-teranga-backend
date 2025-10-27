const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    }
  },
  category: {
    type: String,
    enum: ['welcome', 'academic', 'cultural', 'social', 'sports', 'other'],
    default: 'other'
  },
  image: {
    type: String,
    default: ''
  },
  organizer: {
    name: {
      type: String,
      required: true
    },
    contact: {
      phone: String,
      email: String
    }
  },
  capacity: {
    type: Number,
    default: 0
  },
  registeredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'FCFA'
    }
  },
  requirements: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
