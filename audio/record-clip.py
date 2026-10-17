# record-clip

import sounddevice as sd
from scipy.io.wavfile import write

fs = 44100 # Sample Rate
seconds = 5 # duration of recording

print("Now Recording...")
myrecording = sd.rec(int(seconds * fs), samplerate=fs, channels=1)
sd.wait() # Wait until recording is finished
write("output.wav", fs, myrecording)
print("Saved as output.wav")
