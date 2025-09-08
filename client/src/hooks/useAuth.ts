import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithRedirect, signOut, getRedirectResult } from 'firebase/auth';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get ID token and send to backend
          const idToken = await firebaseUser.getIdToken();
          
          try {
            // Try to get existing user profile
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
              // Create new user if doesn't exist
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
            console.error('Error fetching user profile:', error);
            setState(prev => ({
              ...prev,
              loading: false,
              error: 'Failed to load user profile'
            }));
          }
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

    // Handle redirect result
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect auth error:', error);
      setState(prev => ({
        ...prev,
        error: 'Authentication failed'
      }));
    });

    return unsubscribe;
  }, []);

  const login = () => {
    signInWithRedirect(auth, googleProvider);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    ...state,
    login,
    logout
  };
}
