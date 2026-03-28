import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Card, Avatar } from 'react-native-paper';
import { router, Stack } from 'expo-router';

export default function HomeScreen() {
  const features = [
    { title: 'Unit Converter', icon: 'swap-horizontal', route: '/unit' },
    { title: 'Calculator', icon: 'calculator', route: '/calculator' },
    { title: 'Reminder', icon: 'alarm', route: '/reminder' },
    { title: 'Password Generator', icon: 'lock', route: '/password' },
    { title: 'Finance Tracker', icon: 'cash', route: '/finance' },
    { title: 'Currency Converter', icon: 'currency-usd', route: '/currency' },
    { title: 'Split Bill', icon: 'account-group', route: '/split' },
    { title: 'Age Calculator', icon: 'calendar', route: '/age' },
    { title: 'Internet Speed', icon: 'wifi', route: '/speed' },
  ];

  return (
    <>
      {/* 🔥 removes "index" */}
      <Stack.Screen options={{ title: '' }} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          {features.map((item, index) => (
            <Card
              key={index}
              style={styles.card}
              onPress={() => item.route && router.push(item.route)} // 🔥 full card clickable
            >
              <Card.Content style={styles.cardContent}>
                <Avatar.Icon icon={item.icon} size={50} />
                <Text style={styles.cardText}>{item.title}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
container: {
  paddingHorizontal: 15,
  paddingTop: 20,   // 🔥 IMPORTANT (was 5 or 15 before)
  paddingBottom: 30,
},

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },

  // 🔥 centers content (clean UI)
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },

  cardText: {
    textAlign: 'center',
    fontSize: 14,
  },
});