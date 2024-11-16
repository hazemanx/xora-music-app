import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

function VehicleMode({ 
  currentTrack, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious,
  onExit,
  volume,
  onVolumeChange 
}) {
  // Enable wake lock to keep screen on
  useEffect(() => {
    const enableWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };
    
    enableWakeLock();
  }, []);

  // Handle screen orientation
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        if (screen.orientation) {
          await screen.orientation.lock('landscape');
        }
      } catch (err) {
        console.error('Orientation lock error:', err);
      }
    };

    lockOrientation();
    return () => {
      if (screen.orientation) {
        screen.orientation.unlock();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Exit button */}
      <button 
        onClick={onExit}
        className="absolute top-4 right-4 p-4 text-gray-400 hover:text-white"
      >
        Exit Vehicle Mode
      </button>

      <div className="h-full flex items-center">
        {/* Album art and info */}
        <div className="w-1/2 p-8 flex flex-col items-center justify-center">
          <img 
            src={currentTrack?.artwork || '/default-album.png'} 
            alt="Album Art"
            className="max-h-full rounded-lg shadow-2xl"
          />
          <div className="text-center p-4">
            <h2 className="text-3xl font-bold">{currentTrack?.title}</h2>
            <p className="text-xl text-gray-400">{currentTrack?.artist}</p>
          </div>
        </div>

        {/* Touch controls */}
        <div className="flex justify-around items-center p-8">
          <button 
            onClick={onPrevious}
            className="touch-target p-8 rounded-full bg-gray-800 hover:bg-gray-700"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>

          <button 
            onClick={onPlayPause}
            className="touch-target p-10 rounded-full bg-blue-600 hover:bg-blue-500"
          >
            <Play className="w-16 h-16" />
          </button>

          <button 
            onClick={onNext}
            className="touch-target p-8 rounded-full bg-gray-800 hover:bg-gray-700"
          >
            <ChevronRight className="w-12 h-12" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VehicleMode;