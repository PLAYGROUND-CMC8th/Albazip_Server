module.exports = (sequelize, DataTypes) => (
    sequelize.define('time', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        status: { //0: 매장 요일별 영업 //1: 포지션 요일별 근무
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        target_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        day: {
            type: DataTypes.STRING(1),
            allowNull: false
        },
        start_time: {
            type: DataTypes.STRING(5),
            allowNull: false
        },
        end_time: {
            type: DataTypes.STRING(5),
            allowNull: false
        }
    }, {
        timestamps: false,
        paranoid: false,
        tableName: 'time',
        charset: 'utf8'
    })
);