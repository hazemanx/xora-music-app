import React, { useState } from 'react';
import { XIcon, SearchIcon, HomeIcon, LibraryIcon, PlusCircleIcon } from '@heroicons/react/solid';
import { PlayIcon, PauseIcon, FastForwardIcon, RewindIcon } from '@heroicons/react/solid';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 p-5">
        <div className="flex items-center mb-10">
          <XIcon className="h-10 w-10 text-white" />
          <h1 className="text-2xl font-bold ml-2">XORA</h1>
        </div>
        <nav>
          <ul>
            <li className="flex items-center mb-4">
              <HomeIcon className="h-6 w-6 mr-2" />
              <span>Home</span>
            </li>
            <li className="flex items-center mb-4">
              <SearchIcon className="h-6 w-6 mr-2" />
              <span>Search</span>
            </li>
            <li className="flex items-center mb-4">
              <LibraryIcon className="h-6 w-6 mr-2" />
              <span>Your Library</span>
            </li>
          </ul>
        </nav>
        <div className="mt-8">
          <button className="flex items-center">
            <PlusCircleIcon className="h-6 w-6 mr-2" />
            <span>Create Playlist</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 p-4 flex justify-between items-center">
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
