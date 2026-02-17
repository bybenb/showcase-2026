const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/auth_db';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connectado com sucesso');
  } catch (err) {
    console.error('O MongoDB diz ter erro de conexão:', err.message || err);
    process.exit(1);
  }
};

module.exports = connectDB;
