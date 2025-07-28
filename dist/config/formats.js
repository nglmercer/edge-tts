export const AUDIO_FORMATS_STREAM = {
    // RAW PCM
    'raw-8khz-8bit-mono-alaw': 'audio/basic',
    'raw-8khz-8bit-mono-mulaw': 'audio/basic',
    'raw-8khz-16bit-mono-pcm': 'audio/basic',
    'raw-16khz-16bit-mono-pcm': 'audio/basic',
    'raw-22050hz-16bit-mono-pcm': 'audio/basic',
    'raw-24khz-16bit-mono-pcm': 'audio/basic',
    'raw-44100hz-16bit-mono-pcm': 'audio/basic',
    'raw-48khz-16bit-mono-pcm': 'audio/basic',
    // TRUESILK
    'raw-16khz-16bit-mono-truesilk': 'audio/SILK',
    'raw-24khz-16bit-mono-truesilk': 'audio/SILK',
    // MP3
    'audio-16khz-32kbitrate-mono-mp3': 'audio/mpeg',
    'audio-16khz-64kbitrate-mono-mp3': 'audio/mpeg',
    'audio-16khz-128kbitrate-mono-mp3': 'audio/mpeg',
    'audio-24khz-48kbitrate-mono-mp3': 'audio/mpeg',
    'audio-24khz-96kbitrate-mono-mp3': 'audio/mpeg',
    'audio-24khz-160kbitrate-mono-mp3': 'audio/mpeg',
    'audio-48khz-96kbitrate-mono-mp3': 'audio/mpeg',
    'audio-48khz-192kbitrate-mono-mp3': 'audio/mpeg',
    // OPUS in container
    'audio-16khz-16bit-32kbps-mono-opus': 'audio/opus',
    'audio-24khz-16bit-24kbps-mono-opus': 'audio/opus',
    'audio-24khz-16bit-48kbps-mono-opus': 'audio/opus',
    // OGG
    'ogg-16khz-16bit-mono-opus': 'audio/ogg; codecs=opus; rate=16000',
    'ogg-24khz-16bit-mono-opus': 'audio/ogg; codecs=opus; rate=24000',
    'ogg-48khz-16bit-mono-opus': 'audio/ogg; codecs=opus; rate=48000',
    // WEBM
    'webm-16khz-16bit-mono-opus': 'audio/webm; codec=opus',
    'webm-24khz-16bit-mono-opus': 'audio/webm; codec=opus',
    'webm-24khz-16bit-24kbps-mono-opus': 'audio/webm; codec=opus',
    'amr-wb-16000hz': 'audio/amr-wb',
    'g722-16khz-64kbps': 'audio/g722'
};
export const AUDIO_FORMATS_NON_STREAM = {
    // RIFF (WAV)
    'riff-8khz-8bit-mono-alaw': 'audio/x-wav',
    'riff-8khz-8bit-mono-mulaw': 'audio/x-wav',
    'riff-8khz-16bit-mono-pcm': 'audio/x-wav',
    'riff-22050hz-16bit-mono-pcm': 'audio/x-wav',
    'riff-24khz-16bit-mono-pcm': 'audio/x-wav',
    'riff-44100hz-16bit-mono-pcm': 'audio/x-wav',
    'riff-48khz-16bit-mono-pcm': 'audio/x-wav',
};
const ALL_AUDIO_FORMATS = { ...AUDIO_FORMATS_STREAM, ...AUDIO_FORMATS_NON_STREAM };
const FORMAT_CONTENT_TYPE = new Map(Object.entries(ALL_AUDIO_FORMATS));
export { ALL_AUDIO_FORMATS, FORMAT_CONTENT_TYPE };
//# sourceMappingURL=formats.js.map