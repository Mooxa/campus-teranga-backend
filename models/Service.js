const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['transport', 'housing', 'procedures', 'health', 'other'],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'FCFA'
    },
    period: {
      type: String,
      enum: ['per_trip', 'per_month', 'per_year', 'one_time'],
      default: 'one_time'
    }
  },
  location: {
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  contact: {
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    }
  },
  image: {
    type: String,
    default: ''
  },
  features: [String],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
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

module.exports = mongoose.model('Service', serviceSchema);
