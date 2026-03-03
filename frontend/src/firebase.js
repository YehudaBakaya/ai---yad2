import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAmerPSBHNcHxYhA8de0YXw12pzRZH4YeY",
  authDomain: "yad2---ai.firebaseapp.com",
  projectId: "yad2---ai",
  storageBucket: "yad2---ai.firebasestorage.app",
  messagingSenderId: "143470628410",
  appId: "1:143470628410:web:758707ef96a7ef4930af03",
  measurementId: "G-V9N2LEMP2T",
};

const app = initializeApp(firebaseConfig);

export const auth          = getAuth(app);
export const db            = getFirestore(app);
export const storage       = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
