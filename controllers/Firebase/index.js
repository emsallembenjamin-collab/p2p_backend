const admin = require("firebase-admin");
const serviceAccount = require("serviceAccountKey.json");

const initFirebase = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

const sendPushNotification = (token, message) => {

  const message = {
    notification: {
      title: 'Title of the notification',
      body: 'Body of the notification'
    },
    token: req.body.token // This token you'll get from the client side
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      // Successfully sent message
    })
    .catch((error) => {
      // Handle errors
    });
};


const FirebaseContrller = {
  initFirebase, 
  sendPushNotification
}