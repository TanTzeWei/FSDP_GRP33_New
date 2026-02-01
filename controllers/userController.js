// controllers/userController.js
const UserModel = require('../models/userModel');
const ReferralModel = require('../models/referralModel');
const PointsModel = require('../models/pointsModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Points awarded for referral (both referrer and referee get this)
const REFERRAL_POINTS_REFERRER = 25;
const REFERRAL_POINTS_REFEREE = 25;

class UserController {
    static async signup(req, res) {
        try {
            console.log('Signup payload:', req.body);
            const { name, email, password, role, stall_id, stall_name, hawker_centre_id, invite_code, referral_code } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }

            // If signing up as stall owner, mark as pending approval and optionally create a stall record
            let createData = { name, email, password };
            
            // Handle admin role
            if (role === 'admin') {
                createData.role = 'admin';
            } else if (role === 'stall_owner') {
                createData.role = 'stall_owner';
                createData.is_stall_owner = true;
                createData.approval_status = 'pending';
                createData.owner_verified = false;

                // Store pending stall information to be used when admin approves
                // Stall will only be created upon approval to avoid orphaned stalls on rejection
                if (stall_name) {
                    createData.pending_stall_name = stall_name;
                    if (hawker_centre_id) {
                        createData.pending_hawker_centre_id = hawker_centre_id;
                    }
                    console.log('Pending stall details - Name:', stall_name, 'Hawker Centre ID:', hawker_centre_id);
                } else if (stall_id) {
                    // If they're associating with an existing stall, store it
                    createData.stall_id = stall_id;
                }
            }

            // Pass `name` to match DB column `name`
            const result = await UserModel.createUser(createData);
            if (!result.success) {
                return res.status(400).json({ success: false, message: result.message });
            }

            // For stall owners, do not auto-approve; return pending message without token
            if (result.user.role === 'stall_owner' || result.user.is_stall_owner) {
                return res.status(201).json({ success: true, message: 'Owner signup received - pending approval', user: result.user, token: null });
            }

            const newUserId = result.user.userId ?? result.user.user_id;

            // Referral: if new signup entered a referral code, reward both users
            if (referral_code && typeof referral_code === 'string' && referral_code.trim()) {
                const referrer = await UserModel.findUserByReferralCode(referral_code.trim());
                if (referrer && referrer.user_id !== newUserId) {
                    const refResult = await ReferralModel.create(referrer.user_id, newUserId);
                    if (refResult.success) {
                        try {
                            await PointsModel.addReferralPoints(referrer.user_id, REFERRAL_POINTS_REFERRER, 'Friend signed up with your code', { referee_id: newUserId });
                            await PointsModel.addReferralPoints(newUserId, REFERRAL_POINTS_REFEREE, 'Signed up with a friend\'s code', { referrer_id: referrer.user_id });
                        } catch (pointsErr) {
                            console.error('Referral points error:', pointsErr);
                        }
                    }
                }
            }

            // Generate token for normal users
            const token = jwt.sign({ userId: result.user.userId, email: result.user.email, role: result.user.role, stallId: result.user.stall_id }, JWT_SECRET, { expiresIn: '2h' });

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

            // Deny stall owners who are not approved
            if ((result.user.role === 'stall_owner' || result.user.is_stall_owner) && result.user.approval_status !== 'approved') {
                return res.status(403).json({ success: false, message: 'Owner account pending approval' });
            }

            const token = jwt.sign({ userId: result.user.userId, email: result.user.email, role: result.user.role, stallId: result.user.stall_id }, JWT_SECRET, { expiresIn: '2h' });

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

    // Admin: approve owner
    static async approveOwner(req, res) {
        try {
            const userId = req.params.userId;
            const { stall_name, hawker_centre_id } = req.body;
            const supabase = require('../dbConfig');
            
            // Get user details first
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('user_id, name, email, stall_id, pending_stall_name, pending_hawker_centre_id')
                .eq('user_id', userId)
                .maybeSingle();
            
            if (userError || !userData) {
                return res.status(400).json({ success: false, message: 'User not found' });
            }
            
            let stallId = userData.stall_id;
            
            // Determine stall_name and hawker_centre_id to use
            // Priority: 1) Request body, 2) Pending values from signup, 3) Fallback
            const effectiveStallName = stall_name || userData.pending_stall_name;
            let effectiveHawkerCentreId = hawker_centre_id || userData.pending_hawker_centre_id;
            
            // Create stall if stall_name is available and user doesn't have a stall yet
            if (effectiveStallName && !stallId) {
                // Get hawker_centre_id - either from request, pending value, or use first available hawker centre
                if (!effectiveHawkerCentreId) {
                    const { data: hawkerCentres, error: hawkerErr } = await supabase
                        .from('hawker_centres')
                        .select('id')
                        .limit(1)
                        .single();
                    
                    if (hawkerErr || !hawkerCentres) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'No hawker centres available. Please provide a hawker centre ID.' 
                        });
                    }
                    
                    effectiveHawkerCentreId = hawkerCentres.id;
                }
                
                // Create the stall
                const { data: stallData, error: stallErr } = await supabase
                    .from('stalls')
                    .insert([{ 
                        stall_name: effectiveStallName, 
                        hawker_centre_id: effectiveHawkerCentreId, 
                        status: 'Active' // Set to active upon approval
                    }])
                    .select('id')
                    .maybeSingle();
                
                if (stallErr) {
                    console.error('Failed to create stall during owner approval', stallErr);
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Failed to create stall: ' + stallErr.message 
                    });
                }
                
                if (stallData) {
                    stallId = stallData.id;
                }
            }
            
            // Update user approval status and assign stall
            // Clear pending fields since they've been processed
            const updateData = { 
                approval_status: 'approved', 
                owner_verified: true,
                pending_stall_name: null,
                pending_hawker_centre_id: null
            };
            if (stallId) {
                updateData.stall_id = stallId;
            }
            
            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('user_id', userId)
                .select('user_id, name, email, role, stall_id, approval_status, owner_verified')
                .maybeSingle();
                
            if (error) {
                return res.status(400).json({ success: false, message: error.message || 'Failed to approve owner' });
            }

            // If user already had a stall, activate it
            if (data && data.stall_id && !stall_name) {
                await supabase.from('stalls').update({ status: 'Active' }).eq('id', data.stall_id);
            }

            res.json({ success: true, message: 'Owner approved', user: data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error during owner approval' });
        }
    }

    // Admin: list pending owner signups
    static async listPendingOwners(req, res) {
        try {
            const supabase = require('../dbConfig');
            const { data, error } = await supabase
                .from('users')
                .select('user_id, name, email, created_at, stall_id, approval_status, pending_stall_name, pending_hawker_centre_id')
                .eq('approval_status', 'pending')
                .order('created_at', { ascending: true });
            
            if (error) return res.status(400).json({ success: false, message: error.message || 'Failed to fetch pending owners' });
            
            // Fetch hawker centre names for pending_hawker_centre_id values
            const hawkerCentreIds = data
                .map(owner => owner.pending_hawker_centre_id)
                .filter(Boolean);
            
            let hawkerCentresMap = {};
            if (hawkerCentreIds.length > 0) {
                const { data: hawkerCentres, error: hawkerError } = await supabase
                    .from('hawker_centres')
                    .select('id, name')
                    .in('id', hawkerCentreIds);
                
                if (!hawkerError && hawkerCentres) {
                    hawkerCentresMap = hawkerCentres.reduce((map, hc) => {
                        map[hc.id] = hc.name;
                        return map;
                    }, {});
                }
            }
            
            // Add hawker centre name to each owner
            const enrichedData = data.map(owner => ({
                ...owner,
                pending_hawker_centre_name: owner.pending_hawker_centre_id 
                    ? hawkerCentresMap[owner.pending_hawker_centre_id] || null 
                    : null
            }));
            
            res.json({ success: true, data: enrichedData });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error fetching pending owners' });
        }
    }

    // Admin: list all stall owners (approved, pending, and rejected)
    static async listAllOwners(req, res) {
        try {
            const supabase = require('../dbConfig');
            
            // Get all stall owners
            const { data: owners, error: ownersError } = await supabase
                .from('users')
                .select('user_id, name, email, created_at, stall_id, approval_status')
                .or('is_stall_owner.eq.true,role.eq.stall_owner')
                .order('created_at', { ascending: true });
            
            if (ownersError) {
                return res.status(400).json({ success: false, message: ownersError.message || 'Failed to fetch all owners' });
            }

            if (!owners || owners.length === 0) {
                return res.json({ success: true, data: [] });
            }

            // Get all stall IDs that exist
            const stallIds = owners.map(o => o.stall_id).filter(Boolean);
            
            // Fetch stall information if there are any stalls
            let stallsMap = {};
            if (stallIds.length > 0) {
                const { data: stalls, error: stallsError } = await supabase
                    .from('stalls')
                    .select('id, stall_name, hawker_centre_id')
                    .in('id', stallIds);
                
                if (!stallsError && stalls) {
                    stallsMap = stalls.reduce((map, stall) => {
                        map[stall.id] = stall;
                        return map;
                    }, {});
                }
            }

            // Get hawker centre IDs
            const hawkerCentreIds = Object.values(stallsMap)
                .map(s => s.hawker_centre_id)
                .filter(Boolean);
            
            // Fetch hawker centre information
            let hawkerCentresMap = {};
            if (hawkerCentreIds.length > 0) {
                const { data: hawkerCentres, error: hawkerError } = await supabase
                    .from('hawker_centres')
                    .select('id, name')
                    .in('id', hawkerCentreIds);
                
                if (!hawkerError && hawkerCentres) {
                    hawkerCentresMap = hawkerCentres.reduce((map, hc) => {
                        map[hc.id] = hc.name;
                        return map;
                    }, {});
                }
            }

            // Transform the data to include stall and hawker centre information
            const transformedData = owners.map(owner => {
                const stall = owner.stall_id ? stallsMap[owner.stall_id] : null;
                const hawkerCentreName = stall && stall.hawker_centre_id 
                    ? hawkerCentresMap[stall.hawker_centre_id] 
                    : null;
                
                return {
                    user_id: owner.user_id,
                    name: owner.name,
                    email: owner.email,
                    created_at: owner.created_at,
                    stall_id: owner.stall_id,
                    approval_status: owner.approval_status,
                    stall_name: stall?.stall_name || null,
                    hawker_centre_name: hawkerCentreName || null
                };
            });

            res.json({ success: true, data: transformedData });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error fetching all owners' });
        }
    }

    // Admin: reject owner signup
    static async rejectOwner(req, res) {
        try {
            const userId = req.params.userId;
            const supabase = require('../dbConfig');

            // Mark the owner as rejected
            // No stall exists yet since stalls are only created upon approval
            const { data, error } = await supabase
                .from('users')
                .update({ approval_status: 'rejected', owner_verified: false })
                .eq('user_id', userId)
                .select('user_id, name, email, approval_status')
                .maybeSingle();

            if (error) {
                return res.status(400).json({ success: false, message: error.message || 'Failed to reject owner' });
            }

            res.json({ success: true, message: 'Owner rejected', user: data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error rejecting owner' });
        }
    }

    // Admin: delete stall owner
    static async deleteOwner(req, res) {
        try {
            const userId = req.params.userId;
            const { deleteStall } = req.body; // Optional: whether to also delete the stall
            const supabase = require('../dbConfig');

            // Get user and their stall_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('user_id, name, stall_id')
                .eq('user_id', userId)
                .maybeSingle();

            if (userError || !userData) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const stallId = userData.stall_id;

            // Delete the user
            const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('user_id', userId);

            if (deleteError) {
                return res.status(400).json({ success: false, message: deleteError.message || 'Failed to delete owner' });
            }

            // Optionally delete the stall if requested and exists
            if (deleteStall && stallId) {
                const { error: stallDeleteError } = await supabase
                    .from('stalls')
                    .delete()
                    .eq('id', stallId);

                if (stallDeleteError) {
                    console.error('Failed to delete stall:', stallDeleteError);
                    // Continue anyway since user is deleted
                }
            }

            res.json({ success: true, message: 'Owner deleted successfully', deletedStall: deleteStall && stallId ? true : false });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error deleting owner' });
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

    static async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ success: false, message: 'Name is required' });
            }

            const result = await UserModel.updateUser(userId, { name });
            
            if (!result.success) {
                return res.status(400).json({ success: false, message: 'Failed to update profile' });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: result.user
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error during profile update' });
        }
    }

    static async changePassword(req, res) {
        try {
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
            }

            // Validate current password
            const user = await UserModel.findUserByEmail(req.user.email);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const bcrypt = require('bcrypt');
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }

            // Update password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await UserModel.updatePassword(userId, hashedPassword);

            if (!result.success) {
                return res.status(400).json({ success: false, message: 'Failed to change password' });
            }

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error during password change' });
        }
    }

    static async deleteAccount(req, res) {
        try {
            const userId = req.user.userId;

            const result = await UserModel.deleteUser(userId);

            if (!result.success) {
                return res.status(400).json({ success: false, message: 'Failed to delete account' });
            }

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error during account deletion' });
        }
    }

    static async getUserStats(req, res) {
        try {
            const userId = req.user.userId;
            const supabase = require('../dbConfig');

            // Get photos uploaded count
            const { count: photosCount, error: photosError } = await supabase
                .from('photos')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (photosError) {
                console.error('Error fetching photos count:', photosError);
            }

            // Get total likes received on user's photos
            const { data: likesData, error: likesError } = await supabase
                .from('photos')
                .select('likes_count')
                .eq('user_id', userId);

            let totalLikes = 0;
            if (!likesError && likesData) {
                totalLikes = likesData.reduce((sum, photo) => sum + (photo.likes_count || 0), 0);
            }

            // Get orders count
            const { count: ordersCount, error: ordersError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (ordersError) {
                console.error('Error fetching orders count:', ordersError);
            }

            // Get user points
            const { data: pointsData, error: pointsError } = await supabase
                .from('user_points')
                .select('points_balance')
                .eq('user_id', userId)
                .maybeSingle();

            res.json({
                success: true,
                stats: {
                    photosUploaded: photosCount || 0,
                    totalLikes: totalLikes,
                    totalOrders: ordersCount || 0,
                    pointsBalance: pointsData?.points_balance || 0
                }
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch user stats' });
        }
    }
}

module.exports = UserController;
