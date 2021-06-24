// const asyncHandler = require('./asyncHandler');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/error');

const verify = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return next(new AppError('Not authorized for this route.', 401));
  }
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    req.user = decodedToken;
    next();
  } catch (err) {
    return next(new AppError('Not authorized for this route.', 401));
  }
};

module.exports = verify;
