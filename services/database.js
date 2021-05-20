const createModels = require('../models');

module.exports = {
  async initDatabase(conn) {
    createModels(conn);
    return await conn.sync({ alter: true });
  },
};
