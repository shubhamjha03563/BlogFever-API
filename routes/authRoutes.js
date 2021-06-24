const express = require('express');
const router = express.Router();

const {
  signup,
  getUser,
  getAllUsers,
  login,
  updateUser,
  followUser,
  unfollowUser,
  logout,
} = require('../controllers/authController');

const { uploadUserImage } = require('../middlewares/uploadImage');
const verify = require('../middlewares/auth');

router.route('/users').get(getAllUsers);
router.route('/signup').post(uploadUserImage, signup);
router.route('/login').post(login);
router.route('/logout').get(logout);

router
  .route('/users/:userId')
  .get(getUser)
  .patch(verify, uploadUserImage, updateUser);
router.route('/users/:userId/follow').patch(verify, followUser);
router.route('/users/:userId/unfollow').patch(verify, unfollowUser);

module.exports = router;
