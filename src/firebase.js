import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAB2W4MtpUymcGukOZB6RsualHnhRkowdQ",
  authDomain: "improtech-alumni.firebaseapp.com",
  projectId: "improtech-alumni",
  storageBucket: "improtech-alumni.firebasestorage.app",
  messagingSenderId: "251487053255",
  appId: "1:251487053255:web:2b11902bccc6a9fd0d65e2",
  measurementId: "G-S4KK3CLRR7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
