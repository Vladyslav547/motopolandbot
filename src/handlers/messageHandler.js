const { MESSAGES } = require('../utils/constants');
const { buildDraftActionsKeyboard } = require('../utils/keyboards');

function registerMessageHandlers(bot, { draftService }) {
  bot.on('text', async (ctx) => {
    const text = typeof ctx.message.text === 'string' ? ctx.message.text.trim() : '';

    if (!text) {
      return;
    }

    if (text.startsWith('/')) {
      await ctx.reply(MESSAGES.UNKNOWN_COMMAND);
      return;
    }

    const draft = await draftService.getDraft(ctx.from.id);

    if (!draft) {
      await draftService.createDraft(ctx.from.id, text);
      await ctx.reply(MESSAGES.REQUEST_CREATED, buildDraftActionsKeyboard());
      return;
    }

    if (draft.submitting) {
      await ctx.reply(MESSAGES.ALREADY_SUBMITTING);
      return;
    }

    if (draft.awaitingClarification) {
      const result = await draftService.addClarification(ctx.from.id, text);

      if (!result.ok) {
        if (result.reason === 'submitting') {
          await ctx.reply(MESSAGES.ALREADY_SUBMITTING);
          return;
        }

        await ctx.reply(MESSAGES.NO_DRAFT);
        return;
      }

      await ctx.reply(MESSAGES.CLARIFICATION_ADDED, buildDraftActionsKeyboard());
      return;
    }

    await ctx.reply(MESSAGES.ACTIVE_DRAFT_GUIDE, buildDraftActionsKeyboard());
  });

  bot.on('message', async (ctx, next) => {
    if (typeof ctx.message.text === 'string') {
      if (typeof next === 'function') {
        return next();
      }

      return;
    }

    await ctx.reply(MESSAGES.TEXT_ONLY);
  });
}

module.exports = {
  registerMessageHandlers
};
