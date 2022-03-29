module.exports = (sequelize, DataTypes) => (
    sequelize.define('shop', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        type: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        address: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        owner_name: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        register_number: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true
        },
        start_time: {
            type: DataTypes.STRING(5),
            allowNull: false
        },
        end_time: {
            type: DataTypes.STRING(5),
            allowNull: false
        },
        holiday: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        payday: {
            type: DataTypes.STRING(2),
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'shop',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);