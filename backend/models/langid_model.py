import torch
import torch.nn as nn
import librosa
import numpy as np

# --- Model Definition (should match training model exactly) ---
class CNNBiLSTM(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv1d(40, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool1d(2)
        self.lstm = nn.LSTM(input_size=64, hidden_size=128, num_layers=1,
                            batch_first=True, bidirectional=True)
        self.fc = nn.Linear(128 * 2, 10)

    def forward(self, x):
        x = x.permute(0, 2, 1)  # (B, 40, 100)
        x = self.pool(torch.relu(self.conv1(x)))  # (B, 64, 50)
        x = x.permute(0, 2, 1)  # (B, 50, 64)
        lstm_out, _ = self.lstm(x)
        out = lstm_out[:, -1, :]  # last timestep
        return self.fc(out)

# --- Language List ---
LANGUAGES = ["hindi", "kannada", "tamil", "malayalam", "marathi",
             "punjabi", "urdu", "bengali", "gujarati", "telugu"]

# --- Device & Load Model ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = CNNBiLSTM().to(device)
model.load_state_dict(torch.load("models/cnn_bilstm_langid.pth", map_location=device))
model.eval()

# --- Feature Extraction Function (same as training) ---
def extract_features(file_path, max_len=100):
    audio, sr = librosa.load(file_path, sr=16000, duration=3)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40).T
    if mfcc.shape[0] < max_len:
        mfcc = np.pad(mfcc, ((0, max_len - mfcc.shape[0]), (0, 0)))
    else:
        mfcc = mfcc[:max_len]
    return mfcc

# --- Inference Function ---
def detect_language(audio_path: str) -> str:
    features = extract_features(audio_path)
    input_tensor = torch.FloatTensor(features).unsqueeze(0).to(device)  # shape: (1, 100, 40)
    with torch.no_grad():
        output = model(input_tensor)
        predicted_idx = output.argmax(1).item()
    return LANGUAGES[predicted_idx]
