const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const { buildPushMessage } = require('../../utils/pushNotification');

const initFirebase = () => {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
