import WebSocket,{type RawData }  from 'ws'; // Importar Buffer explícitamente para claridad
import { Constants } from '../config/constants';
import { writeFile } from 'fs/promises';
import { Buffer } from 'buffer';
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
    private audio_format: string = 'mp3';
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

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private validatePitch(pitch: string | number): string {
        if (typeof pitch === 'number') {
            return `${pitch}Hz`;
        }
        if (!/^(-?\d{1,3}Hz)$/.test(pitch)) {
            throw new Error("Invalid pitch format. Expected format: '-100Hz to 100Hz' or a number.");
        }
        return pitch;
    }

    private validateRate(rate: string | number): string {
        if (typeof rate === 'number') {
            return `${rate}%`;
        }
        if (!/^(-?\d{1,3}%)$/.test(rate)) {
            throw new Error("Invalid rate format. Expected format: '0% to 100%' or a number.");
        }
        return rate;
    }

    private validateVolume(volume: string | number): string {
        if (typeof volume === 'number') {
            return `${volume}%`;
        }
        if (!/^(-?\d{1,3}%)$/.test(volume)) {
            throw new Error("Invalid volume format. Expected format: '100% to 100%' or a number.");
        }
        return volume;
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
                const message = this.buildTTSConfigMessage();
                this.ws.send(message);

                const speechMessage = `X-RequestId:${req_id}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}Z\r\nPath:ssml\r\n\r\n${SSML_text}`;
                this.ws.send(speechMessage);
            });

            this.ws.on('message', (data: RawData) => {
                this.processAudioData(data);
            });

            this.ws.on('error', (err) => {
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

    private buildTTSConfigMessage(): string {
        return `X-Timestamp:${new Date().toISOString()}Z\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
            `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":true},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
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


    async toFile(outputPath: string): Promise<string> {
        const audioBuffer = this.toBuffer(); 
        const finalPath = `${outputPath}.${this.audio_format}`;
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