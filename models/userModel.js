const sql = require("mssql");
const bcrypt = require("bcrypt");
const dbConfig = require("../dbConfig");

class UserModel {
    // Create new user (signup)
    static async createUser(userData) {
        try {
            const pool = await sql.connect(dbConfig);
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            const query = `
                INSERT INTO Users (username, email, password, role)
                OUTPUT INSERTED.userId, INSERTED.username, INSERTED.email, INSERTED.role
                VALUES (@username, @email, @password, @role)
            `;

            const request = pool.request();
            request.input("username", sql.NVarChar(100), userData.username);
            request.input("email", sql.NVarChar(100), userData.email);
            request.input("password", sql.NVarChar(255), hashedPassword);
            request.input("role", sql.NVarChar(50), userData.role || "customer");

            console.log("Executing query:", query);
            const result = await request.query(query);

            return { success: true, user: result.recordset[0] };
        } catch (error) {
            if (error.number === 2627) {
                // Unique constraint (duplicate email)
                return { success: false, message: "Email already exists" };
            }
            throw error;
        }
    }

    // Find user by email (for login)
    static async findUserByEmail(email) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT userId, username, email, password, role
                FROM Users 
                WHERE email = @Email
            `;

            const request = pool.request();
            request.input("Email", sql.NVarChar(100), email);

            const result = await request.query(query);
            return result.recordset[0] || null;
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
            const pool = await sql.connect(dbConfig);
            const query = `
                UPDATE Users
                SET username = @username, role = @role
                OUTPUT INSERTED.userId, INSERTED.username, INSERTED.email, INSERTED.role
                WHERE userId = @userId
            `;

            const request = pool.request();
            request.input("userId", sql.Int, userId);
            request.input("username", sql.NVarChar(100), updateData.username);
            request.input("role", sql.NVarChar(50), updateData.role);

            const result = await request.query(query);
            return { success: true, user: result.recordset[0] };
        } catch (error) {
            throw error;
        }
    }

    // Delete user (optional)
    static async deleteUser(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `DELETE FROM Users WHERE userId = @userId`;

            const request = pool.request();
            request.input("userId", sql.Int, userId);

            await request.query(query);
            return { success: true };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserModel;
