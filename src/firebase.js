import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_R4TkEEFGE7YmjckYduguTwf3OpHo_ZE",
  authDomain: "dementia-cure-app.firebaseapp.com",
  databaseURL: "https://dementia-cure-app-default-rtdb.firebaseio.com",
  projectId: "dementia-cure-app",
  storageBucket: "dementia-cure-app.firebasestorage.app",
  messagingSenderId: "574552654807",
  appId: "1:574552654807:web:a24e28b8a84d0644d84192",
  measurementId: "G-NDT452V2VR",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;