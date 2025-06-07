import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function UploadScreen() {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [fileName, setFileName] = useState('');
  useEffect(() => {
    return () => {
      Speech.stop();  // Stop reading aloud when leaving the screen
    };
  }, []);

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result?.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setAudioUri(uri);
        setFileName(result.assets[0].name || 'Selected audio file');
        setTranslatedText('');
        setSubmitted(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const submitAudio = async () => {
    if (!audioUri) {
      Alert.alert('No Audio', 'Please upload an audio file first.');
      return;
    }

    setLoading(true);
    setSubmitted(true);

    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      const fileUri = fileInfo.uri;
      const fileName = fileUri.split('/').pop() || 'audio.m4a';
      const fileExt = fileName.split('.').pop() || 'm4a';
      const mimeType = `audio/${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      const query = new URLSearchParams();
      query.append('tgt_lang', targetLanguage);

      const response = await fetch(
        `https://cb88-2402-3a80-ce5-6008-bc2d-7620-58b6-42da.ngrok-free.app/translate/audio/?${query.toString()}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Translation failed');
      }

      if (responseData.translated_text) {
        setTranslatedText(responseData.translated_text);
      } else {
        throw new Error('No translation returned');
      }

    } catch (err: any) {
      console.error('Submit error:', err);
      Alert.alert('Error', err.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReadAloud = () => {
    if (translatedText) {
      Speech.speak(translatedText);
    } else {
      Alert.alert('No Text', 'Nothing to read aloud yet.');
    }
  };

  return (
    <LinearGradient
      colors={['#6a11cb', '#2575fc']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Audio Translation</Text>
        <Text style={styles.description}>
          Upload audio and translate to your preferred language
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={pickAudioFile}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="file-upload" size={24} color="#fff" />
          </View>
          <Text style={styles.buttonText}>
            {fileName || 'Select Audio File'}
          </Text>
        </TouchableOpacity>

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Target Language</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={targetLanguage}
              onValueChange={setTargetLanguage}
              dropdownIconColor="#fff"
              style={{ color: '#fff' }}
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Kannada" value="kn" />
              <Picker.Item label="Hindi" value="hi" />
              <Picker.Item label="Tamil" value="ta" />
              <Picker.Item label="Marathi" value="mr" />
              <Picker.Item label="Urdu" value="ur" />
              <Picker.Item label="Telugu" value="te" />
              <Picker.Item label="Malayalam" value="ml" />
              <Picker.Item label="Punjabi" value="pa" />
              <Picker.Item label="Gujarati" value="gu" />
              <Picker.Item label="Bengali" value="bn" />
            </Picker>
          </View>
        </View>

        {audioUri && !submitted && (
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={submitAudio}
            disabled={loading}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="language" size={24} color="#fff" />
            </View>
            <Text style={styles.buttonText}>
              {loading ? 'Translating...' : 'Translate Audio'}
            </Text>
          </TouchableOpacity>
        )}

        {loading && (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={{ marginVertical: 20 }}
          />
        )}

        {translatedText ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Translation Result</Text>
            <ScrollView style={styles.translationScroll}>
              <Text style={styles.translationText}>{translatedText}</Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.button, styles.readButton]}
              onPress={handleReadAloud}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="volume-high" size={24} color="#fff" />
              </View>
              <Text style={styles.buttonText}>Read Aloud</Text>
            </TouchableOpacity>
          </View>
        ) : (
          submitted &&
          !loading && (
            <Text style={styles.errorText}>No translation available</Text>
          )
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 30,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
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
  button: {
    flexDirection: 'row',
    backgroundColor: 'rgba(37, 38, 75, 0.47)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  submitButton: {
    backgroundColor: 'rgba(243, 156, 18, 0.7)',
  },
  readButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.7)',
    marginTop: 15,
  },
  iconContainer: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: 25,
  },
  pickerLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  picker: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  translationScroll: {
    maxHeight: 200,
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
  },
  errorText: {
    color: 'rgba(255, 99, 71, 0.9)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});