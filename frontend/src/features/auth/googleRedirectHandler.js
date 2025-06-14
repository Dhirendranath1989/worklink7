import { auth } from '../../services/firebase';
import { getRedirectResult } from 'firebase/auth';
import { getApiBaseUrl } from '../../utils/apiUtils';

// Handle Google redirect result on page load
export const handleGoogleRedirectResult = async () => {
  try {
    console.log('Checking for Google redirect result...');
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('Google redirect result found:', result.user.uid);
      
      // Get ID token for backend verification
      const idToken = await result.user.getIdToken();
      
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        firstName: result.user.displayName?.split(' ')[0] || '',
        lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
      };
      
      // Send to backend
      const response = await fetch(`${getApiBaseUrl()}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken, userData }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }
      
      console.log('Backend Google login successful:', data.user);
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      return { user: data.user, token: data.token };
    }
    
    return null;
  } catch (error) {
    console.error('Google redirect result error:', error);
    throw error;
  }
};