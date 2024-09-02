import React, { useState, useEffect } from 'react';

function Home() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/tracks')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setTracks(data);
        setIsLoading(false);
      })
      .catch(error => {
        setError('Error fetching tracks: ' + error.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to XORA</h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recently Played</h2>
        <div className="space-y-4">
          {tracks.map(track => (
            <div key={track.id} className="flex items-center space-x-4">
              <img src="https://via.placeholder.com/50" alt={track.title} className="w-12 h-12 object-cover rounded-md" />
              <div>
                <p className="font-medium">{track.title}</p>
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
