'use strict';

const { DataType } = require('sequelize-typescript');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    if (process.argv.includes('--skip-execution')) {
      return console.log(
        '⚠️  Skipping execution of migration 20260130172011-test.js as requested.',
      );
    }

    await queryInterface.addColumn('users', 'hasAccess', {
      type: DataType.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'hasAccess');
  }
};
