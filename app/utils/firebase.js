import auth from '@react-native-firebase/auth';

// For React Native Firebase, the configuration is handled by google-services.json
// No need to manually initialize the app

export const firebaseApp = {
  // Provide a compatible interface for existing code
  options: {
    apiKey: "AIzaSyC55_OYQl9DuC09T6V0GVFz7cxrgNjUsK0",
    authDomain: "people-e6485.firebaseapp.com",
    projectId: "people-e6485",
    storageBucket: "people-e6485.firebasestorage.app",
    messagingSenderId: "70602694652",
    appId: "1:70602694652:android:e72be6863e0fecc1469c79",
    measurementId: "G-8GND85J4FD"
  }
};

export { auth };
