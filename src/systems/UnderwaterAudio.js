/**
 * Simulates underwater audio effects
 * Applies low-pass filtering, reverb, and muffling based on depth
 */
export class UnderwaterAudio {
    constructor(audioListener) {
        Object.defineProperty(this, "audioContext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lowPassFilter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reverbConvolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "gainNode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "depth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.audioContext = audioListener.getContext();
        // Create low-pass filter for muffled underwater sound
        this.lowPassFilter = this.audioContext.createBiquadFilter();
        this.lowPassFilter.type = 'lowpass';
        this.lowPassFilter.frequency.value = 2000; // Start frequency
        this.lowPassFilter.Q.value = 1;
        // Create gain node
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0;
        // Create reverb for underwater echo
        this.createReverb();
        // Connect filter chain
        this.lowPassFilter.connect(this.gainNode);
        if (this.reverbConvolver) {
            this.gainNode.connect(this.reverbConvolver);
        }
    }
    createReverb() {
        try {
            // Create impulse response for underwater reverb
            const length = this.audioContext.sampleRate * 2; // 2 seconds
            const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
            for (let channel = 0; channel < 2; channel++) {
                const channelData = impulse.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
                }
            }
            this.reverbConvolver = this.audioContext.createConvolver();
            this.reverbConvolver.buffer = impulse;
            this.reverbConvolver.normalize = true;
        }
        catch (error) {
            console.warn('Reverb creation failed:', error);
        }
    }
    /**
     * Update audio based on current depth
     */
    updateDepth(depth) {
        this.depth = depth;
        // More depth = more muffled (lower frequency cutoff)
        const baseFrequency = 2000;
        const depthEffect = depth * 5; // 5 Hz per unit of depth
        const frequency = Math.max(500, baseFrequency - depthEffect);
        this.lowPassFilter.frequency.value = frequency;
        // Adjust gain based on depth (slightly quieter at depth)
        const gain = 1.0 - (depth * 0.01);
        this.gainNode.gain.value = Math.max(0.5, gain);
    }
    /**
     * Get the filter node to connect audio sources
     */
    getInputNode() {
        return this.lowPassFilter;
    }
    /**
     * Get the output node (after reverb)
     */
    getOutputNode() {
        return this.reverbConvolver || this.gainNode;
    }
    /**
     * Set reverb intensity (0.0 to 1.0)
     */
    setReverbIntensity(intensity) {
        if (this.reverbConvolver) {
            // Adjust reverb by creating a dry/wet mix
            // This is simplified - in production, use a proper reverb send
            this.gainNode.gain.value = 1.0 - intensity * 0.3;
        }
    }
}
