const { DELIVERY_MODES } = require('../utils/constants');
const { formatManagerMessage } = require('../utils/formatters');

class DeliveryService {
  constructor({ bot, config, storage, requestCounterService }) {
    this.bot = bot;
    this.config = config;
    this.storage = storage;
    this.requestCounterService = requestCounterService;
    this.queue = Promise.resolve();
  }

  async deliverDraft({ draft, user, timeZone }) {
    const task = this.queue.then(
      () => this.#deliverDraftInternal({ draft, user, timeZone }),
      () => this.#deliverDraftInternal({ draft, user, timeZone })
    );

    this.queue = task.then(
      () => undefined,
      () => undefined
    );

    return task;
  }

  async #deliverDraftInternal({ draft, user, timeZone }) {
    const requestNumber = await this.requestCounterService.peekNextNumber();
    const messageText = formatManagerMessage({
      draft,
      requestNumber,
      timeZone,
      user
    });

    if (this.config.deliveryMode === DELIVERY_MODES.GROUP) {
      await this.#sendManagerMessage({
        messageText,
        requestNumber,
        targetChatId: this.config.managersGroupId,
        targetType: 'group'
      });
      await this.requestCounterService.commitNumber(requestNumber);
      return requestNumber;
    }

    const managerId = await this.#getCurrentRoundRobinManagerId();
    await this.#sendManagerMessage({
      messageText,
      requestNumber,
      targetChatId: managerId,
      targetType: 'manager'
    });
    await this.requestCounterService.commitNumber(requestNumber);
    await this.#advanceRoundRobinIndex();
    return requestNumber;
  }

  async #getCurrentRoundRobinManagerId() {
    const data = await this.storage.read();
    const managerIds = this.config.managerIds;
    const currentIndex = Number(data.roundRobinIndex || 0) % managerIds.length;

    return managerIds[currentIndex];
  }

  async #advanceRoundRobinIndex() {
    await this.storage.update((data) => {
      const currentIndex = Number(data.roundRobinIndex || 0);
      data.roundRobinIndex = (currentIndex + 1) % this.config.managerIds.length;
    });
  }

  async #sendManagerMessage({ messageText, requestNumber, targetChatId, targetType }) {
    console.log('[DeliveryService] Sending request to Telegram target', {
      deliveryMode: this.config.deliveryMode,
      requestNumber,
      targetChatId,
      targetType,
      textLength: messageText.length
    });

    try {
      const response = await this.bot.telegram.sendMessage(targetChatId, messageText);

      console.log('[DeliveryService] Telegram sendMessage succeeded', {
        messageId: response.message_id,
        requestNumber,
        targetChatId,
        targetType
      });

      return response;
    } catch (error) {
      const telegramError = extractTelegramError(error);

      console.error('[DeliveryService] Telegram sendMessage failed', {
        description: telegramError.description,
        errorCode: telegramError.errorCode,
        parameters: telegramError.parameters,
        requestNumber,
        responseData: telegramError.responseData,
        targetChatId,
        targetType
      });

      throw error;
    }
  }
}

function extractTelegramError(error) {
  const responseData = error && error.response && error.response.data ? error.response.data : null;

  return {
    description: responseData && responseData.description ? responseData.description : error.message,
    errorCode: responseData && responseData.error_code ? responseData.error_code : error.code,
    parameters: responseData && responseData.parameters ? responseData.parameters : undefined,
    responseData
  };
}

module.exports = {
  DeliveryService
};
