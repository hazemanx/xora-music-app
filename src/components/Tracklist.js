import React from 'react';

function TrackList({ tracks, currentTrackIndex, onTrackSelect, onAddToPlaylist }) {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">Tracks</h2>
      <ul>
        {tracks.map((track, index) => (
          <li 
            key={track.id} 
            className={`flex justify-between items-center cursor-pointer hover:bg-gray-200 p-2 ${index === currentTrackIndex ? 'bg-blue-200' : ''}`}
          >
            <span onClick={() => onTrackSelect(index)}>
              {track.title} - {track.artist}
            </span>
            <button 
              onClick={() => onAddToPlaylist(track.id)}
              className="bg-green-500 text-white px-2 py-1 rounded text-sm"
            >
              Add to Playlist
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TrackList;