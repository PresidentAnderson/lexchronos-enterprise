#!/usr/bin/env node

/**
 * Database Migration Script for LexChronos
 * @description Handles database migrations with proper error handling and rollback capabilities
 */

const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');
const crypto = require('crypto');

// Configuration
const config = require('../config');

class DatabaseMigrator {
  constructor() {
    this.client = null;
    this.migrationsPath = path.join(__dirname, '../database/migrations');
    this.seedersPath = path.join(__dirname, '../database/seeders');
    this.backupsPath = path.join(__dirname, '../database/backups');
  }

  async connect() {
    this.client = new Client(config.database);
    await this.client.connect();
    console.log('✅ Connected to database');
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log('✅ Disconnected from database');
    }
  }

  async createMigrationsTable() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time INTEGER, -- milliseconds
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        rollback_sql TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_filename ON migrations(filename);
      CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON migrations(executed_at);
      CREATE INDEX IF NOT EXISTS idx_migrations_success ON migrations(success);
    `);
  }

  async getExecutedMigrations() {
    const result = await this.client.query(`
      SELECT filename, checksum, executed_at, success 
      FROM migrations 
      ORDER BY executed_at ASC
    `);
    return result.rows;
  }

  async getPendingMigrations() {
    const files = await fs.readdir(this.migrationsPath);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    const executed = await this.getExecutedMigrations();
    const executedFilenames = new Set(executed.map(m => m.filename));

    const pending = [];
    for (const file of migrationFiles) {
      if (!executedFilenames.has(file)) {
        const content = await fs.readFile(path.join(this.migrationsPath, file), 'utf8');
        const checksum = this.calculateChecksum(content);
        pending.push({ filename: file, content, checksum });
      } else {
        // Verify checksum for executed migrations
        const executedMigration = executed.find(m => m.filename === file);
        const content = await fs.readFile(path.join(this.migrationsPath, file), 'utf8');
        const currentChecksum = this.calculateChecksum(content);
        
        if (executedMigration.checksum !== currentChecksum) {
          console.warn(`⚠️  Warning: Migration ${file} has been modified after execution`);
          console.warn(`   Original checksum: ${executedMigration.checksum}`);
          console.warn(`   Current checksum:  ${currentChecksum}`);
        }
      }
    }

    return pending;
  }

  calculateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async executeMigration(migration) {
    console.log(`🔄 Executing migration: ${migration.filename}`);
    
    const startTime = Date.now();
    let success = true;
    let errorMessage = null;

    try {
      // Begin transaction for migration
      await this.client.query('BEGIN');

      // Execute the migration SQL
      await this.client.query(migration.content);

      // Record successful migration
      const executionTime = Date.now() - startTime;
      await this.client.query(`
        INSERT INTO migrations (filename, checksum, execution_time, success)
        VALUES ($1, $2, $3, $4)
      `, [migration.filename, migration.checksum, executionTime, true]);

      await this.client.query('COMMIT');
      console.log(`✅ Migration ${migration.filename} completed successfully (${executionTime}ms)`);

    } catch (error) {
      await this.client.query('ROLLBACK');
      success = false;
      errorMessage = error.message;

      // Record failed migration
      const executionTime = Date.now() - startTime;
      await this.client.query(`
        INSERT INTO migrations (filename, checksum, execution_time, success, error_message)
        VALUES ($1, $2, $3, $4, $5)
      `, [migration.filename, migration.checksum, executionTime, false, errorMessage]);

      console.error(`❌ Migration ${migration.filename} failed:`, error.message);
      throw error;
    }
  }

  async runMigrations(options = {}) {
    const { dryRun = false, target = null } = options;

    console.log('🚀 Starting database migration...');
    
    if (dryRun) {
      console.log('📋 DRY RUN MODE - No changes will be made');
    }

    await this.createMigrationsTable();
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('✅ Database is up to date - no pending migrations');
      return;
    }

    console.log(`📝 Found ${pending.length} pending migration(s):`);
    pending.forEach(m => console.log(`   - ${m.filename}`));

    if (dryRun) {
      console.log('📋 Dry run completed - migrations would be executed in this order');
      return;
    }

    // Execute migrations
    let executedCount = 0;
    for (const migration of pending) {
      if (target && migration.filename > target) {
        console.log(`🔄 Stopping at target: ${target}`);
        break;
      }

      await this.executeMigration(migration);
      executedCount++;
    }

    console.log(`✅ Successfully executed ${executedCount} migration(s)`);
  }

  async rollbackMigration(filename) {
    console.log(`🔄 Rolling back migration: ${filename}`);

    try {
      const result = await this.client.query(`
        SELECT rollback_sql FROM migrations 
        WHERE filename = $1 AND success = true
        ORDER BY executed_at DESC LIMIT 1
      `, [filename]);

      if (result.rows.length === 0) {
        throw new Error(`No successful migration found for: ${filename}`);
      }

      const rollbackSql = result.rows[0].rollback_sql;
      if (!rollbackSql) {
        throw new Error(`No rollback SQL available for migration: ${filename}`);
      }

      await this.client.query('BEGIN');
      await this.client.query(rollbackSql);
      
      // Mark migration as rolled back
      await this.client.query(`
        UPDATE migrations 
        SET success = false, error_message = 'Rolled back manually'
        WHERE filename = $1
      `, [filename]);

      await this.client.query('COMMIT');
      console.log(`✅ Migration ${filename} rolled back successfully`);

    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error(`❌ Rollback failed:`, error.message);
      throw error;
    }
  }

  async getMigrationStatus() {
    await this.createMigrationsTable();
    
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();

    console.log('\n📊 Migration Status:');
    console.log('==================');
    
    if (executed.length > 0) {
      console.log('\n✅ Executed Migrations:');
      executed.forEach(m => {
        const status = m.success ? '✅' : '❌';
        console.log(`   ${status} ${m.filename} (${m.executed_at})`);
        if (!m.success && m.error_message) {
          console.log(`      Error: ${m.error_message}`);
        }
      });
    }

    if (pending.length > 0) {
      console.log('\n⏳ Pending Migrations:');
      pending.forEach(m => console.log(`   📄 ${m.filename}`));
    } else {
      console.log('\n✅ All migrations are up to date');
    }

    return { executed: executed.length, pending: pending.length };
  }

  async seedDatabase() {
    console.log('🌱 Seeding database...');

    try {
      const files = await fs.readdir(this.seedersPath);
      const seedFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (seedFiles.length === 0) {
        console.log('📝 No seed files found');
        return;
      }

      for (const file of seedFiles) {
        console.log(`🌱 Running seeder: ${file}`);
        const content = await fs.readFile(path.join(this.seedersPath, file), 'utf8');
        
        await this.client.query('BEGIN');
        await this.client.query(content);
        await this.client.query('COMMIT');
        
        console.log(`✅ Seeder ${file} completed`);
      }

      console.log(`✅ Database seeding completed (${seedFiles.length} seeders)`);

    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error('❌ Database seeding failed:', error.message);
      throw error;
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupsPath, `backup_${timestamp}.sql`);

    console.log(`💾 Creating database backup: ${backupFile}`);

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupsPath, { recursive: true });

      // Get database name from connection string
      const dbName = config.computed.databaseName || 'lexchrono';

      // Use pg_dump to create backup
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const pgDump = spawn('pg_dump', [
          config.database.url,
          '--no-password',
          '--verbose',
          '--clean',
          '--if-exists',
          '--create',
          '--file', backupFile
        ]);

        pgDump.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ Backup created successfully: ${backupFile}`);
            resolve(backupFile);
          } else {
            reject(new Error(`pg_dump exited with code ${code}`));
          }
        });

        pgDump.on('error', (error) => {
          reject(new Error(`pg_dump error: ${error.message}`));
        });
      });

    } catch (error) {
      console.error('❌ Backup creation failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const [,, command, ...args] = process.argv;
  const migrator = new DatabaseMigrator();

  try {
    await migrator.connect();

    switch (command) {
      case 'up':
      case 'migrate':
        const target = args.find(arg => arg.startsWith('--target='))?.split('=')[1];
        const dryRun = args.includes('--dry-run');
        await migrator.runMigrations({ target, dryRun });
        break;

      case 'down':
      case 'rollback':
        const filename = args[0];
        if (!filename) {
          throw new Error('Please specify migration filename to rollback');
        }
        await migrator.rollbackMigration(filename);
        break;

      case 'status':
        await migrator.getMigrationStatus();
        break;

      case 'seed':
        await migrator.seedDatabase();
        break;

      case 'backup':
        await migrator.createBackup();
        break;

      case 'fresh':
        console.log('🔄 Fresh migration: creating backup first...');
        await migrator.createBackup();
        console.log('🔄 Running all migrations...');
        await migrator.runMigrations();
        await migrator.seedDatabase();
        break;

      default:
        console.log(`
Database Migration Tool for LexChronos

Usage: node migrate.js <command> [options]

Commands:
  up, migrate     Run pending migrations
  down, rollback  Rollback specific migration
  status          Show migration status
  seed            Run database seeders
  backup          Create database backup
  fresh           Backup, migrate, and seed

Options:
  --dry-run       Show what would be migrated without executing
  --target=FILE   Migrate up to specific file

Examples:
  node migrate.js up
  node migrate.js up --dry-run
  node migrate.js up --target=002_create_posts.sql
  node migrate.js down 001_create_users.sql
  node migrate.js status
  node migrate.js fresh
        `);
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await migrator.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseMigrator;