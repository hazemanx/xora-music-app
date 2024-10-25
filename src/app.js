import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, getPlaylists, savePlaylist, updateTrackMetadata } from './firebase';
import { useAudioContext } from './hooks/useAudioContext';
import useOfflineDetection from './hooks/useOfflineDetection';
import usePlaybackState from './hooks/usePlaybackState';
import { DragDropContext } from 'react-beautiful-dnd';

// Components
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import MusicPlayer from './components/MusicPlayer';
import TrackList from './components/TrackList';
import Playlists from './components/Playlists';
import SearchBar from './components/SearchBar';
import PlaylistViewer from './components/PlaylistViewer';
import QueueViewer from './components/QueueViewer';
import InstallPrompt from './components/InstallPrompt';
import TrackMetadataEditor from './components/TrackMetadataEditor';
import OfflineIndicator from './components/OfflineIndicator';
import AudioProcessor from './components/audio/AudioProcessor';
import ErrorBoundary from './components/ErrorBoundary';

// Constants and Utils
import { REPEAT_MODES, INITIAL_TRACKS } from './constants';
import { shuffleArray, debounce } from './utils';

function App() {
  // Core state
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTrack, setEditingTrack] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Audio processing state
  const { 
    audioContext, 
    sourceNode,
    isInitialized: isAudioInitialized 
  } = useAudioContext();

  // Playback state management
  const {
    currentTrackIndex,
    isPlaying,
    shuffle,
    repeat,
    queue,
    setCurrentTrackIndex,
    setIsPlaying,
    setShuffle,
    setRepeat,
    setQueue,
    handleNextTrack,
    handlePreviousTrack
  } = usePlaybackState(tracks);

  // Offline detection
  const isOnline = useOfflineDetection();

  // Memoized filtered data
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return {
      tracks: tracks.filter(track => 
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query)
      ),
      playlists: playlists.filter(playlist =>
        playlist.name.toLowerCase().includes(query)
      )
    };
  }, [tracks, playlists, searchQuery]);

  // Initialize playlists
  useEffect(() => {
    const initializePlaylists = async () => {
      if (!auth.currentUser) return;
      
      setIsLoading(true);
      try {
        const fetchedPlaylists = await getPlaylists(auth.currentUser.uid);
        setPlaylists(fetchedPlaylists);
      } catch (err) {
        setError('Failed to fetch playlists');
        console.error('Playlist fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializePlaylists();
  }, []);

  // Playlist management
  const handleCreatePlaylist = useCallback(async (name) => {
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      const newPlaylist = { name, tracks: [] };
      const updatedPlaylists = [...playlists, newPlaylist];
      await savePlaylist(auth.currentUser.uid, newPlaylist);
      setPlaylists(updatedPlaylists);
    } catch (err) {
      setError('Failed to create playlist');
      console.error('Playlist creation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [playlists]);

  const handleSelectPlaylist = useCallback((index) => {
    setCurrentPlaylist(index);
    setQueue(playlists[index].tracks);
    setCurrentTrackIndex(0);
    setShuffle(false);
    setRepeat(REPEAT_MODES.OFF);
  }, [playlists, setQueue, setCurrentTrackIndex, setShuffle, setRepeat]);

  // Queue management
  const handleReorderQueue = useCallback((startIndex, endIndex) => {
    const newQueue = Array.from(queue);
    const [reorderedItem] = newQueue.splice(startIndex, 1);
    newQueue.splice(endIndex, 0, reorderedItem);
    setQueue(newQueue);
  }, [queue, setQueue]);

  // Playlist reordering with optimistic updates
  const handleReorderPlaylist = useCallback(async (startIndex, endIndex) => {
    if (currentPlaylist === null) return;

    const updatedPlaylists = [...playlists];
    const playlist = updatedPlaylists[currentPlaylist];
    const [reorderedItem] = playlist.tracks.splice(startIndex, 1);
    playlist.tracks.splice(endIndex, 0, reorderedItem);
    
    // Optimistic update
    setPlaylists(updatedPlaylists);
    setQueue(playlist.tracks);
    
    // Persist changes
    if (auth.currentUser) {
      try {
        await savePlaylist(auth.currentUser.uid, playlist);
      } catch (err) {
        setError('Failed to save playlist order');
        // Revert on error
        setPlaylists(playlists);
        setQueue(playlists[currentPlaylist].tracks);
      }
    }
  }, [currentPlaylist, playlists, setQueue]);

  // Track metadata management
  const handleSaveMetadata = useCallback(async (updatedTrack) => {
    try {
      await updateTrackMetadata(updatedTrack);
      setTracks(prev => prev.map(t => 
        t.id === updatedTrack.id ? updatedTrack : t
      ));
      setEditingTrack(null);
    } catch (err) {
      setError('Failed to update track metadata');
    }
  }, []);

  // Playback handlers
  const handlePlayPause = useCallback((playing) => {
    setIsPlaying(playing);
  }, [setIsPlaying]);

  const handleTrackEnd = useCallback(() => {
    switch(repeat) {
      case REPEAT_MODES.ONE:
        // Current track will repeat automatically
        break;
      case REPEAT_MODES.ALL:
        handleNextTrack();
        break;
      default:
        if (currentTrackIndex < queue.length - 1) {
          handleNextTrack();
        } else {
          setIsPlaying(false);
        }
    }
  }, [repeat, currentTrackIndex, queue.length, handleNextTrack, setIsPlaying]);

  return (
    <ErrorBoundary>
      <div className="App min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <Navbar />
        <OfflineIndicator isOnline={isOnline} />
        
        <div className="container mx-auto p-4 mb-20">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Welcome to XORA Music
          </h1>

          {!auth.currentUser ? (
            <Auth />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-300">
                  Welcome, {auth.currentUser.email}!
                </p>
                {isLoading && (
                  <div className="animate-pulse text-blue-500">
                    Loading...
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">
                  {error}
                </div>
              )}

              <SearchBar 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TrackList 
                  tracks={filteredData.tracks}
                  currentTrackIndex={currentTrackIndex}
                  onTrackSelect={index => {
                    setCurrentTrackIndex(index);
                    setQueue(prev => [...prev, filteredData.tracks[index]]);
                  }}
                  onAddToQueue={track => setQueue(prev => [...prev, track])}
                  onEditMetadata={setEditingTrack}
                  isProcessingEnabled={isAudioInitialized}
                />

                <div className="space-y-4">
                  <Playlists 
                    playlists={filteredData.playlists}
                    onCreatePlaylist={handleCreatePlaylist}
                    onSelectPlaylist={handleSelectPlaylist}
                    currentPlaylist={currentPlaylist}
                  />
                  
                  {currentPlaylist !== null && (
                    <DragDropContext onDragEnd={({source, destination}) => {
                      if (destination) {
                        handleReorderPlaylist(source.index, destination.index);
                      }
                    }}>
                      <PlaylistViewer
                        tracks={playlists[currentPlaylist].tracks}
                        currentTrackIndex={currentTrackIndex}
                        onTrackSelect={index => {
                          setCurrentTrackIndex(index);
                          setQueue(playlists[currentPlaylist].tracks);
                        }}
                      />
                    </DragDropContext>
                  )}
                </div>

                <QueueViewer
                  queue={queue}
                  currentTrackIndex={currentTrackIndex}
                  onTrackSelect={setCurrentTrackIndex}
                  onReorderQueue={handleReorderQueue}
                />
              </div>

              {editingTrack && (
                <TrackMetadataEditor
                  track={editingTrack}
                  onSave={handleSaveMetadata}
                  onCancel={() => setEditingTrack(null)}
                />
              )}
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
          onError={setError}
          shuffle={shuffle}
          onToggleShuffle={() => setShuffle(!shuffle)}
          repeat={repeat}
          onToggleRepeat={() => {
            const modes = Object.values(REPEAT_MODES);
            const nextIndex = (modes.indexOf(repeat) + 1) % modes.length;
            setRepeat(modes[nextIndex]);
          }}
          audioContext={audioContext}
          sourceNode={sourceNode}
        />

        <InstallPrompt />
      </div>
    </ErrorBoundary>
  );
}

export default App;