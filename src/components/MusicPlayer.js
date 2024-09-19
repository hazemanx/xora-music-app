import React, { useState, useEffect } from 'react';
import { Howl, Howler } from 'howler';
import './MusicPlayer.css';

function MusicPlayer({ tracks, currentTrackIndex, isPlaying, onPlayPause, onNextTrack, onPreviousTrack, onTrackEnd, onError }) {
  const [sound, setSound] = useState(null);
  const [volume, setVolume] = useState(1);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'

  useEffect(() => {
    if (tracks.length > 0 && currentTrackIndex < tracks.length) {
      if (sound) {
        sound.unload();
      }
      const newSound = new Howl({
        src: [tracks[currentTrackIndex].url],
        html5: true,
        volume: volume,
        onload: () => {
          setDuration(newSound.duration());
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
  }, [tracks, currentTrackIndex]);

  useEffect(() => {
    if (sound) {
      if (isPlaying) {
        sound.play();
      } else {
        sound.pause();
      }
    }
  }, [isPlaying, sound]);

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

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!tracks.length) return null;

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-2">
          <div className="text-white">
            Now Playing: {currentTrack.title} - {currentTrack.artist}
          </div>
          <div className="flex space-x-4">
            <button className={`text-white ${shuffle ? 'bg-blue-500' : ''}`} onClick={toggleShuffle}>
              {shuffle ? 'Shuffle On' : 'Shuffle Off'}
            </button>
            <button className={`text-white ${repeat !== 'off' ? 'bg-blue-500' : ''}`} onClick={toggleRepeat}>
              Repeat: {repeat === 'one' ? '1' : repeat === 'all' ? 'All' : 'Off'}
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-white">{formatTime(seek)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            value={seek}
            onChange={handleSeek}
            className="w-full"
          />
          <span className="text-white">{formatTime(duration)}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 w-1/3">
            <span className="text-white">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full"
            />
          </div>
          <div className="flex space-x-4">
            <button className="text-white" onClick={onPreviousTrack}>Previous</button>
            <button className="text-white" onClick={togglePlayPause}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button className="text-white" onClick={onNextTrack}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;