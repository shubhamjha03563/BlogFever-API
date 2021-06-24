const express = require('express');
const router = express.Router();

const {
  getAllBlogs,
  getBlog,
  createBlog,
  deleteBlog,
  updateBlog,
  likeBlog,
  dislikeBlog,
  saveBlog,
  unsaveBlog,
} = require('../controllers/blogController');

const verify = require('../middlewares/auth');

router.route('/').get(getAllBlogs).post(verify, createBlog);
router
  .route('/:blogId')
  .get(getBlog)
  .delete(verify, deleteBlog)
  .patch(verify, updateBlog);
router.route('/:blogId/like').patch(verify, likeBlog);
router.route('/:blogId/dislike').patch(verify, dislikeBlog);
router.route('/:blogId/save').patch(verify, saveBlog);
router.route('/:blogId/unsave').patch(verify, unsaveBlog);

module.exports = router;
