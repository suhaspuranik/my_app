import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';

export default function UploadScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [languageData, setLanguageData] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      } else {
        showCustomAlert('No File Selected', 'You did not select any audio file');
      }
    } catch (error) {
      showCustomAlert('Error', 'Failed to pick audio file');
      console.error('Error picking file:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      showCustomAlert('No File Selected', 'Please choose an audio file first.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType || 'audio/wav',
    } as any);

    try {
      const response = await fetch('https://cb88-2402-3a80-ce5-6008-bc2d-7620-58b6-42da.ngrok-free.app/detect-language/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.language) {
        setLanguageData(data);
        showCustomAlert('Language Detected', `Detected language: ${data.language}`);
      } else {
        showCustomAlert('Error', 'No language detected in the audio');
      }
    } catch (err) {
      showCustomAlert('Error', 'Failed to upload and process the file');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (feedback: string) => {
    setFeedback(feedback);
    showCustomAlert('Feedback Received', `Thank you for your ${feedback === 'thumbs-up' ? 'positive' : 'negative'} feedback!`);
  };

  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Upload Audio File</Text>
        <Text style={styles.description}>
          Detect from 10 Indian languages: Hindi, Kannada, Tamil, Malayalam,
          Marathi, Punjabi, Urdu, Bengali, Gujarati, Telugu.
        </Text>

        <TouchableOpacity style={styles.button} onPress={pickAudio}>
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
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Upload & Detect'}
          </Text>
        </TouchableOpacity>

        {isLoading && (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
        )}

        {languageData?.confidence && (
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceTitle}>Prediction Confidence</Text>
            {Object.entries(languageData.confidence).map(([lang, conf]: [string, number]) => (
              <View key={lang} style={styles.progressBarContainer}>
                <Text style={styles.languageText}>{lang}</Text>
                <ProgressBar
                  progress={conf}
                  color="rgba(243, 156, 18, 0.7)"
                  style={styles.progressBar}
                />
              </View>
            ))}
          </View>
        )}

        {languageData?.language && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>Is this prediction correct?</Text>
            <View style={styles.feedbackButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.feedbackButton,
                  feedback === 'thumbs-up' && styles.feedbackButtonActive
                ]}
                onPress={() => handleFeedback('thumbs-up')}
              >
                <Ionicons
                  name="thumbs-up"
                  size={30}
                  color={feedback === 'thumbs-up' ? '#4CAF50' : '#fff'}
                />
                <Text style={styles.feedbackButtonText}>Correct</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackButton,
                  feedback === 'thumbs-down' && styles.feedbackButtonActive
                ]}
                onPress={() => handleFeedback('thumbs-down')}
              >
                <Ionicons
                  name="thumbs-down"
                  size={30}
                  color={feedback === 'thumbs-down' ? '#F44336' : '#fff'}
                />
                <Text style={styles.feedbackButtonText}>Incorrect</Text>
              </TouchableOpacity>
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

        {/* Custom Alert Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showAlert}
          onRequestClose={() => setShowAlert(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{alertTitle}</Text>
              <Text style={styles.modalText}>{alertMessage}</Text>
              <Pressable
                style={[styles.modalButton, styles.modalButtonClose]}
                onPress={() => setShowAlert(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
    marginBottom: 40,
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
  confidenceContainer: {
    marginTop: 30,
  },
  confidenceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  languageText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  feedbackContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  feedbackButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  feedbackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 120,
  },
  feedbackButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  feedbackButtonText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 14,
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  modalButton: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonClose: {
    backgroundColor: '#2575fc',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

