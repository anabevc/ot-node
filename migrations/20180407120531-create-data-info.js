
module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable('data_info', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
        },
        data_set_id: {
            allowNull: false,
            type: Sequelize.STRING,
            unique: true,
        },
        data_provider_wallet: {
            allowNull: false,
            type: Sequelize.STRING,
        },
        total_documents: {
            allowNull: false,
            type: Sequelize.INTEGER,
        },
        root_hash: {
            allowNull: false,
            type: Sequelize.STRING,
        },
        import_timestamp: {
            allowNull: false,
            type: Sequelize.DATE,
        },
        data_size: {
            allowNull: false,
            type: Sequelize.INTEGER,
        },
        origin: {
            allowNull: false,
            type: Sequelize.STRING,
        },
    }),
    down: (queryInterface, Sequelize) => queryInterface.dropTable('data_infos'),
};
