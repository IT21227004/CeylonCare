// CeylonCare/app/pages/ChatScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ user: string; bot: string }[]>([]);

  const sendMessage = async () => {
    if (!message) {
      console.log('[DEBUG] No message to send');
      return;
    }

    // Add user message to history
    setChatHistory([...chatHistory, { user: message, bot: '' }]);
    console.log(`[DEBUG] Sending message: ${message}`);

    try {
      const response = await axios.post('http://192.168.8.134:5001/chat', {
        message,
      }, {
        // Removed Authorization header since no token is used
      });
      console.log('[DEBUG] API response:', response.data);
      const botResponse = response.data.response;

      // Add bot response to history
      setChatHistory(prev => [...prev.slice(0, -1), { user: message, bot: botResponse }]);
    } catch (error) {
      console.error('[ERROR] Failed to connect to chatbot:', error.message || error);
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
      <Button title="Send" onPress={sendMessage} />
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