module.exports = (conn) => {
  return {
    log: require('./log')(conn),
  };
};
