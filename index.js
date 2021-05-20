const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const BodyParser = require('koa-body');
const { Sequelize } = require('sequelize');

const config = require('./env.json');
const pkg = require('./package.json');
const { Database } = require('./services');
const { FragmentMiddleware } = require('./middlewares');

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

  try {
    await Database.initDatabase(conn);
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败：', error);
  }

  const app = new Koa();
  const router = new Router();

  app.context.conn = conn;

  // 跨域配置
  app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'content-type');
    await next();
  });
  app.use(Logger());
  app.use(BodyParser());

  app.use(FragmentMiddleware);

  require('./routes')(router);

  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = pkg.port || 3000;
  app.listen(port);
}

main();
