const path = require('path');
const config = require('../config/redis.json');
const redis = require('redis');
//const redisConfig = require(path.join( config.CONFIG_PATH, "redis.json"))[config.NODE_ENV];
const client  = redis.createClient(config);

client.connect();
client.on('connect', () => {
    console.log('redis connection success');
});

module.exports = {

    getRedisClient: () => {
        return client;
    },

    set: async(key, value) => {
        await client.set(key, value, redis.print);
    },

    get:  async(key) => {
        var result = await client.get(key, redis.print);
        return result;
    },

    del: async(key) => {
        await client.del(key);
    },

    delAll: async() => {
        await client.flushDb();
    }
}