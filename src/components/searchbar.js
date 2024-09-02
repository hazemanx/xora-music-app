import React, { useState } from 'react';
import { SearchIcon } from '@heroicons/react/solid';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchTerm);
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center">
      <SearchIcon className="h-6 w-6 text-gray-400 mr-2" />
      <input
        type="text"
        placeholder="Search for Artists, Songs, or Podcasts"
        className="bg-white bg-opacity-20 text-white placeholder-gray-400 px-4 py-2 rounded-full w-64"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </form>
  );
}

export default SearchBar;
