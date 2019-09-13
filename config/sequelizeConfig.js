require('dotenv').config();
const path = require('path');
const homedir = require('os').homedir();
const pjson = require('../package.json');

if (!process.env.NODE_ENV) {
    // Environment not set. Use the production.
    process.env.NODE_ENV = 'production';
}

const storagePath = process.env.SEQUELIZEDB ?
    process.env.SEQUELIZEDB :
    path.join(homedir, `.${pjson.name}rc`, process.env.NODE_ENV, 'system.db');

module.exports = {
    [process.env.NODE_ENV]: {
        database: 'origintrail',
        host: '127.0.0.1',
        port: 5433,
        dialect: 'postgres',
        username: 'postgres',
        password: 'root',
        storage: storagePath,
        migrationStorageTableName: 'sequelize_meta',
        logging: false,
        operatorsAliases: false,
        define: {
            underscored: true,
            timestamps: true,
        },
        retry: {
            match: [
                /SQLITE_BUSY/,
            ],
            name: 'query',
            max: 5,
        },
    },
};
