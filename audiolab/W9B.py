# W9A-demo-py: Normalize, Trim Silence, 2X Speed Up: LICENSE = NumPy: BSD, librosa: ISC, soundfile: BSD-3-Clause

import numpy as np
import librosa
import soundfile as sf

# trim starting and ending silence from the audio clip
def trim_silence(audio):
    chunk_size = 1024 # Process in 1024-sample chunks (24ms at 44.1khz)
    threshold = 0.1 # linear fraction of silence compared to max amplitude
    start = 0
    for i in range(0, len(audio), chunk_size):
        if np.max(np.abs(audio[i:i+chunk_size])) > threshold:
            start = i
            break
    # Find end index
    end = len(audio)
    for i in range(len(audio) - chunk_size, 0, -chunk_size):
        if np.max(np.abs(audio[i:i+chunk_size])) > threshold:
            end = i + chunk_size
            break
    return audio[start:end]

# Normalize audio to -1.0 to 1.0 range
def normalize_audio(audio):
    peak = np.max(np.abs(audio))
    if peak > 0:
        return audio / peak
    return audio

# Change audio speed
def change_speed(audio, rate):
    indices = (np.arange(0, len(audio) - 1, rate)).astype(int)
    return audio[indices]
    
# Read the input file
audio, samplerate = librosa.load('output.wav', sr=None, mono=True)

# Normalize
normalized = normalize_audio(audio)

# Trim silence
trimmed = trim_silence(normalized)

# Speed up 2x
sped_up = change_speed(trimmed, 2.0)

# Write output
sf.write("processed.wav", sped_up, samplerate)
