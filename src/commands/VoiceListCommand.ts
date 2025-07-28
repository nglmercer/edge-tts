import { Command } from 'commander';
import { EdgeTTS } from '../services/EdgeTTS.js';

export const VoiceListCommand = new Command('voice-list')
  .description('Get the list of available voices')
  .action(async () => {
    const tts = new EdgeTTS();
    const voices = await tts.getVoices();

    console.log('Lista de voces disponibles:');
    voices.forEach((voice) => {
      console.log(` - ${voice.ShortName}`);
    });
  });
