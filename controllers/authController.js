const AppError = require('../utils/error');
const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');
const fs = require('fs');

// url  GET users/
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  let users,
    reqQuery = { ...req.query },
    query;

  const remove = ['select'];
  reqQuery = remove.forEach((rem) => delete reqQuery[rem]);

  query = User.find(reqQuery).sort('-joinedAt');

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
    /*
    query.select('a b'); // include a and b, exclude other fields
    query.select('-a -b'); // exclude a and b, inlclude other fields
    */
  }

  users = await query;

  res
    .status(200)
    .json({ status: 'pass', count: users ? users.length : 0, data: users });
});

// url  POST users/signup
exports.signup = asyncHandler(async (req, res, next) => {
  let user;
  user = await User.findOne({ email: req.body.email });
  if (user) {
    return next(
      new AppError('Authentication failed! Invalid Credentials', 401)
    );
  }
  if (req.file) {
    req.body.profilePicture = req.file.path;
  }
  user = await User.create(req.body);
  sendTokenResponse(user, res, 200);
});

// url  POST users/login
exports.login = asyncHandler(async (req, res, next) => {
  let user;
  if (!req.body.email || !req.body.password) {
    return next(new AppError('Please enter both email and password.', 400));
  }
  user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user) {
    return next(
      new AppError('Authentication failed! Invalid credentials.'),
      401
    );
  }
  let isMatch = await user.matchPassword(req.body.password);
  console.log(req.body.password);
  if (!isMatch) {
    return next(
      new AppError('Authentication failed! Invalid credentials.'),
      401
    );
  }
  sendTokenResponse(user, res, 200);
});

// url  GET users/logout
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', '', { maxAge: 1 });
  res.status(200).json({ status: 'pass', data: {} });
});

// url  GET users/:userId
exports.getUser = asyncHandler(async (req, res, next) => {
  let user;
  user = await User.findById(req.params.userId);
  res.status(200).json({ status: 'pass', data: user });
});

const sendTokenResponse = asyncHandler(async (user, res, statusCode) => {
  const token = await user.getJwtToken();
  const options = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE),
    httpOnly: true,
  };
  res
    .cookie('token', token, options)
    .status(statusCode)
    .json({ status: 'pass', token });
});

// url  POST users/:userId
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.userId);
  console.log(req.body);
  if (!user) {
    return next(
      new AppError(`User not found with Id ${req.params.userId}`, 400)
    );
  }

  if (req.user.id != user._id) {
    return next(new AppError(`Not authorized for this request`, 401));
  }

  if (req.file) {
    req.body.profilePicture = req.file.path;
    await fs.unlink(user.profilePicture, () => {});
  }

  if (req.body.password) {
    delete req.body.password;
  }

  user = await User.findByIdAndUpdate(req.params.userId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'pass', data: user });
});

// url  PATCH users/:userId/follow
exports.followUser = asyncHandler(async (req, res, next) => {
  if (req.user.id == req.params.userId) {
    return next(
      new AppError('User cannot follow or unfollow him/ her - self'),
      400
    );
  }

  let followedUser = await User.findById(req.params.userId);
  if (!followedUser) {
    return next(
      new AppError(`User not found with Id ${req.params.userId}`, 400)
    );
  }

  if (followedUser.followers.includes(req.user.id)) {
    return next(new AppError(`Already follwing user ${followedUser._id}`));
  }

  let followerUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      $push: { following: followedUser._id },
    },
    { new: true }
  );

  followedUser = await User.findByIdAndUpdate(
    req.params.userId,
    { $push: { followers: followerUser._id } },
    {
      new: true,
    }
  );

  res.status(200).json({
    status: 'pass',
    message: `You are now following user ${followedUser._id}`,
    following: followerUser.following,
  });
});

// url  PATCH users/:userId/follow
exports.unfollowUser = asyncHandler(async (req, res, next) => {
  if (req.user.id == req.params.userId) {
    return next(
      new AppError('User cannot follow or unfollow him/ her - self'),
      400
    );
  }

  let unfollowedUser = await User.findById(req.params.userId);
  if (!unfollowedUser) {
    return next(
      new AppError(`User not found with Id ${req.params.userId}`, 400)
    );
  }

  if (!unfollowedUser.followers.includes(req.user.id)) {
    return next(new AppError(`Not following user ${unfollowedUser._id}`));
  }

  let followerUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: { following: unfollowedUser._id },
    },
    { new: true }
  );

  unfollowedUser = await User.findByIdAndUpdate(
    req.params.userId,
    { $pull: { followers: followerUser._id } },
    {
      new: true,
    }
  );

  res.status(200).json({
    status: 'pass',
    message: `Unfollowed user ${unfollowedUser._id}`,
    following: followerUser.following,
  });
});
