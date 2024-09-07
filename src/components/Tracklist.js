import React from 'react';

function TrackList({ tracks, currentTrackIndex, onTrackSelect }) {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">Tracks</h2>
      <ul>
        {tracks.map((track, index) => (
          <li 
            key={track.id} 
            className={`cursor-pointer hover:bg-gray-200 p-2 ${index === currentTrackIndex ? 'bg-blue-200' : ''}`}
            onClick={() => onTrackSelect(index)}
          >
            {track.title} - {track.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TrackList;