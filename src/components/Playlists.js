import React, { useState } from 'react';

function Playlists({ playlists, onCreatePlaylist, onSelectPlaylist, onAddToPlaylist }) {
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">Playlists</h2>
      <form onSubmit={handleCreatePlaylist} className="mb-4">
        <input
          type="text"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          placeholder="New playlist name"
          className="mr-2 p-1 border rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-2 py-1 rounded">Create Playlist</button>
      </form>
      <ul>
        {playlists.map((playlist, index) => (
          <li 
            key={index} 
            className="cursor-pointer hover:bg-gray-200 p-2"
            onClick={() => onSelectPlaylist(index)}
          >
            {playlist.name} ({playlist.tracks.length} tracks)
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Playlists;