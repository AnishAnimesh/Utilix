import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useState } from 'react';

export default function SpeedTest() {
    const [speed, setSpeed] = useState('');
    const [loading, setLoading] = useState(false);

    const testSpeed = async () => {
        setLoading(true);
        setSpeed('');

        try {
            const start = Date.now();

            await fetch('https://jsonplaceholder.typicode.com/posts');

            const end = Date.now();

            const duration = (end - start) / 1000;
            const size = 50000;

            const speedMbps = (size / duration) / (1024 * 1024);

            setSpeed(speedMbps.toFixed(2) + ' Mbps');
        } catch (error) {
            setSpeed('Error testing speed');
        }

        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Internet Speed Test</Text>

            <Button
                mode="contained"
                onPress={testSpeed}
                disabled={loading}
            >
                {loading ? 'Testing...' : 'Test Speed'}
            </Button>

            {/* 🔥 Loading Animation */}
            {loading && (
                <ActivityIndicator
                    animating={true}
                    size="large"
                    style={{ marginTop: 20 }}
                />
            )}

            {/* ✅ Result */}
            {speed ? (
                <Text style={styles.result}>Speed: {speed}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    result: {
        marginTop: 20,
        fontSize: 18,
    },
});