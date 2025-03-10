# Backend for Moment Web App

Welcome to the backend of the Moment web application! This project is built using Node.js, Express, and MongoDB.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)

## Installation

To get started with this project, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NojinNojs/moment-be.git
   cd moment-be
   ```

2. **Install the dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file**:
   - Copy the `.env.example` file to `.env` and fill in your MongoDB connection string.
   ```bash
   cp .env.example .env
   ```

4. **Start the server**:
   - For production:
   ```bash
   npm start
   ```
   - For development:
   ```bash
   npm run dev
   ```

## Usage

The server will run on the specified port (default is **3000**). You can access it at [http://localhost:3000](http://localhost:3000).

## Scripts

- **`npm start`**: Runs the application in production mode.
- **`npm run dev`**: Runs the application in development mode with live reloading.