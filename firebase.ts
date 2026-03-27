import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoRPRBQygT9b0g8LIXswjDPCi-2jN7n7s",
  authDomain: "habit-pulse-b7299.firebaseapp.com",
  projectId: "habit-pulse-b7299",
  storageBucket: "habit-pulse-b7299.firebasestorage.app",
  messagingSenderId: "461725683788",
  appId: "1:461725683788:web:51b1ca8abbcfb51534e4e9",
  measurementId: "G-HZCT2NFNVT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };