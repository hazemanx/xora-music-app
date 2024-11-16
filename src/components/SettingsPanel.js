import React from 'react';
import { 
  Settings, Volume2, Music, Car, Download, 
  Wifi, Battery, Sliders, Radio 
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

function SettingsPanel({ onClose }) {
  const { 
    settings, 
    updateSettings,
    resetSettings 
  } = useSettings();

  const sections = [
    {
      id: 'playback',
      icon: <Music className="w-5 h-5" />,
      title: 'Playback',
      settings: [
        {
          key: 'crossfadeTime',
          label: 'Crossfade Duration',
          type: 'range',
          min: 0,
          max: 12,
          step: 0.5,
          unit: 's',
          description: 'Smooth transition between tracks'
        },
        {
          key: 'gaplessPlayback',
          label: 'Gapless Playback',
          type: 'toggle',
          description: 'Eliminate silence between tracks'
        },
        {
          key: 'defaultVolume',
          label: 'Default Volume',
          type: 'range',
          min: 0,
          max: 100,
          step: 1,
          unit: '%'
        }
      ]
    },
    {
      id: 'audio',
      icon: <Sliders className="w-5 h-5" />,
      title: 'Audio Processing',
      settings: [
        {
          key: 'enableReplayGain',
          label: 'ReplayGain',
          type: 'toggle',
          description: 'Automatic volume normalization'
        },
        {
          key: 'enableEqualizer',
          label: 'Equalizer',
          type: 'toggle'
        },
        {
          key: 'audioQuality',
          label: 'Processing Quality',
          type: 'select',
          options: [
            { value: 'low', label: 'Low (Save Battery)' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
          ]
        }
      ]
    },
    {
      id: 'vehicle',
      icon: <Car className="w-5 h-5" />,
      title: 'Vehicle Mode',
      settings: [
        {
          key: 'autoEnterVehicle',
          label: 'Auto-enter Vehicle Mode',
          type: 'toggle',
          description: 'When connected to car bluetooth'
        },
        {
          key: 'keepScreenOn',
          label: 'Keep Screen On',
          type: 'toggle'
        },
        {
          key: 'largerControls',
          label: 'Larger Touch Targets',
          type: 'toggle'
        }
      ]
    },
    {
      id: 'offline',
      icon: <Wifi className="w-5 h-5" />,
      title: 'Offline Mode',
      settings: [
        {
          key: 'downloadQuality',
          label: 'Download Quality',
          type: 'select',
          options: [
            { value: 'high', label: 'High (320kbps)' },
            { value: 'medium', label: 'Medium (192kbps)' },
            { value: 'low', label: 'Low (128kbps)' }
          ]
        },
        {
          key: 'autoDownload',
          label: 'Auto-Download',
          type: 'toggle',
          description: 'Download played tracks automatically'
        },
        {
          key: 'storageLimit',
          label: 'Storage Limit',
          type: 'range',
          min: 1,
          max: 32,
          step: 1,
          unit: 'GB'
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-auto">
      <div className="max-w-2xl mx-auto p-4 pt-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full"
          >
            ✕
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.id} className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {section.icon}
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.settings.map(setting => (
                  <SettingControl
                    key={setting.key}
                    value={settings[setting.key]}
                    onChange={(value) => updateSettings({ [setting.key]: value })}
                    {...setting}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded"
          >
            Reset All Settings
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Setting Control Component
function SettingControl({ type, label, description, value, onChange, ...props }) {
  switch (type) {
    case 'toggle':
      return (
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium">{label}</label>
            {description && (
              <p className="text-sm text-gray-400">{description}</p>
            )}
          </div>
          <button
            onClick={() => onChange(!value)}
            className={`w-12 h-6 rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );

    case 'range':
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="font-medium">{label}</label>
            <span className="text-gray-400">
              {value}{props.unit}
            </span>
          </div>
          <input
            type="range"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
            {...props}
          />
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <label className="font-medium">{label}</label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-800 rounded p-2"
          >
            {props.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default SettingsPanel;