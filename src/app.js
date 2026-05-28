import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import emailRoutes from './routes/emailRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Parsing JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend dashboard
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configure email routes
app.use('/api', emailRoutes);

// Fallback to static html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

export default app;
