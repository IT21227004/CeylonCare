import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// import Voice from '@react-native-voice/voice';

const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ user: string; bot: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  // const [isRecording, setIsRecording] = useState(false);
  // const [languageCode, setLanguageCode] = useState('en-US');
  // const [voiceInitialized, setVoiceInitialized] = useState(false);

  useEffect(() => {
    // Fetch userId
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          console.log(`[DEBUG] Fetched userId: ${storedUserId}`);
        } else {
          console.warn('[WARNING] No userId in AsyncStorage, using default');
          setUserId('guQ7Z9OI59fBKqbyT5e8UdFoCc2');
        }
      } catch (error) {
        console.error('[ERROR] Failed to fetch userId:', error.message);
        setUserId('guQ7Z9OI59fBKqbyT5e8UdFoCc2');
      }
    };
    fetchUserId();

    // Initialize Voice
  //   const initVoice = async () => {
  //     try {
  //       console.log('[DEBUG] Initializing Voice module');
  //       await Voice.isRecognizing(); // Test initialization
  //       Voice.onSpeechStart = () => {
  //         console.log('[DEBUG] Recording started');
  //         setIsRecording(true);
  //       };
  //       Voice.onSpeechEnd = () => {
  //         console.log('[DEBUG] Recording ended');
  //         setIsRecording(false);
  //       };
  //       Voice.onSpeechError = (error) => {
  //         console.error('[ERROR] Voice recognition error:', JSON.stringify(error));
  //         setIsRecording(false);
  //         Alert.alert('Error', 'Failed to record voice. Check console for details.');
  //       };
  //       Voice.onSpeechResults = async (event) => {
  //         const transcribedText = event.value?.[0] || '';
  //         console.log(`[DEBUG] Voice transcription result: ${transcribedText}`);
  //         if (!transcribedText) {
  //           console.warn('[WARNING] No transcription received from voice input');
  //           Alert.alert('Warning', 'No speech detected. Please try again.');
  //           return;
  //         }
  //         setMessage(transcribedText);
  //         await sendMessage(transcribedText);
  //       };
  //       setVoiceInitialized(true);
  //       console.log('[DEBUG] Voice module initialized successfully');
  //     } catch (error) {
  //       console.error('[ERROR] Failed to initialize Voice module:', error.message);
  //       setVoiceInitialized(false);
  //     }
  //   };

  //   initVoice();

  //   return () => {
  //     Voice.destroy().then(Voice.removeAllListeners);
  //     console.log('[DEBUG] Voice cleanup completed');
  //   };
  }, []);

  // const startRecording = async () => {
  //   if (!voiceInitialized) {
  //     console.error('[ERROR] Voice module not initialized, cannot start recording');
  //     Alert.alert('Error', 'Voice module not initialized. Please restart the app.');
  //     return;
  //   }

  //   try {
  //     console.log(`[DEBUG] Starting voice recording with languageCode: ${languageCode}`);
  //     await Voice.start(languageCode);
  //   } catch (error) {
  //     console.error('[ERROR] Failed to start recording:', error.message);
  //     setIsRecording(false);
  //   }
  // };

  // const stopRecording = async () => {
  //   try {
  //     console.log('[DEBUG] Stopping voice recording');
  //     await Voice.stop();
  //   } catch (error) {
  //     console.error('[ERROR] Failed to stop recording:', error.message);
  //   }
  // };

  const sendMessage = async (textMessage = message) => {
    if (!textMessage || !userId) {
      console.log('[DEBUG] No message or userId provided');
      return;
    }

    setChatHistory([...chatHistory, { user: textMessage, bot: '' }]);
    console.log(`[DEBUG] Sending message: "${textMessage}" for user ${userId}`);

    try {
      const response = await axios.post(`http://172.20.10.14:5000/healthChat/${userId}`, {
        message: textMessage,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('[DEBUG] Chatbot response:', response.data);
      const botResponse = response.data.response;

      // Verify language consistency
      const isSinhalaQuery = /[\u0D80-\u0DFF]/.test(textMessage);
      const isSinhalaResponse = /[\u0D80-\u0DFF]/.test(botResponse);
      console.log(`[DEBUG] Query language (inferred): ${isSinhalaQuery ? 'Sinhala' : 'English'}`);
      console.log(`[DEBUG] Response language (inferred): ${isSinhalaResponse ? 'Sinhala' : 'English'}`);
      if (isSinhalaQuery !== isSinhalaResponse) {
        console.error(`[ERROR] Language mismatch: Query language '${isSinhalaQuery ? 'Sinhala' : 'English'}', Response language '${isSinhalaResponse ? 'Sinhala' : 'English'}'`);
      }

      setChatHistory(prev => [...prev.slice(0, -1), { user: textMessage, bot: botResponse }]);
    } catch (error) {
      console.error('[ERROR] Chatbot request failed:', error.message);
      if (error.response) {
        console.error('[DEBUG] Error response:', error.response.data);
      }
      Alert.alert('Error', 'Failed to connect to chatbot');
      setChatHistory(prev => [...prev.slice(0, -1), { user: textMessage, bot: 'Error connecting to chatbot' }]);
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
          onSubmitEditing={() => sendMessage()}
        />
  
        <Button title="Send" onPress={() => sendMessage()} disabled={!userId} />
       
        {/* <Button
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={!voiceInitialized}
        /> */}
        
        {/* <Button
          title={`Switch to ${languageCode === 'en-US' ? 'Sinhala' : 'English'}`}
          onPress={() => setLanguageCode(prev => prev === 'en-US' ? 'si-LK' : 'en-US')}
        /> */}
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