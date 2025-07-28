"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynthesizeCommand = void 0;
const commander_1 = require("commander");
const EdgeTTS_1 = require("../services/EdgeTTS");
exports.SynthesizeCommand = new commander_1.Command('synthesize')
    .description('Edge TTS: synthesize text to audio')
    .option('-t, --text <text>', 'Text to convert to audio')
    .option('-v, --voice [voice]', 'Voice to use for the audio synthesis', 'en-US-AriaNeural')
    .option('-r, --rate [rate]', 'Rate of speech', '0%')
    .option('-l, --volume [volume]', 'Volume of speech', '0%')
    .option('-p, --pitch [pitch]', 'Pitch of speech', '0Hz')
    .option('-o, --output [output]', 'Output file name', `output_${Date.now()}`)
    .action(async (options) => {
    const { text, voice, pitch, rate, volume, output } = options;
    if (!text) {
        console.error('Text is required');
        process.exit(1);
    }
    const tts = new EdgeTTS_1.EdgeTTS();
    await tts.synthesize(text, voice, { pitch, rate, volume });
    await tts.toFile(`${output}`);
    console.log(`Audio file generated: ${output}.mp3`);
});
