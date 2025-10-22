#!/usr/bin/env node

// Generate a secure JWT secret for production
const crypto = require('crypto');

const generateJWTSecret = () => {
  // Generate a 64-byte random string
  const secret = crypto.randomBytes(64).toString('hex');
  console.log('Generated JWT Secret:');
  console.log(secret);
  console.log('\nAdd this to your Render environment variables:');
  console.log('JWT_SECRET=' + secret);
  console.log('\nOr add to your .env file:');
  console.log('JWT_SECRET=' + secret);
};

generateJWTSecret();
