import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ user: string; bot: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch userId from AsyncStorage or auth context
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          console.log(`[DEBUG] Fetched userId from AsyncStorage: ${storedUserId}`);
        } else {
          console.warn('[WARNING] No userId found in AsyncStorage, using default');
          setUserId('guQ7Z9OI59fBKqbyT5e8UdFoCc2'); // Default for testing
        }
      } catch (error) {
        console.error('[ERROR] Failed to fetch userId from AsyncStorage:', error.message);
        setUserId('guQ7Z9OI59fBKqbyT5e8UdFoCc2'); // Fallback
      }
    };
    fetchUserId();
  }, []);

  const sendMessage = async () => {
    if (!message || !userId) {
      console.log('[DEBUG] No message or userId to send');
      return;
    }

    // Add user message to history
    setChatHistory([...chatHistory, { user: message, bot: '' }]);
    console.log(`[DEBUG] Sending message: ${message} for user ${userId}`);

    try {
      const response = await axios.post(`http://192.168.60.22:5000/healthChat/${userId}`, {
        message,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('[DEBUG] API response:', response.data);
      const botResponse = response.data.response;

      // Add bot response to history
      setChatHistory(prev => [...prev.slice(0, -1), { user: message, bot: botResponse }]);
    } catch (error) {
      console.error('[ERROR] Failed to connect to chatbot:', error.message || error);
      if (error.response) {
        console.error('[DEBUG] Error Response:', JSON.stringify(error.response.data, null, 2));
      }
      Alert.alert('Error', 'Failed to connect to chatbot. Check console for details.');
      setChatHistory(prev => [...prev.slice(0, -1), { user: message, bot: 'Error connecting to chatbot' }]);
    }

    setMessage('');
    console.log('[DEBUG] Message input cleared');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={chatHistory}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.userMessage}>You: {item.user}</Text>
            <Text style={styles.botMessage}>Bot: {item.bot}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Type your message..."
        onSubmitEditing={sendMessage}
      />
      <Button title="Send" onPress={sendMessage} disabled={!userId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  input: { borderWidth: 1, padding: 10, marginVertical: 10 },
  userMessage: { fontWeight: 'bold', color: 'blue' },
  botMessage: { color: 'green' },
});

export default ChatScreen;