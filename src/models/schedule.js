module.exports = (sequelize, DataTypes) => (
    sequelize.define('schedule', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        position_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        year: {
            type: DataTypes.STRING(4),
            allowNull: false
        },
        month: {
            type: DataTypes.STRING(2),
            allowNull: false
        },
        day: {
            type: DataTypes.STRING(2),
            allowNull: false
        },
        time: {
            type: DataTypes.STRING(11),
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        start_time: {
            type: DataTypes.STRING(5),
            allowNull: true
        },
        end_time: {
            type: DataTypes.STRING(5),
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'schedule',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);