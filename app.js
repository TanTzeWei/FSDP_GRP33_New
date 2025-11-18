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
let UserController, HawkerCentreController, UploadController, authMiddleware;

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
    authMiddleware = require('./middlewares/authMiddleware');
    console.log('✅ AuthMiddleware loaded');
} catch (error) {
    console.error('❌ Error loading AuthMiddleware:', error.message);
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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// User Routes (only if controllers loaded successfully)
if (UserController && authMiddleware) {
    app.post('/signup', UserController.signup);
    app.post('/login', UserController.login);
    app.get('/profile', authMiddleware, UserController.getProfile);
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
    // Upload photo (stores as BLOB in database)
    app.post('/api/photos/upload', UploadController.uploadMiddleware, UploadController.uploadPhoto);
    
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
    
    // Get photo details
    app.get('/api/photos/:photoId', UploadController.getPhotoDetails);
    
    // Like/Unlike photos
    app.post('/api/photos/:photoId/like', UploadController.likePhoto);
    app.delete('/api/photos/:photoId/like', UploadController.unlikePhoto);
    
    // Delete photo
    app.delete('/api/photos/:photoId', UploadController.deletePhoto);
    
    console.log('✅ Photo BLOB upload routes configured (database storage)');
} else {
    console.log('⚠️  Photo upload routes disabled (missing UploadController)');
}
// Simple health route
app.get('/', (req, res) => {
	res.send('Server is running');
});

// Test database insert route
app.get('/test-db', async (req, res) => {
    try {
        const sql = require('mssql');
        const { connectDB } = require('./dbConfig');
        
        console.log('Testing database insert...');
        await connectDB();
        
        // Test simple insert without BLOB
        const result = await sql.query`
            INSERT INTO photos (
                user_id, hawker_centre_id, stall_id, food_item_id,
                original_filename, photo_data, file_size, mime_type,
                dish_name, description
            )
            OUTPUT INSERTED.id, INSERTED.created_at
            VALUES (
                1, 1, NULL, NULL,
                'test.jpg', 0x123456, 1024, 'image/jpeg',
                'Test Dish', 'Test Description'
            )
        `;
        
        console.log('Database insert successful:', result.recordset[0]);
        res.json({ success: true, data: result.recordset[0] });
        
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