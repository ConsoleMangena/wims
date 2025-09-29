const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const apiRouter = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;
const DEFAULT_ORIGIN = 'http://localhost:5173';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [DEFAULT_ORIGIN];
const CORS_CREDENTIALS = process.env.CORS_CREDENTIALS === 'true';

// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: CORS_CREDENTIALS }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
