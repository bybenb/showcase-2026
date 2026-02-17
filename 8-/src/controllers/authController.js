const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { gerarToken } = require('../utils/jwt');

const register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        // Generate JWT token
        const token = gerarToken(newUser._id);

        // Respond with user data and token
        return res.status(201).json({ user: { id: newUser._id, name: newUser.name, email: newUser.email }, token });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user including password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Generate JWT token
        const token = gerarToken(user._id);

        // Respond with user data and token
        return res.status(200).json({ user: { id: user._id, name: user.name, email: user.email }, token });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login };