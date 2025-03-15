// app.js
// This file sets up the Express application, including middleware and routes.

const express = require('express');
const app = express();
const connectDB = require('./config/db');
const loadEnv = require('./config/dotenv');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Load environment variables
loadEnv();

// Connect to the database
connectDB();

// Middleware
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Error handling middleware
app.use(errorMiddleware);

module.exports = app; 