module.exports = (sequelize, DataTypes) => (
    sequelize.define('schedule', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        worker_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        shop_id:{
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
        start_time: {
            type: DataTypes.STRING(5),
            allowNull: false
        },
        end_time: {
            type: DataTypes.STRING(5),
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        real_start_time: {
            type: DataTypes.STRING(5),
            allowNull: true
        },
        real_end_time: {
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