const sql = require('mssql');
const dbConfig = require('../dbConfig');

class StallModel {
    static async getStallById(id) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            request.input('id', sql.Int, id);

            const query = `
                SELECT s.*, ct.name AS cuisine_name, hc.name AS hawker_centre_name, hc.id AS hawker_centre_id
                FROM stalls s
                LEFT JOIN cuisine_types ct ON s.cuisine_type_id = ct.id
                LEFT JOIN hawker_centres hc ON s.hawker_centre_id = hc.id
                WHERE s.id = @id
            `;

            const result = await request.query(query);
            return result.recordset[0] || null;
        } catch (error) {
            throw new Error(`Error fetching stall: ${error.message}`);
        }
    }
}

module.exports = StallModel;
