const createLog = require('./createLog');

module.exports = async function (ctx) {
  const { conn, cache } = ctx;

  const apps = Object.keys(cache);

  await Promise.all(
    apps.map(async (v) => {
      const tableName = `log_${v}`;

      if (!conn.models[tableName]) {
        await createLog(conn, tableName);
      }

      const promise = await conn.models[tableName].bulkCreate(cache[v]);
      delete ctx.cache[v];

      return promise;
    })
  );
};
