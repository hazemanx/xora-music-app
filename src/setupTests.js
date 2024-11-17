import '@testing-library/jest-dom';
// Mock AudioContext and related audio APIs
class MockAudioContext {
  createGain() {
    return {
      connect: jest.fn(),
      gain: { value: 1, setValueAtTime: jest.fn() }
    };
  }
  
  createOscillator() {
    return {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
  }

  decodeAudioData() {
    return Promise.resolve({});
  }

  close() {
    return Promise.resolve();
  }
}

window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

// Mock Blob and ArrayBuffer
window.Blob = function() {
  return {
    arrayBuffer: () => Promise.resolve(new ArrayBuffer())
  };
};

// Set up fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob())
  })
);

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
