const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const BodyParser = require('koa-body');
const { Sequelize } = require('sequelize');
const redis = require("redis");
const { promisify } = require('util');

const config = require('./env.json');
const cacheWriteDatabase = require('./services/cacheWriteDatabase');

async function main() {
  const conn = new Sequelize({
    host: config.databaseHost,
    dialect: 'mysql',
    username: config.databaseUserName,
    password: config.databasePassword,
    port: config.databasePort,
    database: config.databaseName,
    define: {
      freezeTableName: true,
    },
  });

  try {
    await conn.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败：', error);
  }

  const client = redis.createClient({
    host: config.redisHost,
    port: config.redisPort,
  });
  redisPromisify(client);

  const app = new Koa();
  const router = new Router();

  app.context.redis = client;
  app.context.conn = conn;

  // 跨域配置
  app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'content-type');
    await next();
  });

  if(config.dev){
    app.use(Logger());
  }
  
  app.use(BodyParser());

  router.use(require('./log'));
  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = config.serverPort || 3000;
  app.listen(port);

  setInterval(() => {
    cacheWriteDatabase(app.context);
  }, config.writeInterval || 60000);
}

main();

function redisPromisify(client) {
  [
    // 
    'ttl', 'exists', 'del', 'expire',
    // string
    'get', 'set', 'mget', 'getset',
    // list
    'lpush', 'lpop', 'lindex', 'lrange', 'llen', 'lrem', 'rpush', 'rpop',
    // set
    'sadd', 'scard', 'smembers', 'sismember', 'srem',
    // hash
    'hset', 'hget', 'hgetall', 'hdel', 'hexists', 'hkeys', 'hvals', 'hlen', 'hmget', 'hmset'
  ]
  .forEach(v=>{
    client[`${v}Async`] = promisify(client[v]).bind(client);
  });
}