import React from 'react';

function Home() {
  // Mock data for featured playlists and recent tracks
  const featuredPlaylists = [
    { id: 1, name: "Today's Top Hits", imageUrl: "https://via.placeholder.com/150" },
    { id: 2, name: "Chill Vibes", imageUrl: "https://via.placeholder.com/150" },
    { id: 3, name: "Rock Classics", imageUrl: "https://via.placeholder.com/150" },
  ];

  const recentTracks = [
    { id: 1, name: "Song Name 1", artist: "Artist 1", imageUrl: "https://via.placeholder.com/50" },
    { id: 2, name: "Song Name 2", artist: "Artist 2", imageUrl: "https://via.placeholder.com/50" },
    { id: 3, name: "Song Name 3", artist: "Artist 3", imageUrl: "https://via.placeholder.com/50" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to XORA</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Featured Playlists</h2>
        <div className="flex space-x-4">
          {featuredPlaylists.map(playlist => (
            <div key={playlist.id} className="w-40">
              <img src={playlist.imageUrl} alt={playlist.name} className="w-full h-40 object-cover rounded-md mb-2" />
              <p className="text-sm font-medium">{playlist.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Recently Played</h2>
        <div className="space-y-4">
          {recentTracks.map(track => (
            <div key={track.id} className="flex items-center space-x-4">
              <img src={track.imageUrl} alt={track.name} className="w-12 h-12 object-cover rounded-md" />
              <div>
                <p className="font-medium">{track.name}</p>
                <p className="text-sm text-gray-400">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
