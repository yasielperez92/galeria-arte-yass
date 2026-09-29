import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyAXrOTe_UJ4picZEn-HxKf5rwOIZji-Pq8",
  authDomain: "galeria-arte-yass.firebaseapp.com",
  projectId: "galeria-arte-yass",
  storageBucket: "galeria-arte-yass.firebasestorage.app",
  messagingSenderId: "1074275044260",
  appId: "1:1074275044260:web:9724713bbcc87d848b4f31",
  measurementId: "G-YRDQT089JD"
};

const app = initializeApp(firebaseConfig);

export default app;
