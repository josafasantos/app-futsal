import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "app-futsal-5693e",
  appId: "1:1044101019463:web:fcaa2ef6926bdda2837e62",
  storageBucket: "app-futsal-5693e.firebasestorage.app",
  apiKey: "AIzaSyCnrOCfEhTREVaY3N2ocGbubEBmKoYRDsU",
  authDomain: "app-futsal-5693e.firebaseapp.com",
  messagingSenderId: "1044101019463"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
