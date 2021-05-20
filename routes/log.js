const Router = require('koa-router');
const Schema = require('validate');

const { idGenerate, createUniq } = require('../services');
const { validate } = require('../utils');

const router = new Router();

// 应用名和git地址只支持英文
const schema = new Schema({
  appName: {
    type: String,
    required: true,
    length: { max: 20 },
    match: /^[a-zA-Z0-9-]+$/,
    message: {
      required: '应用名称必填',
      length: '应用名称不大于20字符',
      match: '应用名称只支持数字、英文、和-',
    },
  },
  git: {
    type: String,
    required: true,
    length: { max: 200 },
    match: /^[a-zA-Z0-9-]+$/,
    message: {
      required: 'git地址必填',
      length: 'git地址只支持数字、英文、和-',
    },
  },
});

router.get('/list', async (ctx) => {
  // todo: 搜索条件
  // const { user } = ctx.request.query;
  const res = await ctx.conn.models.user.findAll({
    attributes: ['appList'],
    where: { uid: ctx.uid },
  });

  if (res.length > 0) {
    const arr = [];
    // 查找appList表获取详情
    res[0].appList.split(',').forEach((v) => {
      if (v) {
        arr.push(
          ctx.conn.models.appList.findAll({
            attributes: ['appName', 'git', 'updatedAt'],
            where: { id: v },
          })
        );
      }
    });
    ctx.set('Content-Type', 'application/json');
    ctx.body = await Promise.all(arr).then((result) => {
      return result.map((v) => v[0]);
    });
  } else {
    ctx.body = JSON.stringify({ message: '未找到用户' });
  }
});

router.post('/save', async (ctx) => {
  const { appName, git, desc, id } = ctx.request.body;

  if (!validate({ ctx, schema, obj: { appName, git } })) {
    return;
  }

  // 编辑
  if (id) {
    const res = await ctx.conn.models.appList.findAll({
      attributes: ['id'],
      where: { id },
    });

    if (res.length > 0) {
      await ctx.conn.models.appList.update(
        {
          appName,
          desc,
          updater: ctx.uid,
          git,
        },
        {
          where: { id },
        }
      );

      ctx.body = JSON.stringify({ message: '保存成功' });
    } else {
      ctx.status = 400;
      ctx.body = JSON.stringify({ message: '未找到应用' });
    }
  } else {
    // 创建
    const appId = await idGenerate({
      ctx,
      modelName: 'appList',
      idName: 'id',
    });

    if (
      await createUniq({
        ctx,
        modelName: 'appList',
        queryKey: ['appName'],
        queryObj: { appName },
        repeatMsg: '应用名称已被使用',
        createObj: {
          appName,
          id: appId,
          desc,
          creator: ctx.uid,
          updater: ctx.uid,
          git,
        },
      })
    ) {
      // 在用户表的appList字段中添加新创建的应用
      const res = await ctx.conn.models.user.findAll({
        attributes: ['appList'],
        where: { uid: ctx.uid },
      });
      await ctx.conn.models.user.update(
        {
          appList: `${res[0].appList},${appId}`,
        },
        {
          where: { uid: ctx.uid },
        }
      );
      ctx.body = JSON.stringify({ message: '创建成功' });
    }
  }
});

module.exports = router.routes();
