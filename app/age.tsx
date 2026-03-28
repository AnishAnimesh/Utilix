import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useState } from 'react';

export default function AgeCalculator() {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [result, setResult] = useState('');
  const [nextBirthday, setNextBirthday] = useState('');

  const calculateAge = () => {
    if (!day || !month || !year) return;

    const birthDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );

    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // adjust days
    if (days < 0) {
      months--;
      const prevMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      ).getDate();
      days += prevMonth;
    }

    // adjust months
    if (months < 0) {
      years--;
      months += 12;
    }

    setResult(`${years} years, ${months} months, ${days} days`);

    // 🎂 Next birthday calculation
    let nextBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    if (nextBday < today) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setNextBirthday(`${diffDays} days left`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Age Calculator</Text>

      <Text>Enter Date of Birth</Text>

      <View style={styles.row}>
        <TextInput
          label="DD"
          value={day}
          onChangeText={setDay}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          label="MM"
          value={month}
          onChangeText={setMonth}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          label="YYYY"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <Button mode="contained" onPress={calculateAge}>
        Calculate
      </Button>

      {result ? (
        <Text style={styles.result}>Age: {result}</Text>
      ) : null}

      {nextBirthday ? (
        <Text style={styles.result}>
          🎂 Next Birthday: {nextBirthday}
        </Text>
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
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
  },
  result: {
    marginTop: 15,
    fontSize: 16,
  },
});