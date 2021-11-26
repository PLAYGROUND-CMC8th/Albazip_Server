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
        writer_job:{
            type: DataTypes.STRING(10),
            allowNull: false
        },
        pin: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        content: {
            type: DataTypes.STRING(500),
            allowNull: true
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