import React from 'react';

function TrackList({ tracks, currentTrackIndex, onTrackSelect, onAddToPlaylist, onAddToQueue, onEditMetadata }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Tracks</h2>
      <ul>
        {tracks.map((track, index) => (
          <li key={track.id} className="mb-2 flex items-center">
            <span
              className={`cursor-pointer ${index === currentTrackIndex ? 'font-bold' : ''}`}
              onClick={() => onTrackSelect(index)}
            >
              {track.title} - {track.artist}
            </span>
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={() => onEditMetadata(track)}
            >
              Edit
            </button>
            <button
              className="ml-2 text-green-500 hover:text-green-700"
              onClick={() => onAddToPlaylist(track.id)}
            >
              Add to Playlist
            </button>
            <button
              className="ml-2 text-purple-500 hover:text-purple-700"
              onClick={() => onAddToQueue(track)}
            >
              Add to Queue
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TrackList;