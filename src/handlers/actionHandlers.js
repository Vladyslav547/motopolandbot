const { ACTIONS, MESSAGES } = require('../utils/constants');
const { buildDraftActionsKeyboard } = require('../utils/keyboards');

function registerActionHandlers(bot, { draftService, deliveryService, config }) {
  bot.action(ACTIONS.ADD_CLARIFICATION, async (ctx) => {
    await ctx.answerCbQuery();

    const result = await draftService.markAwaitingClarification(ctx.from.id);

    if (!result.ok) {
      if (result.reason === 'submitting') {
        await ctx.reply(MESSAGES.ALREADY_SUBMITTING);
        return;
      }

      await ctx.reply(MESSAGES.NO_DRAFT);
      return;
    }

    await ctx.reply(MESSAGES.ASK_CLARIFICATION);
  });

  bot.action(ACTIONS.SEND_TO_MANAGER, async (ctx) => {
    await ctx.answerCbQuery();

    const claimResult = await draftService.claimDraftForSending(ctx.from.id);

    if (!claimResult.ok) {
      if (claimResult.reason === 'submitting') {
        await ctx.reply(MESSAGES.ALREADY_SUBMITTING);
        return;
      }

      await ctx.reply(MESSAGES.NO_DRAFT);
      return;
    }

    try {
      await deliveryService.deliverDraft({
        draft: claimResult.draft,
        user: ctx.from,
        timeZone: config.timeZone
      });

      await draftService.clearDraft(ctx.from.id);
      await ctx.reply(MESSAGES.SENT);
    } catch (error) {
      console.error('Failed to deliver draft:', error);
      await draftService.releaseDraft(ctx.from.id);
      await ctx.reply(MESSAGES.SEND_FAILED, buildDraftActionsKeyboard());
    }
  });
}

module.exports = {
  registerActionHandlers
};
