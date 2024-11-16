import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_SETTINGS = {
  // Playback
  crossfadeTime: 2,
  gaplessPlayback: true,
  defaultVolume: 100,
  
  // Audio Processing
  enableReplayGain: true,
  enableEqualizer: true,
  audioQuality: 'high',
  
  // Vehicle Mode
  autoEnterVehicle: false,
  keepScreenOn: true,
  largerControls: true,
  
  // Offline Mode
  downloadQuality: 'high',
  autoDownload: false,
  storageLimit: 8
};

export const useSettings = create(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
      
      resetSettings: () => set({ settings: DEFAULT_SETTINGS })
    }),
    {
      name: 'xora-settings'
    }
  )
);

export function useSettingsValue(key) {
  return useSettings((state) => state.settings[key]);
} 