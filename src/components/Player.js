import React from 'react';
import { PlayIcon, PauseIcon, FastForwardIcon, RewindIcon } from '@heroicons/react/solid';

function Player({ isPlaying, setIsPlaying }) {
  return (
    <div className="bg-gray-900 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <img src="/api/placeholder/50/50" alt="Album cover" className="w-12 h-12 mr-4" />
          <div>
            <h3 className="font-semibold">Song Title</h3>
            <p className="text-sm text-gray-400">Artist Name</p>
          </div>
        </div>
        <div className="flex items-center">
          <RewindIcon className="h-6 w-6 mr-4 cursor-pointer" />
          {isPlaying ? (
            <PauseIcon className="h-8 w-8 cursor-pointer" onClick={() => setIsPlaying(false)} />
          ) : (
            <PlayIcon className="h-8 w-8 cursor-pointer" onClick={() => setIsPlaying(true)} />
          )}
          <FastForwardIcon className="h-6 w-6 ml-4 cursor-pointer" />
        </div>
        <div className="w-1/3">
          <div className="bg-gray-700 h-1 rounded-full">
            <div className="bg-white h-1 w-1/3 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
