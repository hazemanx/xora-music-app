import React, { useEffect, useRef, useState } from 'react';

// Audio processing engine class
class AudioProcessorEngine {
  constructor({ context, onProcessingComplete }) {
    this.context = context;
    this.onProcessingComplete = onProcessingComplete;
    this.nodes = {
      input: null,
      gain: null,
      analyzer: null,
      compressor: null,
      equalizer: null,
      pitchShifter: null,
      reverb: null,
      delay: null,
      output: null
    };
    this.initialize();
  }

  async initialize() {
    try {
      // Create nodes
      this.nodes.input = this.context.createGain();
      this.nodes.gain = this.context.createGain();
      this.nodes.analyzer = this.context.createAnalyser();
      this.nodes.compressor = this.createCompressor();
      this.nodes.equalizer = this.createEqualizer();
      this.nodes.pitchShifter = await this.createPitchShifter();
      this.nodes.reverb = await this.createReverb();
      this.nodes.delay = this.createDelay();
      this.nodes.output = this.context.createGain();

      // Configure analyzer
      this.nodes.analyzer.fftSize = 8192;
      this.nodes.analyzer.smoothingTimeConstant = 0.8;

      // Connect processing chain
      this.connectNodes();

      if (this.onProcessingComplete) {
        this.onProcessingComplete({
          context: this.context,
          nodes: this.nodes
        });
      }
    } catch (error) {
      console.error('Audio processor initialization failed:', error);
    }
  }

  connectNodes() {
    // Main chain
    this.nodes.input
      .connect(this.nodes.gain)
      .connect(this.nodes.compressor)
      .connect(this.nodes.equalizer)
      .connect(this.nodes.pitchShifter)
      .connect(this.nodes.reverb)
      .connect(this.nodes.delay)
      .connect(this.nodes.analyzer)
      .connect(this.nodes.output)
      .connect(this.context.destination);
  }

  createCompressor() {
    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

  createEqualizer() {
    const bands = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
    const filters = bands.map(frequency => {
      const filter = this.context.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });
    
    // Connect filters in series
    filters.reduce((prev, curr) => prev.connect(curr));
    return filters[0];
  }

  async createPitchShifter() {
    // Initialize pitch shifter worklet
    await this.context.audioWorklet.addModule('/audio-worklets/pitch-shifter.js');
    return new AudioWorkletNode(this.context, 'pitch-shifter');
  }

  async createReverb() {
    const convolver = this.context.createConvolver();
    const response = await fetch('/impulse-responses/hall.wav');
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    convolver.buffer = audioBuffer;
    return convolver;
  }

  createDelay() {
    const delay = this.context.createDelay(2.0);
    delay.delayTime.value = 0;
    return delay;
  }

  // Public methods
  setVolume(value) {
    if (this.nodes.gain) {
      this.nodes.gain.gain.value = value;
    }
  }

  async setPitch(semitones) {
    if (this.nodes.pitchShifter) {
      await this.nodes.pitchShifter.parameters.get('pitch').setValueAtTime(semitones, this.context.currentTime);
    }
  }

  setEqualizer(bands) {
    if (!Array.isArray(this.nodes.equalizer)) return;
    bands.forEach((gain, index) => {
      if (this.nodes.equalizer[index]) {
        this.nodes.equalizer[index].gain.value = gain;
      }
    });
  }

  cleanup() {
    Object.values(this.nodes).forEach(node => {
      if (node?.disconnect) {
        node.disconnect();
      }
    });
  }
}

// React component wrapper
const AudioProcessor = ({ audioSource, onProcessingComplete }) => {
  const processorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!audioSource) return;

    const initProcessor = async () => {
      try {
        processorRef.current = new AudioProcessorEngine({
          context: audioSource.context,
          onProcessingComplete: (result) => {
            setIsInitialized(true);
            if (onProcessingComplete) {
              onProcessingComplete(result);
            }
          }
        });
      } catch (error) {
        console.error('Failed to initialize AudioProcessor:', error);
      }
    };

    initProcessor();

    return () => {
      if (processorRef.current?.cleanup) {
        processorRef.current.cleanup();
      }
    };
  }, [audioSource, onProcessingComplete]);

  return null;
};

export { AudioProcessorEngine };
export default AudioProcessor; 