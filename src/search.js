const ldap = require('ldapjs');

const { settings } = require('./settings');
var crmAPI = require('civicrm')(settings.civicrm);

const CIVI_CN_PREFIX = 'civi_';

function formatContact(contact) {
    const propertiesMap = {
        'mail': 'email',
        'givenname': 'first_name',
        'sn': 'last_name',
        'title': 'job_title',
        'co': 'country',
        'l': 'city',
        'st': 'state_province',
        'street': 'street_address',
        'postaladdress': 'street_address',
        'postalcode': 'postal_code',
        'telephonenumber': 'phone',
        'o': 'current_employer',
        'company': 'current_employer',
        'displayName': 'display_name',
    };

    const contactUrl =
          settings.civicrm.cms === 'Joomla' ? `${settings.civicrm.server}/administrator/?option=com_civicrm&task=civicrm/contact/view&reset=1&cid=${contact.id}`
        : settings.civicrm.cms === 'WordPress' ? `${settings.civicrm.server}/wp-admin/admin.php?page=CiviCRM&q=civicrm/contact/view&reset=1&cid=${contact.id}`
        : `${settings.civicrm.server}/civicrm/contact/view?reset=1&cid=${contact.id}`;

    var ldapAttributes = Object
        .keys(propertiesMap)
        .reduce(
            (acc, ldapKey) => {
                const civiKey = propertiesMap[ldapKey];
                if (typeof contact[civiKey] !== 'undefined') {
                    acc[ldapKey] = contact[civiKey];
                }

                return acc;
            },
            {
                objectClass: ["top", "inetOrgPerson", "person"],
                cn: contact.sort_name,
                homeurl: contactUrl
            }
        );

    if (contact['supplemental_address_1']) {
        ldapAttributes['postaladdress'] += `, ${contact['supplemental_address_1']}`;
    }

    if (contact["supplemental_address_2"]) {
        ldapAttributes['postaladdress'] += `, ${contact['supplemental_address_2']}`;
    }

    ldapAttributes['info'] = `CiviCRM contact record: ${contactUrl}`;

    return {
        dn: `cn=${CIVI_CN_PREFIX}${contact.id},${settings.ldap.basedn}`,
        attributes: ldapAttributes
    };
}

async function civicrmContactSearch (name, params) {
    console.log (`searching for contact "${name}"…`);

    return new Promise((resolve, reject) => {
        const sortingParams = { ...params, sort_name: name };

        crmAPI.call (
            'contact',
            settings.civicrm.action,
            sortingParams,
            function (data) {
                if (data.is_error) {
                    reject(data);
                } else {
                    resolve(data.values);
                }

            }
        );
    });
}

function searchHandler(req, res, next) {
    const noimpl = {
        dn: req.dn.toString(),
        attributes: { objectclass: ['inetOrgPerson', 'top'], o: 'Tech To The People', mail: 'sponsor.ldap@tttp.eu', cn: 'Not Implemented' }
    };

    const params = {
        contact_type: 'Individual',
        return: 'display_name,sort_name,first_name,last_name,email,title,organization_name,current_employer,job_title,phone,street_address,supplemental_address_1,city,state_province,postal_code,country',
        'option.limit' : req.sizeLimit,
    };

    const dn = req.dn.toString();
    const query = req.filter.json;
    console.log(`query DN = ${dn} ${req.scope} / ${query.type}`);

    if (req.scope !== 'sub') {
        console.warn(`NOT implemented ${req.scope} ${query.type}`);
        res.send(noimpl);
        res.end();
        return next();
    }

    const match = req.filter.toString().match(/\(\w.?=\*?([^\)]*?)\*\)/);

    if (!match) {
        console.log('Invalid query format. Make sure it has no spaces and correct use of parenthesis. It should match: /\\(\\w.?=\\*?([^\\)]*?)\\*\\)/');
        return next(new ldap.NoSuchAttributeError('invalid query format'));
    }

    const address = match && match[1] || '';

    console.log (`${req.filter.toString()} -> searching ${query.type} for ${address}`);

    civicrmContactSearch(address, params)
        .then(
            contacts => {
                contacts
                    .map(formatContact)
                    .forEach(contact => res.send(contact))

                res.end();
                return next();
            },
            error => {
                console.error('civicrmContactsSearch', error);
                return next(new ldap.OperationsError(error && error.error_message));
            }
        );
}

module.exports.searchHandler = searchHandler;
