module.exports = (sequelize, DataTypes) => (
    sequelize.define('position', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        shop_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
            unique: true
        },
        title: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        rank: {
            type: DataTypes.STRING(10),
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'position',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'

    })
);