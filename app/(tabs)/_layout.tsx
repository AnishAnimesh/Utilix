import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: 'Utilix',
        headerTitleAlign: 'left',

        // 🔥 MAKE TEXT BIG & BOLD
        headerTitleStyle: {
          fontSize: 26,
          fontWeight: 'bold',
        },
      }}
    />
  );
}