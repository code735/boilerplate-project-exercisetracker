const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Schema } = mongoose;

require('dotenv').config();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('MONGO_URI:', process.env.MONGO_URI);

// Define user schema
const userSchema = new Schema({
  username: String,
  log: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }]
});

// Define exercise schema
const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },
});

// Create user and exercise models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Routes

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = new User({ username });
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;
    const newExercise = new Exercise({ description, duration, date });
    await newExercise.save();

    const user = await User.findById(_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.log.push(newExercise);
    await user.save();

    res.json({ 
      _id: user._id, 
      username: user.username, 
      description: newExercise.description, 
      duration: newExercise.duration, 
      date: newExercise.date.toDateString() 
    });
  } catch (error) {
    console.error('Error adding exercise:', error);
    res.status(500).json({ error: 'Error adding exercise' });
  }
});


app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const user = await User.findById(_id).populate('log');
    const log = user.log.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));
    res.json({ _id: user._id, username: user.username, count: user.log.length, log });
  } catch (error) {
    console.error('Error fetching exercise log:', error);
    res.status(500).json({ error: 'Error fetching exercise log' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
