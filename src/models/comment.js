module.exports = (sequelize, DataTypes) => (
    sequelize.define('comment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        board_id:{
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
        comment_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        content: {
            type: DataTypes.STRING(100),
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'comment',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);