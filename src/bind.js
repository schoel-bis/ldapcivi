const { settings } = require('./settings');

function bindHandler(req, res, next) {
    const username = req.dn.toString(),
    password = req.credentials;

    if (!req.dn.equals(`cn=root,${settings.ldap.basedn}`) || password !== settings.ldap.password ) {
        console.log ('invalid password');
        return next(new ldap.InvalidCredentialsError());
    }

    res.end();
    return next();
}

module.exports.bindHandler = bindHandler;
