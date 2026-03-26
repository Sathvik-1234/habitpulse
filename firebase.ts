import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB5ec4ggBtr8UZTuh4JK3q5VK3Prtv0Xl4",
  authDomain: "habitpulse-983ca.firebaseapp.com",
  projectId: "habitpulse-983ca",
  storageBucket: "habitpulse-983ca.firebasestorage.app",
  messagingSenderId: "836895510028",
  appId: "1:836895510028:web:14e202e1ea1a46d0d2a829",
  measurementId: "G-L3MJKD69T8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export let messaging: any = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});