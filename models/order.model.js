const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true }, // nullable: order dari chat AI belum tentu ada userId login
    buyerName: { type: DataTypes.STRING, allowNull: false },
    totalAmount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  },
  { tableName: 'orders', timestamps: true }
);

module.exports = Order;