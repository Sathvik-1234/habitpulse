importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB5ec4ggBtr8UZTuh4JK3q5VK3Prtv0Xl4",
  authDomain: "habitpulse-983ca.firebaseapp.com",
  projectId: "habitpulse-983ca",
  storageBucket: "habitpulse-983ca.firebasestorage.app",
  messagingSenderId: "836895510028",
  appId: "1:836895510028:web:14e202e1ea1a46d0d2a829",
  measurementId: "G-L3MJKD69T8"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
