const fs = require('fs');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'fail';

  // Cast errors signify that the input was in the wrong format
  if (err.name === 'CastError') {
    error.status = 400;
    error.message = 'Cast Error - Invalid Id';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    /*
    If a field is not entered, this error is fired but
    then also the picture gets saved, so it should be removed from local storage
    but first we have to confirm that user has uploaded a file
    */
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    error.status = 400;
    error.message = Object.values(err.errors)
      .map((obj) => obj.message)
      .join(', ');
  }

  // Duplicate field errors. These errors don’t have a unique name, so they are accessed with the error code
  if (err.code === 11000) {
    /*
    If a duplicate field is entered, this error is fired but
    then also the picture gets saved, so it should be removed from local
    storage
    */
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    error.status = 400;
    error.message = `Duplicate value entered for '${
      Object.getOwnPropertyNames(err.keyValue)[0]
    }'`;
  }

  console.log(err);

  // res.status(statusCode).json({ status, message: 'Something went wrong!' });
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message || err.message,
  });
};

module.exports = errorHandler;
