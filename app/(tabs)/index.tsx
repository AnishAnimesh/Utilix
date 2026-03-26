import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Utilix</Text>

      <Card style={styles.card}>
        <Card.Title
          title="Unit Converter"
          left={(props) => <Avatar.Icon {...props} icon="swap-horizontal" />}
        />
        <Card.Actions>
          <Button onPress={() => router.push('/unit')}>Open</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Calculator"
          left={(props) => <Avatar.Icon {...props} icon="calculator" />}
        />
        <Card.Actions>
          <Button onPress={() => router.push('/calculator')}>
            Open
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Flashlight"
          left={(props) => <Avatar.Icon {...props} icon="flashlight" />}
        />
        <Card.Actions>
          <Button>Open</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Sound Meter"
          left={(props) => <Avatar.Icon {...props} icon="microphone" />}
        />
        <Card.Actions>
          <Button>Open</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Storage Analyzer"
          left={(props) => <Avatar.Icon {...props} icon="folder" />}
        />
        <Card.Actions>
          <Button>Open</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Internet Speed"
          left={(props) => <Avatar.Icon {...props} icon="wifi" />}
        />
        <Card.Actions>
          <Button>Open</Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    gap: 12,
    paddingBottom: 30, // extra space at bottom
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    elevation: 3,
  },
});