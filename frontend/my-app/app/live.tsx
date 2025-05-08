import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function LiveScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingURI, setRecordingURI] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);

      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      clearInterval(intervalRef.current!);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingURI(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handleUpload = async () => {
    if (!recordingURI) {
      Alert.alert('No recording found', 'Please record audio first');
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: recordingURI,
      type: 'audio/x-wav',
      name: 'audio.wav',
    } as any);

    try {
      const response = await fetch('http://<YOUR_BACKEND>/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = await response.json();
      console.log('Upload success:', data);
      Alert.alert('Success', 'Audio uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      Alert.alert('Error', 'Failed to upload audio');
    }
  };

  return (
    <LinearGradient
      colors={['#6a11cb', '#2575fc']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Live Audio Recording</Text>
        <Text style={styles.description}>
          Record audio to detect language from 10 Indian languages
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              isRecording ? styles.stopButton : styles.recordButton
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={isRecording ? 'stop' : 'mic'} 
                size={28} 
                color="#fff" 
              />
            </View>
            <Text style={styles.buttonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>

          {recordingURI && (
            <TouchableOpacity 
              style={[styles.button, styles.uploadButton]}
              onPress={handleUpload}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="cloud-upload" size={28} color="#fff" />
              </View>
              <Text style={styles.buttonText}>Upload & Detect</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.duration}>
          {isRecording ? 'Recording' : 'Recorded'} Time: {duration}s
        </Text>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
  },
  title: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: '#fff', 
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center', 
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgb(255, 255, 255)',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recordButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.7)',
  },
  stopButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.7)',
  },
  uploadButton: {
    backgroundColor: 'rgba(243, 156, 18, 0.7)',
  },
  iconContainer: {
    marginRight: 15,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600',
  },
  duration: { 
    color: '#fff', 
    fontSize: 18, 
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  backButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600',
    marginLeft: 10,
  },
});