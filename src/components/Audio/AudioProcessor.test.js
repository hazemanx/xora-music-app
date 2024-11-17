import { render, act } from '@testing-library/react';
import AudioProcessor from './AudioProcessor';

describe('AudioProcessor', () => {
  let audioContext;
  let processor;

  beforeEach(() => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    processor = new AudioProcessor(audioContext);
  });

  afterEach(() => {
    audioContext.close();
  });

  test('initializes with default settings', () => {
    expect(processor.gainNode.gain.value).toBe(1);
    expect(processor.isInitialized).toBe(true);
  });

  test('applies volume changes', () => {
    act(() => {
      processor.setVolume(0.5);
    });
    expect(processor.gainNode.gain.value).toBe(0.5);
  });

  test('handles audio processing chain', () => {
    const sourceNode = audioContext.createOscillator();
    act(() => {
      processor.connectSource(sourceNode);
    });
    expect(processor.sourceNode).toBe(sourceNode);
  });
}); 