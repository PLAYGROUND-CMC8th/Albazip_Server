module.exports = (sequelize, DataTypes) => (
    sequelize.define('board_image', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        board_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        image_path: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: false,
        tableName: 'board_image',
        charset: 'utf8',
        createdAt: 'register_date',
        updatedAt: 'update_date'
    })
);