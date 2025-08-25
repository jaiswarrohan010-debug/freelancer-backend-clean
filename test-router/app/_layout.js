import { Stack } from 'expo-router';
import { ThemeProvider } from './context/ThemeContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </ThemeProvider>
  );
} 