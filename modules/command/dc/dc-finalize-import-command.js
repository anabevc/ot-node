const fs = require('fs');
const Command = require('../command');
const Models = require('../../../models');
const Utilities = require('../../Utilities');

class DcFinalizeImport extends Command {
    constructor(ctx) {
        super(ctx);
        this.logger = ctx.logger;
        this.remoteControl = ctx.remoteControl;
        this.config = ctx.config;
        this.notifyError = ctx.notifyError;
    }

    /**
     * Executes command and produces one or more events
     * @param command
     */
    async execute(command) {
        const {
            error,
            handler_id,
            data_set_id,
            data_provider_wallet,
            purchased,
            documentPath,
            root_hash,
            data_hash,
            otjson_size_in_bytes,
            total_documents,
        } = command.data;

        await Utilities.deleteDirectory(documentPath);

        if (error) {
            await this._processError(error, handler_id, documentPath);
            return Command.empty();
        }

        try {
            const import_timestamp = new Date();
            this.remoteControl.importRequestData();
            await Models.data_info.create({
                data_set_id,
                root_hash,
                data_provider_wallet: data_provider_wallet || this.config.node_wallet,
                import_timestamp,
                total_documents,
                origin: purchased ? 'PURCHASED' : 'IMPORTED',
                otjson_size_in_bytes,
                data_hash,
            }).catch(async (error) => {
                this.logger.error(error);
                this.notifyError(error);
                await Models.handler_ids.update(
                    {
                        status: 'FAILED',
                        data: JSON.stringify({
                            error,
                        }),
                    },
                    {
                        where: {
                            handler_id,
                        },
                    },
                );
                this.remoteControl.importFailed(error);
            });

            await Models.handler_ids.update(
                {
                    status: 'COMPLETED',
                    data: JSON.stringify({
                        dataset_id: data_set_id,
                        import_time: import_timestamp.valueOf(),
                        otjson_size_in_bytes,
                        root_hash,
                        data_hash,
                    }),
                },
                {
                    where: {
                        handler_id,
                    },
                },
            );

            this.logger.info('Import complete');
            this.logger.info(`Root hash: ${root_hash}`);
            this.logger.info(`Data set ID: ${data_set_id}`);
            this.remoteControl.importSucceeded();
        } catch (error) {
            this.logger.error(`Failed to register import. Error ${error}.`);
            this.notifyError(error);
            await Models.handler_ids.update(
                {
                    status: 'FAILED',
                    data: JSON.stringify({
                        error,
                    }),
                },
                {
                    where: {
                        handler_id,
                    },
                },
            );
            this.remoteControl.importFailed(error);
        }
        return Command.empty();
    }

    /**
     * Builds default dcFinalizeImportCommand
     * @param map
     * @returns {{add, data: *, delay: *, deadline: *}}
     */
    default(map) {
        const command = {
            name: 'dcFinalizeImportCommand',
            delay: 0,
            transactional: false,
        };
        Object.assign(command, map);
        return command;
    }

    async _processError(error, handlerId, documentPath) {
        this.logger.error(error.message);
        await Models.handler_ids.update(
            {
                status: 'FAILED',
                data: JSON.stringify({
                    error: error.message,
                }),
            },
            {
                where: {
                    handler_id: handlerId,
                },
            },
        );
        this.remoteControl.importFailed(error);

        if (error.type !== 'ImporterError') {
            this.notifyError(error);
        }
    }
}

module.exports = DcFinalizeImport;
