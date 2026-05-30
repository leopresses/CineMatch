import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthCtx {
  user: User | null;
  profile: any;
  preferences: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({ user: null, profile: null, preferences: null, loading: true, signOut: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfileAndPrefs = async (u: User) => {
    try {
      const userRef = doc(db, "profiles", u.uid);
      const docSnap = await getDoc(userRef);
      let currentProfile = {};
      if (!docSnap.exists()) {
        const name = u.displayName || u.email?.split("@")[0] || "";
        const avatar_url = u.photoURL || null;
        currentProfile = { id: u.uid, name, avatar_url, created_at: new Date().toISOString() };
        await setDoc(userRef, currentProfile);
      } else {
        currentProfile = docSnap.data();
        if (!currentProfile.avatar_url && u.photoURL) {
          currentProfile.avatar_url = u.photoURL;
          await setDoc(userRef, { avatar_url: u.photoURL }, { merge: true });
        }
      }
      setProfile(currentProfile);

      const prefRef = doc(db, "user_preferences", u.uid);
      const prefSnap = await getDoc(prefRef);
      if (prefSnap.exists()) {
        setPreferences(prefSnap.data());
      } else {
        setPreferences({ favorite_genres: [], disliked_genres: [], streaming_services: [] });
      }
    } catch (e) {
      console.error("Erro ao carregar dados do usuário:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        ensureProfileAndPrefs(currentUser).then(() => setLoading(false));
      } else {
        setProfile(null);
        setPreferences(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, preferences, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
