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
  
  // Audio processing
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
          if (audioContextRef.current) {
            sourceNodeRef.current = audioContextRef.current.createMediaElementSource(newSound._sounds[0]._node);
            sourceNodeRef.current.connect(gainNodeRef.current);
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
  }, [currentTrack?.url]);

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

  const handlePitchChange = (newPitch) => {
    const value = Math.max(-12, Math.min(12, newPitch));
    setPitch(value);
    // Implement pitch shifting using Web Audio API
    if (sourceNodeRef.current) {
      // Advanced pitch implementation will go here
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white">
      {/* Main Player UI */}
      <div className="max-w-screen-xl mx-auto p-4">
        {/* Track Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img 
              src={currentTrack?.artwork || "/api/placeholder/50/50"} 
              alt="Album cover" 
              className="w-16 h-16 rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-lg">{currentTrack?.title || 'No Track Selected'}</h3>
              <p className="text-gray-400">{currentTrack?.artist || 'Unknown Artist'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 hover:bg-gray-800 rounded-full"
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
            >
              <AdjustmentsIcon className="h-6 w-6" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-full">
              <ShareIcon className="h-6 w-6" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-full">
              <ViewListIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-gray-400">{formatTime(seek)}</span>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={seek}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
          <span className="text-sm text-gray-400">{formatTime(duration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-8">
          <button className="p-2 hover:bg-gray-800 rounded-full" onClick={onPreviousTrack}>
            <RewindIcon className="h-8 w-8" />
          </button>
          <button 
            className="p-4 hover:bg-gray-800 rounded-full" 
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <PauseIcon className="h-10 w-10" />
            ) : (
              <PlayIcon className="h-10 w-10" />
            )}
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-full" onClick={onNextTrack}>
            <FastForwardIcon className="h-8 w-8" />
          </button>
        </div>

        {/* Advanced Controls (Speed & Pitch) */}
        {showAdvancedControls && (
          <div className="mt-4 p-4 bg-gray-900 rounded-lg">
            <div className="space-y-4">
              {/* Speed Control */}
              <div>
                <label className="text-sm text-gray-400">Playback Speed ({speed.toFixed(2)}x)</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer mt-2"
                />
              </div>
              
              {/* Pitch Control */}
              <div>
                <label className="text-sm text-gray-400">Pitch ({pitch > 0 ? '+' : ''}{pitch} semitones)</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={pitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer mt-2"
                />
              </div>

              {/* Volume Control */}
              <div>
                <label className="text-sm text-gray-400">Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer mt-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Player;