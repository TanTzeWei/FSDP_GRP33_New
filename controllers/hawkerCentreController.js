const HawkerCentreModel = require('../models/hawkerCentreModel');

class HawkerCentreController {
    // Get all hawker centres with optional filtering
    static async getAllHawkerCentres(req, res) {
        try {
            const filters = {
                minRating: req.query.minRating ? parseFloat(req.query.minRating) : null,
                cuisine: req.query.cuisine || null,
                searchTerm: req.query.search || null
            };

            // Remove null values from filters
            Object.keys(filters).forEach(key => {
                if (filters[key] === null || filters[key] === undefined) {
                    delete filters[key];
                }
            });

            const hawkerCentres = await HawkerCentreModel.getAllHawkerCentres(filters);

            // Parse JSON fields if they exist
            const processedHawkerCentres = hawkerCentres.map(hc => {
                let facilities = [];
                if (hc.facilities) {
                    try {
                        // If it's already an array, use it directly
                        facilities = Array.isArray(hc.facilities) ? hc.facilities : JSON.parse(hc.facilities);
                    } catch (e) {
                        // If JSON parsing fails, treat it as comma-separated string
                        facilities = typeof hc.facilities === 'string' ? hc.facilities.split(',').map(f => f.trim()) : [];
                    }
                }
                
                let available_cuisines = [];
                if (hc.available_cuisines) {
                    if (Array.isArray(hc.available_cuisines)) {
                        available_cuisines = hc.available_cuisines;
                    } else if (typeof hc.available_cuisines === 'string') {
                        available_cuisines = hc.available_cuisines.split(', ').filter(c => c);
                    }
                }
                
                return {
                    ...hc,
                    facilities,
                    available_cuisines
                };
            });

            res.status(200).json({
                success: true,
                data: processedHawkerCentres,
                count: processedHawkerCentres.length
            });
        } catch (error) {
            console.error('Error in getAllHawkerCentres:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch hawker centres',
                error: error.message
            });
        }
    }

    // Get hawker centre by ID with detailed information
    static async getHawkerCentreById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid hawker centre ID is required'
                });
            }

            const hawkerCentre = await HawkerCentreModel.getHawkerCentreById(parseInt(id));

            if (!hawkerCentre) {
                return res.status(404).json({
                    success: false,
                    message: 'Hawker centre not found'
                });
            }

            // Process facilities field (handle both JSON and comma-separated strings)
            let facilities = [];
            if (hawkerCentre.facilities) {
                try {
                    facilities = Array.isArray(hawkerCentre.facilities) ? hawkerCentre.facilities : JSON.parse(hawkerCentre.facilities);
                } catch (e) {
                    facilities = typeof hawkerCentre.facilities === 'string' ? hawkerCentre.facilities.split(',').map(f => f.trim()) : [];
                }
            }
            hawkerCentre.facilities = facilities;

            // Process available_cuisines field (handle both arrays and strings)
            let available_cuisines = [];
            if (hawkerCentre.available_cuisines) {
                if (Array.isArray(hawkerCentre.available_cuisines)) {
                    available_cuisines = hawkerCentre.available_cuisines;
                } else if (typeof hawkerCentre.available_cuisines === 'string') {
                    available_cuisines = hawkerCentre.available_cuisines.split(', ').filter(c => c);
                }
            }
            hawkerCentre.available_cuisines = available_cuisines;

            // Process stalls data
            hawkerCentre.stalls = hawkerCentre.stalls.map(stall => {
                let specialties = [];
                if (stall.specialties) {
                    try {
                        specialties = Array.isArray(stall.specialties) ? stall.specialties : JSON.parse(stall.specialties);
                    } catch (e) {
                        specialties = [];
                    }
                }
                return {
                    ...stall,
                    specialties
                };
            });

            res.status(200).json({
                success: true,
                data: hawkerCentre
            });
        } catch (error) {
            console.error('Error in getHawkerCentreById:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch hawker centre details',
                error: error.message
            });
        }
    }

    // Get nearby hawker centres based on coordinates
    static async getNearbyHawkerCentres(req, res) {
        try {
            const { latitude, longitude, radius } = req.query;

            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const radiusKm = radius ? parseFloat(radius) : 5;

            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid coordinates provided'
                });
            }

            const nearbyHawkerCentres = await HawkerCentreModel.getNearbyHawkerCentres(lat, lng, radiusKm);

            // Process JSON fields
            const processedHawkerCentres = nearbyHawkerCentres.map(hc => ({
                ...hc,
                facilities: hc.facilities ? JSON.parse(hc.facilities) : [],
                available_cuisines: hc.available_cuisines ? hc.available_cuisines.split(', ').filter(c => c) : [],
                distance_km: parseFloat(hc.distance_km).toFixed(2)
            }));

            res.status(200).json({
                success: true,
                data: processedHawkerCentres,
                count: processedHawkerCentres.length,
                searchCenter: { latitude: lat, longitude: lng },
                searchRadius: radiusKm
            });
        } catch (error) {
            console.error('Error in getNearbyHawkerCentres:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch nearby hawker centres',
                error: error.message
            });
        }
    }

    // Get all cuisine types
    static async getCuisineTypes(req, res) {
        try {
            const cuisineTypes = await HawkerCentreModel.getAllCuisineTypes();

            res.status(200).json({
                success: true,
                data: cuisineTypes
            });
        } catch (error) {
            console.error('Error in getCuisineTypes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch cuisine types',
                error: error.message
            });
        }
    }

    // Get popular dishes from a specific hawker centre
    static async getPopularDishes(req, res) {
        try {
            const { id } = req.params;
            const { limit } = req.query;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid hawker centre ID is required'
                });
            }

            const dishLimit = limit && !isNaN(limit) ? parseInt(limit) : 10;
            const popularDishes = await HawkerCentreModel.getPopularDishes(parseInt(id), dishLimit);

            // Process JSON fields
            const processedDishes = popularDishes.map(dish => ({
                ...dish,
                dietary_info: dish.dietary_info ? JSON.parse(dish.dietary_info) : []
            }));

            res.status(200).json({
                success: true,
                data: processedDishes,
                count: processedDishes.length
            });
        } catch (error) {
            console.error('Error in getPopularDishes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch popular dishes',
                error: error.message
            });
        }
    }

    // Get hawker centre statistics
    static async getHawkerCentreStats(req, res) {
        try {
            const stats = await HawkerCentreModel.getHawkerCentreStats();

            res.status(200).json({
                success: true,
                data: {
                    ...stats,
                    average_rating: parseFloat(stats.average_rating).toFixed(2)
                }
            });
        } catch (error) {
            console.error('Error in getHawkerCentreStats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch hawker centre statistics',
                error: error.message
            });
        }
    }

    // Search hawker centres by name, location, or cuisine
    static async searchHawkerCentres(req, res) {
        try {
            const { query: searchQuery, cuisine, minRating, sortBy } = req.query;

            if (!searchQuery || searchQuery.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const filters = {
                searchTerm: searchQuery.trim(),
                cuisine: cuisine || null,
                minRating: minRating ? parseFloat(minRating) : null
            };

            // Remove null values from filters
            Object.keys(filters).forEach(key => {
                if (filters[key] === null || filters[key] === undefined) {
                    delete filters[key];
                }
            });

            let hawkerCentres = await HawkerCentreModel.getAllHawkerCentres(filters);

            // Additional sorting if specified
            if (sortBy) {
                switch (sortBy) {
                    case 'rating':
                        hawkerCentres.sort((a, b) => b.rating - a.rating);
                        break;
                    case 'reviews':
                        hawkerCentres.sort((a, b) => b.total_reviews - a.total_reviews);
                        break;
                    case 'stalls':
                        hawkerCentres.sort((a, b) => b.total_stalls - a.total_stalls);
                        break;
                    case 'name':
                        hawkerCentres.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                }
            }

            // Process JSON fields
            const processedHawkerCentres = hawkerCentres.map(hc => ({
                ...hc,
                facilities: hc.facilities ? JSON.parse(hc.facilities) : [],
                available_cuisines: hc.available_cuisines ? hc.available_cuisines.split(', ').filter(c => c) : []
            }));

            res.status(200).json({
                success: true,
                data: processedHawkerCentres,
                count: processedHawkerCentres.length,
                searchQuery: searchQuery,
                filters: filters
            });
        } catch (error) {
            console.error('Error in searchHawkerCentres:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search hawker centres',
                error: error.message
            });
        }
    }
}

module.exports = HawkerCentreController;