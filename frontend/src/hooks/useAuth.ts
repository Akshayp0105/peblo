import { useContext } from 'react';
import { AuthContext } from '@/components/providers/AuthProvider';
import { signOut as firebaseSignOut } from '@/lib/auth';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    user: context.user,
    loading: context.loading,
    signOut: firebaseSignOut,
  };
};
