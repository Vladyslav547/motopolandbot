const { MESSAGES } = require('../utils/constants');

function registerStartHandler(bot, { draftService }) {
  bot.start(async (ctx) => {
    await draftService.resetDraft(ctx.from.id);
    await ctx.reply(MESSAGES.START);
  });
}

module.exports = {
  registerStartHandler
};
