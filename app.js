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

const supabase = require('./dbConfig');
const path = require('path');
const cors = require('cors');

// Import controllers with error handling
let UserController, HawkerCentreController, UploadController, authMiddleware;
let DishController;
let StallController;
let MenuPhotoController;
let StallClosureController;

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
    UploadController = require('./controllers/uploadController');
    console.log('✅ UploadController loaded');
} catch (error) {
    console.error('❌ Error loading UploadController:', error.message);
}

try {
    MenuPhotoController = require('./controllers/menuPhotoController');
    console.log('✅ MenuPhotoController loaded');
} catch (error) {
    console.error('❌ Error loading MenuPhotoController:', error.message);
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

try {
    StallClosureController = require('./controllers/stallClosureController');
    console.log('✅ StallClosureController loaded');
} catch (error) {
    console.error('❌ Error loading StallClosureController:', error.message);
}

// Create Express app
const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176', 
    'http://127.0.0.1:5173', 
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: Static file serving for uploads removed - now using Cloudinary
// Static files are served directly from Cloudinary CDN

// User Routes (only if controllers loaded successfully)
if (UserController && authMiddleware) {
    app.post('/signup', UserController.signup);
    app.post('/login', UserController.login);
    app.get('/profile', authMiddleware, UserController.getProfile);
    app.put('/profile', authMiddleware, UserController.updateProfile);
    app.put('/change-password', authMiddleware, UserController.changePassword);
    app.delete('/profile', authMiddleware, UserController.deleteAccount);
    app.get('/profile/stats', authMiddleware, UserController.getUserStats);
    // Admin: approve owner accounts
    app.post('/admin/owners/:userId/approve', authMiddleware, authMiddleware.requireAdmin, UserController.approveOwner);
    app.get('/admin/owners/pending', authMiddleware, authMiddleware.requireAdmin, UserController.listPendingOwners);
    app.post('/admin/owners/:userId/reject', authMiddleware, authMiddleware.requireAdmin, UserController.rejectOwner);
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

// Photo Upload Routes - BLOB Storage (photos stored IN database)
if (UploadController) {
    // Upload photo (stores as BLOB in database) - requires authentication
    app.post('/api/photos/upload', authMiddleware, UploadController.uploadMiddleware, UploadController.uploadPhoto);
    
    // Serve photo image from database
    app.get('/api/photos/:id/image', UploadController.getPhotoImage);
    
    // Get all photos metadata
    app.get('/api/photos', UploadController.getPhotos);
    
    // Get featured photos
    app.get('/api/photos/featured', (req, res, next) => {
        req.query.featured = 'true';
        UploadController.getPhotos(req, res, next);
    });
    
    // Get recent photos
    app.get('/api/photos/recent', (req, res, next) => {
        req.query.recent = 'true';
        UploadController.getPhotos(req, res, next);
    });
    
    // Get photos by hawker centre
    app.get('/api/photos/hawker/:hawkerCentreId', UploadController.getPhotosByHawkerCentre);
    
    // Get community photos by stall (for stall owner dashboard)
    app.get('/api/photos/stall/:stallId', UploadController.getPhotosByStall);
    
    // Get ids of photos liked by current user (must come before the :photoId route)
    app.get('/api/photos/liked', authMiddleware, UploadController.getLikedPhotos);

    // Get photo details
    app.get('/api/photos/:photoId', UploadController.getPhotoDetails);

    // Like/Unlike photos (requires authentication)
    app.post('/api/photos/:photoId/like', authMiddleware, UploadController.likePhoto);
    app.delete('/api/photos/:photoId/like', authMiddleware, UploadController.unlikePhoto);
    
    // Update photo approval status (requires authentication - stall owner)
    app.put('/api/photos/:photoId/approval', authMiddleware, UploadController.updateApprovalStatus);
    
    // Delete photo - REQUIRES AUTH
    app.delete('/api/photos/:photoId', authMiddleware, UploadController.deletePhoto);
    
    console.log('✅ Photo BLOB upload routes configured (database storage)');
} else {
    console.log('⚠️  Photo upload routes disabled (missing UploadController)');
}

// Menu Photo Upload Routes (for menu item photos)
if (MenuPhotoController) {
    // Upload menu photo and create/update dish - REQUIRES STALL OWNER
    app.post('/api/menu-photos/upload', authMiddleware, authMiddleware.requireStallOwner, MenuPhotoController.uploadMiddleware, MenuPhotoController.uploadMenuPhoto);
    
    // Get menu photos by stall
    app.get('/api/menu-photos/stall/:stallId', MenuPhotoController.getMenuPhotosByStall);
    
    // Get menu photos by hawker centre
    app.get('/api/menu-photos/hawker/:hawkerCentreId', MenuPhotoController.getMenuPhotosByHawkerCentre);
    
    // Get single menu photo
    app.get('/api/menu-photos/:photoId', MenuPhotoController.getMenuPhoto);
    
    // Delete menu photo
    app.delete('/api/menu-photos/:photoId', MenuPhotoController.deleteMenuPhoto);
    
    console.log('✅ Menu photo upload routes configured (file storage)');
} else {
    console.log('⚠️  Menu photo upload routes disabled (missing MenuPhotoController)');
}

// Dish routes (food_items CRUD)
if (DishController) {
    // Public: list dishes for a stall
    app.get('/api/stalls/:stallId/dishes', DishController.listByStall);
    // Public: get single dish
    app.get('/api/dishes/:id', DishController.getDish);

    // Protected routes: create/update/delete dishes (requires auth)
    if (authMiddleware) {
        app.post('/api/dishes', authMiddleware, authMiddleware.requireStallOwner, DishController.createDish);
        app.put('/api/dishes/:id', authMiddleware, authMiddleware.requireStallOwner, DishController.updateDish);
        app.delete('/api/dishes/:id', authMiddleware, authMiddleware.requireStallOwner, DishController.deleteDish);
    } else {
        console.log('⚠️  Dish write routes disabled (missing authMiddleware)');
    }

    console.log('✅ Dish routes configured');
} else {
    console.log('⚠️  Dish routes disabled (missing DishController)');
}

// Stall route: get stall details
if (StallController) {
    // Public: get all stalls
    app.get('/api/stalls', StallController.getAllStalls);
    // Public: get single stall by ID
    app.get('/api/stalls/:id', StallController.getStallById);
    
    // Protected routes for stall owners
    if (authMiddleware) {
        // Upload stall image
        app.post('/api/stalls/:id/image', authMiddleware, authMiddleware.requireStallOwner, StallController.uploadMiddleware, StallController.uploadStallImage);
 

// Stall Closure Routes (Temporary Closure / Holiday Scheduling)
if (StallClosureController && authMiddleware) {
    // Public: get closure status
    app.get('/api/stalls/:id/closure-status', StallClosureController.getClosureStatus);
    app.get('/api/stalls/:id/active-closures', StallClosureController.getActiveClosures);
    
    // Protected: manage closures (stall owners only)
    app.post('/api/stalls/:id/closures', authMiddleware, authMiddleware.requireStallOwner, StallClosureController.createClosure);
    app.get('/api/stalls/:id/closures', authMiddleware, authMiddleware.requireStallOwner, StallClosureController.getStallClosures);
    app.put('/api/stalls/:id/closures/:closureId', authMiddleware, authMiddleware.requireStallOwner, StallClosureController.updateClosure);
    app.delete('/api/stalls/:id/closures/:closureId', authMiddleware, authMiddleware.requireStallOwner, StallClosureController.deleteClosure);
    
    console.log('✅ Stall closure routes configured');
} else {
    console.log('⚠️  Stall closure routes disabled (missing StallClosureController or authMiddleware)');
}       // Update stall details
        app.put('/api/stalls/:id', authMiddleware, authMiddleware.requireStallOwner, StallController.updateStall);
    }
    
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


    
    // Hawker centre specific
    app.get('/api/hawker-centres/:hawkerCentreId/tables', ReservationController.getHawkerCentreTables);
    app.get('/api/hawker-centres/:hawkerCentreId/reservations', ReservationController.getHawkerCentreReservations);
    app.get('/api/hawker-centres/:hawkerCentreId/reservation-stats', ReservationController.getHawkerCentreReservationStats);
    
    console.log('✅ Reservation routes configured');

// Simple health route
app.get('/', (req, res) => {
	res.send('Server is running');
});

// Test database insert route
app.get('/test-db', async (req, res) => {
    try {
        console.log('Testing Supabase connection...');
        // Simple select to verify access to the Users table
        const { data, error } = await supabase.from('users').select('user_id').limit(1);
        if (error) {
            console.error('Supabase test error:', error);
            return res.status(500).json({ success: false, error: error.message || error });
        }
        res.json({ success: true, data: data && data[0] ? data[0] : null });
        
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Example: use const for port and don't reassign it
const PORT = process.env.PORT || 3000;

// Test database connection on startup
async function testDatabaseConnection() {
    try {
        // Perform a lightweight select to validate Supabase connectivity
        const { data, error } = await supabase.from('users').select('user_id').limit(1);
        if (error) throw error;
        console.log('✅ Supabase connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message || error);
        console.error('💡 Check your .env file SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
}

// Global error handler to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('💥 UNCAUGHT EXCEPTION - Server will continue running:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION - Server will continue running:');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
});

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