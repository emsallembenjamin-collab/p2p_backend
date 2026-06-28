function requireText(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string`);
  }

  return value.trim();
}

function buildPushMessage(token, notification) {
  if (!notification || typeof notification !== 'object') {
    throw new TypeError('notification must be an object');
  }

  const message = {
    notification: {
      title: requireText(notification.title, 'notification.title'),
      body: requireText(notification.body, 'notification.body'),
    },
    token: requireText(token, 'token'),
  };

  if (notification.imageUrl) {
    message.notification.imageUrl = requireText(
      notification.imageUrl,
      'notification.imageUrl',
    );
  }

  if (notification.data !== undefined) {
    if (!notification.data || typeof notification.data !== 'object') {
      throw new TypeError('notification.data must be an object');
    }
    message.data = notification.data;
  }

  return message;
}

module.exports = { buildPushMessage, requireText };
