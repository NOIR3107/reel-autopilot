"""Human-sounding voiceover with Chatterbox (free, open source). Runs in GitHub Actions (the model downloads there).
usage: python tools/chatter_vo.py queue/DATE.json   -> public/vo/DATE/NN.wav (default voice) and public/vo/DATE-ref/NN.wav (cloned host voice)
story_sound.py uses public/vo/DATE/ when it exists, else Kokoro."""
import json, os, sys
import torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS

q = sys.argv[1]
date = os.path.basename(q)[:-5]
scenes = json.load(open(q))['props']['scenes']
m = ChatterboxTTS.from_pretrained(device='cpu')
for tag, ref in (('', None), ('-ref', 'public/vo/ref-host.wav')):
    out = f'public/vo/{date}{tag}'
    os.makedirs(out, exist_ok=True)
    for i, sc in enumerate(scenes):
        torch.manual_seed(11 + i)
        w = m.generate(sc['vo'], exaggeration=sc.get('exag', 0.6), cfg_weight=0.45, **({'audio_prompt_path': ref} if ref else {}))
        ta.save(f'{out}/{i:02d}.wav', w, m.sr)
        print(out, i, round(w.shape[-1] / m.sr, 1), 's', flush=True)
