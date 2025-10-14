const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/formations', require('./routes/formations'));
app.use('/api/services', require('./routes/services'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_teranga', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  // Seed sample data in development
  if (process.env.NODE_ENV === 'development') {
    const seedData = require('./seed_data');
    await seedData();
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Campus Teranga API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
