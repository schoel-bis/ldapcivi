const { defaultsDeepAll } = require('lodash/fp');

function loadConfig(cfgName) {
    if (cfgName) {
        console.log (`Using config file config/${cfgName}.js`);

        return defaultsDeepAll([
            require(`../config/${cfgName}`),
            require('../config/default'),
            {}
        ]);
    }

    console.log ('No setting param given. Using default configuration');
    return require('../config/default');
}

module.exports.loadConfig = loadConfig;
