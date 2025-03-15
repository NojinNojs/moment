// User.js
// This file defines the schema for user data using Mongoose.

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  //   Define the structure of the user data
});

module.exports = mongoose.model("User", userSchema);
