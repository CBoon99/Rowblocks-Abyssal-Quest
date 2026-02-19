import { Howl } from 'howler';
import * as THREE from 'three';
import { UnderwaterAudio } from './UnderwaterAudio';
export class AudioManager {
    constructor(camera) {
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: camera
        });
        Object.defineProperty(this, "ambientSound", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "sounds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
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
            value: null
        });
        Object.defineProperty(this, "positionalSounds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "underwaterFilter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "underwaterAudio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // Create audio listener attached to camera
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        // Initialize audio context
        this.initAudioContext();
        // Initialize underwater audio system
        this.underwaterAudio = new UnderwaterAudio(this.listener);
    }
    initAudioContext() {
        try {
            this.audioContext = this.listener.getContext();
            // Create underwater filter (low-pass filter to simulate water)
            if (this.audioContext) {
                this.underwaterFilter = this.audioContext.createBiquadFilter();
                this.underwaterFilter.type = 'lowpass';
                this.underwaterFilter.frequency.value = 2000; // Muffled underwater sound
                this.underwaterFilter.Q.value = 1;
            }
        }
        catch (error) {
            console.warn('Audio context initialization failed:', error);
        }
    }
    async init() {
        // Initialize ambient underwater sound
        // Using procedural audio generation since we don't have audio files yet
        this.ambientSound = this.createProceduralAmbient();
        // Initialize sound effects
        this.initSoundEffects();
        // Set up audio listener position updates
        this.updateListenerPosition();
    }
    createProceduralAmbient() {
        // Create a procedural ambient sound using Web Audio API
        // This simulates underwater ambience until real audio files are added
        const options = {
            src: [], // Will be generated procedurally
            loop: true,
            volume: 0.3,
            autoplay: false
        };
        // For now, create a silent placeholder that can be replaced with real audio
        // In production, load actual audio files here
        const howl = new Howl(options);
        // Generate procedural tone if Web Audio API is available
        if (this.audioContext && !howl._sounds.length) {
            this.generateProceduralAmbient();
        }
        return howl;
    }
    generateProceduralAmbient() {
        if (!this.audioContext)
            return;
        // Create oscillator for ambient drone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        oscillator.type = 'sine';
        oscillator.frequency.value = 60; // Low frequency drone
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        gainNode.gain.value = 0.1;
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start();
        // Store reference for cleanup
        this._ambientOscillator = oscillator;
        this._ambientGain = gainNode;
    }
    initSoundEffects() {
        // Block slide sound
        this.sounds.set('blockSlide', this.createProceduralSound('blockSlide'));
        // Win sound
        this.sounds.set('win', this.createProceduralSound('win'));
        // Collect sound
        this.sounds.set('collect', this.createProceduralSound('collect'));
        // Bubble sound
        this.sounds.set('bubble', this.createProceduralSound('bubble'));
        // Sonar ping
        this.sounds.set('sonar', this.createProceduralSound('sonar'));
    }
    createProceduralSound(type) {
        // Create procedural sounds using Web Audio API
        const options = {
            src: [],
            volume: 0.5,
            autoplay: false
        };
        const howl = new Howl(options);
        // Generate sound based on type
        if (this.audioContext) {
            switch (type) {
                case 'blockSlide':
                    this.generateBlockSlideSound();
                    break;
                case 'win':
                    this.generateWinSound();
                    break;
                case 'collect':
                    this.generateCollectSound();
                    break;
                case 'bubble':
                    this.generateBubbleSound();
                    break;
                case 'sonar':
                    this.generateSonarSound();
                    break;
            }
        }
        return howl;
    }
    generateBlockSlideSound() {
        if (!this.audioContext)
            return;
        // Metallic scrape + water whoosh
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Metallic scrape
            const scrape = Math.sin(t * 800) * Math.exp(-t * 5);
            // Water whoosh
            const whoosh = Math.random() * 0.3 * Math.exp(-t * 3);
            data[i] = (scrape + whoosh) * 0.3;
        }
        this.playBuffer(buffer);
    }
    generateWinSound() {
        if (!this.audioContext)
            return;
        // Upward arpeggio
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        const frequencies = [523, 659, 784, 1047]; // C, E, G, C
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t * 4);
            if (noteIndex < frequencies.length) {
                const freq = frequencies[noteIndex];
                data[i] = Math.sin(t * freq * Math.PI * 2) * Math.exp(-t * 2) * 0.3;
            }
        }
        this.playBuffer(buffer);
    }
    generateCollectSound() {
        if (!this.audioContext)
            return;
        // Short chime
        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(t * 1000 * Math.PI * 2) * Math.exp(-t * 10) * 0.4;
        }
        this.playBuffer(buffer);
    }
    generateBubbleSound() {
        if (!this.audioContext)
            return;
        // Pop sound
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            data[i] = (Math.random() - 0.5) * Math.exp(-t * 20) * 0.2;
        }
        this.playBuffer(buffer);
    }
    generateSonarSound() {
        if (!this.audioContext)
            return;
        // Ping sound
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 800 + t * 400; // Rising frequency
            data[i] = Math.sin(t * freq * Math.PI * 2) * Math.exp(-t * 3) * 0.3;
        }
        this.playBuffer(buffer);
    }
    playBuffer(buffer) {
        if (!this.audioContext)
            return;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        if (this.underwaterFilter) {
            source.connect(this.underwaterFilter);
            this.underwaterFilter.connect(this.audioContext.destination);
        }
        else {
            source.connect(this.audioContext.destination);
        }
        source.start(0);
    }
    playAmbient() {
        if (this.ambientSound && !this.ambientSound.playing()) {
            this.ambientSound.play();
        }
        // Also play procedural ambient if available
        if (this._ambientGain) {
            this._ambientGain.gain.value = 0.1;
        }
    }
    stopAmbient() {
        if (this.ambientSound) {
            this.ambientSound.stop();
        }
        if (this._ambientGain) {
            this._ambientGain.gain.value = 0;
        }
    }
    playSound(name, position) {
        const sound = this.sounds.get(name);
        if (sound) {
            if (position) {
                // Play as positional 3D sound
                this.playPositionalSound(name, position);
            }
            else {
                // Play as regular sound
                sound.play();
            }
        }
    }
    playPositionalSound(name, position) {
        // Create positional audio if it doesn't exist
        if (!this.positionalSounds.has(name)) {
            const sound = this.sounds.get(name);
            if (!sound)
                return;
            const positionalAudio = new THREE.PositionalAudio(this.listener);
            // Note: In production, load actual audio buffer here
            // positionalAudio.setBuffer(audioBuffer);
            positionalAudio.setRefDistance(20);
            positionalAudio.setRolloffFactor(2);
            positionalAudio.setDistanceModel('inverse');
            this.positionalSounds.set(name, positionalAudio);
        }
        const positionalAudio = this.positionalSounds.get(name);
        if (positionalAudio) {
            // Create a temporary object at the position
            const tempObject = new THREE.Object3D();
            tempObject.position.copy(position);
            this.camera.parent?.add(tempObject);
            positionalAudio.position.copy(position);
            positionalAudio.play();
            // Clean up temp object after sound finishes
            setTimeout(() => {
                tempObject.remove();
            }, 2000);
        }
    }
    updateListenerPosition() {
        // Update listener position to match camera
        // This is handled automatically by Three.js, but we can add custom updates here
        const update = () => {
            if (this.listener && this.camera) {
                // Listener position updates automatically with camera
                // But we can apply underwater filter to all sounds
                this.applyUnderwaterFilter();
            }
            requestAnimationFrame(update);
        };
        update();
    }
    applyUnderwaterFilter() {
        // Apply underwater filter to all sounds
        // This simulates the muffled sound underwater
        if (this.underwaterAudio) {
            const depth = Math.max(0, -this.camera.position.y);
            this.underwaterAudio.updateDepth(depth);
        }
        else if (this.underwaterFilter && this.audioContext) {
            // Fallback to simple filter
            const depth = Math.max(0, -this.camera.position.y);
            const frequency = 2000 - depth * 10;
            this.underwaterFilter.frequency.value = Math.max(500, frequency);
        }
    }
    /**
     * Update audio system (call in game loop)
     */
    update(deltaTime) {
        this.applyUnderwaterFilter();
    }
    setMasterVolume(volume) {
        // Set master volume (0.0 to 1.0)
        Howler.volume(volume);
    }
    setAmbientVolume(volume) {
        if (this.ambientSound) {
            this.ambientSound.volume(volume);
        }
        if (this._ambientGain) {
            this._ambientGain.gain.value = volume * 0.1;
        }
    }
    cleanup() {
        // Clean up audio resources
        if (this.ambientSound) {
            this.ambientSound.unload();
        }
        this.sounds.forEach(sound => sound.unload());
        this.sounds.clear();
        this.positionalSounds.forEach(audio => {
            audio.stop();
            audio.disconnect();
        });
        this.positionalSounds.clear();
        if (this._ambientOscillator) {
            this._ambientOscillator.stop();
        }
    }
}
