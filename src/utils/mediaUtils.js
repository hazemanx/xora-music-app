import axios from 'axios';

const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
const SOUNDCLOUD_CLIENT_ID = process.env.REACT_APP_SOUNDCLOUD_CLIENT_ID;

// YouTube Search
export async function searchYoutube(query) {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'snippet',
        maxResults: 10,
        q: query,
        type: 'video',
        videoCategoryId: '10', // Music category
        key: YOUTUBE_API_KEY
      }
    });

    return response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      platform: 'youtube',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    throw new Error('Failed to search YouTube');
  }
}

// SoundCloud Search
export async function searchSoundCloud(query) {
  try {
    const response = await axios.get(`https://api.soundcloud.com/tracks`, {
      params: {
        q: query,
        limit: 10,
        client_id: SOUNDCLOUD_CLIENT_ID
      }
    });

    return response.data.map(track => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.user.username,
      thumbnail: track.artwork_url || track.user.avatar_url,
      platform: 'soundcloud',
      url: track.permalink_url
    }));
  } catch (error) {
    console.error('SoundCloud search error:', error);
    throw new Error('Failed to search SoundCloud');
  }
}

// Download Media
export async function downloadMedia(track, onProgress) {
  try {
    let downloadUrl;
    
    if (track.platform === 'youtube') {
      // Get downloadable URL using youtube-dl or similar service
      downloadUrl = await getYoutubeDownloadUrl(track.url);
    } else if (track.platform === 'soundcloud') {
      // Get downloadable URL from SoundCloud API
      downloadUrl = await getSoundCloudDownloadUrl(track.url);
    }

    // Download the file
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    });

    // Convert to audio buffer
    const arrayBuffer = await response.data.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      platform: track.platform,
      originalUrl: track.url,
      audioBuffer,
      blob: response.data
    };
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(`Failed to download from ${track.platform}`);
  }
}

// Helper functions for getting download URLs
async function getYoutubeDownloadUrl(videoUrl) {
  // Implement YouTube download URL retrieval
  // You might want to use a server-side implementation for this
  const response = await axios.post('/api/youtube/download', { url: videoUrl });
  return response.data.downloadUrl;
}

async function getSoundCloudDownloadUrl(trackUrl) {
  // Implement SoundCloud download URL retrieval
  const response = await axios.get(`https://api.soundcloud.com/resolve`, {
    params: {
      url: trackUrl,
      client_id: SOUNDCLOUD_CLIENT_ID
    }
  });
  return `${response.data.stream_url}?client_id=${SOUNDCLOUD_CLIENT_ID}`;
}