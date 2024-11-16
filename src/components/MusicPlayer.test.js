import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MusicPlayer from './MusicPlayer';

// Mock Howler
jest.mock('howler', () => ({
  Howl: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seek: jest.fn(),
    volume: jest.fn(),
    unload: jest.fn(),
    _sounds: [{ _node: {} }]
  })),
  Howler: {
    volume: jest.fn()
  }
}));

// Mock sample track
const mockTrack = {
  id: '1',
  url: 'test.mp3',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album'
};

describe('MusicPlayer', () => {
  const defaultProps = {
    tracks: [mockTrack],
    currentTrackIndex: 0,
    isPlaying: false,
    onPlayPause: jest.fn(),
    onNextTrack: jest.fn(),
    onPreviousTrack: jest.fn(),
    onTrackEnd: jest.fn(),
    onError: jest.fn(),
    onTrackUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<MusicPlayer {...defaultProps} />);
    expect(screen.getByText('Test Track')).toBeInTheDocument();
  });

  test('handles play/pause toggle', () => {
    render(<MusicPlayer {...defaultProps} />);
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    expect(defaultProps.onPlayPause).toHaveBeenCalledWith(true);
  });

  test('displays track information', () => {
    render(<MusicPlayer {...defaultProps} />);
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText('Test Album')).toBeInTheDocument();
  });
}); 