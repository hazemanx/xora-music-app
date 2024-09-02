import React, { useState } from 'react';
import { SearchIcon } from '@heroicons/react/solid';
import { PlayIcon, PauseIcon, FastForwardIcon, RewindIcon } from '@heroicons/react/solid';
import Sidebar from './components/Sidebar';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <SearchIcon className="h-6 w-6 mr-2" />
            <input
              type="text"
              placeholder="Search for Artists, Songs, or Podcasts"
              className="bg-white bg-opacity-20 text-white placeholder-gray-400 px-4 py-2 rounded-full"
            />
          </div>
          <div>
            <button className="bg-white text-black px-4 py-2 rounded-full">Log in</button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <h2 className="text-2xl font-bold mb-4">Recently Played</h2>
          {/* Add your content here */}
        </main>

        {/* Player */}
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
      </div>
    </div>
  );
}

export default App;
