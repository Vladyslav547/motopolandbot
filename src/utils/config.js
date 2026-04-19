const path = require('node:path');

const dotenv = require('dotenv');

const { DELIVERY_MODES } = require('./constants');

dotenv.config();

function loadConfig() {
  const botToken = process.env.BOT_TOKEN ? process.env.BOT_TOKEN.trim() : '';
  const deliveryMode = process.env.DELIVERY_MODE ? process.env.DELIVERY_MODE.trim().toUpperCase() : '';
  const managersGroupId = process.env.MANAGERS_GROUP_ID ? process.env.MANAGERS_GROUP_ID.trim() : '';
  const managerIds = parseManagerIds(process.env.MANAGER_IDS);
  const timeZone = process.env.TIMEZONE ? process.env.TIMEZONE.trim() : 'Europe/Kyiv';

  if (!botToken) {
    throw new Error('BOT_TOKEN is required.');
  }

  if (!Object.values(DELIVERY_MODES).includes(deliveryMode)) {
    throw new Error('DELIVERY_MODE must be either GROUP or ROUND_ROBIN.');
  }

  if (deliveryMode === DELIVERY_MODES.GROUP && !managersGroupId) {
    throw new Error('MANAGERS_GROUP_ID is required when DELIVERY_MODE=GROUP.');
  }

  if (deliveryMode === DELIVERY_MODES.ROUND_ROBIN && managerIds.length === 0) {
    throw new Error('MANAGER_IDS is required when DELIVERY_MODE=ROUND_ROBIN.');
  }

  validateTimeZone(timeZone);

  return {
    botToken,
    deliveryMode,
    managerIds,
    managersGroupId,
    storageFilePath: path.join(process.cwd(), 'data', 'storage.json'),
    timeZone
  };
}

function parseManagerIds(rawValue = '') {
  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function validateTimeZone(timeZone) {
  new Intl.DateTimeFormat('uk-UA', {
    timeZone
  }).format(new Date());
}

module.exports = {
  loadConfig
};
