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

    await queryInterface.addColumn('files_metadata', 'parentId', {
      type: DataType.STRING,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addConstraint('files_metadata', {
      fields: ['parentId'],
      type: 'foreign key',
      name: 'fk_files_metadata_parentId',
      references: {
        table: 'files_metadata',
        field: 'fileId',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('files_metadata', 'fk_files_metadata_parentId');
    await queryInterface.removeColumn('files_metadata', 'parentId');
  }
};
