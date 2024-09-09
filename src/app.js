import React, { useState, useEffect } from 'react';
import { auth, getPlaylists, savePlaylist } from './firebase';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import MusicPlayer from './components/MusicPlayer';
import TrackList from './components/TrackList';
import Playlists from './components/Playlists';

// This is a mock playlist. In a real app, you'd fetch this from your database or API.
const initialTracks = [
  { id: 1, title: "Song 1", artist: "Artist 1", url: "https://example.com/song1.mp3" },
  { id: 2, title: "Song 2", artist: "Artist 2", url: "https://example.com/song2.mp3" },
  { id: 3, title: "Song 3", artist: "Artist 3", url: "https://example.com/song3.mp3" },
];

function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (auth.currentUser) {
        const fetchedPlaylists = await getPlaylists(auth.currentUser.uid);
        setPlaylists(fetchedPlaylists);
      }
    };
    fetchPlaylists();
  }, []);

  const handleNextTrack = () => {
    const playlist = currentPlaylist !== null ? playlists[currentPlaylist].tracks : initialTracks;
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  const handlePreviousTrack = () => {
    const playlist = currentPlaylist !== null ? playlists[currentPlaylist].tracks : initialTracks;
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  };

  const handleCreatePlaylist = async (name) => {
    const newPlaylist = { name, tracks: [] };
    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);
    if (auth.currentUser) {
      await savePlaylist(auth.currentUser.uid, newPlaylist);
    }
  };

  const handleSelectPlaylist = (index) => {
    setCurrentPlaylist(index);
    setCurrentTrackIndex(0);
  };

  const handleAddToPlaylist = async (trackId) => {
    if (currentPlaylist !== null) {
      const track = initialTracks.find(t => t.id === trackId);
      const updatedPlaylists = [...playlists];
      updatedPlaylists[currentPlaylist].tracks.push(track);
      setPlaylists(updatedPlaylists);
      if (auth.currentUser) {
        await savePlaylist(auth.currentUser.uid, updatedPlaylists[currentPlaylist]);
      }
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentTracks = currentPlaylist !== null ? playlists[currentPlaylist].tracks : initialTracks;

  return (
    <div className="App min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto p-4 mb-20">
        <h1 className="text-3xl font-bold mb-4">Welcome to XORA Music</h1>
        {!auth.currentUser && <Auth />}
        {auth.currentUser && (
          <div>
            <p className="mb-4">Welcome, {auth.currentUser.email}!</p>
            <div className="flex">
              <div className="w-1/2 pr-4">
                <TrackList 
                  tracks={currentTracks} 
                  currentTrackIndex={currentTrackIndex}
                  onTrackSelect={(index) => setCurrentTrackIndex(index)}
                  onAddToPlaylist={handleAddToPlaylist}
                />
              </div>
              <div className="w-1/2 pl-4">
                <Playlists 
                  playlists={playlists}
                  onCreatePlaylist={handleCreatePlaylist}
                  onSelectPlaylist={handleSelectPlaylist}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <MusicPlayer 
        track={currentTracks[currentTrackIndex]} 
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
      />
    </div>
  );
}

export default App;