const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data (replace this with a database later)
const sampleTracks = [
  { id: 1, title: 'Song 1', artist: 'Artist 1' },
  { id: 2, title: 'Song 2', artist: 'Artist 2' },
  { id: 3, title: 'Song 3', artist: 'Artist 3' },
];

// Routes
app.get('/api/tracks', (req, res) => {
  res.json(sampleTracks);
});

app.get('/api/tracks/:id', (req, res) => {
  const track = sampleTracks.find(t => t.id === parseInt(req.params.id));
  if (!track) return res.status(404).json({ message: 'Track not found' });
  res.json(track);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
