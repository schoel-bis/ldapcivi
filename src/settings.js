const { loadConfig } = require('./load-config');

const settings = loadConfig(process.argv[2]);

module.exports.settings = settings;
