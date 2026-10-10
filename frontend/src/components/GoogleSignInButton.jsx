import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSuccess = (response) => {
    try {
      if (!response.credential) throw new Error('Google did not return an ID token.');
      const claims = jwtDecode(response.credential);
      onSuccess?.({
        credential: response.credential,
        profile: {
          id: claims.sub,
          name: claims.name,
          email: claims.email,
          picture: claims.picture,
        },
      });
    } catch (error) {
      onError?.(error);
    }
  };

  if (!clientId) {
    return <p className="text-center text-sm text-slate-500" role="status">Google Sign-In is not configured.</p>;
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.(new Error('Google sign-in failed. Please try again.'))}
        text={text}
        shape="rectangular"
        width="320"
      />
    </div>
  );
}