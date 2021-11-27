module.exports = (sequelize, DataTypes) => (
    sequelize.define('worker', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        position_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        shop_name: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        position_title: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        user_first_name: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        image_path: {
            type: DataTypes.STRING(200),
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'worker',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);