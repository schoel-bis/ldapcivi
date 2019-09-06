const settings = {
    ldap: {
        basedn: 'dc=yoursite, dc=org', // "cn=root" another alternative
        SUFFIX: 'dc=yoursite, dc=org', //base search. If not defined basedn. If unsure, make the same as above.
        company: 'Your site',
        port: 1389, // 389 is the ldap port, but needs to run as root (priviledged port
        password: 'you need to override it',
        enabled: false // Set this to true
    },

    civicrm: {
        server: 'http://www.example.org',
        path: '/sites/all/modules/civicrm/extern/rest.php',
        api_key: 'your api key',
        key: 'your site key',
        // "Drupal", "Joomla", or "WordPress"
        cms: 'Drupal',

        action: 'getttpquick'
        //  action: 'get' you can use get if you don't install the extension eu.tttp.qlookup
    }
};

module.exports = settings;
