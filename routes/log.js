const Router = require('koa-router');
const querystring = require('querystring');
const { Op } = require('sequelize');
const createLog = require('../services/createLog');

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

  let appId, content, type;

  if ('GET' === method.toUpperCase()) {
    appId = query.appId;
    content = query.content;
    type = query.type;
  } else if ('POST' === method.toUpperCase()) {
    if (headers['content-type'].includes('text/plain')) {
      const _body = querystring.parse(body);
      appId = _body.appId;
      content = _body.content;
      type = _body.type;
    } else if (headers['content-type'].includes('application/json')) {
      appId = body.appId;
      content = body.content;
      type = body.type;
    }
  }

  param.content = content;
  param.type = type;

  if (ctx.cache[`${appId}`]) {
    ctx.cache[`${appId}`].push(param);
  } else {
    ctx.cache[`${appId}`] = [param];
  }

  ctx.body = 'ok';
});

router.get('/get', async (ctx) => {
  const { query } = ctx.request;
  const {
    startTime = '',
    endTime = '',
    currentPage = 1,
    pageSize = 10,
    like = '',
    type = '',
    appId,
  } = query || {};

  if (!appId) {
    ctx.body = JSON.stringify({ message: '缺少AppId' });
    return;
  }

  const tableName = `log_${appId}`;

  if (!ctx.conn.models[tableName]) {
    await createLog(ctx.conn, tableName);
  }

  const timeFilter = {};
  if (startTime) {
    timeFilter[Op.gte] = startTime;
  }
  if (endTime) {
    timeFilter[Op.lte] = endTime;
  }

  const filter = {
    [Op.and]: [
      {
        time: {
          [Op.and]: timeFilter,
        },
      },
    ],
  };

  if (like) {
    filter[Op.and].push({ content: { [Op.like]: `%${like}%` } });
  }

  if (type) {
    filter[Op.and].push({ type: { [Op.eq]: type } });
  }

  const res = await ctx.conn.models[tableName].findAndCountAll({
    where: filter,
    offset: pageSize * (currentPage - 1),
    limit: pageSize,
  });
  ctx.body = res;
});

module.exports = router.routes();
