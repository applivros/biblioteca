import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGcrW9JyAGM3nf4eHdtXaVozJOrKx8e-s",
  authDomain: "applivro-75c5b.firebaseapp.com",
  projectId: "applivro-75c5b",
  storageBucket: "applivro-75c5b.firebasestorage.app",
  messagingSenderId: "196142073774",
  appId: "1:196142073774:web:b1d953b7c633049c9a2a3f",
  measurementId: "G-T7P5KPE9P4"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
