const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function backupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portfolio_management'
  });

  try {
    console.log('🗄️  5 Star General Database Backup Starting...');
    console.log('================================================');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupDir, `portfolio_backup_${timestamp}.sql`);
    
    // Create backup directory if it doesn't exist
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    let sqlDump = '';
    
    // Get all table names
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📊 Found ${tableNames.length} tables to backup...`);
    
    // Add header to SQL dump
    sqlDump += `-- 5 Star General Portfolio Management Database Backup\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: ${process.env.DB_NAME || 'portfolio_management'}\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    // Backup each table
    for (const tableName of tableNames) {
      console.log(`  📋 Backing up table: ${tableName}`);
      
      // Get table structure
      const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      sqlDump += `-- Table structure for ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += `${createTable[0]['Create Table']};\n\n`;
      
      // Get table data
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        sqlDump += `-- Data for table ${tableName}\n`;
        sqlDump += `INSERT INTO \`${tableName}\` VALUES\n`;
        
        const values = [];
        for (const row of rows) {
          const rowValues = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return value;
          });
          values.push(`(${rowValues.join(', ')})`);
        }
        
        sqlDump += values.join(',\n') + ';\n\n';
        console.log(`    ✅ ${rows.length} rows backed up`);
      } else {
        console.log(`    ℹ️  No data to backup`);
      }
    }
    
    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    
    // Write backup file
    await fs.writeFile(backupFile, sqlDump, 'utf8');
    
    console.log('');
    console.log('🎯 BACKUP COMPLETED SUCCESSFULLY!');
    console.log('==================================');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Total tables backed up: ${tableNames.length}`);
    
    const stats = await fs.stat(backupFile);
    console.log(`📏 Backup file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    await connection.end();
    return backupFile;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Export the function
module.exports = { backupDatabase };

// Run if called directly
if (require.main === module) {
  backupDatabase().catch(console.error);
}
