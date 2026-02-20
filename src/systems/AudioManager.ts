import { Howl, HowlOptions } from 'howler';
import * as THREE from 'three';
import { UnderwaterAudio } from './UnderwaterAudio';

export class AudioManager {
    private ambientSound: Howl | null = null;
    private sounds: Map<string, Howl> = new Map();
    private listener: THREE.AudioListener;
    private audioContext: AudioContext | null = null;
    private positionalSounds: Map<string, THREE.PositionalAudio> = new Map();
    private underwaterFilter: BiquadFilterNode | null = null;
    private underwaterAudio: UnderwaterAudio | null = null;
    
    constructor(private camera: THREE.PerspectiveCamera) {
        // Create audio listener attached to camera
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        
        // Initialize audio context immediately
        this.initAudioContext();
        
        // Initialize underwater audio system (will be created in init() if context is ready)
    }
    
    private initAudioContext(): void {
        try {
            // THREE.AudioListener has a 'context' property, not getContext() method
            // The context is created when the listener is added to the camera
            // We need to wait for it to be available or create our own
            if ((this.listener as any).context) {
                this.audioContext = (this.listener as any).context as AudioContext;
            } else {
                // Fallback: create new AudioContext
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            
            // Create underwater filter (low-pass filter to simulate water)
            if (this.audioContext && this.audioContext.state !== 'closed') {
                try {
                    this.underwaterFilter = this.audioContext.createBiquadFilter();
                    this.underwaterFilter.type = 'lowpass';
                    this.underwaterFilter.frequency.value = 2000; // Muffled underwater sound
                    this.underwaterFilter.Q.value = 1;
                } catch (e) {
                    console.warn('Could not create underwater filter:', e);
                }
            }
        } catch (error) {
            console.warn('Audio context initialization failed:', error);
            // Fallback: create new AudioContext if listener context fails
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.warn('Could not create AudioContext:', e);
                // Game can continue without audio
            }
        }
    }
    
    async init(): Promise<void> {
        // Ensure audio context is initialized (but don't start audio yet)
        if (!this.audioContext) {
            this.initAudioContext();
        }
        
        // Initialize underwater audio system if context is available
        if (this.audioContext && !this.underwaterAudio) {
            try {
                this.underwaterAudio = new UnderwaterAudio(this.listener);
            } catch (error) {
                console.warn('UnderwaterAudio initialization failed:', error);
            }
        }
        
        // DON'T start audio here - wait for user gesture
        // Just create the sound objects (they won't play until resumed)
        this.ambientSound = this.createProceduralAmbient();
        
        // Initialize sound effects
        this.initSoundEffects();
        
        // Set up audio listener position updates
        this.updateListenerPosition();
    }
    
