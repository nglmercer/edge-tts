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
export declare class EdgeTTS {
    private audio_stream;
    private audio_format;
    private ws;
    getVoices(): Promise<Voice[]>;
    getVoicesByLanguage(locale: string): Promise<Voice[]>;
    getVoicesByGender(gender: 'Male' | 'Female'): Promise<Voice[]>;
    private generateUUID;
    private validatePitch;
    private validateRate;
    private validateVolume;
    synthesize(text: string, voice?: string, options?: SynthesisOptions): Promise<void>;
    private getSSML;
    private buildTTSConfigMessage;
    synthesizeStream(text: string, voice?: string, options?: SynthesisOptions): AsyncGenerator<Uint8Array, void, unknown>;
    private processAudioData;
    getDuration(): number;
    getAudioInfo(): {
        size: number;
        format: string;
        estimatedDuration: number;
    };
    toFile(outputPath: string, format?: string): Promise<string>;
    toRaw(): string;
    toBase64(): string;
    toBuffer(): Buffer;
}
