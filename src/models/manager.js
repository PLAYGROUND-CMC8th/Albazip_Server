module.exports = (sequelize, DataTypes) => (
    sequelize.define('manager', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        shop_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        shop_name: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        user_first_name: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        user_last_name: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        image_path: {
            type: DataTypes.STRING(200),
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'manager',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);