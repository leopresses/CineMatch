import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyAjjVeqGqxIkkyJtayokhVAQVLV93QYPZ8",
  authDomain: "cinematch-webapp.firebaseapp.com",
  projectId: "cinematch-webapp",
  storageBucket: "cinematch-webapp.firebasestorage.app",
  messagingSenderId: "156868003421",
  appId: "1:156868003421:web:43be81dce41004bc1fefb4",
  measurementId: "G-7JQMQM0NDV"
};

const app = initializeApp(firebaseConfig);

// Proteção Anti-Bot do Google
if (typeof window !== "undefined") {
  // Ativa o token de debug local para não bloquear você no 'localhost'
  // @ts-expect-error - variável global do firebase
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; 
  
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider("6LfTTAQtAAAAAFfIi64qHl9cnCfbHhEikfEw7APV"),
      isTokenAutoRefreshEnabled: true
    });
  } catch (e) {
    console.error("Erro ao inicializar App Check:", e);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
