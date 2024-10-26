import React, { useState, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';
import Equalizer from './Equalizer';

function MusicPlayer({ tracks, currentTrackIndex, isPlaying, onPlayPause, onNextTrack, onPreviousTrack, onTrackEnd, onError }) {
  // Audio and playback state
  const [sound, setSound] = useState(null);
  const [volume, setVolume] = useState(1);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'
  const [isEqualizerVisible, setIsEqualizerVisible] = useState(false);
  const [isPitchSpeedVisible, setIsPitchSpeedVisible] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [sourceNode, setSourceNode] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  // Initialize Audio Context
  useEffect(() => {
    const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(newAudioContext);
    return () => newAudioContext.close();
  }, []);

  // Initialize Howler sound object
  useEffect(() => {
    if (tracks.length > 0 && currentTrackIndex < tracks.length) {
      if (sound) {
        sound.unload();
      }
      const newSound = new Howl({
        src: [tracks[currentTrackIndex].url],
        html5: true,
        volume: volume,
        rate: playbackRate,
        onload: () => {
          setDuration(newSound.duration());
          if (audioContext) {
            const newSourceNode = audioContext.createMediaElementSource(newSound._sounds[0]._node);
            setSourceNode(newSourceNode);
            newSourceNode.connect(audioContext.destination);
          }
        },
        onplay: () => onPlayPause(true),
        onpause: () => onPlayPause(false),
        onstop: () => onPlayPause(false),
        onend: handleTrackEnd,
        onseek: () => {
          setSeek(newSound.seek());
        },
        onloaderror: () => onError(`Failed to load audio for "${tracks[currentTrackIndex].title}"`),
        onplayerror: () => onError(`Failed to play "${tracks[currentTrackIndex].title}". Please try again.`),
      });
      setSound(newSound);
    }
  }, [tracks, currentTrackIndex, audioContext]);

  // Handle play state changes
  useEffect(() => {
    if (sound) {
      if (isPlaying) {
        sound.play();
      } else {
        sound.pause();
      }
    }
  }, [isPlaying, sound]);

  // Track end handler
  const handleTrackEnd = () => {
    if (repeat === 'one') {
      sound.seek(0);
      sound.play();
    } else if (repeat === 'all' || (!shuffle && currentTrackIndex < tracks.length - 1)) {
      onNextTrack();
    } else if (shuffle) {
      const nextIndex = Math.floor(Math.random() * tracks.length);
      onNextTrack(nextIndex);
    } else {
      onPlayPause(false);
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

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (sound) {
      sound.volume(newVolume);
    }
  };

  const handleSeek = (e) => {
    const newSeek = parseFloat(e.target.value);
    setSeek(newSeek);
    if (sound) {
      sound.seek(newSeek);
    }
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(repeat) + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  // Pitch and Speed control handlers
  const adjustSpeed = (increment) => {
    const newSpeed = Math.max(0.1, Math.min(3.0, playbackRate + increment));
    setPlaybackRate(newSpeed);
    if (sound) {
      sound.rate(newSpeed);
    }
  };

  const adjustPitch = (increment) => {
    const newPitch = Math.max(-12, Math.min(12, pitch + increment));
    setPitch(newPitch);
    // Implement pitch shifting logic here using Web Audio API
  };

  const resetPitchAndSpeed = () => {
    setPlaybackRate(1.0);
    setPitch(0);
    if (sound) {
      sound.rate(1.0);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />;
    if (volume < 0.5) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  if (!tracks.length) return null;

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="w-full h-screen bg-zinc-900 text-white flex flex-col">
      {/* Album Art and Track Info */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md aspect-square mb-8">
          <img 
            src={currentTrack.artwork || "/api/placeholder/400/400"}
            alt={`${currentTrack.title} artwork`}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-2">{currentTrack.title}</h2>
          <p className="text-gray-400 text-lg">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="w-full p-8 bg-zinc-900">
        {/* Progress bar */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm text-gray-400">{formatTime(seek)}</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max={duration}
              value={seek}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
          <span className="text-sm text-gray-400">{formatTime(duration)}</span>
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
            className="p-4 text-white hover:text-gray-200"
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
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
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

      {/* Pitch & Speed Controls Modal */}
      {isPitchSpeedVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-sm p-6">
            <div className="mb-8">
              <div className="text-gray-400 mb-2">Tempo ({playbackRate.toFixed(2)}x)</div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => adjustSpeed(-0.1)}
                  className="w-12 h-12 rounded-full bg-zinc-800 text-cyan-500 flex items-center justify-center"
                >
                  <Minus size={24} />
                </button>
                <button
                  onClick={() => adjustSpeed(0.1)}
                  className="w-12 h-12 rounded-full bg-zinc-800 text-cyan-500 flex items-center justify-center"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-gray-400 mb-2">Pitch ({pitch > 0 ? '+' : ''}{pitch})</div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => adjustPitch(-0.5)}
                  className="w-12 h-12 rounded-full bg-zinc-800 text-cyan-500 flex items-center justify-center"
                >
                  <Music size={24} />
                </button>
                <button
                  onClick={() => adjustPitch(0.5)}
                  className="w-12 h-12 rounded-full bg-zinc-800 text-cyan-500 flex items-center justify-center"
                >
                  <Hash size={24} />
                </button>
              </div>
            </div>

            <button
              onClick={resetPitchAndSpeed}
              className="w-12 h-12 rounded-full bg-zinc-800 text-green-500 flex items-center justify-center mx-auto mb-8"
            >
              <RotateCcw size={24} />
            </button>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setIsPitchSpeedVisible(false)}
                className="flex-1 py-2 px-4 rounded bg-zinc-800 text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsPitchSpeedVisible(false)}
                className="flex-1 py-2 px-4 rounded bg-cyan-600 text-white"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equalizer */}
      {isEqualizerVisible && (
        <div className="absolute bottom-full left-0 right-0 bg-zinc-800 p-4">
          <Equalizer audioContext={audioContext} sourceNode={sourceNode} />
        </div>
      )}
    </div>
  );
}

export default MusicPlayer;