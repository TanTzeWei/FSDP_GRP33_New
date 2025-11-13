const sql = require('mssql');
const dbConfig = require('../dbConfig');

class HawkerCentreModel {
    // Get all hawker centres with optional filtering
    static async getAllHawkerCentres(filters = {}) {
        try {
            const pool = await sql.connect(dbConfig);
            let query = `
                SELECT 
                    hc.*,
                    COUNT(DISTINCT s.id) as active_stalls,
                    STRING_AGG(DISTINCT ct.name, ', ') as available_cuisines,
                    AVG(CAST(s.rating as FLOAT)) as average_stall_rating
                FROM hawker_centres hc
                LEFT JOIN stalls s ON hc.id = s.hawker_centre_id AND s.status = 'Active'
                LEFT JOIN cuisine_types ct ON s.cuisine_type_id = ct.id
                WHERE hc.status = 'Active'
            `;

            const request = pool.request();

            // Add filters if provided
            if (filters.minRating) {
                query += ' AND hc.rating >= @minRating';
                request.input('minRating', sql.Decimal(3, 2), filters.minRating);
            }

            if (filters.cuisine) {
                query += ' AND ct.name = @cuisine';
                request.input('cuisine', sql.VarChar(100), filters.cuisine);
            }

            if (filters.searchTerm) {
                query += ' AND (hc.name LIKE @searchTerm OR hc.address LIKE @searchTerm)';
                request.input('searchTerm', sql.VarChar(255), `%${filters.searchTerm}%`);
            }

            query += ' GROUP BY hc.id, hc.name, hc.description, hc.address, hc.postal_code, hc.latitude, hc.longitude, hc.opening_hours, hc.closing_hours, hc.operating_days, hc.total_stalls, hc.rating, hc.total_reviews, hc.image_url, hc.facilities, hc.contact_phone, hc.managed_by, hc.status, hc.created_at, hc.updated_at';
            query += ' ORDER BY hc.rating DESC, hc.total_reviews DESC';

            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            throw new Error(`Error fetching hawker centres: ${error.message}`);
        }
    }

    // Get hawker centre by ID with detailed information
    static async getHawkerCentreById(id) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            request.input('id', sql.Int, id);

            const hawkerQuery = `
                SELECT 
                    hc.*,
                    COUNT(DISTINCT s.id) as active_stalls,
                    STRING_AGG(DISTINCT ct.name, ', ') as available_cuisines,
                    AVG(CAST(s.rating as FLOAT)) as average_stall_rating
                FROM hawker_centres hc
                LEFT JOIN stalls s ON hc.id = s.hawker_centre_id AND s.status = 'Active'
                LEFT JOIN cuisine_types ct ON s.cuisine_type_id = ct.id
                WHERE hc.id = @id AND hc.status = 'Active'
                GROUP BY hc.id, hc.name, hc.description, hc.address, hc.postal_code, hc.latitude, hc.longitude, hc.opening_hours, hc.closing_hours, hc.operating_days, hc.total_stalls, hc.rating, hc.total_reviews, hc.image_url, hc.facilities, hc.contact_phone, hc.managed_by, hc.status, hc.created_at, hc.updated_at
            `;

            const stallsQuery = `
                SELECT 
                    s.*,
                    ct.name as cuisine_name,
                    ct.icon as cuisine_icon,
                    ct.color as cuisine_color
                FROM stalls s
                LEFT JOIN cuisine_types ct ON s.cuisine_type_id = ct.id
                WHERE s.hawker_centre_id = @id AND s.status = 'Active'
                ORDER BY s.rating DESC
            `;

            const [hawkerResult, stallsResult] = await Promise.all([
                request.query(hawkerQuery),
                request.query(stallsQuery)
            ]);

            if (hawkerResult.recordset.length === 0) {
                return null;
            }

            const hawkerCentre = hawkerResult.recordset[0];
            hawkerCentre.stalls = stallsResult.recordset;

            return hawkerCentre;
        } catch (error) {
            throw new Error(`Error fetching hawker centre: ${error.message}`);
        }
    }

    // Get hawker centres within a radius (simplified version using basic coordinate math)
    static async getNearbyHawkerCentres(latitude, longitude, radiusKm = 5) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            
            request.input('latitude', sql.Decimal(10, 8), latitude);
            request.input('longitude', sql.Decimal(11, 8), longitude);
            request.input('radius', sql.Float, radiusKm);

            // Simple distance calculation (for more accuracy, use proper geospatial functions)
            const query = `
                SELECT 
                    hc.*,
                    COUNT(DISTINCT s.id) as active_stalls,
                    STRING_AGG(DISTINCT ct.name, ', ') as available_cuisines,
                    AVG(CAST(s.rating as FLOAT)) as average_stall_rating,
                    (
                        6371 * acos(
                            cos(radians(@latitude)) * cos(radians(hc.latitude)) *
                            cos(radians(hc.longitude) - radians(@longitude)) +
                            sin(radians(@latitude)) * sin(radians(hc.latitude))
                        )
                    ) AS distance_km
                FROM hawker_centres hc
                LEFT JOIN stalls s ON hc.id = s.hawker_centre_id AND s.status = 'Active'
                LEFT JOIN cuisine_types ct ON s.cuisine_type_id = ct.id
                WHERE hc.status = 'Active'
                GROUP BY hc.id, hc.name, hc.description, hc.address, hc.postal_code, hc.latitude, hc.longitude, hc.opening_hours, hc.closing_hours, hc.operating_days, hc.total_stalls, hc.rating, hc.total_reviews, hc.image_url, hc.facilities, hc.contact_phone, hc.managed_by, hc.status, hc.created_at, hc.updated_at
                HAVING distance_km <= @radius
                ORDER BY distance_km, hc.rating DESC
            `;

            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            throw new Error(`Error fetching nearby hawker centres: ${error.message}`);
        }
    }

    // Get all cuisine types
    static async getAllCuisineTypes() {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT * FROM cuisine_types 
                ORDER BY name
            `;
            const result = await pool.request().query(query);
            return result.recordset;
        } catch (error) {
            throw new Error(`Error fetching cuisine types: ${error.message}`);
        }
    }

    // Get popular dishes from a hawker centre
    static async getPopularDishes(hawkerCentreId, limit = 10) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            request.input('hawkerCentreId', sql.Int, hawkerCentreId);
            request.input('limit', sql.Int, limit);

            const query = `
                SELECT TOP (@limit)
                    fi.*,
                    s.stall_name,
                    ct.name as cuisine_name
                FROM food_items fi
                JOIN stalls s ON fi.stall_id = s.id
                JOIN cuisine_types ct ON s.cuisine_type_id = ct.id
                WHERE s.hawker_centre_id = @hawkerCentreId 
                    AND fi.is_available = 1
                    AND s.status = 'Active'
                ORDER BY fi.is_popular DESC, fi.price ASC
            `;

            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            throw new Error(`Error fetching popular dishes: ${error.message}`);
        }
    }

    // Get hawker centre statistics
    static async getHawkerCentreStats() {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT 
                    COUNT(*) as total_hawker_centres,
                    AVG(CAST(rating as FLOAT)) as average_rating,
                    SUM(total_stalls) as total_stalls,
                    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_centres
                FROM hawker_centres
            `;
            const result = await pool.request().query(query);
            return result.recordset[0];
        } catch (error) {
            throw new Error(`Error fetching hawker centre statistics: ${error.message}`);
        }
    }
}

module.exports = HawkerCentreModel;