    /**
     * Start audio after user gesture (call on button click or game start)
     */
    startAudio(): void {
        if (!this.audioContext) {
            this.initAudioContext();
        }
        
        if (this.audioContext) {
            // Resume audio context if suspended (required by browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('✅ Audio context resumed');
                    // Now start procedural ambient
                    this.generateProceduralAmbient();
                }).catch(err => {
                    console.warn('⚠️ Audio resume failed:', err);
                });
            } else {
                // Already active, just start ambient
                this.generateProceduralAmbient();
            }
        }
    }
    
    private createProceduralAmbient(): Howl | null {
        // Create a procedural ambient sound using Web Audio API
        // This simulates underwater ambience until real audio files are added
        
        try {
            // Howl requires at least one source file, so we'll use a data URI for silence
            // or skip Howl entirely and use Web Audio API directly
            if (!this.audioContext) {
                console.warn('AudioContext not available, skipping ambient sound');
                return null;
            }
            
            // Generate procedural tone using Web Audio API directly
            this.generateProceduralAmbient();
            
            // Return null since we're using Web Audio API directly, not Howl
            return null;
        } catch (error) {
            console.warn('Could not create ambient sound:', error);
            return null;
        }
    }
    
    private generateProceduralAmbient(): void {
        if (!this.audioContext) {
            console.warn('⚠️ AudioContext not available for procedural ambient');
            return;
        }
        
        // Check if audio context is suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            console.log('⏸️ Audio context suspended - will resume on user gesture');
            return; // Don't start until resumed
        }
        
        try {
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
            (this as any)._ambientOscillator = oscillator;
            (this as any)._ambientGain = gainNode;
            
            console.log('✅ Procedural ambient sound started');
        } catch (error) {
            console.warn('⚠️ Failed to generate procedural ambient:', error);
        }
    }
    
    private initSoundEffects(): void {
        // Create placeholder sounds that won't crash if Howl fails
        // Collect/catch sound
        try {
            const collectSound = this.createProceduralSound('collect', 0.3, 800, 'sine');
            if (collectSound) {
                (this as any).sounds = (this as any).sounds || new Map();
                (this as any).sounds.set('collect', collectSound);
            }
        } catch (e) {
            console.warn('Could not create collect sound:', e);
        }
        
        // Block slide sound
        try {
            this.sounds.set('blockSlide', this.createProceduralSound('blockSlide'));
        } catch (e) {
            console.warn('Could not create blockSlide sound:', e);
        }
        
        // Win sound
        try {
            this.sounds.set('win', this.createProceduralSound('win'));
        } catch (e) {
            console.warn('Could not create win sound:', e);
        }
        
        // Collect sound
        try {
            this.sounds.set('collect', this.createProceduralSound('collect'));
        } catch (e) {
            console.warn('Could not create collect sound:', e);
        }
        
        // Bubble sound
        try {
            this.sounds.set('bubble', this.createProceduralSound('bubble'));
        } catch (e) {
            console.warn('Could not create bubble sound:', e);
        }
        
        // Sonar ping
        try {
            this.sounds.set('sonar', this.createProceduralSound('sonar'));
        } catch (e) {
            console.warn('Could not create sonar sound:', e);
        }
    }
    
    private createProceduralSound(type: string): Howl | null {
        // Create procedural sounds using Web Audio API
        // Since we don't have audio files, we'll use Web Audio API directly
        // Return null to indicate no Howl instance (sounds will be generated procedurally)
        try {
            if (!this.audioContext) {
                return null;
            }
            
            // Don't generate sounds here - they'll be generated on-demand when played
            // This just creates a placeholder entry in the sounds map
            return null;
        } catch (error) {
            console.warn(`Could not create ${type} sound:`, error);
            return null;
        }
    }
    
    private generateBlockSlideSound(): void {
        if (!this.audioContext) return;
        
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
    
    private generateWinSound(): void {
        if (!this.audioContext) return;
        
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
    
    private generateCollectSound(): void {
        if (!this.audioContext) return;
        
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
    
    private generateBubbleSound(): void {
        if (!this.audioContext) return;
        
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
    
    private generateSonarSound(): void {
        if (!this.audioContext) return;
        
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
    
    private playBuffer(buffer: AudioBuffer): void {
        if (!this.audioContext) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        if (this.underwaterFilter) {
            source.connect(this.underwaterFilter);
            this.underwaterFilter.connect(this.audioContext.destination);
        } else {
            source.connect(this.audioContext.destination);
        }
        
        source.start(0);
    }
    
    playAmbient(): void {
        try {
            // Play procedural ambient (Web Audio API)
            if ((this as any)._ambientGain) {
                (this as any)._ambientGain.gain.value = 0.1;
            }
            
            // Try to play Howl ambient if it exists and is valid
            if (this.ambientSound) {
                try {
                    // Check if Howl is properly initialized
                    if (typeof this.ambientSound.playing === 'function') {
                        if (!this.ambientSound.playing()) {
                            this.ambientSound.play();
                        }
                    }
                } catch (e) {
                    // Howl might not be properly initialized, that's okay
                    // Procedural ambient is already playing
                    console.warn('Howl ambient sound not available, using procedural audio');
                }
            }
        } catch (error) {
            console.warn('Could not play ambient sound:', error);
            // Don't crash - game can continue without audio
        }
    }
    
    stopAmbient(): void {
        if (this.ambientSound) {
            this.ambientSound.stop();
        }
        
        if ((this as any)._ambientGain) {
            (this as any)._ambientGain.gain.value = 0;
        }
    }
    
    playSound(name: string, position?: THREE.Vector3): void {
        try {
            const sound = this.sounds.get(name);
            if (sound) {
                try {
                    if (position) {
                        // Play as positional 3D sound
                        this.playPositionalSound(name, position);
                    } else {
                        // Play as regular sound
                        sound.play();
                    }
                } catch (e) {
                    // Howl might not be initialized, generate procedurally instead
                    this.generateSoundForType(name);
                }
            } else {
                // No Howl instance, generate procedurally
                this.generateSoundForType(name);
            }
        } catch (error) {
            console.warn(`Error playing sound ${name}:`, error);
        }
    }
    
    private playPositionalSound(name: string, position: THREE.Vector3): void {
        // Create positional audio if it doesn't exist
        if (!this.positionalSounds.has(name)) {
            const sound = this.sounds.get(name);
            if (!sound) return;
            
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
    
    private updateListenerPosition(): void {
        // Update listener position to match camera
        // This is handled automatically by Three.js
        // No need for a separate animation loop - this will be called from Game.update()
    }
    
    private applyUnderwaterFilter(): void {
        // Apply underwater filter to all sounds
        // This simulates the muffled sound underwater
        if (this.underwaterAudio) {
            const depth = Math.max(0, -this.camera.position.y);
            this.underwaterAudio.updateDepth(depth);
        } else if (this.underwaterFilter && this.audioContext) {
            // Fallback to simple filter
            const depth = Math.max(0, -this.camera.position.y);
            const frequency = 2000 - depth * 10;
            this.underwaterFilter.frequency.value = Math.max(500, frequency);
        }
    }
    
    /**
     * Update audio system (call in game loop)
     */
    update(deltaTime: number): void {
        this.applyUnderwaterFilter();
    }
    
    setMasterVolume(volume: number): void {
        // Set master volume (0.0 to 1.0)
        Howler.volume(volume);
    }
    
    setAmbientVolume(volume: number): void {
        if (this.ambientSound) {
            this.ambientSound.volume(volume);
        }
        if ((this as any)._ambientGain) {
            (this as any)._ambientGain.gain.value = volume * 0.1;
        }
    }
    
    cleanup(): void {
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
        
        if ((this as any)._ambientOscillator) {
            (this as any)._ambientOscillator.stop();
        }
    }
}
