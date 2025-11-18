const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from .env (if present) BEFORE requiring files that use them
dotenv.config();

// Check for required dependencies
try {
    require('jsonwebtoken');
} catch (error) {
    console.error('❌ Missing dependency: jsonwebtoken');
    console.error('💡 Run: npm install jsonwebtoken');
    process.exit(1);
}

const sql = require('mssql');
const path = require('path');
const cors = require('cors');

// Import controllers with error handling
let UserController, HawkerCentreController, PointsController, authMiddleware;
let DishController;
let StallController;

try {
    UserController = require('./controllers/userController');
    console.log('✅ UserController loaded');
} catch (error) {
    console.error('❌ Error loading UserController:', error.message);
}

try {
    HawkerCentreController = require('./controllers/hawkerCentreController');
    console.log('✅ HawkerCentreController loaded');
} catch (error) {
    console.error('❌ Error loading HawkerCentreController:', error.message);
}

try {
    PointsController = require('./controllers/pointsController');
    console.log('✅ PointsController loaded');
} catch (error) {
    console.error('❌ Error loading PointsController:', error.message);
}

try {
    authMiddleware = require('./middlewares/authMiddleware');
    console.log('✅ AuthMiddleware loaded');
} catch (error) {
    console.error('❌ Error loading AuthMiddleware:', error.message);
}

try {
    DishController = require('./controllers/dishController');
    console.log('✅ DishController loaded');
} catch (error) {
    console.error('❌ Error loading DishController:', error.message);
}

try {
    StallController = require('./controllers/stallController');
    console.log('✅ StallController loaded');
} catch (error) {
    console.error('❌ Error loading StallController:', error.message);
}

// Create Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// User Routes (only if controllers loaded successfully)
if (UserController && authMiddleware) {
    app.post('/signup', UserController.signup);
    app.post('/login', UserController.login);
    app.get('/profile', authMiddleware, UserController.getProfile);
    app.put('/profile', authMiddleware, UserController.updateProfile);
    app.put('/change-password', authMiddleware, UserController.changePassword);
    app.delete('/profile', authMiddleware, UserController.deleteAccount);
    console.log('✅ User routes configured');
} else {
    console.log('⚠️  User routes disabled (missing UserController or authMiddleware)');
}

// Hawker Centre Routes (only if controller loaded successfully)
if (HawkerCentreController) {
    app.get('/api/hawker-centres', HawkerCentreController.getAllHawkerCentres);
    app.get('/api/hawker-centres/search', HawkerCentreController.searchHawkerCentres);
    app.get('/api/hawker-centres/nearby', HawkerCentreController.getNearbyHawkerCentres);
    app.get('/api/hawker-centres/stats', HawkerCentreController.getHawkerCentreStats);
    app.get('/api/hawker-centres/:id', HawkerCentreController.getHawkerCentreById);
    app.get('/api/hawker-centres/:id/dishes', HawkerCentreController.getPopularDishes);
    app.get('/api/cuisine-types', HawkerCentreController.getCuisineTypes);
    console.log('✅ Hawker centre routes configured');
} else {
    console.log('⚠️  Hawker centre routes disabled (missing HawkerCentreController)');
}

// Dish routes (food_items CRUD)
if (DishController) {
    // Public: list dishes for a stall
    app.get('/api/stalls/:stallId/dishes', DishController.listByStall);
    // Public: get single dish
    app.get('/api/dishes/:id', DishController.getDish);

    // Protected routes: create/update/delete dishes (requires auth)
    if (authMiddleware) {
        app.post('/api/dishes', authMiddleware, DishController.createDish);
        app.put('/api/dishes/:id', authMiddleware, DishController.updateDish);
        app.delete('/api/dishes/:id', authMiddleware, DishController.deleteDish);
    } else {
        console.log('⚠️  Dish write routes disabled (missing authMiddleware)');
    }

    console.log('✅ Dish routes configured');
} else {
    console.log('⚠️  Dish routes disabled (missing DishController)');
}

// Stall route: get stall details
if (StallController) {
    app.get('/api/stalls/:id', StallController.getStallById);
    console.log('✅ Stall route configured');
} else {
    console.log('⚠️  Stall routes disabled (missing StallController)');
}

// Points System Routes (only if controller loaded successfully)
if (PointsController && authMiddleware) {
    // User points and dashboard
    app.get('/api/points', authMiddleware, PointsController.getUserPoints);
    app.get('/api/points/dashboard', authMiddleware, PointsController.getPointsDashboard);
    app.get('/api/points/history', authMiddleware, PointsController.getPointsHistory);
    
    // Earning points
    app.post('/api/points/photo-upload', authMiddleware, PointsController.addPhotoUploadPoints);
    app.post('/api/points/upvote', authMiddleware, PointsController.addUpvotePoints);
    
    // Vouchers
    app.get('/api/vouchers', PointsController.getAllVouchers);
    app.post('/api/vouchers/redeem', authMiddleware, PointsController.redeemVoucher);
    app.get('/api/vouchers/redeemed', authMiddleware, PointsController.getRedeemedVouchers);
    app.post('/api/vouchers/use', authMiddleware, PointsController.useVoucher);
    app.get('/api/vouchers/code/:voucherCode', PointsController.getVoucherByCode);
    
    // Admin route (consider adding admin middleware)
    app.post('/api/points/adjust', authMiddleware, PointsController.adjustPoints);
    
    console.log('✅ Points system routes configured');
} else {
    console.log('⚠️  Points system routes disabled (missing PointsController or authMiddleware)');
}
// Simple health route
app.get('/', (req, res) => {
	res.send('Server is running');
});

// Example: use const for port and don't reassign it
const PORT = process.env.PORT || 3000;

// Test database connection on startup
async function testDatabaseConnection() {
    try {
        const dbConfig = require('./dbConfig');
        const pool = await sql.connect(dbConfig);
        console.log('✅ Database connected successfully');
        console.log(`📊 Connected to: ${dbConfig.server}/${dbConfig.database}`);
        await pool.close();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('💡 Check your .env file database configuration');
    }
}

// Start server
app.listen(PORT, async () => {
    console.log('🚀 Hawker Hub Backend Server');
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log('─'.repeat(50));
    
    // Test database connection
    await testDatabaseConnection();
    
    console.log('─'.repeat(50));
    console.log('✅ Server is ready to handle requests!');
});