const admin = require("firebase-admin");
const { buildPushMessage } = require('../../utils/pushNotification');

const initFirebase = () => {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  return admin.app();
};

const sendPushNotification = async (token, notification) => {
  const message = buildPushMessage(token, notification);
  return admin.messaging().send(message);
};

module.exports = {
  initFirebase,
  sendPushNotification,
};
