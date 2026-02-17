const bcrypt = require('bcryptjs');
const User = require('../models/User');

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

        // Return success response
        return res.status(201).json({ name: newUser.name, email: newUser.email });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = { register };