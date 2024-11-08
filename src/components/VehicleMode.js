import React from 'react';
import { motion } from 'framer-motion';

function VehicleMode({ 
  currentTrack, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious 
}) {
  return (
    <div className="fixed inset-0 bg-black text-white">
      {/* Large album art */}
      <div className="h-1/2 flex items-center justify-center p-4">
        <img 
          src={currentTrack?.artwork || '/default-album.png'} 
          alt="Album Art"
          className="max-h-full rounded-lg shadow-2xl"
        />
      </div>

      {/* Track info */}
      <div className="text-center p-4">
        <h2 className="text-3xl font-bold">{currentTrack?.title}</h2>
        <p className="text-xl text-gray-400">{currentTrack?.artist}</p>
      </div>

      {/* Large touch controls */}
      <div className="flex justify-around items-center p-8">
        <button 
          onClick={onPrevious}
          className="touch-target p-8 rounded-full bg-gray-800 hover:bg-gray-700"
        >
          <svg className="w-12 h-12">...</svg>
        </button>

        <button 
          onClick={onPlayPause}
          className="touch-target p-10 rounded-full bg-blue-600 hover:bg-blue-500"
        >
          <svg className="w-16 h-16">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </svg>
        </button>

        <button 
          onClick={onNext}
          className="touch-target p-8 rounded-full bg-gray-800 hover:bg-gray-700"
        >
          <svg className="w-12 h-12">...</svg>
        </button>
      </div>

      {/* Advanced Controls */}
      {showAdvancedControls && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg">
          <div className="space-y-4">
            {/* Audio Processing Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Enhanced Processing</span>
              <button
                onClick={() => setIsProcessingEnabled(!isProcessingEnabled)}
                className={`px-4 py-2 rounded-lg ${
                  isProcessingEnabled ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                {isProcessingEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Speed Control */}
            <div>
              <label className="text-sm text-gray-400">Playback Speed ({speed.toFixed(2)}x)</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer mt-2"
              />
            </div>
            
            {/* Pitch Control */}
            <div>
              <label className="text-sm text-gray-400">
                Pitch ({pitch > 0 ? '+' : ''}{pitch} semitones)
                {isProcessingEnabled && ' - Enhanced'}
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer mt-2"
              />
            </div>

            {/* Volume Control */}
            <div>
              <label className="text-sm text-gray-400">Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer mt-2"
              />
            </div>

            {/* Equalizer Toggle */}
            <button
              className="w-full py-2 mt-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"
              onClick={() => setShowEqualizer(!showEqualizer)}
            >
              {showEqualizer ? 'Hide Equalizer' : 'Show Equalizer'}
            </button>
            {/* Equalizer Component */}
            {showEqualizer && (
              <Equalizer
                audioContext={audioContext}
                sourceNode={sourceNode}
              />
            )}

            {/* Audio Processor Integration */}
            {isProcessingEnabled && (
              <AudioProcessor 
                audioContext={audioContext}
                sourceNode={sourceNode}
                analyzer={analyzer}
                isPlaying={isPlaying}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleMode;