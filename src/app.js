import React, { useState, useEffect } from 'react';
import { auth, getPlaylists, savePlaylist } from './firebase';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import MusicPlayer from './components/MusicPlayer';
import TrackList from './components/TrackList';
import Playlists from './components/Playlists';
import SearchBar from './components/SearchBar';
import PlaylistViewer from './components/PlaylistViewer';
import QueueViewer from './components/QueueViewer';
import { DragDropContext } from 'react-beautiful-dnd';

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
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (auth.currentUser) {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedPlaylists = await getPlaylists(auth.currentUser.uid);
          setPlaylists(fetchedPlaylists);
        } catch (err) {
          setError('Failed to fetch playlists. Please try again later.');
          console.error('Error fetching playlists:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchPlaylists();
  }, []);

  const handleNextTrack = () => {
    if (queue.length > 0) {
      if (shuffle) {
        const nextIndex = Math.floor(Math.random() * queue.length);
        setCurrentTrackIndex(nextIndex);
      } else {
        setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % queue.length);
      }
    }
  };

  const handlePreviousTrack = () => {
    if (queue.length > 0) {
      if (shuffle) {
        const prevIndex = Math.floor(Math.random() * queue.length);
        setCurrentTrackIndex(prevIndex);
      } else {
        setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + queue.length) % queue.length);
      }
    }
  };

  const handleCreatePlaylist = async (name) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPlaylist = { name, tracks: [] };
      const updatedPlaylists = [...playlists, newPlaylist];
      setPlaylists(updatedPlaylists);
      if (auth.currentUser) {
        await savePlaylist(auth.currentUser.uid, newPlaylist);
      }
    } catch (err) {
      setError('Failed to create playlist. Please try again.');
      console.error('Error creating playlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlaylist = (index) => {
    setCurrentPlaylist(index);
    setQueue(playlists[index].tracks);
    setCurrentTrackIndex(0);
    setShuffle(false);
    setRepeat('off');
  };

  const handleAddToPlaylist = async (trackId) => {
    if (currentPlaylist !== null) {
      setIsLoading(true);
      setError(null);
      try {
        const track = initialTracks.find(t => t.id === trackId);
        const updatedPlaylists = [...playlists];
        updatedPlaylists[currentPlaylist].tracks.push(track);
        setPlaylists(updatedPlaylists);
        if (auth.currentUser) {
          await savePlaylist(auth.currentUser.uid, updatedPlaylists[currentPlaylist]);
        }
      } catch (err) {
        setError('Failed to add track to playlist. Please try again.');
        console.error('Error adding track to playlist:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddToQueue = (track) => {
    setQueue(prevQueue => [...prevQueue, track]);
  };

  const handleReorderQueue = (startIndex, endIndex) => {
    const newQueue = Array.from(queue);
    const [reorderedItem] = newQueue.splice(startIndex, 1);
    newQueue.splice(endIndex, 0, reorderedItem);
    setQueue(newQueue);
  };

  const handlePlayPause = (playing) => {
    setIsPlaying(playing);
  };

  const handleTrackEnd = () => {
    if (repeat === 'one') {
      // The MusicPlayer component will handle repeating the current track
    } else if (repeat === 'all' || (!shuffle && currentTrackIndex < queue.length - 1)) {
      handleNextTrack();
    } else if (shuffle) {
      handleNextTrack(); // This will choose a random track due to shuffle being true
    } else {
      setIsPlaying(false);
    }
  };

  const handleReorderPlaylist = async (startIndex, endIndex) => {
    if (currentPlaylist !== null) {
      const updatedPlaylists = [...playlists];
      const [reorderedItem] = updatedPlaylists[currentPlaylist].tracks.splice(startIndex, 1);
      updatedPlaylists[currentPlaylist].tracks.splice(endIndex, 0, reorderedItem);
      
      setPlaylists(updatedPlaylists);
      setQueue(updatedPlaylists[currentPlaylist].tracks);
      
      if (auth.currentUser) {
        try {
          await savePlaylist(auth.currentUser.uid, updatedPlaylists[currentPlaylist]);
        } catch (err) {
          setError('Failed to save reordered playlist. Please try again.');
          console.error('Error saving reordered playlist:', err);
        }
      }
    }
  };

  const handleToggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const handleToggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(repeat) + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  const filteredTracks = initialTracks.filter(track => 
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="App min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto p-4 mb-20">
        <h1 className="text-3xl font-bold mb-4">Welcome to XORA Music</h1>
        {!auth.currentUser && <Auth />}
        {auth.currentUser && (
          <div>
            <p className="mb-4">Welcome, {auth.currentUser.email}!</p>
            {isLoading && <p className="text-blue-500">Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <div className="flex">
              <div className="w-1/3 pr-4">
                <TrackList 
                  tracks={filteredTracks} 
                  currentTrackIndex={currentTrackIndex}
                  onTrackSelect={(index) => {
                    setCurrentTrackIndex(index);
                    setQueue([...queue, filteredTracks[index]]);
                  }}
                  onAddToPlaylist={handleAddToPlaylist}
                  onAddToQueue={handleAddToQueue}
                />
              </div>
              <div className="w-1/3 px-2">
                <Playlists 
                  playlists={filteredPlaylists}
                  onCreatePlaylist={handleCreatePlaylist}
                  onSelectPlaylist={handleSelectPlaylist}
                />
                {currentPlaylist !== null && (
                  <PlaylistViewer
                    tracks={playlists[currentPlaylist].tracks}
                    currentTrackIndex={currentTrackIndex}
                    onTrackSelect={(index) => {
                      setCurrentTrackIndex(index);
                      setQueue(playlists[currentPlaylist].tracks);
                    }}
                    onReorder={handleReorderPlaylist}
                  />
                )}
              </div>
              <div className="w-1/3 pl-4">
                <QueueViewer
                  queue={queue}
                  currentTrackIndex={currentTrackIndex}
                  onTrackSelect={setCurrentTrackIndex}
                  onReorderQueue={handleReorderQueue}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <MusicPlayer 
        tracks={queue}
        currentTrackIndex={currentTrackIndex}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        onTrackEnd={handleTrackEnd}
        onError={(errorMessage) => setError(errorMessage)}
        shuffle={shuffle}
        onToggleShuffle={handleToggleShuffle}
        repeat={repeat}
        onToggleRepeat={handleToggleRepeat}
      />
    </div>
  );
}

export default App;