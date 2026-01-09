// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const supabase = require('../dbConfig');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach token claims first
        req.user = decoded;

        // Normalize claim keys
        if (req.user.stallId && !req.user.stall_id) req.user.stall_id = req.user.stallId;

        // Fetch latest role/stall association from DB to avoid stale claims
        const userId = req.user.userId || req.user.user_id || null;
        if (userId) {
            const { data: dbUser, error } = await supabase.from('users').select('user_id, name, email, role, is_stall_owner, stall_id, approval_status, owner_verified').eq('user_id', userId).maybeSingle();
            if (!error && dbUser) {
                req.user.role = dbUser.role;
                req.user.is_stall_owner = dbUser.is_stall_owner;
                req.user.stall_id = dbUser.stall_id;
                req.user.approval_status = dbUser.approval_status;
                req.user.owner_verified = dbUser.owner_verified;
            }
        }

        next();
    } catch (err) {
        res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Require the requester to be a stall owner and approved
authMiddleware.requireStallOwner = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const isOwner = req.user.role === 'stall_owner' || req.user.is_stall_owner;
    const approved = req.user.approval_status === 'approved' || req.user.owner_verified === true;
    if (!isOwner || !approved) return res.status(403).json({ success: false, message: 'Forbidden: stall owners only' });
    next();
};

// Require admin role
authMiddleware.requireAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    next();
};

module.exports = authMiddleware;
