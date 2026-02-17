require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();


// Middlewares
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});


app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Hi!, Watashi no namae wa Beni desu!' });
});

const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server em http://localhost:${PORT}`));
};

start();

module.exports = app;
