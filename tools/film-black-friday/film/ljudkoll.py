"""Matning av ljudet (eftersom ingen lyssnar har): niva per halvsekund och per frekvensband."""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

sr, x = wavfile.read(sys.argv[1] if len(sys.argv) > 1 else "out/ljud.wav")
x = x.astype(np.float64) / 32768.0
mono = x.mean(axis=1)
band = {"sub<60": (20, 60), "bas 60-200": (60, 200), "lagmell 200-800": (200, 800), "mell 800-3k": (800, 3000), "disk 3k-12k": (3000, 12000)}
filt = {k: signal.butter(4, v, "band", fs=sr, output="sos") for k, v in band.items()}
bx = {k: signal.sosfilt(s, mono) for k, s in filt.items()}
def db(v): return 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-9)
print("tid    total  " + "  ".join(f"{k:>15}" for k in band))
steg = 0.5
for i in range(int(len(mono) / sr / steg)):
    a, b = int(i * steg * sr), int((i + 1) * steg * sr)
    print(f"{i*steg:5.1f}  {db(mono[a:b]):6.1f}  " + "  ".join(f"{db(bx[k][a:b]):15.1f}" for k in band))
print("hela   %6.1f  " % db(mono) + "  ".join(f"{db(bx[k]):15.1f}" for k in band))
# korrelation mellan kanalerna (monokompatibilitet)
print("stereokorrelation: %.2f" % np.corrcoef(x[:, 0], x[:, 1])[0, 1])
