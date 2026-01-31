const bcrypt = require("bcrypt");
const supabase = require('../dbConfig');

// Generate unique referral code (REF + 6 alphanumeric)
function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'REF';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

class UserModel {
    // Create new user (signup)
    static async createUser(userData) {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            const referralCode = userData.referral_code || generateReferralCode();
            const insertRow = {
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role || 'customer',
                is_stall_owner: userData.is_stall_owner || false,
                stall_id: userData.stall_id || null,
                owner_verified: userData.owner_verified || false,
                approval_status: userData.approval_status || 'none',
                pending_stall_name: userData.pending_stall_name || null,
                pending_hawker_centre_id: userData.pending_hawker_centre_id || null,
                referral_code: referralCode
            };

            const { data, error, status } = await supabase
                .from('users')
                .insert([insertRow])
                .select('user_id, name, email, role, is_stall_owner, stall_id, owner_verified, approval_status, referral_code')
                .limit(1)
                .maybeSingle();

            if (error) {
                // unique violation: email or referral_code collision; retry with new code once
                if (status === 409) {
                    if (error.message && error.message.includes('referral_code')) {
                        insertRow.referral_code = generateReferralCode();
                        const retry = await supabase.from('users').insert([insertRow]).select('user_id, name, email, role, is_stall_owner, stall_id, owner_verified, approval_status, referral_code').limit(1).maybeSingle();
                        if (retry.error) {
                            if (retry.status === 409) return { success: false, message: 'Email already exists' };
                            throw retry.error;
                        }
                        if (retry.data) {
                            retry.data.userId = retry.data.user_id || retry.data.userId;
                            return { success: true, user: retry.data };
                        }
                    }
                    return { success: false, message: 'Email already exists' };
                }
                throw error;
            }

            if (data) data.userId = data.user_id || data.userId;
            return { success: true, user: data };
        } catch (error) {
            throw error;
        }
    }

    // Find user by referral code (for signup reward)
    static async findUserByReferralCode(referralCode) {
        try {
            if (!referralCode || typeof referralCode !== 'string') return null;
            const code = referralCode.trim().toUpperCase();
            if (!code.startsWith('REF') || code.length < 4) return null;
            const { data, error } = await supabase
                .from('users')
                .select('user_id, name, email, referral_code')
                .eq('referral_code', code)
                .maybeSingle();
            if (error) throw error;
            if (data) data.userId = data.user_id || data.userId;
            return data || null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by email (for login)
    static async findUserByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('user_id, name, email, password, role, is_stall_owner, stall_id, owner_verified, approval_status')
                .eq('email', email)
                .maybeSingle();

            if (error) throw error;
            if (data) data.userId = data.user_id || data.userId;
            return data || null;
        } catch (error) {
            throw error;
        }
    }

    // Validate user credentials (login)
    static async validateUser(email, password) {
        try {
            const user = await this.findUserByEmail(email);
            if (!user) return { success: false, message: "User not found" };

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword)
                return { success: false, message: "Invalid password" };

            const { password: _, ...userWithoutPassword } = user;
            return { success: true, user: userWithoutPassword };
        } catch (error) {
            throw error;
        }
    }

    // Update user profile (optional)
    static async updateUser(userId, updateData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({ name: updateData.name })
                .eq('user_id', userId)
                .select('user_id, name, email')
                .single();

            if (error) throw error;
            if (data) data.userId = data.user_id || data.userId;
            return { success: true, user: data };
        } catch (error) {
            throw error;
        }
    }

    // Delete user (optional)
    static async deleteUser(userId) {
        try {
            const { error } = await supabase.from('users').delete().eq('user_id', userId);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    // Update password
    static async updatePassword(userId, hashedPassword) {
        try {
            const { error } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    // OAuth Methods
    
    // Find user by OAuth provider and ID
    static async findUserByOAuth(provider, oauthId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('user_id, name, email, role, is_stall_owner, stall_id, owner_verified, approval_status, avatar_url, email_verified, oauth_provider, oauth_id')
                .eq('oauth_provider', provider)
                .eq('oauth_id', oauthId)
                .maybeSingle();

            if (error) throw error;
            if (data) data.userId = data.user_id || data.userId;
            return data || null;
        } catch (error) {
            throw error;
        }
    }

    // Create user via OAuth
    static async createOAuthUser(userData) {
        try {
            const insertRow = {
                name: userData.name,
                email: userData.email,
                oauth_provider: userData.oauth_provider,
                oauth_id: userData.oauth_id,
                avatar_url: userData.avatar_url || null,
                email_verified: userData.email_verified || false,
                role: userData.role || 'customer',
                is_stall_owner: false,
                owner_verified: false,
                approval_status: 'none'
            };

            const { data, error, status } = await supabase
                .from('users')
                .insert([insertRow])
                .select('user_id, name, email, role, is_stall_owner, stall_id, owner_verified, approval_status, avatar_url, email_verified, oauth_provider')
                .limit(1)
                .maybeSingle();

            if (error) {
                if (status === 409) return { success: false, message: 'Email already exists' };
                throw error;
            }

            if (data) data.userId = data.user_id || data.userId;
            return { success: true, user: data };
        } catch (error) {
            throw error;
        }
    }

    // Link OAuth account to existing user
    static async linkOAuthAccount(userId, oauthData) {
        try {
            const updateData = {
                oauth_provider: oauthData.provider,
                oauth_id: oauthData.oauth_id,
                email_verified: oauthData.email_verified || false
            };

            if (oauthData.avatar_url) {
                updateData.avatar_url = oauthData.avatar_url;
            }

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, user: data };
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID (for passport deserialization)
    static async findUserById(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('user_id, name, email, role, is_stall_owner, stall_id, owner_verified, approval_status, avatar_url, email_verified, referral_code')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            if (data) data.userId = data.user_id || data.userId;
            return data || null;
        } catch (error) {
            throw error;
        }
    }

    // Ensure user has a referral code (assign one if missing — for existing users or lazy backfill)
    static async ensureReferralCode(userId) {
        try {
            const user = await this.findUserById(userId);
            if (!user) return null;
            if (user.referral_code) return user.referral_code;

            let code = generateReferralCode();
            for (let attempt = 0; attempt < 5; attempt++) {
                const { data, error } = await supabase
                    .from('users')
                    .update({ referral_code: code })
                    .eq('user_id', userId)
                    .select('referral_code')
                    .maybeSingle();

                if (!error) return data?.referral_code || code;
                if (error.code === '23505') {
                    code = generateReferralCode();
                    continue;
                }
                throw error;
            }
            return code;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserModel;
