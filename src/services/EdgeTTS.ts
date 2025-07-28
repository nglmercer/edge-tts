import WebSocket, { type RawData } from 'ws';
import { Constants } from '../config/constants';
import { writeFile } from 'fs/promises';
import { Buffer } from 'buffer';
import { type AudioOutputFormat  } from '../config/formats';
export interface Voice {
    Name: string;
    ShortName: string;
    Gender: string;
    Locale: string;
    FriendlyName: string;
}

export interface SynthesisOptions {
    pitch?: string | number;
    rate?: string | number;
    volume?: string | number;
    format?: AudioOutputFormat;
}

function ensureBuffer(data: RawData): Buffer {
    if (Buffer.isBuffer(data)) {
        return data;
    }
    if (data instanceof ArrayBuffer) {
        return Buffer.from(data);
    }
    if (Array.isArray(data)) {
        return Buffer.concat(data as unknown as Uint8Array[]);
    }
    if (typeof data === 'string') {
        return Buffer.from(data, 'utf-8');
    }
    throw new Error(`Unsupported RawData type: ${typeof data}`);
}

export class EdgeTTS {
    private audio_stream: Uint8Array[] = [];
    private output_format: AudioOutputFormat = 'audio-24khz-48kbitrate-mono-mp3';
    private ws!: WebSocket;

    async getVoices(): Promise<Voice[]> {
        const response = await fetch(`${Constants.VOICES_URL}?trustedclienttoken=${Constants.TRUSTED_CLIENT_TOKEN}`);
        const data = await response.json();
        return data.map((voice: any) => {
            delete voice.VoiceTag;
            delete voice.SuggestedCodec;
            delete voice.Status;
            return voice;
        });
    }

    async getVoicesByLanguage(locale: string): Promise<Voice[]> {
        const voices = await this.getVoices();
        return voices.filter(voice => voice.Locale.startsWith(locale));
    }

