import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LiveScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingURI, setRecordingURI] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  };

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
      setFeedback(null);

      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      showCustomAlert('Recording Error', 'Failed to start recording');
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
      showCustomAlert('Recording Error', 'Failed to stop recording');
      console.error('Failed to stop recording:', err);
    }
  };

  const languageMapping = {
    en: 'English',
    ta: 'Tamil',
    hi: 'Hindi',
    kn: 'Kannada',
    ml: 'Malayalam',
    mr: 'Marathi',
    pa: 'Punjabi',
    ur: 'Urdu',
    bn: 'Bengali',
    gu: 'Gujarati',
    te: 'Telugu',
  };

  const handleUpload = async () => {
    if (!recordingURI) {
      showCustomAlert('No Recording', 'Please record audio first');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: recordingURI,
      type: 'audio/x-wav',
      name: 'audio.wav',
    } as any);

    try {
      const response = await fetch('https://cb88-2402-3a80-ce5-6008-bc2d-7620-58b6-42da.ngrok-free.app/detect/live-audio', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.language) {
        const fullLanguageName = languageMapping[data.language] || data.language;
        setDetectedLanguage(fullLanguageName);
      } else if (data.error) {
        showCustomAlert('Detection Error', data.error);
      }
    } catch (err) {
      showCustomAlert('Upload Error', 'Failed to upload audio');
      console.error('Upload failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (type: string) => {
    setFeedback(type);
    // Here you could send the feedback to your backend
    console.log(`User feedback: ${type}`);
    showCustomAlert('Feedback Received', `Thank you for your ${type === 'thumbs-up' ? 'positive' : 'negative'} feedback!`);
  };

  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
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
              disabled={isLoading}
            >
              <View style={styles.iconContainer}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="cloud-upload" size={28} color="#fff" />
                )}
              </View>
              <Text style={styles.buttonText}>
                {isLoading ? 'Detecting...' : 'Upload & Detect'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.duration}>
          {isRecording ? 'Recording' : 'Recorded'} Time: {duration}s
        </Text>

        {detectedLanguage && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>Detected Language:</Text>
            <Text style={styles.languageText}>{detectedLanguage}</Text>

            {/* Feedback Buttons */}
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>Is this detection correct?</Text>
              <View style={styles.feedbackButtons}>
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
    padding: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
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
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resultText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 5,
  },
  languageText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
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