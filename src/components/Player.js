import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import {
  PlayIcon, 
  PauseIcon, 
  FastForwardIcon, 
  RewindIcon,
  ViewListIcon,
  ShareIcon,
  AdjustmentsIcon,
  WifiIcon,
  MusicNoteIcon,
  InformationCircleIcon
} from '@heroicons/react/solid';
import Equalizer from './Equalizer';
import { useAudioContext } from '../hooks/useAudioContext';
import AudioProcessor from './Audio/AudioProcessor';
import { useGestures } from '../hooks/useGestures';
import { motion, AnimatePresence } from 'framer-motion';

function Player({ currentTrack, onNextTrack, onPreviousTrack }) {
  // Core playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Advanced audio features state
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  
  // New audio processing state
  const [isProcessingEnabled, setIsProcessingEnabled] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState(null);

  // Audio Context Integration
  const { 
    audioContext, 
    sourceNode, 
    gainNode, 
    analyzer,
    isInitialized,
    connectSource,
    getAnalyzerData 
  } = useAudioContext();

  // Initialize audio processing chain
  useEffect(() => {
    if (isInitialized && sound?._sounds[0]?._node) {
      connectSource(sound._sounds[0]._node);
    }
  }, [isInitialized, sound]);

  // Sound initialization
  useEffect(() => {
    if (currentTrack?.url) {
      if (sound) {
        sound.unload();
      }

      const newSound = new Howl({
        src: [currentTrack.url],
        html5: true,
        volume: volume,
        rate: speed,
        onload: () => {
          setDuration(newSound.duration());
          if (isInitialized && newSound._sounds[0]?._node) {
            connectSource(newSound._sounds[0]._node);
            
            // Initialize audio buffer for processing
            fetch(currentTrack.url)
              .then(response => response.arrayBuffer())
              .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
              .then(decodedBuffer => setAudioBuffer(decodedBuffer))
              .catch(error => console.error('Error loading audio buffer:', error));
          }
        },
        onplay: () => setIsPlaying(true),
        onpause: () => setIsPlaying(false),
        onend: () => {
          setIsPlaying(false);
          onNextTrack?.();
        },
        onseek: () => {
          setSeek(newSound.seek());
        },
      });

      setSound(newSound);
    }
  }, [currentTrack?.url, isInitialized]);

  // Playback control handlers
  const togglePlayPause = () => {
    if (sound) {
      if (isPlaying) {
        sound.pause();
      } else {
        sound.play();
      }
    }
  };

  const handleSeek = (e) => {
    const value = parseFloat(e.target.value);
    setSeek(value);
    sound?.seek(value);
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    sound?.volume(value);
  };

  const handleSpeedChange = (newSpeed) => {
    const value = Math.max(0.5, Math.min(2, newSpeed));
    setSpeed(value);
    sound?.rate(value);
  };

  // Enhanced pitch control with Web Audio API
  const handlePitchChange = (newPitch) => {
    const value = Math.max(-12, Math.min(12, newPitch));
    setPitch(value);
    
    if (sourceNode && isProcessingEnabled) {
      const semitoneRatio = Math.pow(2, value / 12);
      if (audioBuffer) {
        processAudioWithPitch(audioBuffer, semitoneRatio);
      }
    }
  };

  // New audio processing function
  const processAudioWithPitch = async (buffer, pitchRatio) => {
    if (!isInitialized) return;

    try {
      const offlineContext = new OfflineAudioContext(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = pitchRatio;

      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();
      setAudioBuffer(renderedBuffer);
      
      if (isPlaying) {
        sound.pause();
        setTimeout(() => sound.play(), 50);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Add new state for gestures
  const [miniPlayerHeight, setMiniPlayerHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);

  // Gesture handlers
  const { handlers } = useGestures({
    onSwipeUp: (velocity) => {
      if (!isExpanded) {
        setIsExpanded(true);
        // Adjust animation speed based on velocity
        const duration = Math.min(0.5, 1 / velocity);
        setExpandAnimation({ duration });
      }
    },
    onSwipeDown: (velocity) => {
      if (isExpanded) {
        setIsExpanded(false);
        const duration = Math.min(0.5, 1 / velocity);
        setExpandAnimation({ duration });
      }
    },
    onSwipeLeft: () => {
      onNextTrack?.();
    },
    onSwipeRight: () => {
      onPreviousTrack?.();
    },
    onDoubleTap: () => {
      onPlayPause(!isPlaying);
    }
  });

  // Animation variants
  const variants = {
    mini: {
      height: miniPlayerHeight,
      y: window.innerHeight - miniPlayerHeight,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    full: {
      height: '100%',
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  };

  // Initialize audio processor
  useEffect(() => {
    if (!audioContext) return;
    // Initialize audio processor
    audioProcessorRef.current = new AudioProcessor({
      context: audioContext,
      onProcessingComplete: handleProcessingComplete
    });
  }, [audioContext]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-x-0 bottom-0 bg-black"
        initial="mini"
        animate={isExpanded ? 'full' : 'mini'}
        variants={variants}
        drag="y"
        dragConstraints={{ top: 0, bottom: window.innerHeight - miniPlayerHeight }}
        onDragEnd={(e, info) => {
          const shouldExpand = info.offset.y < -50 || 
                             (isExpanded && info.offset.y < window.innerHeight / 3);
          setIsExpanded(shouldExpand);
        }}
        {...handlers}
      >
        {/* Mini Player */}
        {!isExpanded && (
          <div className="flex items-center p-4 h-20">
            <img 
              src={currentTrack?.artwork} 
              alt="Album Art"
              className="w-12 h-12 rounded-lg mr-4"
            />
            <div className="flex-1">
              <h3 className="font-medium truncate">{currentTrack?.title}</h3>
              <p className="text-sm text-gray-400 truncate">{currentTrack?.artist}</p>
            </div>
            <button
              onClick={() => onPlayPause(!isPlaying)}
              className="p-2 rounded-full bg-blue-600"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
        )}

        {/* Full Player */}
        {isExpanded && (
          <div className="h-full p-8 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.img 
                src={currentTrack?.artwork}
                alt="Album Art"
                className="w-64 h-64 rounded-lg shadow-2xl mb-8"
                animate={{ scale: isPlaying ? 1 : 0.95 }}
                transition={{ duration: 0.2 }}
              />
              <h2 className="text-2xl font-bold mb-2">{currentTrack?.title}</h2>
              <p className="text-gray-400 mb-8">{currentTrack?.artist}</p>
              
              {/* Progress bar */}
              <div className="w-full mb-8">
                <Slider 
                  value={[seek]}
                  max={duration}
                  onValueChange={(value) => handleSeek(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>{formatTime(seek)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center space-x-8">
                <button onClick={onPreviousTrack}>
                  <SkipBack size={32} />
                </button>
                <button
                  onClick={() => onPlayPause(!isPlaying)}
                  className="p-4 rounded-full bg-blue-600"
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                </button>
                <button onClick={onNextTrack}>
                  <SkipForward size={32} />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default Player;