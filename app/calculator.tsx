import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function Calculator() {
  const [input, setInput] = useState('');

  const handlePress = (value: string) => {
    setInput(input + value);
  };

  const clear = () => {
    setInput('');
  };

  const calculate = () => {
    try {
      const result = eval(input);
      setInput(result.toString());
    } catch {
      setInput('Error');
    }
  };

  const buttons = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.display}>{input || '0'}</Text>

      {buttons.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((btn) => (
            <TouchableOpacity
              key={btn}
              style={styles.button}
              onPress={() =>
                btn === '=' ? calculate() : handlePress(btn)
              }
            >
              <Text style={styles.text}>{btn}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.clear} onPress={clear}>
        <Text style={styles.text}>CLEAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  display: {
    fontSize: 40,
    textAlign: 'right',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 20,
    margin: 5,
    backgroundColor: '#333',
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: '#fff',
  },
  clear: {
    padding: 20,
    backgroundColor: 'red',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
});