const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name.');
  process.exit(1);
}

console.log(`Generating migration: ${migrationName}...`);
try {
  execSync(`npx sequelize-cli migration:generate --name ${migrationName}`, {
    stdio: 'inherit',
  });
} catch {
  console.error('Failed to generate migration.');
  process.exit(1);
}

const migrationsDir = path.resolve('sequelize', 'migrations');
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.js'));

files.sort((a, b) => b.localeCompare(a));

const latestFile = files[0];

if (!latestFile) {
  console.error('Could not find the generated migration file.');
  process.exit(1);
}

const filePath = path.join(migrationsDir, latestFile);

const content = `'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    if (process.argv.includes('--skip-execution')) {
      return console.log('⚠️  Skipping execution of migration ${latestFile} as requested.');      
    }

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
`;

fs.writeFileSync(filePath, content);

console.log(`\n✅ Successfully generated migration: ${latestFile}`);
console.log(`   (Includes check for --skip-execution flag)`);
