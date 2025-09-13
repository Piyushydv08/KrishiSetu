import { useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithRedirect, 
  signOut, 
  getRedirectResult, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null
  });

  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'X-Firebase-UID': firebaseUser.uid,
          'Authorization': `Bearer ${idToken}`
        }
      });
      let user: User;
      if (response.ok) {
        user = await response.json();
      } else {
        user = await apiRequest('POST', '/api/user/register', {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          firebaseUid: firebaseUser.uid,
          profileImage: firebaseUser.photoURL,
          roleSelected: false
        }).then(res => res.json());
      }
      setState({
        user,
        firebaseUser,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load user profile'
      }));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await fetchUserProfile(firebaseUser);
        } else {
          setState({
            user: null,
            firebaseUser: null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Auth error:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Authentication failed'
        }));
      }
    });
    return unsubscribe;
  }, []);

  const refetchUser = async () => {
    if (state.firebaseUser) {
      setState(prev => ({ ...prev, loading: true }));
      await fetchUserProfile(state.firebaseUser!);
    }
  };

  // Google login
  const loginWithGoogle = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    signInWithPopup(auth, googleProvider)
      .then(result => {
        // Google login successful - onAuthStateChanged will handle the rest
      })
      .catch(error => {
        console.error('Google login error:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to login with Google'
        }));
      });
  };

  // Email/password login
  const loginWithEmail = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the user data fetching
    } catch (error: any) {
      console.error('Email login error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to login with email/password'
      }));
      throw error;
    }
  };

  // Email/password registration
  const registerWithEmail = async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // onAuthStateChanged will create the user in our backend
      return userCredential.user;
    } catch (error: any) {
      console.error('Email registration error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to register with email/password'
      }));
      throw error;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await signOut(auth);
      setState({
        user: null,
        firebaseUser: null,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to logout'
      }));
    }
  };

  return {
    ...state,
    login: loginWithGoogle, // Keep original name for backward compatibility
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    refetchUser
  };
}
