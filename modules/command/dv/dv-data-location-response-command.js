const Models = require('../../../models/index');
const Command = require('../command');

/**
 * Handles data location response.
 */
class DVDataLocationResponseCommand extends Command {
    constructor(ctx) {
        super(ctx);
        this.logger = ctx.logger;
        this.config = ctx.config;
        this.web3 = ctx.web3;
        this.remoteControl = ctx.remoteControl;
    }

    /**
     * Executes command and produces one or more events
     * @param command
     * @param transaction
     */
    async execute(command, transaction) {
        const {
            queryId,
            wallet,
            nodeId,
            imports,
            dataPrice,
            dataSize,
            stakeFactor,
            replyId,
        } = command.data;

        const networkQuery = await Models.network_queries.findOne({
            where: { id: queryId },
        });

        if (!networkQuery) {
            throw Error(`Didn't find query with ID ${queryId}.`);
        }

        // Store the offer if not stored so far.
        // TODO: Potential race condition here.
        let networkQueryResponse = await Models.network_query_responses.findOne({
            where: { query_id: queryId, reply_id: replyId },
        });

        if (!networkQueryResponse) {
            networkQueryResponse = await Models.network_query_responses.create({
                query_id: queryId,
                wallet,
                node_id: nodeId,
                data_set_ids: JSON.stringify(imports),
                data_price: dataPrice,
                stake_factor: stakeFactor,
                reply_id: replyId,
            });
        }

        // TODO: Fire socket notification for Houston
        this.logger.trace(`DH ${nodeId} in query ID ${queryId} and reply ID ${replyId} ` +
            `confirms possession of data imports: '${JSON.stringify(imports)}'`);

        if (!networkQueryResponse) {
            this.logger.error(`Failed to add query response. Reply ID ${replyId}.`);
            throw Error('Internal error.');
        }

        this.remoteControl.networkQueryOfferArrived({
            query: JSON.stringify(networkQuery.query),
            query_id: queryId,
            wallet,
            node_id: nodeId,
            imports: JSON.stringify(imports),
            data_size: dataSize,
            data_price: dataPrice,
            stake_factor: stakeFactor,
            reply_id: replyId,
        });

        return Command.empty();
    }

    /**
     * Builds default DVDataLocationResponseCommand
     * @param map
     * @returns {{add, data: *, delay: *, deadline: *}}
     */
    default(map) {
        const command = {
            name: 'dvDataLocationResponseCommand',
            delay: 0,
            deadline_at: Date.now() + (5 * 60 * 1000),
            transactional: false,
        };
        Object.assign(command, map);
        return command;
    }
}

module.exports = DVDataLocationResponseCommand;
