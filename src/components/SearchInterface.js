import React, { useState, useCallback } from 'react';
import { Search, Youtube, Cloud, Library, Link, Download } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { searchYoutube, searchSoundCloud, searchLibrary } from '../utils/search';
import { downloadMedia } from '../utils/downloader';

const PLATFORMS = {
  LIBRARY: 'library',
  YOUTUBE: 'youtube',
  SOUNDCLOUD: 'soundcloud'
};

function SearchInterface({ onAddToLibrary }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS.LIBRARY);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});

  // Debounce search to prevent too many API calls
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Handle URL paste
  const handlePaste = useCallback(async (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('youtube.com') || pastedText.includes('youtu.be')) {
      setPlatform(PLATFORMS.YOUTUBE);
      setSearchQuery(pastedText);
    } else if (pastedText.includes('soundcloud.com')) {
      setPlatform(PLATFORMS.SOUNDCLOUD);
      setSearchQuery(pastedText);
    }
  }, []);

  // Unified search function
  const performSearch = useCallback(async (query) => {
    if (!query) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let searchResults;
      switch (platform) {
        case PLATFORMS.YOUTUBE:
          searchResults = await searchYoutube(query);
          break;
        case PLATFORMS.SOUNDCLOUD:
          searchResults = await searchSoundCloud(query);
          break;
        default:
          searchResults = await searchLibrary(query);
      }
      setResults(searchResults);
    } catch (err) {
      setError(`Search failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [platform]);

  // Handle media download
  const handleDownload = async (item) => {
    try {
      setDownloadProgress({ [item.id]: 0 });
      
      const downloadedTrack = await downloadMedia(item, {
        onProgress: (progress) => {
          setDownloadProgress(prev => ({
            ...prev,
            [item.id]: progress
          }));
        }
      });

      onAddToLibrary(downloadedTrack);
      
      // Clear progress after successful download
      setDownloadProgress(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center space-x-2 mb-4">
          {/* Platform Selection */}
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

          {/* Search Input */}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {/* Results List */}
      <div className="space-y-2">
        {results.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <img 
                src={item.thumbnail} 
                alt={item.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.artist}</p>
              </div>
            </div>

            {platform !== PLATFORMS.LIBRARY && (
              <button
                onClick={() => handleDownload(item)}
                disabled={item.id in downloadProgress}
                className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 disabled:opacity-50"
              >
                {item.id in downloadProgress ? (
                  <div className="relative">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs">
                      {Math.round(downloadProgress[item.id])}%
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

export default SearchInterface; 