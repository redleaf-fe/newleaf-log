const { DataTypes } = require('sequelize');

module.exports = async function (conn, tableName) {
  conn.define(
    tableName,
    {
      // 内容
      content: DataTypes.STRING,
      // 来源
      ip: DataTypes.STRING(50),
      referer: DataTypes.STRING,
      ua: DataTypes.STRING,
      // time，因为先写入文件或缓存，所以这里不用updatedAt和createdAt
      time: DataTypes.STRING(15),
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  );
  await conn.sync({ alter: true });
};
