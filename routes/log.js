const Router = require('koa-router');
const querystring = require('querystring');
const router = new Router();

router.register(['/log'], ['GET', 'POST'], async (ctx) => {
  const { method, query, body, headers, socket } = ctx.request;
  const time = new Date().getTime();

  const param = {
    ip: headers['x-forwarded-for'] || socket.remoteAddress,
    referer: headers['referer'] || '',
    ua: headers['user-agent'] || '',
    time,
  };

  let appId, content;

  if ('GET' === method.toUpperCase()) {
    appId = query.appId;
    content = query.content;
  } else if ('POST' === method.toUpperCase()) {
    if (headers['content-type'].includes('text/plain')) {
      const _body = querystring.parse(body);
      appId = _body.appId;
      content = _body.content;
    } else if (headers['content-type'].includes('application/json')) {
      appId = body.appId;
      content = body.content;
    }
  }

  param.content = content;

  if (ctx.cache[`${appId}`]) {
    ctx.cache[`${appId}`].push(param);
  } else {
    ctx.cache[`${appId}`] = [param];
  }

  ctx.body = 'ok';
});

router.get('/get', async (ctx) => {
  const { query } = ctx.request;
  const { datetime, appId } = query || {};

  const tableName = `log_${appId}`;

  if (ctx.conn.models[tableName]) {
    const res = await ctx.conn.models[tableName].findAll();
    ctx.body = res;
  } else {
    ctx.body = JSON.stringify({ message: '日志尚未初始化', errCode: 1001 });
  }
});

module.exports = router.routes();
