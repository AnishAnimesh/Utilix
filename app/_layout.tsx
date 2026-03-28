import { Stack } from 'expo-router';
import { IconButton } from 'react-native-paper';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: 'Utilix',
        headerTitleAlign: 'left', // ✅ MOVE LEFT

        headerRight: () => (
          <IconButton
            icon="dots-vertical"
            onPress={() => console.log('Menu')}
          />
        ),
      }}
    />
  );
}