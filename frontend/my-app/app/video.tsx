import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import { useRouter } from 'expo-router';

export default function VideoScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<'front' | 'back'>('front');
  const [caption, setCaption] = useState('');
  const cameraRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = (e) => console.error('STT Error:', e);

    startListening();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e: any) => {
    const text = e.value?.[0];
    if (text) setCaption(text);
  };

  const startListening = async () => {
    try {
      await Voice.start('en-IN'); // Change language as needed
    } catch (e) {
      console.error('Failed to start voice recognition:', e);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access is required.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />
      <View style={styles.overlay}>
        <Text style={styles.caption}>{caption || 'Listening...'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 20 },
  button: {
    backgroundColor: '#2575fc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  overlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  caption: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
});
