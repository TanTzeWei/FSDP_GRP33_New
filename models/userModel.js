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
                INSERT INTO Users (name, email, password)
                OUTPUT INSERTED.userId, INSERTED.name, INSERTED.email
                VALUES (@name, @email, @password)
            `;

            const request = pool.request();
            request.input("name", sql.NVarChar(100), userData.name);
            request.input("email", sql.NVarChar(100), userData.email);
            request.input("password", sql.NVarChar(255), hashedPassword);
            // role column removed for now; set roles later via migrations or separate admin flow

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
                SELECT userId, name, email, password
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
                SET name = @name
                OUTPUT INSERTED.userId, INSERTED.name, INSERTED.email
                WHERE userId = @userId
            `;

            const request = pool.request();
            request.input("userId", sql.Int, userId);
            request.input("name", sql.NVarChar(100), updateData.name);
            // role update omitted for now

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

    // Update password
    static async updatePassword(userId, hashedPassword) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                UPDATE Users
                SET password = @password
                WHERE userId = @userId
            `;

            const request = pool.request();
            request.input("userId", sql.Int, userId);
            request.input("password", sql.NVarChar(255), hashedPassword);

            await request.query(query);
            return { success: true };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserModel;
