// Importing the authRoutes
const authRoutes = require('./routes/authRoutes');

// Using the authRoutes
app.use('/api/auth', authRoutes);