    async getVoicesByGender(gender: 'Male' | 'Female'): Promise<Voice[]> {
        const voices = await this.getVoices();
        return voices.filter(voice => voice.Gender === gender);
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private validatePitch(pitch: string | number): string {
        if (typeof pitch === 'number') {
            return (pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`);
        }
        if (!/^[+-]?\d{1,3}(?:\.\d+)?Hz$/.test(pitch)) {
            throw new Error("Invalid pitch format. Expected format: '-100Hz to +100Hz' or a number.");
        }
        return pitch;
    }

    private validateRate(rate: string | number): string {
        let rateValue: number;
        if (typeof rate === 'string') {
            rateValue = parseFloat(rate.replace('%', ''));
            if (isNaN(rateValue)) throw new Error("Invalid rate format.");
        } else {
            rateValue = rate;
        }

        if (rateValue >= 0) {
            return `+${rateValue}%`;
        }
        return `${rateValue}%`;
    }

    private validateVolume(volume: string | number): string {
        let volumeValue: number;
        if (typeof volume === 'string') {
            volumeValue = parseInt(volume.replace('%', ''), 10);
            if (isNaN(volumeValue)) throw new Error("Invalid volume format.");
        } else {
            volumeValue = volume;
        }

        if (volumeValue < -100 || volumeValue > 100) {
            throw new Error("Volume cannot be negative. Expected a value from -100% to 100% (or more).");
        }

        return `${volumeValue}%`;
    }
    async synthesize(text: string, voice: string = 'en-US-AnaNeural', options: SynthesisOptions = {}): Promise<void> {
        return new Promise((resolve, reject) => {
            this.audio_stream = [];
            const req_id = this.generateUUID();
            this.ws = new WebSocket(`${Constants.WSS_URL}?trustedclienttoken=${Constants.TRUSTED_CLIENT_TOKEN}&ConnectionId=${req_id}`);

            const SSML_text = this.getSSML(text, voice, options);
            const timeout = setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close();
                }
                reject(new Error("Synthesis timeout"));
            }, 30000);
            this.ws.on('open', () => {
                const message = this.buildTTSConfigMessage(options.format);
                this.ws.send(message);

                const speechMessage = `X-RequestId:${req_id}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}Z\r\nPath:ssml\r\n\r\n${SSML_text}`;
                this.ws.send(speechMessage);
            });

            this.ws.on('message', (data: RawData) => {
                this.processAudioData(data);
            });

            this.ws.on('error', (err: any) => {
                clearTimeout(timeout);
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close();
                }
                reject(err);
            });

            this.ws.on('close', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }

    private getSSML(text: string, voice: string, options: SynthesisOptions = {}): string {
        if (typeof options.pitch === 'string') {
            options.pitch = options.pitch.replace('hz', 'Hz');
        }

        const pitch = this.validatePitch(options.pitch ?? 0);
        const rate = this.validateRate(options.rate ?? 0);
        const volume = this.validateVolume(options.volume ?? 0);

        return `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'><prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>${text}</prosody></voice></speak>`;
    }

    private buildTTSConfigMessage(outputFormat: AudioOutputFormat = this.output_format): string {
        this.output_format = outputFormat;
        const formattedOutput = `"${outputFormat}"`;

        return `X-Timestamp:${new Date().toISOString()}Z\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
            `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":true},"outputFormat":${formattedOutput}}}}}`;
    }
    private getFileExtension(): string {
        const format = this.output_format;
        if (format.includes('mp3')) return 'mp3';
        if (format.includes('riff')) return 'wav';
        if (format.includes('ogg')) return 'ogg';
        if (format.includes('webm')) return 'webm';
        if (format.includes('pcm')) return 'pcm'; 
        if (format.includes('truesilk')) return 'silk';

        return 'audio';
    }


    async *synthesizeStream(text: string, voice: string = 'en-US-AnaNeural', options: SynthesisOptions = {}): AsyncGenerator<Uint8Array, void, unknown> {
        this.audio_stream = [];
        const req_id = this.generateUUID();
        this.ws = new WebSocket(`${Constants.WSS_URL}?trustedclienttoken=${Constants.TRUSTED_CLIENT_TOKEN}&ConnectionId=${req_id}`);

        const SSML_text = this.getSSML(text, voice, options);

        const queue: Uint8Array[] = [];
        let done = false;
        let error: Error | null = null;
        let notify: (() => void) | null = null;

        const push = (chunk: Uint8Array) => {
            queue.push(chunk);
            if (notify) {
                notify();
                notify = null;
            }
        };

        const timeout = setTimeout(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
        }, 30000);

        this.ws.on('open', () => {
            const message = this.buildTTSConfigMessage();
            this.ws.send(message);

            const speechMessage = `X-RequestId:${req_id}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}Z\r\nPath:ssml\r\n\r\n${SSML_text}`;
            this.ws.send(speechMessage);
        });

        this.ws.on('message', (data: RawData) => {
            const buffer = ensureBuffer(data);
            const needle = Buffer.from('Path:audio\r\n');

            const audioStartIndex = buffer.indexOf(new Uint8Array(needle));

            if (audioStartIndex !== -1) {
                const audioChunk = buffer.subarray(audioStartIndex + needle.length);
                const chunk = new Uint8Array(audioChunk);
                this.audio_stream.push(chunk);
                push(chunk);
            }

            if (buffer.toString().includes('Path:turn.end')) {
                this.ws?.close();
            }
        });

        this.ws.on('error', (err: any) => {
            error = err;
            done = true;
            if (notify) {
                notify();
                notify = null;
            }
        });

        this.ws.on('close', () => {
            clearTimeout(timeout);
            done = true;
            if (notify) {
                notify();
                notify = null;
            }
        });

        while (!done || queue.length > 0) {
            if (queue.length === 0) {
                await new Promise<void>(resolve => (notify = resolve));
                continue;
            }
            const chunk = queue.shift();
            if (chunk) {
                yield chunk;
            }
        }

        if (error) {
            throw error;
        }
    }

    private processAudioData(data: RawData): void {
        const buffer = ensureBuffer(data);
        const needle = Buffer.from("Path:audio\r\n");

        const audioStartIndex = buffer.indexOf(new Uint8Array(needle));

        if (audioStartIndex !== -1) {
            const audioChunk = buffer.subarray(audioStartIndex + needle.length);
            this.audio_stream.push(new Uint8Array(audioChunk));
        }

        if (buffer.toString().includes("Path:turn.end")) {
            this.ws?.close();
        }
    }

    getDuration(): number {
        if (this.audio_stream.length === 0) {
            throw new Error("No audio data available");
        }
        // Estimate duration based on the size of the audio stream
        const bufferSize = this.toBuffer().length;
        const estimatedDuration = bufferSize / (24000 * 3); // 24000 Hz sample rate, 3 bytes per sample (16-bit stereo)
        return estimatedDuration;
    }

    getAudioInfo(): { size: number; format: string; estimatedDuration: number } {
        const buffer = this.toBuffer();
        return {
            size: buffer.length,
            format: this.audio_format,
            estimatedDuration: this.getDuration()
        };
    }

    async toFile(outputPath: string): Promise<string> {
        const audioBuffer = this.toBuffer();
        const extension = this.getFileExtension();
        const finalPath = `${outputPath}.${extension}`;
        
        await writeFile(finalPath, new Uint8Array(audioBuffer));
        return finalPath;
    }

    toRaw(): string {
        return this.toBase64();
    }

    toBase64(): string {
        return this.toBuffer().toString('base64');
    }
    
    toBuffer(): Buffer {
        if (this.audio_stream.length === 0) {
            throw new Error("No audio data available. Did you run synthesize() first?");
        }
        return Buffer.concat(this.audio_stream);
    }
}