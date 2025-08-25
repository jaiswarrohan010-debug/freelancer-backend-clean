import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_mode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('@theme_mode', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? {
      background: '#1a1a1a',
      text: '#ffffff',
      primary: '#0A84FF',
      secondary: '#5856D6',
      border: '#333333',
      card: '#2c2c2c',
      error: '#FF453A',
      success: '#32D74B',
      input: '#333333',
      placeholder: '#666666',
    } : {
      background: '#ffffff',
      text: '#000000',
      primary: '#007AFF',
      secondary: '#5856D6',
      border: '#e0e0e0',
      card: '#ffffff',
      error: '#FF3B30',
      success: '#34C759',
      input: '#f2f2f2',
      placeholder: '#999999',
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 