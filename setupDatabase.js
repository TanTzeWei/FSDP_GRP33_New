const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

async function setupDatabase() {
    let pool;
    
    try {
        console.log('🚀 Starting database setup...');
        
        // Initialize database connection
        pool = await dbConfig.initializeDatabase();
        
        // Read the schema file
        const schemaPath = path.join(__dirname, 'init-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split schema into individual statements (simple split by GO or semicolon)
        const statements = schema
            .split(/GO\s*$/gim)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`📋 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
                    await pool.request().query(statement);
                } catch (error) {
                    // Some errors are expected (like table already exists)
                    if (error.message.includes('already exists') || 
                        error.message.includes('There is already an object')) {
                        console.log(`ℹ️  Skipping: ${error.message.split('.')[0]}`);
                    } else {
                        console.error(`❌ Error in statement ${i + 1}:`, error.message);
                        throw error;
                    }
                }
            }
        }
        
        console.log('✅ Database schema setup completed successfully!');
        
        // Test that tables were created
        const tablesQuery = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            ORDER BY TABLE_NAME
        `;
        
        const tablesResult = await pool.request().query(tablesQuery);
        const tableNames = tablesResult.recordset.map(row => row.TABLE_NAME);
        
        console.log('📊 Created tables:', tableNames.join(', '));
        
        // Check if sample data was inserted
        const hawkerCountQuery = 'SELECT COUNT(*) as count FROM hawker_centres';
        const hawkerResult = await pool.request().query(hawkerCountQuery);
        const hawkerCount = hawkerResult.recordset[0].count;
        
        console.log(`🏪 Sample hawker centres inserted: ${hawkerCount}`);
        
        return {
            success: true,
            tables: tableNames,
            hawkerCentres: hawkerCount
        };
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    setupDatabase()
        .then(result => {
            if (result.success) {
                console.log('🎉 Database setup completed successfully!');
                process.exit(0);
            } else {
                console.error('💥 Database setup failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error.message);
            process.exit(1);
        });
}

module.exports = { setupDatabase };