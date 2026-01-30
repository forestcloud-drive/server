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

    await queryInterface.addColumn('users', 'mustChangePassword', {
      type: DataType.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'mustChangePassword');
  }
};
