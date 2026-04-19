function formatManagerMessage({ draft, requestNumber, timeZone, user }) {
  const username = user.username ? `@${user.username}` : 'немає username';
  const firstName = user.first_name ? user.first_name.trim() : '';
  const clarificationText = draft.clarifications.length
    ? draft.clarifications.join('\n\n')
    : 'немає';

  return [
    `Нова заявка #${requestNumber}`,
    '',
    `Клієнт: ${username}`,
    `Ім’я: ${firstName || 'не вказано'}`,
    `Telegram ID: ${user.id}`,
    '',
    'Запит:',
    draft.requestText,
    '',
    'Уточнення:',
    clarificationText,
    '',
    `Час: ${formatLocalDateTime(new Date(), timeZone)}`
  ].join('\n');
}

function formatLocalDateTime(date, timeZone) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric'
  }).format(date);
}

module.exports = {
  formatLocalDateTime,
  formatManagerMessage
};
