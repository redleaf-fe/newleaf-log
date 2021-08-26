module.exports = {
  appsKey: `_newleaf_log_apps_`,
  appLogKey(appId) {
    return `_newleaf_log_${appId}`;
  },
};
