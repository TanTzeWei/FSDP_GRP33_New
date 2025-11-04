module.exports = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    trustServerCertificate: true,
    options: {
      // Use provided DB_PORT or default to 1433 (standard SQL Server port)
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
      connectionTimeout: 60000, // Connection timeout in milliseconds
    },
  };