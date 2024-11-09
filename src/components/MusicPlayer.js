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

import { useAudioContext } from '../hooks/useAudioContext';

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
  const [visualizerType, setVisualizerType] = useState('waveform');
  const [isFavorite, setIsFavorite] = useState(false);
  const [crossfadeTime, setCrossfadeTime] = useState(2);
  const [nextSound, setNextSound] = useState(null);
  const [replayGain, setReplayGain] = useState(0);
  const [playbackHistory, setPlaybackHistory] = useState([]);
  
  // Refs
  const audioProcessorRef = useRef(null);
  const visualizerRef = useRef(null);
  const crossfadeTimerRef = useRef(null);
  const seekBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const gestureAreaRef = useRef(null);

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
        if (sound) {
          if (crossfadeTime > 0) {
            await handleCrossfade();
          } else {
            sound.unload();
          }
        }

        const currentTrack = tracks[currentTrackIndex];
        const newSound = new Howl({
          src: [currentTrack.url],
          html5: true,
          volume: volume,
          rate: playbackRate,
          format: ['mp3', 'wav', 'flac'],
          onload: () => {
            setDuration(newSound.duration());
            if (isInitialized && newSound._sounds[0]?._node) {
              connectSource(newSound._sounds[0]._node);
              
              // Apply replay gain if available
              if (currentTrack.replayGain) {
                setReplayGain(currentTrack.replayGain);
                applyReplayGain(newSound, currentTrack.replayGain);
              }
            }
          },
          onplay: () => onPlayPause(true),
          onpause: () => onPlayPause(false),
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
        onError('Failed to load track');
      }
    };

    initTrack();
  }, [tracks, currentTrackIndex, crossfadeTime, volume, playbackRate, isInitialized]);

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
      // Update track metadata
      const updatedTrack = { ...tracks[currentTrackIndex], ...updatedMetadata };
      await onTrackUpdate(currentTrackIndex, updatedTrack);
      
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
    }
  };

  // Playback control handlers
  const togglePlayPause = () => {
    if (sound) {
      if (isPlaying) {
        sound.pause();
      } else {
        sound.play();
      }
      onPlayPause(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (sound) {
      sound.volume(newVolume);
    }
  };

  const handleSeek = (newPosition) => {
    if (sound) {
      sound.seek(newPosition);
      setSeek(newPosition);
      updateVisualization();
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setPlaybackRate(newSpeed);
    if (sound) {
      sound.rate(newSpeed);
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
    <div className="w-full h-screen bg-zinc-900 text-white flex flex-col">
      {/* Enhanced Album Art and Track Info */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md aspect-square mb-8 relative group">
          <img 
            src={currentTrack.artwork || "/api/placeholder/400/400"}
            alt={`${currentTrack.title} artwork`}
            className="w-full h-full object-cover rounded-lg shadow-xl transition-transform group-hover:scale-105"
          />
          <button
            onClick={() => setIsMetadataEditorOpen(true)}
            className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 size={20} />
          </button>
        </div>
        
        <div className="w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-2 truncate">{currentTrack.title}</h2>
          <p className="text-gray-400 text-lg truncate">{currentTrack.artist}</p>
          {currentTrack.album && (
            <p className="text-gray-500 text-sm mt-1 truncate">{currentTrack.album}</p>
          )}
        </div>

        {/* Visualizer */}
        {isVisualizerVisible && (
          <div className="w-full max-w-md mt-8">
            <AudioVisualizer
              ref={visualizerRef}
              type={visualizerType}
              audioContext={audioContext}
              sourceNode={sourceNode}
              className="w-full h-32 bg-zinc-800/50 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Enhanced Playback Controls */}
      <div className="w-full p-8 bg-zinc-900/95 backdrop-blur">
        {/* Progress bar */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm text-gray-400 min-w-[40px]">
            {formatTime(seek)}
          </span>
          <div className="flex-1 relative group">
            <Slider
              ref={seekBarRef}
              min={0}
              max={duration}
              value={[seek]}
              onValueChange={([value]) => handleSeek(value)}
              className="relative z-10"
            />
            <div className="absolute inset-0 -z-10 scale-y-[4] opacity-0 group-hover:opacity-100 transition-opacity">
              <canvas 
                ref={el => visualizerRef.current?.setWaveformCanvas(el)}
                className="w-full h-full"
              />
            </div>
          </div>
          <span className="text-sm text-gray-400 min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Main controls */}
        <div className="flex justify-between items-center mb-8">
          <button 
            className={`p-2 text-gray-400 hover:text-white ${shuffle ? 'text-blue-500' : ''}`}
            onClick={toggleShuffle}
          >
            <Shuffle size={24} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white" onClick={onPreviousTrack}>
            <SkipBack size={28} />
          </button>
          <button 
            onClick={togglePlayPause}
            className="p-4 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? <Pause size={40} /> : <Play size={40} />}
          </button>
          <button className="p-2 text-gray-400 hover:text-white" onClick={onNextTrack}>
            <SkipForward size={28} />
          </button>
          <button 
            className={`p-2 text-gray-400 hover:text-white ${repeat !== 'off' ? 'text-blue-500' : ''}`}
            onClick={toggleRepeat}
          >
            {repeat === 'one' ? <RepeatOnce size={24} /> : <Repeat size={24} />}
          </button>
        </div>

        {/* Bottom controls */}
        <div className="flex justify-between items-center">
          <button 
            className="p-2 text-gray-400 hover:text-white"
            onClick={() => setIsPitchSpeedVisible(true)}
          >
            <Settings size={24} />
          </button>
          <div className="flex items-center gap-2">
            {getVolumeIcon()}
            <Slider
              ref={volumeBarRef}
              min={0}
              max={1}
              step={0.01}
              value={[volume]}
              onValueChange={([value]) => handleVolumeChange(value)}
              className="w-24"
            />
          </div>
          <button 
            className={`p-2 text-gray-400 hover:text-white ${isEqualizerVisible ? 'text-blue-500' : ''}`}
            onClick={() => setIsEqualizerVisible(!isEqualizerVisible)}
          >
            <List size={24} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {isMetadataEditorOpen && (
        <TrackMetadataEditor
          track={currentTrack}
          onSave={handleMetadataSave}
          onClose={() => setIsMetadataEditorOpen(false)}
        />
      )}

      {isPitchSpeedVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Playback Settings</h3>
            
            {/* Speed control */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Playback Speed: {playbackRate.toFixed(2)}x
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleSpeedChange(Math.max(0.5, playbackRate - 0.1))}
                >
                  <Minus size={16} />
                </Button>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[playbackRate]}
                  onValueChange={([value]) => handleSpeedChange(value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleSpeedChange(Math.min(2, playbackRate + 0.1))}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Pitch control */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Pitch Adjustment: {pitch > 0 ? '+' : ''}{pitch} semitones
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePitchChange(Math.max(-12, pitch - 1))}
                >
                  <Minus size={16} />
                </Button>
                <Slider
                  min={-12}
                  max={12}
                  step={1}
                  value={[pitch]}
                  onValueChange={([value]) => handlePitchChange(value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePitchChange(Math.min(12, pitch + 1))}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Close button */}
            <Button 
              className="w-full"
              onClick={() => setIsPitchSpeedVisible(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Equalizer */}
      {isEqualizerVisible && (
        <div className="absolute bottom-full left-0 right-0 bg-zinc-800 p-4">
          <Equalizer 
            audioContext={audioContext} 
            sourceNode={sourceNode} 
          />
        </div>
      )}
    </div>
  );
}

export default MusicPlayer;