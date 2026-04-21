import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAbZ3_vyXJ_68GUsBTS-BFoBwwMXjOPuXc",
  authDomain: "genai-a-490712.firebaseapp.com",
  projectId: "genai-a-490712",
  storageBucket: "genai-a-490712.firebasestorage.app",
  messagingSenderId: "712283449462",
  appId: "1:712283449462:web:41a5f1ed153487368ad757"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
