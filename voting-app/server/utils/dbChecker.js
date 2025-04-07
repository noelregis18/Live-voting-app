const mongoose = require('mongoose');

// Function to check MongoDB connection
const checkDbConnection = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB is already connected');
      return true;
    }

    // Try to connect if not connected
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

module.exports = { checkDbConnection }; 