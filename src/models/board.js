module.exports = (sequelize, DataTypes) => (
    sequelize.define('board', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        shop_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        writer_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        content: {
            type: DataTypes.STRING(200),
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'board',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);