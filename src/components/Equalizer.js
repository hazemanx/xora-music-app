import React, { useEffect, useState, useRef } from 'react';

const BANDS = [
  { frequency: 60, label: '60Hz', type: 'lowshelf' },
  { frequency: 170, label: '170Hz', type: 'peaking' },
  { frequency: 310, label: '310Hz', type: 'peaking' },
  { frequency: 600, label: '600Hz', type: 'peaking' },
  { frequency: 1000, label: '1kHz', type: 'peaking' },
  { frequency: 3000, label: '3kHz', type: 'peaking' },
  { frequency: 6000, label: '6kHz', type: 'peaking' },
  { frequency: 12000, label: '12kHz', type: 'highshelf' },
];

const PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0],
  bass: [5, 4, 3, 0, 0, 0, 0, 0],
  treble: [0, 0, 0, 0, 0, 2, 3, 4],
  electronic: [4, 3, 0, -2, 0, 2, 3, 4],
  rock: [3, 2, -1, -2, 0, 2, 3, 2],
  vocal: [-2, -1, 0, 3, 4, 3, 0, -1],
};

function Equalizer({ audioContext, sourceNode }) {
  const [filters, setFilters] = useState([]);
  const [gains, setGains] = useState(new Array(BANDS.length).fill(0));
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentPreset, setCurrentPreset] = useState('flat');
  const [showPresets, setShowPresets] = useState(false);
  const previousChainRef = useRef(null);

  useEffect(() => {
    if (!audioContext || !sourceNode) return;

    // Create filters
    const newFilters = BANDS.map(({ frequency, type }) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.gain.value = 0;
      filter.Q.value = 1;
      return filter;
    });

    setFilters(newFilters);

    // Connect filters in chain
    if (previousChainRef.current) {
      sourceNode.disconnect(previousChainRef.current[0]);
    }

    newFilters.forEach((filter, index) => {
      if (index === 0) {
        sourceNode.connect(filter);
      }
      if (index < newFilters.length - 1) {
        filter.connect(newFilters[index + 1]);
      }
      if (index === newFilters.length - 1) {
        filter.connect(audioContext.destination);
      }
    });

    previousChainRef.current = newFilters;

    return () => {
      newFilters.forEach(filter => filter.disconnect());
    };
  }, [audioContext, sourceNode]);

  const handleGainChange = (index, value) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);

    if (filters[index]) {
      filters[index].gain.value = isEnabled ? value : 0;
    }
  };

  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);
    filters.forEach((filter, index) => {
      filter.gain.value = !isEnabled ? gains[index] : 0;
    });
  };

  const applyPreset = (presetName) => {
    const presetGains = PRESETS[presetName];
    setGains(presetGains);
    filters.forEach((filter, index) => {
      filter.gain.value = isEnabled ? presetGains[index] : 0;
    });
    setCurrentPreset(presetName);
    setShowPresets(false);
  };

  const resetEqualizer = () => {
    applyPreset('flat');
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Equalizer</h2>
          <button
            onClick={toggleEnabled}
            className={`px-3 py-1 rounded-full text-sm ${
              isEnabled ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-gray-300'
            }`}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700"
          >
            Presets
          </button>
          <button
            onClick={resetEqualizer}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Presets Dropdown */}
      {showPresets && (
        <div className="absolute mt-2 p-2 bg-zinc-800 rounded-lg shadow-xl z-10">
          {Object.keys(PRESETS).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`block w-full text-left px-4 py-2 rounded ${
                currentPreset === preset
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-zinc-700'
              }`}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Sliders */}
      <div className="flex justify-between items-end gap-4 h-64">
        {BANDS.map((band, index) => (
          <div key={band.frequency} className="flex flex-col items-center flex-1">
            <input
              type="range"
              min="-12"
              max="12"
              value={gains[index]}
              onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
              className="h-48 appearance-none bg-zinc-800 rounded-full cursor-pointer write-vertical"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
            <span className="text-xs text-gray-400 mt-2">{band.label}</span>
            <span className="text-xs text-gray-500">
              {gains[index] > 0 ? `+${gains[index]}` : gains[index]}
            </span>
          </div>
        ))}
      </div>

      {/* Advanced Controls */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm text-gray-400 mb-1 block">
            Quality Factor (Q)
          </label>
          <input
            type="range"
            min="0.1"
            max="4"
            step="0.1"
            defaultValue="1"
            onChange={(e) => {
              filters.forEach(filter => {
                if (filter.Q) filter.Q.value = parseFloat(e.target.value);
              });
            }}
            className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export default Equalizer;