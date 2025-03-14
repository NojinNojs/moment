# Moment (Money Management)

A web-based money management application that simplifies personal finance management with the help of Machine Learning. The app helps users track their income and expenses, auto-categorize transactions, and provides insightful dashboard summaries.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies](#technologies)
- [Contributing](#contributing)

## Overview

Moment is designed to assist individuals—especially students and young professionals—in managing their finances efficiently. By leveraging Machine Learning, the application automatically categorizes transactions based on their descriptions, while allowing manual adjustments when needed. This streamlined approach enables users to gain a clear understanding of their financial habits and make informed decisions.

## Features

- **User Authentication:** Secure registration and login system.
- **Transaction Management:** Create, read, update, and delete financial transactions.
- **Auto-Categorization:** Machine Learning-powered categorization of transactions.
- **Manual Adjustments:** Users can modify categories if the auto-categorization isn’t accurate.
- **Dashboard:** Visual summary of income, expenses, and recent transactions.
- **Responsive Design:** Optimized for desktops, tablets, and mobile devices.

## Project Structure

- **Front-End:** 
  - Developed with React and Vite.
  - Styled using Tailwind CSS.
- **Back-End:**
  - Built with Node.js and Express.js.
  - Data is stored in MongoDB.
  - JWT-based authentication for secure access.
- **Machine Learning:**
  - Implemented in Python using Scikit-Learn.
  - Data processing with Pandas and NumPy.
  - Model saved and loaded using Joblib/Pickle for auto-categorization.

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/NojinNojs/moment.git
   ```
2. **Front-End Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Back-End Setup:**
   ```bash
   cd backend
   npm install
   npm start
   ```
4. **Machine Learning Setup:**
   -

## Usage

- Open the landing page to learn more about the application.
- Register or log in to access your personalized dashboard.
- Manage your transactions (add, edit, delete) easily.
- Let the ML model auto-categorize your transactions and adjust manually when needed.
- Monitor your financial summary on the dashboard.

## Technologies

- **Front-End:** React, Vite, Tailwind CSS, Axios, React Router.
- **Back-End:** Node.js, Express.js, MongoDB, Mongoose, JWT.
- **Machine Learning:** Python, Scikit-Learn, Pandas, NumPy, Joblib/Pickle.
- **Additional Tools:** VS Code, Postman, GitHub, Figma, Vercel.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements or bug fixes.