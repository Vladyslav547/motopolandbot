const { Markup } = require('telegraf');

const { ACTIONS } = require('./constants');

function buildDraftActionsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Відправити менеджеру', ACTIONS.SEND_TO_MANAGER)],
    [Markup.button.callback('Додати уточнення', ACTIONS.ADD_CLARIFICATION)]
  ]);
}

module.exports = {
  buildDraftActionsKeyboard
};
