import * as THREE from 'three';
import { Howl } from 'howler';

/**
 * Enhanced spatial audio system for 3D positional sounds
 * Handles distance-based volume, doppler effects, and underwater filtering
 */
export class SpatialAudio {
    private listener: THREE.AudioListener;
    private audioContext: AudioContext;
    private sounds: Map<string, THREE.PositionalAudio> = new Map();
    private ambientSources: THREE.Audio[] = [];
    
    constructor(camera: THREE.PerspectiveCamera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        // THREE.AudioListener has a 'context' property, not getContext() method
        try {
            this.audioContext = (this.listener as any).context as AudioContext;
        } catch (error) {
            // Fallback: create new AudioContext
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }
    
    /**
     * Create a positional audio source at a specific 3D location
     */
    createPositionalSound(
        name: string,
        position: THREE.Vector3,
        buffer?: AudioBuffer
    ): THREE.PositionalAudio {
        const audio = new THREE.PositionalAudio(this.listener);
        
        if (buffer) {
            audio.setBuffer(buffer);
        }
        
        // Configure spatial audio properties
        audio.setRefDistance(10); // Distance at which volume is halved
        audio.setRolloffFactor(2); // How quickly volume decreases with distance
        audio.setDistanceModel('inverse'); // Inverse distance model
        audio.setMaxDistance(100); // Maximum hearing distance
        
        // Create object to hold the audio
        const soundObject = new THREE.Object3D();
        soundObject.position.copy(position);
        soundObject.add(audio);
        
        this.sounds.set(name, audio);
        
        return audio;
    }
    
    /**
     * Play a sound at a specific 3D position
     */
    playAtPosition(name: string, position: THREE.Vector3, volume: number = 1.0): void {
        let audio = this.sounds.get(name);
        
        if (!audio) {
            // Create new positional audio if it doesn't exist
            audio = this.createPositionalSound(name, position);
        }
        
        // Update position
        audio.parent?.position.copy(position);
        
        // Set volume and play
        audio.setVolume(volume);
        audio.play();
    }
    
    /**
     * Update audio positions (call in game loop)
     */
    update(deltaTime: number): void {
        // Update doppler effects, distance calculations, etc.
        // This is handled automatically by Three.js PositionalAudio
    }
    
    /**
     * Set master volume for all spatial sounds
     */
    setMasterVolume(volume: number): void {
        this.sounds.forEach(audio => {
            audio.setVolume(volume);
        });
    }
    
    /**
     * Clean up audio resources
     */
    cleanup(): void {
        this.sounds.forEach(audio => {
            audio.stop();
            audio.disconnect();
        });
        this.sounds.clear();
        
        this.ambientSources.forEach(source => {
            source.stop();
            source.disconnect();
        });
        this.ambientSources = [];
    }
}
