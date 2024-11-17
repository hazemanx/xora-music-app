import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  List,
  Volume2,
  Volume1,
  VolumeX,
  Settings,
  Shuffle,
  Repeat,
  RepeatOnce,
  Plus,
  Minus,
  Music,
  Hash,
  RotateCcw,
  Edit2,
  Image as ImageIcon,
  Save,
  FileText,
  BarChart2,
  Clock,
  Heart,
  Share2,
  MessageCircle,
  MoreVertical,
  Radio
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Slider } from "../ui/slider";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

import { AudioProcessorEngine } from './Audio/AudioProcessor';
import Equalizer from './Equalizer';
import TrackMetadataEditor from './TrackMetadataEditor';
import AudioVisualizer from './AudioVisualizer';
import { useAudioContext } from '../Hooks/useAudioContext';
import { ProgressRing } from './ProgressRing';
import { QueueDisplay } from './QueueDisplay';
import { MiniPlayer } from './MiniPlayer';

const supportedFormats = ['mp3', 'wav', 'aac', 'ogg', 'flac'];

function MusicPlayer({
  tracks, 
  currentTrackIndex, 
  isPlaying, 
  onPlayPause, 
  onNextTrack, 
  onPreviousTrack, 
  onTrackEnd, 
  onError,
  onTrackUpdate 
}) {
  // Existing state
  const [sound, setSound] = useState(null);
  const [volume, setVolume] = useState(1);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [isEqualizerVisible, setIsEqualizerVisible] = useState(false);
  const [isPitchSpeedVisible, setIsPitchSpeedVisible] = useState(false);
  
  // Audio Context state
  const { 
    audioContext, 
    sourceNode,
    gainNode,
    analyzer,
    isInitialized,
    connectSource,
    getAnalyzerData 
  } = useAudioContext();
  
  // Enhanced features state
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [isMetadataEditorOpen, setIsMetadataEditorOpen] = useState(false);
  const [isVisualizerVisible, setIsVisualizerVisible] = useState(false);
  const [visualizerType, setVisualizerType] = useState('bars');
  const [isFavorite, setIsFavorite] = useState(false);
  const [crossfadeTime, setCrossfadeTime] = useState(2);
  const [nextSound, setNextSound] = useState(null);
  const [replayGain, setReplayGain] = useState(0);
  const [playbackHistory, setPlaybackHistory] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  
  // Refs
  const audioProcessorRef = useRef(null);
  const visualizerRef = useRef(null);
  const crossfadeTimerRef = useRef(null);
  const seekBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const gestureAreaRef = useRef(null);

  const isFormatSupported = useCallback((url) => {
    return supportedFormats.some(format => url.toLowerCase().endsWith(format));
  }, []);

  // Initialize audio processor
  useEffect(() => {
    if (!audioContext) return;
    
    try {
      audioProcessorRef.current = new AudioProcessorEngine({
        context: audioContext,
        onProcessingComplete: handleProcessingComplete
      });

      return () => {
        if (audioProcessorRef.current?.cleanup) {
          audioProcessorRef.current.cleanup();
        }
        if (sound) {
          sound.unload();
        }
        if (crossfadeTimerRef.current) {
          clearTimeout(crossfadeTimerRef.current);
        }
      };
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      onError('Failed to initialize audio processor');
    }
  }, [audioContext]);

  // Track initialization
  useEffect(() => {
    if (!tracks.length || currentTrackIndex >= tracks.length) return;

    const initTrack = async () => {
      try {
        const currentTrack = tracks[currentTrackIndex];
        
        if (!currentTrack.url) {
          throw new Error('Invalid track URL');
        }

        if (!isFormatSupported(currentTrack.url)) {
          throw new Error('Unsupported audio format');
        }

        if (sound) {
          sound.unload();
        }

        const newSound = new Howl({
          src: [currentTrack.url],
          html5: true,
          volume: volume,
          rate: playbackRate,
          format: supportedFormats,
          xhr: {
            method: 'GET',
            headers: {
              'Content-Type': 'audio/*'
            }
          },
          onload: () => {
            setDuration(newSound.duration());
            if (isInitialized && newSound._sounds[0]?._node) {
              connectSource(newSound._sounds[0]._node);
              
              if (currentTrack.replayGain) {
                setReplayGain(currentTrack.replayGain);
                applyReplayGain(newSound, currentTrack.replayGain);
              }
            }
          },
          onloaderror: (id, error) => {
            console.error('Audio loading error:', error);
            onError('Failed to load audio file');
          },
          onplayerror: (id, error) => {
            console.error('Audio playback error:', error);
            onError('Playback error occurred');
          },
          onend: onTrackEnd,
          onseek: () => setSeek(newSound.seek()),
          onstop: () => {
            setSeek(0);
            onPlayPause(false);
          }
        });

        setSound(newSound);
        
        // Update playback history
        setPlaybackHistory(prev => [...prev, { 
          trackId: currentTrack.id, 
          timestamp: Date.now() 
        }]);

      } catch (error) {
        console.error('Track initialization failed:', error);
        onError(error.message);
      }
    };

    initTrack();
  }, [tracks, currentTrackIndex, volume, playbackRate, isInitialized, isFormatSupported]);

  // Enhanced playback control handlers
  const handleTrackEnd = () => {
    if (repeat === 'one') {
      sound.seek(0);
      sound.play();
    } else if (repeat === 'all' || (!shuffle && currentTrackIndex < tracks.length - 1)) {
      handleCrossfade().then(() => onNextTrack());
    } else if (shuffle) {
      const nextIndex = getRandomTrackIndex();
      handleCrossfade().then(() => onNextTrack(nextIndex));
    } else {
      onPlayPause(false);
    }
  };

  const handleCrossfade = useCallback(async () => {
    if (!sound || crossfadeTime <= 0) return;
    
    // Create next track's sound
    const nextTrack = tracks[currentTrackIndex + 1];
    if (!nextTrack) return;
    
    const fadeOutVolume = sound.volume();
    const nextSound = new Howl({
      src: [nextTrack.url],
      html5: true,
      volume: 0,
      onload: () => {
        // Start crossfade
        nextSound.play();
        nextSound.fade(0, fadeOutVolume, crossfadeTime * 1000);
        sound.fade(fadeOutVolume, 0, crossfadeTime * 1000);
        
        // Cleanup after fade
        setTimeout(() => {
          sound.unload();
          setSound(nextSound);
        }, crossfadeTime * 1000);
      }
    });
    
    setNextSound(nextSound);
  }, [sound, crossfadeTime, tracks, currentTrackIndex]);

  const handleProcessingComplete = (result) => {
    // Handle results from audio processor
    if (result.replayGain) {
      setReplayGain(result.replayGain);
    }
  };

  // Metadata handling
  const handleMetadataSave = async (updatedMetadata) => {
    try {
      setIsLoading(true);
      const updatedTrack = { ...tracks[currentTrackIndex], ...updatedMetadata };
      await onTrackUpdate(currentTrackIndex, updatedTrack);
      
      // Update local state immediately for smooth UI
      setTracks(prev => prev.map((track, idx) => 
        idx === currentTrackIndex ? updatedTrack : track
      ));
      
      toast({
        title: "Changes saved",
        description: "Track information has been updated successfully."
      });
      
      setIsMetadataEditorOpen(false);
    } catch (error) {
      console.error('Failed to save metadata:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Playback control handlers
  const togglePlayPause = () => {
    if (sound) {
      if (isPlaying) {
        sound.pause();
        cancelAnimationFrame(visualizerFrameRef.current);
      } else {
        sound.play();
        updateVisualization();
      }
      onPlayPause(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (sound) {
      sound.volume(newVolume);
      // Update visualization intensity with volume
      updateVisualization(newVolume);
    }
  };

  const handleSeek = (newPosition) => {
    if (sound) {
      sound.seek(newPosition);
      setSeek(newPosition);
      // Ensure visualization stays in sync after seeking
      cancelAnimationFrame(visualizerFrameRef.current);
      updateVisualization();
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setPlaybackRate(newSpeed);
    if (sound) {
      sound.rate(newSpeed);
      // Adjust visualization to playback speed
      updateVisualization();
    }
  };

  const handlePitchChange = async (newPitch) => {
    setPitch(newPitch);
    if (audioProcessorRef.current) {
      await audioProcessorRef.current.setPitch(newPitch);
    }
  };

  // Visualization
  const startVisualization = () => {
    if (visualizerRef.current) {
      visualizerRef.current.start();
    }
  };

  const pauseVisualization = () => {
    if (visualizerRef.current) {
      visualizerRef.current.pause();
    }
  };

  const updateVisualization = () => {
    if (visualizerRef.current) {
      visualizerRef.current.update();
    }
  };

  // Utility functions
  const getRandomTrackIndex = () => {
    const availableIndices = tracks
      .map((_, index) => index)
      .filter(index => index !== currentTrackIndex);
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  };

  const updatePlaybackHistory = (track) => {
    setPlaybackHistory(prev => {
      const newHistory = [track, ...prev].slice(0, 50); // Keep last 50 tracks
      return newHistory;
    });
  };

  const preloadNextTrack = (track) => {
    if (!track?.url) return;
    new Howl({ src: [track.url], preload: true });
  };

  const applyReplayGain = (sound, gain) => {
    if (!sound || !gain) return;
    const volume = Math.min(1, Math.max(0, sound.volume() * Math.pow(10, gain / 20)));
    sound.volume(volume);
  };

  const handleAudioError = (type, error) => {
    console.error(`Audio ${type} error:`, error);
    onError(`Failed to ${type} audio. Please try again.`);
  };

  const cleanup = () => {
    if (sound) {
      sound.unload();
    }
    if (crossfadeTimerRef.current) {
      clearTimeout(crossfadeTimerRef.current);
    }
    if (audioProcessorRef.current) {
      audioProcessorRef.current.cleanup();
    }
    if (visualizerRef.current) {
      visualizerRef.current.cleanup();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!tracks.length) return null;

  const currentTrack = tracks[currentTrackIndex];

  return (
    <>
      {/* Mini Player (when collapsed) */}
      {!isExpanded && (
        <MiniPlayer
          currentTrack={tracks[currentTrackIndex]}
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onExpand={() => setIsExpanded(true)}
        />
      )}

      {/* Full Player */}
      {isExpanded && (
        <div className="fixed inset-0 bg-cyber-black text-cyber-silver p-8">
          <div className="h-full flex flex-col">
            {/* Visualizer */}
            <AudioVisualizer
              audioContext={audioContext}
              sourceNode={sourceNode}
              type={visualizerType}
              onTypeChange={setVisualizerType}
            />

            {/* Track Info & Controls */}
            <div className="flex-1 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{currentTrack?.title}</h2>
                <p className="text-cyber-accent">{currentTrack?.artist}</p>
              </div>
              
              {/* Progress Ring */}
              <ProgressRing
                progress={(seek / duration) * 100}
                size={120}
              />
            </div>

            {/* Progress Bar */}
            <ProgressBar
              currentTime={seek}
              duration={duration}
              onSeek={handleSeek}
            />

            {/* Playback Controls */}
            <div className="flex items-center justify-between mt-8">
              <button onClick={() => setShowQueue(!showQueue)}>
                Queue
              </button>
              <div className="flex items-center gap-4">
                <button onClick={onPreviousTrack}>Previous</button>
                <button onClick={togglePlayPause}>
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={onNextTrack}>Next</button>
              </div>
              <button onClick={() => setIsExpanded(false)}>
                Minimize
              </button>
            </div>
          </div>

          {/* Queue Sidebar */}
          {showQueue && (
            <QueueDisplay
              queue={tracks}
              currentIndex={currentTrackIndex}
              onTrackSelect={(index) => {
                setCurrentTrackIndex(index);
                handleTrackTransition(tracks[index]);
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

export default MusicPlayer;