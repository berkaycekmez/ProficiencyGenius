const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve the main HTML file for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'English Proficiency Test Server is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 English Proficiency Test Server running on port ${PORT}`);
    console.log(`📱 Access the app at: http://localhost:${PORT}`);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
    console.log('👋 Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 Server shutting down gracefully...');
    process.exit(0);
});