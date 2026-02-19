export class SoundManager {
    constructor() {
        this.sounds = {};
        this.ambientPlaying = false;
        this.initSounds();
    }
    
    initSounds() {
        // Create audio contexts for sound effects
        // Note: In a real implementation, you would load actual audio files
        // For now, we'll use Web Audio API to generate simple tones
        
        this.sounds = {
            sonar: this.createTone(800, 0.1, 'sine'),
            echo: this.createTone(400, 0.2, 'sine'),
            nudge: this.createTone(200, 0.1, 'square'),
            speed: this.createTone(600, 0.15, 'sine'),
            light: this.createTone(300, 0.1, 'sine'),
            collect: this.createTone(1000, 0.2, 'sine'),
            success: this.createChord([523, 659, 784], 0.3)
        };
    }
    
    createTone(frequency, duration, type = 'sine') {
        return () => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }
    
    createChord(frequencies, duration) {
        return () => {
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + duration);
                }, index * 50);
            });
        };
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            try {
                this.sounds[soundName]();
            } catch (e) {
                // Silently fail if audio context is not available
                console.log('Sound playback not available');
            }
        }
    }
    
    playAmbient() {
        // Ambient underwater sounds would be loaded here
        // For now, we'll just mark it as playing
        this.ambientPlaying = true;
    }
    
    stopAmbient() {
        this.ambientPlaying = false;
    }
}

