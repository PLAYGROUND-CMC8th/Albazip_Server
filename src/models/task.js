module.exports = (sequelize, DataTypes) => (
    sequelize.define('task', {
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
        status: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        content: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        target_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        completer_job: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        target_date: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'task',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);