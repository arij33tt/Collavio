import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// YouTube Clone Firebase web app
const ytCloneConfig = {
  apiKey: "AIzaSyD3REjdbKMk_tKM7MtEgwidxp2LGNzk5Yg",
  authDomain: "clone-9191c.firebaseapp.com",
  projectId: "clone-9191c",
  storageBucket: "clone-9191c.appspot.com",
  messagingSenderId: "6054021258",
  appId: "1:6054021258:web:1af16811567e78e7314573",
  measurementId: "G-H2E030VZRW"
};

const existing = getApps().find(a => a.name === 'yt-clone');
export const ytCloneApp = existing || initializeApp(ytCloneConfig, 'yt-clone');
export const ytCloneAuth = getAuth(ytCloneApp);
export const ytCloneGoogleProvider = new GoogleAuthProvider();