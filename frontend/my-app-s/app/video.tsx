import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AudioScreen() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [audioURI, setAudioURI] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAudioURI(file.uri);
        setFileName(file.name || 'Selected audio file');
      } else {
        Alert.alert('No file selected', 'Please select an audio file');
      }
    } catch (err) {
      console.error('File picker error:', err);
      Alert.alert('Error', 'Failed to pick a file');
    }
  };

  const handleUpload = async () => {
    if (!audioURI) {
      Alert.alert('No file selected', 'Please select an audio file first');
      return;
    }

    const fileExtension = audioURI.split('.').pop();
    let mimeType = 'audio/mpeg';

    if (fileExtension === 'wav') {
      mimeType = 'audio/wav';
    } else if (fileExtension === 'm4a') {
      mimeType = 'audio/mp4';
    }

    const formData = new FormData();
    formData.append('file', {
      uri: audioURI,
      type: mimeType,
      name: `audio.${fileExtension}`,
    } as any);

    setIsProcessing(true);

    try {
      const response = await fetch('https://cb88-2402-3a80-ce5-6008-bc2d-7620-58b6-42da.ngrok-free.app/caption/live-audio/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.caption) {
        setCaption(data.caption);
        Alert.alert('Success', 'Caption generated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to generate caption');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      Alert.alert('Error', 'Failed to upload audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!caption) return;

    try {
      const path = FileSystem.documentDirectory + 'caption.txt';
      await FileSystem.writeAsStringAsync(path, caption, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          dialogTitle: 'Share Caption File',
          mimeType: 'text/plain',
        });
      } else {
        Alert.alert('Success', 'Caption saved to your device');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save caption file');
    }
  };

  const handleFeedback = (feedback: string) => {
    setFeedback(feedback);
    console.log(`User feedback: ${feedback}`);
  };

  return (
    <LinearGradient
      colors={['#6a11cb', '#2575fc']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Audio Caption Generator</Text>
        <Text style={styles.description}>
          Upload an audio file to generate automatic captions
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={pickAudioFile}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="file-upload" size={24} color="#fff" />
          </View>
          <Text style={styles.buttonText}>
            {fileName || 'Choose Audio File'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleUpload}
          disabled={isProcessing || !audioURI}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-upload" size={24} color="#fff" />
          </View>
          <Text style={styles.buttonText}>
            {isProcessing ? 'Processing...' : 'Generate Caption'}
          </Text>
        </TouchableOpacity>

        {isProcessing && (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={{ marginTop: 20 }}
          />
        )}

        {caption && (
          <View style={styles.resultContainer}>
            <Text style={styles.subtitle}>Generated Caption</Text>
            <ScrollView style={styles.captionScroll}>
              <Text style={styles.captionText}>{caption}</Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.button, styles.downloadButton]}
              onPress={handleDownload}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="download" size={24} color="#fff" />
              </View>
              <Text style={styles.buttonText}>Download Caption</Text>
            </TouchableOpacity>

            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>Is this caption accurate?</Text>
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  onPress={() => handleFeedback('thumbs-up')}
                >
                  <Ionicons
                    name="thumbs-up"
                    size={30}
                    color={feedback === 'thumbs-up' ? '#4CAF50' : 'rgba(255,255,255,0.7)'}
                    style={styles.feedbackIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFeedback('thumbs-down')}
                >
                  <Ionicons
                    name="thumbs-down"
                    size={30}
                    color={feedback === 'thumbs-down' ? '#F44336' : 'rgba(255,255,255,0.7)'}
                    style={styles.feedbackIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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
    padding: 30,
    justifyContent: 'center',
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
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  downloadButton: {
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  captionScroll: {
    maxHeight: 200,
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
  },
  captionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
  },
  feedbackContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  feedbackText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 10,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  feedbackIcon: {
    marginHorizontal: 20,
  },
});