import { useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  User 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // 1. Delete from Supabase (Profile, Posts, etc. assuming cascade or manual check)
      // We start with the profile. If this fails due to RLS, the user remains.
      const { error: supabaseError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', currentUser.uid);

      if (supabaseError) {
        console.error('Supabase deletion error:', supabaseError);
        // Continue anyway or throw? Let's proceed to ensure auth is cleared if possible.
      }

      // 2. Delete from Firebase Auth
      await currentUser.delete();
      
      // 3. Clear local state and redirect
      setUser(null);
      window.location.href = '/';
      return true;
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('Security Re-authentication required. Please sign out and sign in again to delete your account.');
      }
      throw error;
    }
  };

  return { user, loading, loginWithGoogle, logout, signUpWithEmail, signInWithEmail, deleteAccount };
}
