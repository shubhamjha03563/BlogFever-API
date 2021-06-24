const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: [
      'Fashion',
      'Food',
      'Travel',
      'Movie',
      'Fitness',
      'Sports',
      'Moving',
      'Gaming',
      'Business',
      'Stock Market',
      'Computer Programming',
    ],
    required: [true, 'Please provide the category of your blog.'],
  },
  title: {
    type: String,
    required: [true, 'Please provide the title for your blog.'],
    maxLength: [50, 'Letter limit 50, exceeded!'],
    unique: true,
  },
  snippet: {
    type: String,
    required: [true, 'Please provide a snippet for your blog'],
    maxLength: [100, 'Letter limit 100, exceeded!'],
    unique: true,
  },
  body: {
    type: String,
    required: [true, 'Please provide the body of your blog'],
    unique: true,
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  likes: {
    type: Number,
  },
  usersLiked: {
    type: [mongoose.Schema.ObjectId],
    ref: 'User',
  },
  dislikes: {
    type: Number,
  },
  usersDisliked: {
    type: [mongoose.Schema.ObjectId],
    ref: 'User',
  },
  saves: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model('Blog', BlogSchema);
