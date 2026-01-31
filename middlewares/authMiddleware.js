// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const supabase = require('../dbConfig');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Path:', req.path);
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No token provided');
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified, decoded:', decoded);
        
        // Attach token claims first
        req.user = decoded;

        // Normalize claim keys
        if (req.user.stallId && !req.user.stall_id) req.user.stall_id = req.user.stallId;

        // Fetch latest role/stall association from DB to avoid stale claims
        const userId = req.user.userId || req.user.user_id || null;
        console.log('Fetching user data for userId:', userId);
        
        if (userId) {
            const { data: dbUser, error } = await supabase.from('users').select('user_id, name, email, role, is_stall_owner, stall_id, approval_status, owner_verified').eq('user_id', userId).maybeSingle();
            
            if (error) {
                console.log('⚠️ DB fetch error:', error);
            }
            
            if (!error && dbUser) {
                console.log('✅ DB user fetched:', dbUser);
                req.user.role = dbUser.role;
                req.user.is_stall_owner = dbUser.is_stall_owner;
                req.user.stall_id = dbUser.stall_id;
                req.user.approval_status = dbUser.approval_status;
                req.user.owner_verified = dbUser.owner_verified;
            }
        }

        console.log('Final req.user:', req.user);
        next();
    } catch (err) {
        console.log('❌ Token verification failed:', err.message);
        console.log('JWT_SECRET being used:', JWT_SECRET);
        console.log('Token being verified:', token);
        res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Require the requester to be a stall owner and approved
authMiddleware.requireStallOwner = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    console.log('=== requireStallOwner Middleware ===');
    console.log('req.user:', req.user);
    console.log('role:', req.user.role);
    console.log('is_stall_owner:', req.user.is_stall_owner);
    console.log('approval_status:', req.user.approval_status);
    console.log('owner_verified:', req.user.owner_verified);
    
    const isOwner = req.user.role === 'stall_owner' || req.user.is_stall_owner;
    const approved = req.user.approval_status === 'approved' || req.user.owner_verified === true;
    
    console.log('isOwner:', isOwner);
    console.log('approved:', approved);
    
    if (!isOwner || !approved) {
        console.log('❌ FORBIDDEN: Not owner or not approved');
        return res.status(403).json({ success: false, message: 'Forbidden: stall owners only' });
    }
    
    console.log('✅ PASSED: User is approved stall owner');
    next();
};

// Require admin role
authMiddleware.requireAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    next();
};

module.exports = authMiddleware;
