module.exports = (sequelize, DataTypes) => (
    sequelize.define('report', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        job: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER, //0: 공지사항 1: 게시글
            allowNull: false
        },
        target_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        reason: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        reporter_job: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'report',
        charset: 'utf8',
        createdAt: 'register_date'
    })
);