import { useState, useEffect, useRef, useCallback } from 'react';

// Audio worklet processor code
const workletCode = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.position = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      // Process audio data
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.position] = inputChannel[i];
        outputChannel[i] = this.buffer[this.position];
        this.position = (this.position + 1) % this.bufferSize;
      }
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
`;

export const useAudioContext = () => {
  // Enhanced state management
  const [contextState, setContextState] = useState({
    isInitialized: false,
    isProcessing: false,
    format: null,
    sampleRate: 0,
    channels: 0,
    duration: 0,
    currentTime: 0,
    bufferSize: 0,
    processingLatency: 0
  });

  // Performance metrics
  const [metrics, setMetrics] = useState({
    cpuLoad: 0,
    nodeCount: 0,
    dropouts: 0,
    averageLatency: 0
  });

  // Processing state
  const [processingState, setProcessingState] = useState({
    pitchShift: 1.0,
    timeStretch: 1.0,
    effectsEnabled: {},
    analysisEnabled: true,
    routingMode: 'standard'
  });

  // Core audio refs
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const destinationRef = useRef(null);

  // Analysis refs
  const analyzerRefs = useRef({
    waveform: null,
    spectrum: null,
    loudness: null,
    pitch: null
  });

  // Processing chain refs
  const processingChainRef = useRef({
    input: {
      gain: null,
      meter: null,
      filter: null
    },
    effects: {
      compressor: null,
      limiter: null,
      equalizer: [],
      pitchShifter: null,
      timeStretcher: null,
      reverb: null,
      delay: null,
      chorus: null,
      phaser: null
    },
    output: {
      gain: null,
      meter: null,
      limiter: null
    }
  });

  // Buffer management
  const bufferPoolRef = useRef({
    available: [],
    inUse: new Map(),
    totalSize: 0
  });

  // Performance monitoring
  const performanceRef = useRef({
    lastUpdate: 0,
    metrics: {
      bufferUnderruns: 0,
      processTime: [],
      latencyValues: []
    }
  });

  // Initialize WebAssembly modules
  useEffect(() => {
    const initializeWasm = async () => {
      try {
        // Initialize WebAssembly modules for DSP
        const wasmModule = await WebAssembly.instantiateStreaming(
          fetch('/audio-processor.wasm'),
          {
            env: {
              memory: new WebAssembly.Memory({ initial: 256 }),
              abort: () => console.error('Wasm abort')
            }
          }
        );
        
        // Store WASM instance
        processingChainRef.current.wasmInstance = wasmModule.instance;
      } catch (error) {
        console.error('Failed to initialize WASM:', error);
      }
    };

    initializeWasm();
  }, []);

  // Initialize audio context and processing chain
  useEffect(() => {
    const initializeAudioContext = async () => {
      try {
        // Create high-performance audio context
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 48000,
          latencyHint: 'playback',
          numberOfChannels: 2
        });

        // Register audio worklet
        const workletBlob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(workletBlob);
        await audioContextRef.current.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);

        // Create worklet node
        workletNodeRef.current = new AudioWorkletNode(
          audioContextRef.current,
          'audio-processor',
          {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 2,
            channelCountMode: 'explicit',
            channelInterpretation: 'speakers'
          }
        );

        // Initialize processing chain
        await initializeProcessingChain();
        
        // Initialize analyzers
        initializeAnalyzers();
        
        // Start performance monitoring
        startPerformanceMonitoring();

        // Update state
        setContextState(prev => ({
          ...prev,
          isInitialized: true,
          sampleRate: audioContextRef.current.sampleRate,
          bufferSize: 4096
        }));

      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        handleError(error);
      }
    };

    if (!audioContextRef.current) {
      initializeAudioContext();
    }

    return () => cleanup();
  }, []);

  // Initialize processing chain
  const initializeProcessingChain = async () => {
    const ctx = audioContextRef.current;
    const chain = processingChainRef.current;

    // Input stage
    chain.input.gain = ctx.createGain();
    chain.input.meter = createMeter();
    chain.input.filter = ctx.createBiquadFilter();

    // Effects
    chain.effects.compressor = createCompressor();
    chain.effects.limiter = createLimiter();
    chain.effects.equalizer = createEqualizer();
    chain.effects.pitchShifter = await createPitchShifter();
    chain.effects.timeStretcher = await createTimeStretcher();
    chain.effects.reverb = await createReverb();
    chain.effects.delay = createDelay();
    chain.effects.chorus = createChorus();
    chain.effects.phaser = createPhaser();

    // Output stage
    chain.output.gain = ctx.createGain();
    chain.output.meter = createMeter();
    chain.output.limiter = createLimiter();

    // Initialize default routing
    connectProcessingChain();
  };

  // Initialize analyzers
  const initializeAnalyzers = () => {
    const ctx = audioContextRef.current;

    // Waveform analyzer
    analyzerRefs.current.waveform = ctx.createAnalyser();
    analyzerRefs.current.waveform.fftSize = 8192;
    analyzerRefs.current.waveform.smoothingTimeConstant = 0.2;

    // Spectrum analyzer
    analyzerRefs.current.spectrum = ctx.createAnalyser();
    analyzerRefs.current.spectrum.fftSize = 16384;
    analyzerRefs.current.spectrum.smoothingTimeConstant = 0.8;

    // Loudness analyzer
    analyzerRefs.current.loudness = createLoudnessAnalyzer();

    // Pitch analyzer
    analyzerRefs.current.pitch = createPitchAnalyzer();
  };

  // Effect creators
  const createCompressor = () => {
    const compressor = audioContextRef.current.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, audioContextRef.current.currentTime);
    compressor.knee.setValueAtTime(30, audioContextRef.current.currentTime);
    compressor.ratio.setValueAtTime(12, audioContextRef.current.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContextRef.current.currentTime);
    compressor.release.setValueAtTime(0.25, audioContextRef.current.currentTime);
    return compressor;
  };

  const createLimiter = () => {
    const limiter = audioContextRef.current.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-1, audioContextRef.current.currentTime);
    limiter.knee.setValueAtTime(0, audioContextRef.current.currentTime);
    limiter.ratio.setValueAtTime(20, audioContextRef.current.currentTime);
    limiter.attack.setValueAtTime(0.001, audioContextRef.current.currentTime);
    limiter.release.setValueAtTime(0.1, audioContextRef.current.currentTime);
    return limiter;
  };

  const createEqualizer = () => {
    const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
    return frequencies.map(freq => {
      const filter = audioContextRef.current.createBiquadFilter();
      filter.type = freq < 80 ? 'lowshelf' : freq > 10000 ? 'highshelf' : 'peaking';
      filter.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
      filter.Q.setValueAtTime(1.0, audioContextRef.current.currentTime);
      return filter;
    });
  };

  const createPitchShifter = async () => {
    const bufferSize = 4096;
    const pitchShifter = await createWorkletNode('pitch-shifter', {
      processorOptions: {
        bufferSize,
        windowSize: bufferSize * 2
      }
    });
    return pitchShifter;
  };

  const createTimeStretcher = async () => {
    const bufferSize = 4096;
    const timeStretcher = await createWorkletNode('time-stretcher', {
      processorOptions: {
        bufferSize,
        windowSize: bufferSize * 2
      }
    });
    return timeStretcher;
  };

  const createReverb = async () => {
    const convolver = audioContextRef.current.createConvolver();
    const impulseResponse = await generateImpulseResponse();
    convolver.buffer = impulseResponse;
    return convolver;
  };

  const createDelay = () => {
    const ctx = audioContextRef.current;
    const delay = ctx.createDelay(5.0);
    const feedback = ctx.createGain();
    const wet = ctx.createGain();
    const dry = ctx.createGain();

    delay.delayTime.setValueAtTime(0.5, ctx.currentTime);
    feedback.gain.setValueAtTime(0.3, ctx.currentTime);
    wet.gain.setValueAtTime(0.3, ctx.currentTime);
    dry.gain.setValueAtTime(0.7, ctx.currentTime);

    return { delay, feedback, wet, dry };
  };

  const createChorus = () => {
    const ctx = audioContextRef.current;
    const delay = ctx.createDelay();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const wet = ctx.createGain();
    const dry = ctx.createGain();

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.002, ctx.currentTime);
    wet.gain.setValueAtTime(0.3, ctx.currentTime);
    dry.gain.setValueAtTime(0.7, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();

    return { delay, lfo, lfoGain, wet, dry };
  };

  const createPhaser = () => {
    const ctx = audioContextRef.current;
    const stages = 8;
    const filters = Array(stages).fill().map(() => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'allpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.Q.setValueAtTime(5, ctx.currentTime);
      return filter;
    });

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
    lfoGain.gain.setValueAtTime(800, ctx.currentTime);

    lfo.connect(lfoGain);
    lfo.start();

    return { filters, lfo, lfoGain };
  };

  // Analysis tools
  const createMeter = () => {
    const splitter = audioContextRef.current.createChannelSplitter(2);
    const leftAnalyzer = audioContextRef.current.createAnalyser();
    const rightAnalyzer = audioContextRef.current.createAnalyser();
    
    leftAnalyzer.fftSize = 2048;
    rightAnalyzer.fftSize = 2048;
    
    splitter.connect(leftAnalyzer, 0);
    splitter.connect(rightAnalyzer, 1);
    
    return { splitter, leftAnalyzer, rightAnalyzer };
  };

  const createLoudnessAnalyzer = () => {
    const analyzer = audioContextRef.current.createAnalyser();
    analyzer.fftSize = 2048;
    analyzer.smoothingTimeConstant = 0.8;
    return analyzer;
  };

  const createPitchAnalyzer = () => {
    const analyzer = audioContextRef.current.createAnalyser();
    analyzer.fftSize = 2048;
    analyzer.smoothingTimeConstant = 0.8;
    return analyzer;
  };

  // Format handling
  const detectFormat = useCallback((audioElement) => {
    const formats = {
      'audio/mpeg': { name: 'MP3', quality: 'lossy', maxBitrate: 320 },
      'audio/wav': { name: 'WAV', quality: 'lossless', maxBitrate: 1411 },
      'audio/flac': { name: 'FLAC', quality: 'lossless', maxBitrate: 1411 },
      'audio/alac': { name: 'ALAC', quality: 'lossless', maxBitrate: 1411 },
      'audio/aac': { name: 'AAC', quality: 'lossy', maxBitrate: 256 },
      'audio/ogg': { name: 'OGG', quality: 'lossy', maxBitrate: 500 }
    };

    const type = audioElement.type || 'audio/mpeg';
    return formats[type] || { name: 'Unknown', quality: 'unknown', maxBitrate: 0 };
  }, []);

  // Buffer management
  const allocateBuffer = (size) => {
    const buffer = bufferPoolRef.current.available.find(b => b.length >= size);
    if (buffer) {
      const id = crypto.randomUUID();
      bufferPoolRef.current.inUse.set(id, buffer);
      bufferPoolRef.current.available = bufferPoolRef.current.available.filter(b => b !== buffer);
      return { buffer, id };
    }
    
    // Create new buffer if none available
    const newBuffer = new Float32Array(size);
    const id = crypto.randomUUID();
    bufferPoolRef.current.inUse.set(id, newBuffer);
    bufferPoolRef.current.totalSize += size;
    return { buffer: newBuffer, id };
  };

  // Add buffer release function
  const releaseBuffer = (id) => {
    const buffer = bufferPoolRef.current.inUse.get(id);
    if (buffer) {
      bufferPoolRef.current.inUse.delete(id);
      bufferPoolRef.current.available.push(buffer);
    }
  };

  // Add buffer cleanup function
  const cleanupBuffers = () => {
    bufferPoolRef.current.available = [];
    bufferPoolRef.current.inUse.clear();
    bufferPoolRef.current.totalSize = 0;
  };

  // Add to cleanup function
  const cleanup = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    cleanupBuffers();
    // Clear all refs and state
    workletNodeRef.current = null;
    sourceNodeRef.current = null;
    destinationRef.current = null;
    analyzerRefs.current = {
      waveform: null,
      spectrum: null,
      loudness: null,
      pitch: null
    };
  };

  // Return additional functions in the hook
  return {
    ...contextState,
    metrics,
    processingState,
    allocateBuffer,
    releaseBuffer,
    cleanupBuffers,
    // ... rest of the return object
  };
};