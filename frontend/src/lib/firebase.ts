import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your project's Firebase configuration
// Find these at console.firebase.google.com -> Project Settings -> General
const firebaseConfig = {
  apiKey: "AIzaSyATFdiXGqX7xNYh8g9YBj9dXs_l8wrt324",
  authDomain: "nagarseva-5e75a.firebaseapp.com",
  projectId: "nagarseva-5e75a",
  storageBucket: "nagarseva-5e75a.firebasestorage.app",
  messagingSenderId: "1063854489421",
  appId: "1:1063854489421:web:1746a84d48a2174f2a4104",
  measurementId: "G-TVPJZ4S8GJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
