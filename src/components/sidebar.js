import React from 'react';
import { HomeIcon, SearchIcon, LibraryIcon, PlusCircleIcon } from '@heroicons/react/outline';

function Sidebar() {
  return (
    <div className="w-64 bg-black p-5">
      <div className="flex items-center mb-10">
        <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22l-9-5V7l9-5 9 5v10l-9 5zm0-2.615l7-3.89V8.505l-7-3.89-7 3.89v6.99l7 3.89zm0-14.77l5 2.78v5.57l-5 2.78-5-2.78V7.395l5-2.78z"/>
        </svg>
        <h1 className="text-2xl font-bold ml-2 text-white">XORA</h1>
      </div>
      <nav>
        <ul>
          <li className="flex items-center mb-4 text-gray-400 hover:text-white cursor-pointer">
            <HomeIcon className="h-6 w-6 mr-2" />
            <span>Home</span>
          </li>
          <li className="flex items-center mb-4 text-gray-400 hover:text-white cursor-pointer">
            <SearchIcon className="h-6 w-6 mr-2" />
            <span>Search</span>
          </li>
          <li className="flex items-center mb-4 text-gray-400 hover:text-white cursor-pointer">
            <LibraryIcon className="h-6 w-6 mr-2" />
            <span>Your Library</span>
          </li>
        </ul>
      </nav>
      <div className="mt-8">
        <button className="flex items-center text-gray-400 hover:text-white">
          <PlusCircleIcon className="h-6 w-6 mr-2" />
          <span>Create Playlist</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
