const bcrypt = require("bcrypt");
const supabase = require('../dbConfig');

class UserModel {
    // Create new user (signup)
    static async createUser(userData) {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            const insertRow = {
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role || 'customer',
                is_stall_owner: userData.is_stall_owner || false,
                stall_id: userData.stall_id || null,
                owner_verified: userData.owner_verified || false,
                approval_status: userData.approval_status || 'none'
            };

            const { data, error, status } = await supabase
                .from('users')
                .insert([insertRow])
                .select('user_id, name, email, role, is_stall_owner, stall_id, owner_verified, approval_status')
                .limit(1)
                .maybeSingle();

            if (error) {
                // unique violation handling may vary; return friendly message
                if (status === 409) return { success: false, message: 'Email already exists' };
                throw error;
            }

            if (data) data.userId = data.user_id || data.userId;
            return { success: true, user: data };
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
}

module.exports = UserModel;
