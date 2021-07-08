const express = require('express');
const colors = require('colors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/error');

const app = express();

// body-parser
app.use(express.json());

// taking form-data inputs
app.use(express.urlencoded({ extended: false }));

// cookie parser
app.use(cookieParser());

// serve static files
app.use(express.static('public'));

// sanitize data - prevent noSql injection
app.use(mongoSanitize());

// set security headers - XSS protection
app.use(helmet());

// prevent script tags - cross site scripting
app.use(xss());

// limit 100 requests per 10 mins
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// prevent hpp (http param pollution)
app.use(hpp());

// enable cors
app.use(cors());

// dotenv config
dotenv.config({ path: './vars.env' });

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true, // if false, gives deprecation warning when required set to true in schema
    useFindAndModify: false, // if false, gives deprecation warning when any data is updated
  })
  .then(
    app.listen(process.env.PORT, () => {
      console.log(`Listening to port ${process.env.PORT}...`.cyan.bold);
    }),
    console.log('Connected to database.'.yellow.bold)
  )
  .catch((err) => {
    console.log(err);
    console.log('Error connecting to database !'.red.bold);
  });

const blogRoutes = require('./routes/blogRoutes');
const authRoutes = require('./routes/authRoutes');

// Mount routers
app.use('/blogs', blogRoutes);
app.use('/auth', authRoutes);

// Unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Requested URL not found - ${req.url}`, 404));
  /* If we pass in an argument to next(), the function will assume that 
  argument is an error and thus proceed directly to the error handling middleware, here 'errorHandler' */
});

app.use(errorHandler);

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!SERVER SHUT DOWN!'.bold.red);
  process.exit(1);
});
