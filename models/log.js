const { DataTypes } = require('sequelize');

module.exports = (conn) => {
  return conn.define(
    'log',
    {
      // 应用唯一Id
      id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
      },
      // 内容
      content: DataTypes.STRING,
      // 来源
      ip: DataTypes.STRING(50),
      // referer
      referer: DataTypes.STRING,
      // time，因为先写入文件或缓存，所以这里不用updatedAt和createdAt
      time: DataTypes.STRING(20),
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  );
};
