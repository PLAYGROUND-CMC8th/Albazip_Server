const path = require('path');
const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'dev';
const config = require(__dirname + '/../config/mysql.json')[env];
const db = {};

sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.user = require('./user')(sequelize, Sequelize);
db.manager = require('./manager')(sequelize, Sequelize);
db.worker = require('./worker')(sequelize, Sequelize);

db.shop = require('./shop')(sequelize, Sequelize);
db.position = require('./position')(sequelize, Sequelize);
db.task = require('./task')(sequelize, Sequelize);

db.board = require('./board')(sequelize, Sequelize);
db.board_image = require('./board_image')(sequelize, Sequelize);
db.comment = require('./comment')(sequelize, Sequelize);

db.schedule = require('./schedule')(sequelize, Sequelize);
db.time = require('./time')(sequelize, Sequelize);

/**
 * 다대다 관계 명시 및 테이블 선언부분
 */

// user 와 task
// db.user.hasMany(db.task, {
//     foreignKey: 'writer_id',
//     sourceKey: 'id',
//     onDelete: 'cascade'
// });
// db.task.belongsTo(db.user, {
//     foreignKey: 'writer_id',
//     targetKey: 'id'
// });

// user와 board
// db.user.hasMany(db.board, {
//     foreignKey: 'writer_id',
//     sourceKey: 'id',
//     onDelete: 'cascade'
// });
// db.board.belongsTo(db.user, {
//     foreignKey: 'writer_id',
//     targetKey: 'id'
// });

// user와 comment
// db.user.hasMany(db.comment, {
//     foreignKey: 'writer_id',
//     sourceKey: 'id',
//     onDelete: 'cascade'
// });
// db.comment.belongsTo(db.user, {
//     foreignKey: 'writer_id',
//     targetKey: 'id'
// });

// shop과 board
db.shop.hasMany(db.board, {
    foreignKey: 'shop_id',
    sourceKey: 'id',
    onDelete: 'cascade'
});
db.board.belongsTo(db.shop, {
    foreignKey: 'shop_id',
    targetKey: 'id'
});

// shop과 position
db.shop.hasMany(db.position, {
    foreignKey: 'shop_id',
    sourceKey: 'id',
    onDelete: 'cascade'
});
db.position.belongsTo(db.shop, {
    foreignKey: 'shop_id',
    targetKey: 'id'
});

// shop과 task
db.shop.hasMany(db.task, {
    foreignKey: 'shop_id',
    sourceKey: 'id',
    onDelete: 'cascade'
});
db.task.belongsTo(db.shop, {
    foreignKey: 'shop_id',
    targetKey: 'id'
});

// position과 schedule
db.position.hasMany(db.schedule, {
    foreignKey: 'position_id',
    sourceKey: 'id',
    onDelete: 'cascade'
});
db.schedule.belongsTo(db.position, {
    foreignKey: 'position_id',
    targetKey: 'id'
});

// board와 board_image
db.board.hasMany(db.board_image, {
    foreignKey: 'board_id',
    sourceKey: 'id',
    onDelete: 'cascade'
});
db.board_image.belongsTo(db.board, {
    foreignKey: 'board_id',
    targetKey: 'id'
});

// board와 comment
db.board.hasMany(db.comment, {
    foreignKey: 'board_id',
    sourceKey: 'id',
    onDelete: 'cascade'
});
db.comment.belongsTo(db.board, {
    foreignKey: 'board_id',
    targetKey: 'id'
});

// manager, shop과 user
db.shop.belongsToMany(db.user, {
    through: 'manager',
    foreignKey: 'shop_id',
    timestamps: false,
    paranoid: false,

});
db.user.belongsToMany(db.shop, {
    through: 'manager',
    foreignKey: 'user_id',
    timestamps: false,
    paranoid: false
});

// worker, position과 user
db.position.belongsToMany(db.user, {
    through: 'worker',
    foreignKey: 'position_id',
    timestamps: false,
    paranoid: false,

});
db.user.belongsToMany(db.position, {
    through: 'worker',
    foreignKey: 'user_id',
    timestamps: false,
    paranoid: false
});

module.exports = db;
