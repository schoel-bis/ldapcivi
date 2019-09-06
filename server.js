const ldap = require('ldapjs');

const { settings } = require('./src/settings');
const { bindHandler } = require('./src/bind');
const { searchHandler } = require('./src/search');

const server = ldap.createServer(settings.ldap);
server.bind(settings.ldap.basedn, bindHandler);
server.search('', searchHandler);
server.listen(settings.ldap.port, function() {
  console.log('LDAP server listening at %s', server.url);
});
