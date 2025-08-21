import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDlFQS1f7MJ7O_uQitCS9YDd_ZocKUMGkc',
  authDomain: 'people-e6485.firebaseapp.com',
  projectId: 'people-e6485',
  storageBucket: 'people-e6485.appspot.com',
  messagingSenderId: '106447345447513461862',
  appId: '1:70602694652:android:e72be6863e0fecc1469c79',
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Export the auth object for use in your app
export const auth = getAuth(app);
export default app;
