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
      await this.bot.telegram.sendMessage(this.config.managersGroupId, messageText);
      await this.requestCounterService.commitNumber(requestNumber);
      return requestNumber;
    }

    const managerId = await this.#getCurrentRoundRobinManagerId();
    await this.bot.telegram.sendMessage(managerId, messageText);
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
}

module.exports = {
  DeliveryService
};
