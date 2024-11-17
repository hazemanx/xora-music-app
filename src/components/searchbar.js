import React, { useState, useCallback } from 'react';
import { Search, Youtube, Cloud, Library, Link, Download } from 'lucide-react';
import { useDebounce } from '../Hooks/useDebounce';
import { searchYoutube, searchSoundCloud, downloadMedia } from '../utils/mediaUtils';
import { toast } from "@/components/ui/use-toast";

const PLATFORMS = {
  LIBRARY: 'library',
  YOUTUBE: 'youtube',
  SOUNDCLOUD: 'soundcloud'
};

function SearchBar({ searchQuery, setSearchQuery, onAddToLibrary }) {
  const [platform, setPlatform] = useState(PLATFORMS.LIBRARY);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});

  const handleSearch = useCallback(async (query) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let results;
      switch (platform) {
        case PLATFORMS.YOUTUBE:
          results = await searchYoutube(query);
          break;
        case PLATFORMS.SOUNDCLOUD:
          results = await searchSoundCloud(query);
          break;
        default:
          // Use your existing library search
          setSearchQuery(query);
          return;
      }
      setResults(results);
    } catch (err) {
      setError(`Search failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [platform, setSearchQuery]);

  const handleDownload = async (track) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [track.id]: 0 }));
      
      const downloadedTrack = await downloadMedia(track, (progress) => {
        setDownloadProgress(prev => ({ ...prev, [track.id]: progress }));
      });

      // Add to library
      await onAddToLibrary(downloadedTrack);

      // Clear progress and show success message
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[track.id];
        return newProgress;
      });

      toast({
        title: "Download Complete",
        description: `${track.title} has been added to your library`,
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setPlatform(PLATFORMS.LIBRARY)}
              className={`p-2 rounded ${
                platform === PLATFORMS.LIBRARY ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <Library className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPlatform(PLATFORMS.YOUTUBE)}
              className={`p-2 rounded ${
                platform === PLATFORMS.YOUTUBE ? 'bg-red-600' : 'hover:bg-gray-700'
              }`}
            >
              <Youtube className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPlatform(PLATFORMS.SOUNDCLOUD)}
              className={`p-2 rounded ${
                platform === PLATFORMS.SOUNDCLOUD ? 'bg-orange-600' : 'hover:bg-gray-700'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPaste={handlePaste}
              placeholder={`Search ${platform} or paste URL...`}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      <div className="space-y-2">
        {results.map((track) => (
          <div 
            key={track.id}
            className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <img 
                src={track.thumbnail} 
                alt={track.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div>
                <h3 className="font-medium">{track.title}</h3>
                <p className="text-sm text-gray-400">
                  {track.artist} • {track.platform}
                </p>
              </div>
            </div>

            {platform !== PLATFORMS.LIBRARY && (
              <button
                onClick={() => handleDownload(track)}
                disabled={track.id in downloadProgress}
                className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 disabled:opacity-50"
              >
                {track.id in downloadProgress ? (
                  <div className="relative">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs">
                      {Math.round(downloadProgress[track.id])}%
                    </span>
                  </div>
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;