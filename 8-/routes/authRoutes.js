const express = require('express');
const { register, login } = require('../controllers/authController');
const protect = require('../middleware/protect');

const router = express.Router();

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Protected route for user profile
router.get('/profile', protect, (req, res) => {
    res.status(200).json({ user: req.user });
});

module.exports = router;
