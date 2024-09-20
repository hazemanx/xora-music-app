import React, { useState, useEffect } from 'react';

const bands = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

function Equalizer({ audioContext, sourceNode }) {
  const [filters, setFilters] = useState([]);

  useEffect(() => {
    if (audioContext && sourceNode) {
      const newFilters = bands.map(frequency => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      sourceNode.disconnect();
      sourceNode.connect(newFilters[0]);
      for (let i = 0; i < newFilters.length - 1; i++) {
        newFilters[i].connect(newFilters[i + 1]);
      }
      newFilters[newFilters.length - 1].connect(audioContext.destination);

      setFilters(newFilters);
    }
  }, [audioContext, sourceNode]);

  const handleChange = (event, index) => {
    const newFilters = [...filters];
    newFilters[index].gain.value = event.target.value;
    setFilters(newFilters);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-white text-lg font-bold mb-2">Equalizer</h2>
      <div className="flex justify-between">
        {filters.map((filter, index) => (
          <div key={index} className="flex flex-col items-center">
            <input
              type="range"
              min="-12"
              max="12"
              step="0.1"
              value={filter.gain.value}
              onChange={(e) => handleChange(e, index)}
              className="h-32 appearance-none bg-gray-700 rounded-full overflow-hidden"
              style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
            />
            <span className="text-white text-xs mt-1">{bands[index]}Hz</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Equalizer;