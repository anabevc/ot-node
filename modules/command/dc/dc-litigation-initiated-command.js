const Command = require('../command');
const Utilities = require('../../Utilities');
const Models = require('../../../models/index');

/**
 * Repeatable command that checks whether litigation is successfully initiated
 */
class DcLitigationInitiatedCommand extends Command {
    constructor(ctx) {
        super(ctx);
        this.logger = ctx.logger;
    }

    /**
     * Executes command and produces one or more events
     * @param command
     */
    async execute(command) {
        const {
            offerId,
            dhIdentity,
            objectIndex,
            blockIndex,
        } = command.data;

        const events = await Models.events.findAll({
            where: {
                event: 'LitigationInitiated',
                finished: 0,
            },
        });
        if (events) {
            const event = events.find((e) => {
                const {
                    offerId: eventOfferId,
                    holderIdentity,
                    requestedObjectIndex,
                    requestedBlockIndex,
                } = JSON.parse(e.data);
                return Utilities.compareHexStrings(offerId, eventOfferId)
                    && Utilities.compareHexStrings(dhIdentity, holderIdentity)
                    && objectIndex === parseInt(requestedObjectIndex, 10)
                    && blockIndex === parseInt(requestedBlockIndex, 10);
            });
            if (event) {
                event.finished = true;
                await event.save({ fields: ['finished'] });

                this.logger.important(`Litigation initiated for DH ${dhIdentity} and offer ${offerId}.`);

                const offer = await Models.offers.findOne({
                    where: { offer_id: offerId },
                });
                return {
                    commands: [
                        {
                            data: {
                                offerId,
                                dhIdentity,
                                objectIndex,
                                blockIndex,
                            },
                            name: 'dcLitigationAnsweredCommand',
                            period: 5000,
                            deadline_at: Date.now() +
                                            (offer.litigation_interval_in_minutes * 60 * 1000),
                        },
                    ],
                };
            }
        }
        return Command.repeat();
    }

    /**
     * Builds default AddCommand
     * @param map
     * @returns {{add, data: *, delay: *, deadline: *}}
     */
    default(map) {
        const command = {
            name: 'dcLitigationInitiatedCommand',
            delay: 0,
            period: 5000,
            deadline_at: Date.now() + (5 * 60 * 1000),
            transactional: false,
        };
        Object.assign(command, map);
        return command;
    }
}

module.exports = DcLitigationInitiatedCommand;
