import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { router } from 'expo-router';

export default function HomeScreen() {
  const features = [
    { title: 'Unit Converter', icon: 'swap-horizontal', route: '/unit' },
    { title: 'Calculator', icon: 'calculator', route: '/calculator' },
    { title: 'Flashlight', icon: 'flashlight' },
    { title: 'Sound Meter', icon: 'microphone' },
    { title: 'Storage Analyzer', icon: 'folder' },
    { title: 'Internet Speed', icon: 'wifi' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Utilix</Text>

      <View style={styles.grid}>
        {features.map((item, index) => (
          <Card key={index} style={styles.card}>
            <Card.Title
              title={item.title}
              titleStyle={{ fontSize: 14 }}
              left={(props) => (
                <Avatar.Icon {...props} icon={item.icon} size={40} />
              )}
            />
            <Card.Actions>
              <Button
                onPress={() => item.route && router.push(item.route)}
              >
                Open
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },

  // 🔥 GRID STYLE
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // 🔥 EACH CARD = 2 columns
  card: {
    width: '48%',   // IMPORTANT → makes 2 columns
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
});