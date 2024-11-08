import React, { useState, useRef } from 'react';
import { 
  Image, 
  Edit2, 
  Save, 
  X, 
  Music2, 
  User, 
  Disc, 
  Calendar, 
  Hash,
  Tag,
  AlertCircle
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const TrackMetadataEditor = ({ track, onSave, onClose }) => {
  const [metadata, setMetadata] = useState({
    title: track.title || '',
    artist: track.artist || '',
    album: track.album || '',
    albumArtist: track.albumArtist || '',
    year: track.year || '',
    genre: track.genre || '',
    trackNumber: track.trackNumber || '',
    composer: track.composer || '',
    artwork: track.artwork || null
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Image processing utilities
  const processArtwork = async (file) => {
    try {
      setIsProcessing(true);
      const maxSize = 800; // Max dimension for artwork
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Maintain aspect ratio while resizing
            if (width > height) {
              if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Apply slight sharpening
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with high quality
            const optimizedArtwork = canvas.toDataURL('image/jpeg', 0.92);
            resolve(optimizedArtwork);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Artwork processing failed:', error);
      setError('Failed to process artwork. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArtworkSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    try {
      const processedArtwork = await processArtwork(file);
      if (processedArtwork) {
        setMetadata(prev => ({ ...prev, artwork: processedArtwork }));
      }
    } catch (error) {
      setError('Failed to process artwork. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      // Validate required fields
      if (!metadata.title || !metadata.artist) {
        setError('Title and Artist are required.');
        return;
      }

      // Process track metadata
      const processedMetadata = {
        ...metadata,
        lastModified: new Date().toISOString()
      };

      await onSave(processedMetadata);
      onClose();
    } catch (error) {
      setError('Failed to save metadata. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 text-white">
        <DialogHeader>
          <DialogTitle>Edit Track Information</DialogTitle>
          <DialogDescription>
            Modify track metadata and artwork
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Artwork Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-48 h-48 bg-zinc-800 rounded-lg overflow-hidden">
              {metadata.artwork ? (
                <img 
                  src={metadata.artwork} 
                  alt="Track artwork" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={48} className="text-zinc-600" />
                </div>
              )}
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-2 right-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Edit2 size={16} />
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleArtworkSelect}
            />
          </div>

          {/* Metadata Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <div className="relative">
                <Music2 className="absolute left-3 top-3 text-zinc-400" size={16} />
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={e => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="artist">Artist</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-zinc-400" size={16} />
                <Input
                  id="artist"
                  value={metadata.artist}
                  onChange={e => setMetadata(prev => ({ ...prev, artist: e.target.value }))}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="album">Album</Label>
              <div className="relative">
                <Disc className="absolute left-3 top-3 text-zinc-400" size={16} />
                <Input
                  id="album"
                  value={metadata.album}
                  onChange={e => setMetadata(prev => ({ ...prev, album: e.target.value }))}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <Input
                    id="year"
                    value={metadata.year}
                    onChange={e => setMetadata(prev => ({ ...prev, year: e.target.value }))}
                    className="pl-10 bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="trackNumber">Track Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <Input
                    id="trackNumber"
                    value={metadata.trackNumber}
                    onChange={e => setMetadata(prev => ({ ...prev, trackNumber: e.target.value }))}
                    className="pl-10 bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="genre">Genre</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 text-zinc-400" size={16} />
                <Input
                  id="genre"
                  value={metadata.genre}
                  onChange={e => setMetadata(prev => ({ ...prev, genre: e.target.value }))}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrackMetadataEditor;