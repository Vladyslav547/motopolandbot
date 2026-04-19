const { Telegraf } = require('telegraf');

const { registerStartHandler } = require('./handlers/startHandler');
const { registerActionHandlers } = require('./handlers/actionHandlers');
const { registerMessageHandlers } = require('./handlers/messageHandler');
const { DeliveryService } = require('./services/deliveryService');
const { DraftService } = require('./services/draftService');
const { RequestCounterService } = require('./services/requestCounterService');
const { JsonStorage } = require('./storage/jsonStorage');
const { loadConfig } = require('./utils/config');

async function main() {
  const config = loadConfig();
  console.log('[Config] Loaded bot configuration', {
    deliveryMode: config.deliveryMode,
    managerIdsCount: config.managerIds.length,
    managersGroupId: config.managersGroupId || null,
    storageFilePath: config.storageFilePath,
    timeZone: config.timeZone
  });

  const storage = new JsonStorage(config.storageFilePath, {
    counter: 0,
    roundRobinIndex: 0,
    drafts: {}
  });

  await storage.init();

  const bot = new Telegraf(config.botToken);
  const draftService = new DraftService(storage);
  const requestCounterService = new RequestCounterService(storage);
  const deliveryService = new DeliveryService({
    bot,
    config,
    storage,
    requestCounterService
  });

  registerStartHandler(bot, { draftService });
  registerActionHandlers(bot, { draftService, deliveryService, config });
  registerMessageHandlers(bot, { draftService });

  bot.catch(async (error, ctx) => {
    console.error('Unhandled bot error:', error);

    if (ctx && typeof ctx.reply === 'function') {
      try {
        await ctx.reply('Сталася тимчасова помилка. Спробуйте ще раз трохи пізніше.');
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  });

  await bot.launch();
  console.log('Bot started successfully.');

  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Stopping bot...`);
    await bot.stop(signal);
    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

main().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
