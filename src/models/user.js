const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => (
    sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        phone: {
            type: DataTypes.STRING(11),
            allowNull: false,
            unique: true
        },
        pwd: {
            type: DataTypes.STRING(172),
            allowNull: false
        },
        salt: {
            type: DataTypes.STRING(88),
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        first_name: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        birthyear: {
            type: DataTypes.STRING(4),
            allowNull: false
        },
        gender: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        image_path: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue : 1
        },
        last_position: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        latest_access_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'user',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);