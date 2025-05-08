import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';


export default function GreetScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const handleOption = (option: string) => {
    console.log("Selected:", option);
    
  };

  // Calculate screen width for responsive layout
  const { width } = Dimensions.get('window');
  const boxSize = width * 0.4; // 40% of screen width

  return (
    <LinearGradient
      colors={['#6a11cb', '#2575fc']}
      style={styles.container}
    >
      {/* Info icon in top right corner */}
      <TouchableOpacity 
        style={styles.infoButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="information-circle-outline" size={28} color="white" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>🎯 Pick One !!</Text>
        <Text style={styles.subtitle}>Choose your detection method and prove me wrong !</Text>

        <View style={styles.gridContainer}>
          {/* Option 1 */}
          <TouchableOpacity 
            style={[styles.box, { width: boxSize, height: boxSize }]} 
            onPress={() => router.push('/upload')}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons name="file-upload" size={32} color="#fff" />
            </View>
            <Text style={styles.boxText}> Upload Audio</Text>
          </TouchableOpacity>

          {/* Option 2 */}
          <TouchableOpacity 
            style={[styles.box, { width: boxSize, height: boxSize }]} 
            onPress={() => router.push('/live')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="mic" size={32} color="#fff" />
            </View>
            <Text style={styles.boxText}>Live Audio</Text>
          </TouchableOpacity>

          {/* Option 3 */}
          <TouchableOpacity 
            style={[styles.box, { width: boxSize, height: boxSize }]} 
            onPress={() => router.push('/video')}
          >
            <View style={styles.iconContainer}>
              <FontAwesome name="cc" size={32} color="#fff" />
            </View>
            <Text style={styles.boxText}>Video Captioning</Text>
          </TouchableOpacity>

          {/* Option 4 */}
          <TouchableOpacity 
            style={[styles.box, { width: boxSize, height: boxSize }]} 
            onPress={() => router.push('/translate')}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="translate" size={32} color="#fff" />
            </View>
            <Text style={styles.boxText}>Translation</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About These Options</Text>
              <MaterialCommunityIcons name="translate" size={32} color="black" />
            </View>
            <Text style={styles.modalText}>
              Choose between these detection methods:
              {'\n\n'}1️⃣ Upload Audio: Select an audio file from your device 
              {'\n\n'}2️⃣ Live Audio: Record audio in real-time
              {'\n\n'}3️⃣ Video Captioning: Extract and translate audio from videos
              {'\n\n'}4️⃣ Translation: Get text translations between supported languages
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Got It!</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  content: {
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
  },
  infoButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  title: { 
    fontSize: 40, 
    fontWeight: 'bold', 
    marginBottom: 5, 
    textAlign: 'center',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(254, 254, 254, 0.22)',
    elevation: 5,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconContainer: {
    backgroundColor: '#007BFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderColor: 'rgba(7, 7, 7, 0.6)',
  },
  boxText: { 
    color: 'black', 
    fontSize: 16, 
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 10,
    color: 'black',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    marginBottom: 25,
    lineHeight: 22,
  },
  closeButton: {
    alignSelf: 'center',
    backgroundColor: '#2575fc',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});