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
            type: DataTypes.STRING(20),
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
        },
        salary: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        salary_type: { //0: 시급, 1: 주급, 2: 월급
            type: DataTypes.INTEGER,
            allowNull: false
        },
        work_day: {
            type: DataTypes.STRING(20),
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
        work_time: {
            type: DataTypes.STRING(5),
            allowNull: false
        },
        break_time: {
            type: DataTypes.STRING(5),
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