import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function UploadScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        console.log('Picked file:', result.assets[0]);
      } else {
        console.log('No file selected');
      }
    } catch (error) {
      console.error('Error picking file:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      Alert.alert('No file selected ‼️', 'Please choose an audio file first.');
      return;
    }

    setIsLoading(true); // Start loading

    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType || 'audio/wav',
    } as any);

    try {
      const response = await fetch('http://127.0.0.1:8000/detect-language/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Response:', data);
      Alert.alert('Detected Language', data.language || 'Unknown');
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'Failed to upload file.');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <LinearGradient
      colors={['#6a11cb', '#2575fc']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Upload Audio File</Text>
        <Text style={styles.description}>
          Detect from 10 Indian languages: Hindi, Kannada, Tamil, Malayalam, 
          Marathi, Punjabi, Urdu, Bengali, Gujarati, Telugu.
        </Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={pickAudio}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="file-upload" size={24} color="#fff" />
          </View>
          <Text style={styles.buttonText}>
            {selectedFile ? selectedFile.name : 'Choose Audio File'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-upload" size={24} color="#fff" />
          </View>
          <Text style={styles.buttonText}>Upload & Detect</Text>
        </TouchableOpacity>

        {isLoading && (
          <ActivityIndicator 
            size="large" 
            color="#fff" 
            style={{ marginTop: 20 }} 
          />
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
    fontSize: 40, 
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
  submitButton: {
    backgroundColor: 'rgba(243, 156, 18, 0.7)',
    borderColor: 'rgb(255, 255, 255)',
  },
  iconContainer: {},
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600',
    marginLeft: 10,
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
