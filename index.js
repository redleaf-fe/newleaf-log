const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const BodyParser = require('koa-body');
const { Sequelize } = require('sequelize');

const config = require('./env.json');
const cacheWriteDatabase = require('./services/cacheWriteDatabase');

// 日志缓存
const cache = {};

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

  const app = new Koa();
  const router = new Router();

  app.context.cache = cache;
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

  require('./routes')(router);

  app.use(router.routes());
  app.use(router.allowedMethods());

  // 每分钟写数据库
  setInterval(() => {
    cacheWriteDatabase(app.context);
  }, config.writeInterval);

  const port = config.serverPort || 3000;
  app.listen(port);
}

main();
