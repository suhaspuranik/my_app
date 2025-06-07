import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';


export default function WelcomeScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('about'); // 'about' or 'models'

  return (
    <LinearGradient
      colors={['#6a11cb', '#2575fc']}
      style={styles.container}
    >

      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => setModalVisible(true)}
      >
      <Ionicons name="information-circle-outline" size={28} color="white" />
       
      </TouchableOpacity>

      <Animatable.View
        animation="fadeInDown"
        duration={1500}
        style={styles.header}
      >

        <Image
          source={require('../assets/images/welcome.png')} // Path remains the same
          style={styles.logo}
          resizeMode="contain"
        />
      </Animatable.View>
      <Animatable.View
        animation="fadeInUp"
        duration={1500}
        style={styles.footer}
      >
        <Text style={styles.title}>Welcome to Indian Language Detection System </Text>
        <Text style={styles.subtitle}>Discover and analyze audio in 10 Indian language with our powerful detection tool</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/options')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#ff8a00', '#e52e71']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About This App</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="black" />
              </Pressable>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <Pressable
                style={[styles.tabButton, activeTab === 'about' && styles.activeTab]}
                onPress={() => setActiveTab('about')}
              >
                <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About App</Text>
              </Pressable>
              <Pressable
                style={[styles.tabButton, activeTab === 'models' && styles.activeTab]}
                onPress={() => setActiveTab('models')}
              >
                <Text style={[styles.tabText, activeTab === 'models' && styles.activeTabText]}>Our Models</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {activeTab === 'about' ? (
                <>
                  <Text style={styles.sectionTitle}>📝  App Overview</Text>
                  <Text style={styles.modalText}>
                    This app helps detect and transcribe audio in 10 Indian languages including Kannada,Hindi, Bengali, Tamil, Telugu, Malayalam,Urdu,Gujarathi,Marathi & Punjabi.
                    Our technology enables real-time translation and analysis of spoken content.
                  </Text>

                  <Text style={styles.sectionTitle}>🧾  Key Features</Text>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Support for 10 Indian languages</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Audio upload and live recording</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}> Caption extraction</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Audio translation between languages</Text>
                  </View>
                </>
              ) : (
                <>
                    <Text style={styles.sectionTitle}>📝 Model Architecture</Text>
                  <Text style={styles.modalText}>
                    Our models are based on CNN-BLSTM (Convolutional Neural Network - Bidirectional Long Short-Term Memory), fine-tuned specifically for Indian languages.
                  </Text>
                    <Text style={styles.sectionTitle}>ℹ️ About the model </Text>
                  <Text style={styles.modalText}>
                    Our CNN-BLSTM hybrid model combines convolutional feature extraction with bidirectional sequence modeling for accurate language detection from audio spectrograms.
                  </Text>
                  <Text style={styles.sectionTitle}>🔧 Training Data</Text>
                  <Text style={styles.modalText}>
                    ➊ Trained on 10,000+ hours of speech data per language
                      {'\n'}➋  Curated datasets from diverse Indian dialects
                      {'\n'}➌ Continually updated with new linguistic patterns
                  </Text>

                    <Text style={styles.sectionTitle}>⚙️ Technical Specifications</Text>
                  <Text style={styles.modalText}>
                    ➊ Accuracy: Getting around 85 %  across supported languages
                      {'\n'}➋ Latency:5000s for most translations
                      {'\n'}➌ Supports code-switching between languages
                      {'\n'}➍ Trained and tested with unseen datas
                  </Text>


                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logo: {
    width: 400,
    height: 400,
  },
  title: {
    color: '#05375a',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: 'grey',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonGradient: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
  },
  modalText: {  // This was missing
    fontSize: 16,
    color: '#333',
    textAlign: 'justify',
    marginBottom: 20,
    lineHeight: 22,

  },
  closeButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(7, 51, 245, 0.67)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Additional styles for the enhanced modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalBody: {
    maxHeight: '80%',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#2575fc',
    borderRadius:2
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#2575fc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    color: '#333',
  },

  infoButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,

  },
});