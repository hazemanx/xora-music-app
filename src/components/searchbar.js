import React from 'react';
import { SearchIcon } from '@heroicons/react/solid';

function SearchBar({ searchQuery, setSearchQuery }) {
  const handleSearch = (e) => {
    e.preventDefault();
    // The search is now real-time, but we keep the form submission for any additional functionality you might want to add
    console.log('Searching for:', searchQuery);
    // TODO: You can add any additional search-related functionality here
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center">
      <SearchIcon className="h-6 w-6 text-gray-400 mr-2" />
      <input
        type="text"
        placeholder="Search for Artists, Songs, or Podcasts"
        className="bg-white bg-opacity-20 text-white placeholder-gray-400 px-4 py-2 rounded-full w-64"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {/* You can add a submit button here if you want to trigger a search explicitly */}
      {/* <button type="submit" className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-full">
        Search
      </button> */}
    </form>
  );
}

export default SearchBar;