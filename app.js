const express = require('express');
const dotenv = require('dotenv');
// Load environment variables from .env (if present) BEFORE requiring files that use them
dotenv.config();
const sql = require('mssql');
const path = require('path');
const cors = require('cors');
const UserController = require('./controllers/userController');
const authMiddleware = require('./middlewares/authMiddleware');

// Create Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Routes
app.post('/signup', UserController.signup);
app.post('/login', UserController.login);
app.get('/profile', authMiddleware, UserController.getProfile);
// Simple health route
app.get('/', (req, res) => {
	res.send('Server is running');
});

// Example: use const for port and don't reassign it
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});