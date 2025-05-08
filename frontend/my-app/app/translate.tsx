import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';

export default function TranslateScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');

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
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    setIsProcessing(true);
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const fileName = uri.split('/').pop() || 'audio.wav';
        const fileType = Platform.OS === 'ios' ? 'audio/x-wav' : 'audio/wav';

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: fileName,
          type: fileType,
        } as any);
        formData.append('source_lang', sourceLang);
        formData.append('target_lang', targetLang);

        const response = await fetch('http://<YOUR_BACKEND_HOST>/translate-audio', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const result = await response.json();
        setTranslatedText(result.translation || 'No translation found.');
      }
    } catch (err) {
      console.error('Recording error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <LinearGradient
      colors={['#6A11CB', '#2575FC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Audio Translator</Text>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>From:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={sourceLang}
              style={styles.picker}
              onValueChange={setSourceLang}
              dropdownIconColor="#05375a"
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Hindi" value="hi" />
              <Picker.Item label="Tamil" value="ta" />
              <Picker.Item label="Kannada" value="kn" />
              <Picker.Item label="Telugu" value="te" />
            </Picker>
          </View>

          <Text style={styles.label}>To:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={targetLang}
              style={styles.picker}
              onValueChange={setTargetLang}
              dropdownIconColor="#05375a"
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Hindi" value="hi" />
              <Picker.Item label="Tamil" value="ta" />
              <Picker.Item label="Kannada" value="kn" />
              <Picker.Item label="Telugu" value="te" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={styles.recordButton}
          onPress={recording ? stopRecording : startRecording}
        >
          <Ionicons name={recording ? 'stop' : 'mic'} size={24} color="white" />
          <Text style={styles.recordText}>
            {recording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>

        {isProcessing && <ActivityIndicator size="large" color="#FF8A00" style={styles.loader} />}

        {translatedText.length > 0 && (
          <View style={styles.result}>
            <Text style={styles.resultLabel}>Translation:</Text>
            <Text style={styles.resultText}>{translatedText}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    margin: 30,
    // marginBottom:150,
    // marginTop:150,
    borderRadius: 30,
    padding: 25,
    // backgroundColor: 'white',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: 'white' },
  pickerContainer: { marginBottom: 30 },
  pickerWrapper: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    borderColor:'white',
     shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginVertical: 10,
    elevation: 5,
  },
  picker: { height: 50, width: '100%', color: '#05375a' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: 'white' },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A00',
    padding: 16,
    borderRadius: 25,
    marginVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recordText: { color: 'white', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  loader: { marginVertical: 20 },
  result: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  resultLabel: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#05375a' },
  resultText: { fontSize: 16, lineHeight: 24, color: '#05375a' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(43, 29, 240, 0.33)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 30,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    
  },
  backText: { color: 'white', fontSize: 18, fontWeight: '600', marginLeft: 10,marginRight:10 },
});
