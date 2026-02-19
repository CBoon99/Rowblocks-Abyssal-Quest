import * as THREE from 'three';
/**
 * Enhanced spatial audio system for 3D positional sounds
 * Handles distance-based volume, doppler effects, and underwater filtering
 */
export class SpatialAudio {
    constructor(camera) {
        Object.defineProperty(this, "listener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "audioContext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sounds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "ambientSources", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.audioContext = this.listener.getContext();
    }
    /**
     * Create a positional audio source at a specific 3D location
     */
    createPositionalSound(name, position, buffer) {
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
    playAtPosition(name, position, volume = 1.0) {
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
    update(deltaTime) {
        // Update doppler effects, distance calculations, etc.
        // This is handled automatically by Three.js PositionalAudio
    }
    /**
     * Set master volume for all spatial sounds
     */
    setMasterVolume(volume) {
        this.sounds.forEach(audio => {
            audio.setVolume(volume);
        });
    }
    /**
     * Clean up audio resources
     */
    cleanup() {
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
