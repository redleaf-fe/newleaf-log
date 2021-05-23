const { DataTypes } = require('sequelize');

module.exports = async function (ctx) {
  const { conn, cache } = ctx;

  const apps = Object.keys(cache);

  await Promise.all(
    apps.map(async (v) => {
      const tableName = `log_${v}`;

      if (!conn.models[tableName]) {
        conn.define(
          tableName,
          {
            // 内容
            content: DataTypes.STRING,
            // 来源
            ip: DataTypes.STRING(50),
            // referer
            referer: DataTypes.STRING,
            // time，因为先写入文件或缓存，所以这里不用updatedAt和createdAt
            time: DataTypes.STRING(15),
          },
          {
            createdAt: false,
            updatedAt: false,
          }
        );
        await conn.sync({ alter: true });
      }

      const promise = await conn.models[tableName].bulkCreate(cache[v]);
      delete ctx.cache[v];

      return promise;
    })
  );
};
