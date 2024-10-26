import { useState, useCallback, useEffect, useRef } from 'react';

// Define constants for repeat modes
export const REPEAT_MODES = {
  OFF: 'off',
  ALL: 'all',
  ONE: 'one'
};

// Define playback states
export const PLAYBACK_STATES = {
  PLAYING: 'playing',
  PAUSED: 'paused',
  LOADING: 'loading',
  ERROR: 'error'
};

export function usePlaybackState(initialTracks = []) {
  // Core playback state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackState, setPlaybackState] = useState(PLAYBACK_STATES.PAUSED);
  
  // Queue management
  const [queue, setQueue] = useState([]);
  const [queueHistory, setQueueHistory] = useState([]);
  const previousQueue = useRef([]);
  
  // Playback settings
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1.0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(REPEAT_MODES.OFF);
  
  // Audio processing state
  const [equalizer, setEqualizer] = useState({
    bass: 0,
    mid: 0,
    treble: 0
  });
  const [pitch, setPitch] = useState(0);

  // Time tracking
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  // Error handling
  const [error, setError] = useState(null);

  // Initialize queue with tracks if provided
  useEffect(() => {
    if (initialTracks.length > 0 && queue.length === 0) {
      setQueue(initialTracks);
    }
  }, [initialTracks]);

  // Save queue history when changed
  useEffect(() => {
    if (queue !== previousQueue.current) {
      setQueueHistory(prev => [...prev, previousQueue.current]);
      previousQueue.current = queue;
    }
  }, [queue]);

  // Handle track changes
  const handleTrackChange = useCallback((index) => {
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    setPlaybackState(PLAYBACK_STATES.LOADING);
    setError(null);
  }, []);

  // Next track logic
  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (shuffle) {
      // Avoid playing the same track twice in shuffle mode
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === currentTrackIndex && queue.length > 1);
      handleTrackChange(nextIndex);
    } else {
      if (currentTrackIndex < queue.length - 1) {
        handleTrackChange(currentTrackIndex + 1);
      } else if (repeat === REPEAT_MODES.ALL) {
        handleTrackChange(0);
      } else {
        setIsPlaying(false);
        setPlaybackState(PLAYBACK_STATES.PAUSED);
      }
    }
  }, [currentTrackIndex, queue.length, shuffle, repeat, handleTrackChange]);

  // Previous track logic
  const handlePreviousTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
      // If more than 3 seconds into the song, restart it
      setCurrentTime(0);
    } else if (shuffle) {
      // In shuffle mode, go to a random previous track from history
      const previousTracks = queueHistory[queueHistory.length - 1] || [];
      if (previousTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * previousTracks.length);
        handleTrackChange(randomIndex);
      }
    } else {
      // Normal previous track behavior
      if (currentTrackIndex > 0) {
        handleTrackChange(currentTrackIndex - 1);
      } else if (repeat === REPEAT_MODES.ALL) {
        handleTrackChange(queue.length - 1);
      }
    }
  }, [currentTrackIndex, currentTime, queue.length, shuffle, repeat, queueHistory, handleTrackChange]);

  // Queue management functions
  const addToQueue = useCallback((track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < currentTrackIndex) {
      setCurrentTrackIndex(prev => prev - 1);
    }
  }, [currentTrackIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    setPlaybackState(PLAYBACK_STATES.PAUSED);
  }, []);

  const moveInQueue = useCallback((fromIndex, toIndex) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      
      // Update currentTrackIndex if necessary
      if (fromIndex === currentTrackIndex) {
        setCurrentTrackIndex(toIndex);
      } else if (
        fromIndex < currentTrackIndex && toIndex >= currentTrackIndex ||
        fromIndex > currentTrackIndex && toIndex <= currentTrackIndex
      ) {
        setCurrentTrackIndex(prev => 
          fromIndex < currentTrackIndex ? prev - 1 : prev + 1
        );
      }
      
      return newQueue;
    });
  }, [currentTrackIndex]);

  // Time update handler
  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
    
    // Auto-advance to next track if needed
    if (time >= duration && duration > 0) {
      if (repeat === REPEAT_MODES.ONE) {
        setCurrentTime(0);
      } else {
        handleNextTrack();
      }
    }
  }, [duration, repeat, handleNextTrack]);

  // Seek handler
  const handleSeek = useCallback((time) => {
    setCurrentTime(time);
    return time;
  }, []);

  // Volume handler with fade
  const handleVolumeChange = useCallback((newVolume, fadeTime = 0) => {
    if (fadeTime > 0) {
      const steps = 20;
      const stepTime = fadeTime / steps;
      const volumeDiff = newVolume - volume;
      const stepValue = volumeDiff / steps;

      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        currentStep++;
        setVolume(prev => prev + stepValue);
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          setVolume(newVolume);
        }
      }, stepTime);
    } else {
      setVolume(newVolume);
    }
  }, [volume]);

  return {
    // Playback state
    currentTrackIndex,
    isPlaying,
    playbackState,
    currentTime,
    duration,
    buffered,
    error,

    // Queue state
    queue,
    queueHistory,

    // Settings
    volume,
    speed,
    shuffle,
    repeat,
    equalizer,
    pitch,

    // State setters
    setCurrentTrackIndex,
    setIsPlaying,
    setPlaybackState,
    setDuration,
    setBuffered,
    setError,
    setVolume,
    setSpeed,
    setShuffle,
    setRepeat,
    setEqualizer,
    setPitch,

    // Track control handlers
    handleNextTrack,
    handlePreviousTrack,
    handleTrackChange,
    handleTimeUpdate,
    handleSeek,
    handleVolumeChange,

    // Queue management
    addToQueue,
    removeFromQueue,
    clearQueue,
    moveInQueue,

    // Constants
    REPEAT_MODES,
    PLAYBACK_STATES
  };
}

export default usePlaybackState;