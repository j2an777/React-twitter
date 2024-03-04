// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDeLjqaUDgWF7AutvvQvEStqutooXuPPZg",
  authDomain: "react-twitter-77995.firebaseapp.com",
  projectId: "react-twitter-77995",
  storageBucket: "react-twitter-77995.appspot.com",
  messagingSenderId: "607815803251",
  appId: "1:607815803251:web:40665e38c8189468b3e506"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const storage = getStorage(app);

export const db = getFirestore(app);