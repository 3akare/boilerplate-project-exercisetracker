// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize app
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/exerciseTracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define User Schema
const userSchema = new mongoose.Schema({
  username: String,
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: String,
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// POST /api/users - Create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const user = new User({ username });
  await user.save();
  res.json({ username: user.username, _id: user._id });
});

// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// POST /api/users/:_id/exercises - Add exercise to a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const exerciseDate = date ? new Date(date).toDateString() : new Date().toDateString();
  const exercise = new Exercise({
    userId: req.params._id,
    description,
    duration,
    date: exerciseDate,
  });
  await exercise.save();
  const user = await User.findById(req.params._id);
  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
  });
});

// GET /api/users/:_id/logs - Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findById(req.params._id);
  let exercises = await Exercise.find({ userId: req.params._id });

  // Filter by date if "from" and "to" are provided
  if (from || to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    exercises = exercises.filter(exercise => {
      const exerciseDate = new Date(exercise.date);
      return (!from || exerciseDate >= fromDate) && (!to || exerciseDate <= toDate);
    });
  }

  // Limit the number of results
  if (limit) {
    exercises = exercises.slice(0, Number(limit));
  }

  res.json({
    username: user.username,
    count: exercises.length,
    log: exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date,
    })),
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
