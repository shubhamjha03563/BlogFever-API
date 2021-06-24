const express = require('express');
const colors = require('colors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Blog = require('./models/Blog');
const User = require('./models/User');
const fs = require('fs');

let dir = __dirname + '/uploads/blogImages';

const app = express();
dotenv.config({ path: './vars.env' });

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(app.listen(process.env.PORT2))
  .catch((err) => {
    console.log(err);
    console.log('Error connecting to database !'.red.bold);
  });

const deleteAllData = async () => {
  try {
    await Blog.deleteMany();
    await User.deleteMany();
    console.log(' Database Cleared  '.bgRed.bold);

    fs.rmdirSync(dir, { recursive: true });

    // create the folder to store images
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '-d') {
  deleteAllData();
}

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!\nSERVER SHUT DOWN!'.bold.red);
  process.exit(1);
});
