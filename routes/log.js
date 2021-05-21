const Router = require('koa-router');

const router = new Router();

router.register(['/log'], ['GET', 'POST'], async (ctx) => {
  // referer
  // referer: DataTypes.STRING,

  const { method, query, body, headers, socket } = ctx.request;
  const time = new Date().getTime();

  const param = {
    ip: headers['x-forwarded-for'] || socket.remoteAddress,
    referer,
    time,
  };

  if ('GET' === method.toUpperCase()) {
    const { appId, content } = query;
    param.id = appId;
    param.content = content;
  } else if ('POST' === method.toUpperCase()) {
    const { appId, content } = body;
    param.id = appId;
    param.content = content;
  }
  if (ctx.cache[`${appId}`]) {
    ctx.cache[`${appId}`].push(param);
  } else {
    ctx.cache[`${appId}`] = [param];
  }
});

module.exports = router.routes();
