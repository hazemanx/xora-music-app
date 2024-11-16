// Array utilities
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Performance utilities
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format utilities
export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Audio utilities
export const calculateReplayGain = (audioBuffer) => {
  if (!audioBuffer) return 0;
  
  const channels = audioBuffer.numberOfChannels;
  let sum = 0;
  
  for (let channel = 0; channel < channels; channel++) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
  }
  
  const rms = Math.sqrt(sum / (channels * audioBuffer.length));
  const db = 20 * Math.log10(rms);
  return -db;
};

// Platform utilities
export const getPlatformFromUrl = (url) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'YOUTUBE';
  }
  if (url.includes('soundcloud.com')) {
    return 'SOUNDCLOUD';
  }
  return 'LOCAL';
};

// Error handling
export const handleError = (error) => {
  console.error('Error:', error);
  return {
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'UNKNOWN_ERROR'
  };
}; 