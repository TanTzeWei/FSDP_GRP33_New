// controllers/userController.js
const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

class UserController {
    static async signup(req, res) {
        try {
            console.log('Signup payload:', req.body);
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }

            // Pass `name` to match DB column `name`
            const result = await UserModel.createUser({ name, email, password });
            if (!result.success) {
                return res.status(400).json({ success: false, message: result.message });
            }

            // Generate token
            const token = jwt.sign({ userId: result.user.userId, email: result.user.email }, JWT_SECRET, { expiresIn: '2h' });

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: result.user,
                token
            });
        } catch (error) {
            // Log full error and return stack/message in response for local debugging
            console.error(error && error.stack ? error.stack : error);
            res.status(500).json({ success: false, message: 'Server error during signup', error: error?.message, stack: error?.stack });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password required' });
            }

            const result = await UserModel.validateUser(email, password);
            if (!result.success) {
                return res.status(401).json({ success: false, message: result.message });
            }

            const token = jwt.sign({ userId: result.user.userId, email: result.user.email }, JWT_SECRET, { expiresIn: '2h' });

            res.json({
                success: true,
                message: 'Login successful',
                user: result.user,
                token
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error during login' });
        }
    }

    static async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            const user = await UserModel.findUserByEmail(req.user.email);

            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            delete user.password;
            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
        }
    }
}

module.exports = UserController;
