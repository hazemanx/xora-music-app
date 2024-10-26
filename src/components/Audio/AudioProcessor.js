import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  AlertCircle,
  Mic,
  Music,
  RefreshCw,
  Save,
  Settings,
  Waveform,
  Clock
} from 'lucide-react';

const AudioProcessor = ({ audioSource, onProcessingComplete }) => {
  // Existing refs
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const pitchNodeRef = useRef(null);
  const analyzerRef = useRef(null);
  const equalizerNodesRef = useRef([]);
  
  // New refs for enhanced processing
  const timeStretchNodeRef = useRef(null);
  const effectsChainRef = useRef({
    compressor: null,
    reverb: null,
    delay: null
  });
  const visualizerCanvasRef = useRef(null);

  // Enhanced state management
  const [isInitialized, setIsInitialized] = useState(false);
  const [pitch, setPitch] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [format, setFormat] = useState(null);
  const [visualizationType, setVisualizationType] = useState('waveform');
  const [effectsSettings, setEffectsSettings] = useState({
    compressor: { threshold: -24, ratio: 4, knee: 30, attack: 0.003, release: 0.25 },
    reverb: { decay: 2.0, preDelay: 0.1, mix: 0.5 },
    delay: { time: 0.5, feedback: 0.4, mix: 0.3 }
  });

  // Existing EQ configuration...
  const eqBands = [/* Your existing EQ bands */];
  const [eqSettings, setEqSettings] = useState(eqBands);
  const [presets, setPresets] = useState({/* Your existing presets */});

  // Format detection and handling
  const detectFormat = (source) => {
    const formats = {
      'audio/mpeg': 'MP3',
      'audio/wav': 'WAV',
      'audio/flac': 'FLAC',
      'audio/alac': 'ALAC'
    };
    
    const type = source.type || 'audio/mpeg';
    setFormat(formats[type] || 'Unknown');
    return formats[type] || 'MP3';
  };

  // Enhanced initialization
  useEffect(() => {
    const initializeAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 48000,
          latencyHint: 'playback'
        });
        
        // Initialize analyzer with higher resolution
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 8192;
        analyzerRef.current.smoothingTimeConstant = 0.8;

        // Initialize effects chain
        effectsChainRef.current.compressor = createCompressor();
        effectsChainRef.current.reverb = await createReverb();
        effectsChainRef.current.delay = createDelay();

        if (audioSource) {
          const format = detectFormat(audioSource);
          sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioSource);
          
          // Enhanced node connection chain
          connectProcessingChain();
        }

        // Start visualization
        if (visualizerCanvasRef.current) {
          startVisualization();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };

    if (!isInitialized && audioSource) {
      initializeAudioContext();
    }

    return () => cleanup();
  }, [audioSource, isInitialized]);

  // Enhanced processing chain connection
  const connectProcessingChain = () => {
    disconnectNodes();
    
    let currentNode = sourceNodeRef.current;

    // Connect pitch shifter if active
    if (pitch !== 1.0) {
      const pitchShifter = createEnhancedPitchShifter(pitch);
      currentNode.connect(pitchShifter.input);
      currentNode = pitchShifter.output;
    }

    // Connect time stretcher if active
    if (speed !== 1.0) {
      const timeStretcher = createTimeStretcher(speed);
      currentNode.connect(timeStretcher.input);
      currentNode = timeStretcher.output;
    }

    // Connect effects chain
    Object.values(effectsChainRef.current).forEach(effect => {
      if (effect && effect.active) {
        currentNode.connect(effect);
        currentNode = effect;
      }
    });

    // Connect EQ chain
    equalizerNodesRef.current.forEach(eq => {
      currentNode.connect(eq);
      currentNode = eq;
    });

    // Final connections
    currentNode.connect(analyzerRef.current);
    analyzerRef.current.connect(audioContextRef.current.destination);
  };

  // Enhanced pitch shifter using phase vocoder technique
  const createEnhancedPitchShifter = (pitchRatio) => {
    const bufferSize = 4096;
    const grainSize = bufferSize * 2;
    const pitchShifter = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
    
    let inputBuffer = new Float32Array(grainSize);
    let outputBuffer = new Float32Array(grainSize);
    let grainWindow = createHannWindow(grainSize);
    
    pitchShifter.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      
      // Phase vocoder implementation
      processGrain(input, output, pitchRatio, grainWindow);
    };

    return {
      input: pitchShifter,
      output: pitchShifter
    };
  };

  // Time stretching implementation
  const createTimeStretcher = (speedRatio) => {
    const bufferSize = 4096;
    const stretcher = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
    
    let buffer = new Float32Array(bufferSize * 2);
    let readPosition = 0;
    
    stretcher.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      
      // WSOLA (Waveform Similarity Overlap-Add) implementation
      processTimeStretch(input, output, speedRatio, buffer, readPosition);
    };

    return {
      input: stretcher,
      output: stretcher
    };
  };

  // Effects processors
  const createCompressor = () => {
    const compressor = audioContextRef.current.createDynamicsCompressor();
    const settings = effectsSettings.compressor;
    
    Object.entries(settings).forEach(([param, value]) => {
      if (compressor[param]) {
        compressor[param].setValueAtTime(value, audioContextRef.current.currentTime);
      }
    });

    return compressor;
  };

  const createReverb = async () => {
    const convolver = audioContextRef.current.createConvolver();
    const settings = effectsSettings.reverb;
    
    // Generate impulse response
    const impulseResponse = await generateImpulseResponse(
      audioContextRef.current,
      settings.decay,
      settings.preDelay
    );
    
    convolver.buffer = impulseResponse;
    return convolver;
  };

  const createDelay = () => {
    const delay = audioContextRef.current.createDelay(5.0);
    const feedback = audioContextRef.current.createGain();
    const settings = effectsSettings.delay;
    
    delay.delayTime.setValueAtTime(settings.time, audioContextRef.current.currentTime);
    feedback.gain.setValueAtTime(settings.feedback, audioContextRef.current.currentTime);
    
    delay.connect(feedback);
    feedback.connect(delay);
    
    return delay;
  };

  // Visualization
  const startVisualization = () => {
    const canvas = visualizerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    
    const draw = () => {
      requestAnimationFrame(draw);
      
      if (visualizationType === 'waveform') {
        analyzerRef.current.getByteTimeDomainData(dataArray);
        drawWaveform(ctx, dataArray);
      } else {
        analyzerRef.current.getByteFrequencyData(dataArray);
        drawSpectrum(ctx, dataArray);
      }
    };
    
    draw();
  };

  // Clean up
  const cleanup = () => {
    disconnectNodes();
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
  };

  // Your existing render code...
  return (
    <div className="w-full max-w-2xl p-6 bg-gray-900 rounded-lg shadow-xl">
      {/* Your existing UI components... */}
      
      {/* Add new visualization canvas */}
      <canvas
        ref={visualizerCanvasRef}
        className="w-full h-32 mt-4 bg-gray-800 rounded"
      />
      
      {/* Add format indicator */}
      {format && (
        <div className="text-sm text-gray-400 mt-2">
          Format: {format} | Sample Rate: {audioContextRef.current?.sampleRate}Hz
        </div>
      )}
    </div>
  );
};

// Helper functions (implementations would go here)
const createHannWindow = (size) => {/* Implementation */};
const processGrain = (input, output, ratio, window) => {/* Implementation */};
const processTimeStretch = (input, output, ratio, buffer, position) => {/* Implementation */};
const generateImpulseResponse = async (context, decay, preDelay) => {/* Implementation */};
const drawWaveform = (ctx, data) => {/* Implementation */};
const drawSpectrum = (ctx, data) => {/* Implementation */};

export default AudioProcessor;