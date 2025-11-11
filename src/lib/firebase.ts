
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "studio-5589810889-8713e",
  "appId": "1:967271201856:web:3a809f573af17cb49073a5",
  "storageBucket": "studio-5589810889-8713e.appspot.com",
  "apiKey": "AIzaSyAD-gRLJHUPP0QJ81sakOfGOtHOIkUCiLs",
  "authDomain": "studio-5589810889-8713e.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "967271201856"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
