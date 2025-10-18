const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const config = require('./config');
const GameServer = require('./GameServer');
const { Logger } = require('./utils/helpers');

// Create Express app
const app = express();
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: config.ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Serve static files from client directory
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Basic health check endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    name: 'Clash Royale Clone Server',
    version: '1.0.0',
    stats: gameServer.getStats()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve client for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Initialize game server
const gameServer = new GameServer(io);

// Start server
server.listen(config.PORT, () => {
  Logger.info(`Server running on port ${config.PORT}`);
  Logger.info(`CORS enabled for: ${config.ALLOWED_ORIGINS.join(', ')}`);
  Logger.info(`Serving client from: ${clientPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully...');
  gameServer.shutdown();
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully...');
  gameServer.shutdown();
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});
