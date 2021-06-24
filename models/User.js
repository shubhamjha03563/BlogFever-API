const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name to be displayed'],
    maxLength: 50,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email',
    },
    required: [true, 'Please enter your email'],
    unique: true,
  },
  password: {
    type: String,
    trim: true,
    select: false,
    required: [true, 'Please give a password'],
    minLength: [6, 'Password should be atleast 6 characters long'],
  },
  profilePicture: {
    type: String,
    default: 'uploads/default.png',
  },
  joinedAt: {
    type: Date,
    default: Date.now(),
  },
  blogsWritten: {
    type: [mongoose.Schema.ObjectId],
    ref: 'Blog',
  },
  blogsSaved: {
    type: [mongoose.Schema.ObjectId],
    ref: 'Blog',
  },
  followers: {
    type: [mongoose.Schema.ObjectId],
    ref: 'User',
  },
  following: {
    type: [mongoose.Schema.ObjectId],
    ref: 'User',
  },
});

UserSchema.pre('save', async function (next) {
  const salt = bcrypt.genSaltSync();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getJwtToken = async function () {
  return jwt.sign({ id: this._id }, process.env.SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('user', UserSchema);
