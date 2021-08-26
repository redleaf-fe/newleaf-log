const createLog = require('./createLog');
const {appsKey, appLogKey} = require("../redisKey");

module.exports = async function (ctx) {
  const { conn, redis } = ctx;

  const apps = await redis.smembersAsync(appsKey);

  await Promise.all(
    apps.map(async (v) => {
      const tableName = `log_${v}`;
      const logKey = appLogKey(v);
      const data = await redis.smembersAsync(logKey);

      if(!data.length){
        return;
      }

      if (!conn.models[tableName]) {
        await createLog(conn, tableName);
      }

      await conn.models[tableName].bulkCreate(data.map(v => JSON.parse(v)));
      await redis.sremAsync(logKey, ...data);
    })
  );
};
