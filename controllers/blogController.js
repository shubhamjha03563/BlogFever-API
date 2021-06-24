const Blog = require('../models/Blog');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/error');
const { json } = require('express');

// url  GET /blogs
exports.getAllBlogs = asyncHandler(async (req, res, next) => {
  let blogs,
    reqQuery = { ...req.query },
    query;

  const remove = ['select'];
  reqQuery = remove.forEach((rem) => delete reqQuery[rem]);
  query = Blog.find(reqQuery).sort('-createdAt');

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
    /*
    query.select('a b'); // include a and b, exclude other fields
    query.select('-a -b'); // exclude a and b, inlclude other fields
    */
  }

  blogs = await query;

  res
    .status(200)
    .json({ status: 'pass', count: blogs ? blogs.length : 0, data: blogs });
});

// url  GET /blogs/:blogId
exports.getBlog = asyncHandler(async (req, res, next) => {
  let blog = await Blog.findById(req.params.blogId);
  if (!blog) {
    return next(new AppError(`Blog not found with Id ${req.params.id}`, 400));
  }
  res.status(200).json({ status: 'pass', data: blog });
});

// url POST /blogs
exports.createBlog = asyncHandler(async (req, res, next) => {
  req.body.author = req.user.id;
  let blog = await Blog.create(req.body);
  await User.findByIdAndUpdate(req.user.id, {
    $push: { blogsWritten: blog._id },
  });
  res.status(200).json({ status: 'pass', owner: req.user.id, data: blog });
});

// url PATCH /blogs/:blogId
exports.updateBlog = asyncHandler(async (req, res, next) => {
  let blog = await Blog.findById(req.params.blogId);

  if (!blog) {
    return next(
      new AppError(`Blog not found with Id ${req.params.blogId}`, 400)
    );
  }

  if (req.user.id != blog.author) {
    return next(
      new AppError(
        `This blog doesn't belong to user with id ${req.user.id}`,
        401
      )
    );
  }

  req.body.updatedAt = Date.now();
  console.log(req.body);
  blog = await Blog.findByIdAndUpdate(req.params.blogId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'pass', data: blog });
});

// url DELETE /blogs/:blogId
exports.deleteBlog = asyncHandler(async (req, res, next) => {
  let blog = await Blog.findById(req.params.blogId);
  if (!blog) {
    return next(new AppError(`Blog not found with Id ${req.params.id}`, 400));
  }
  if (req.user.id != blog.author) {
    return next(
      new AppError(
        `This blog doesn't belong to user with id ${req.user.id}`,
        401
      )
    );
  }
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { blogsWritten: blog._id },
  });
  blog = await Blog.findByIdAndDelete(req.params.blogId);
  res.status(200).json({ status: 'pass', data: {} });
});

// url PATCH /blogs/:blogId/save
exports.saveBlog = asyncHandler(async (req, res, next) => {
  let blog = await Blog.findById(req.params.blogId);
  if (!blog) {
    return next(
      new AppError(`Blog not found with Id ${req.params.blogId}`, 400)
    );
  }

  if (blog.author == req.user.id) {
    return next(
      new AppError('User cannot save or unsave his/ her own blog', 400)
    );
  }

  let user = await User.findById(req.user.id);

  if (user.blogsSaved.includes(req.params.blogId)) {
    return next(
      new AppError('This blog is already present in your collections.', 400)
    );
  }
  user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $push: { blogsSaved: blog._id },
    },
    { new: true }
  );

  await Blog.findByIdAndUpdate(blog._id, { $inc: { saves: 1 } });

  res.status(200).json({
    status: 'pass',
    message: 'Blog saved to your collections.',
    blogsSaved: user.blogsSaved,
  });
});

// url PATCH /blogs/:blogId/save
exports.unsaveBlog = asyncHandler(async (req, res, next) => {
  let blog = await Blog.findById(req.params.blogId);
  if (!blog) {
    return next(
      new AppError(`Blog not found with Id ${req.params.blogId}`, 400)
    );
  }

  if (blog.author == req.user.id) {
    return next(
      new AppError('User cannot save or unsave his/ her own blog', 400)
    );
  }

  let user = await User.findById(req.user.id);

  if (!user.blogsSaved.includes(req.params.blogId)) {
    return next(
      new AppError("This blog is not present in user's collections.", 400)
    );
  }
  user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: { blogsSaved: blog._id },
    },
    { new: true }
  );

  await Blog.findByIdAndUpdate(blog._id, { $inc: { saves: -1 } });

  res.status(200).json({
    status: 'pass',
    message: 'Blog removed from your collections.',
    blogsSaved: user.blogsSaved,
  });
});

// url PATCH /blogs/:blogId/like
exports.likeBlog = asyncHandler(async (req, res, next) => {
  let blog = await Blog.findById(req.params.blogId);
  if (!blog) {
    return next(
      new AppError(`Blog not found with Id ${req.params.blogId}`, 400)
    );
  }

  if (blog.usersDisliked.includes(req.user.id)) {
    console.log('l');
    blog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      {
        $pull: { usersDisliked: req.user.id },
        $push: { usersLiked: req.user.id },
      },
      { new: true }
    );
  } else if (blog.usersLiked.includes(req.user.id)) {
    blog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      {
        $pull: { usersLiked: req.user.id },
      },
      { new: true }
    );
  } else {
    blog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      {
        $push: { usersLiked: req.user.id },
      },
      { new: true }
    );
  }

  blog = await Blog.findByIdAndUpdate(
    req.params.blogId,
    {
      likes: blog.usersLiked.length,
      dislikes: blog.usersDisliked.length,
    },
    { new: true }
  );

  res.status(200).json({
    status: 'pass',
    likes: blog.likes,
    usersLiked: blog.usersLiked,
    dislikes: blog.dislikes,
    usersDisliked: blog.usersDisliked,
  });
});

exports.dislikeBlog = asyncHandler(async (req, res, next) => {
  let blog = await Blog.findById(req.params.blogId);
  if (!blog) {
    return next(
      new AppError(`Blog not found with Id ${req.params.blogId}`, 400)
    );
  }

  if (blog.usersLiked.includes(req.user.id)) {
    console.log('d');
    blog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      {
        $pull: { usersLiked: req.user.id },
        $push: { usersDisliked: req.user.id },
      },
      { new: true }
    );
  } else if (blog.usersDisliked.includes(req.user.id)) {
    blog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      {
        $pull: { usersDisliked: req.user.id },
      },
      { new: true }
    );
  } else {
    blog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      {
        $push: { usersDisliked: req.user.id },
      },
      { new: true }
    );
  }

  blog = await Blog.findByIdAndUpdate(
    req.params.blogId,
    {
      likes: blog.usersLiked.length,
      dislikes: blog.usersDisliked.length,
    },
    {
      new: true,
    }
  );

  res.status(200).json({
    status: 'pass',
    likes: blog.likes,
    usersLiked: blog.usersLiked,
    dislikes: blog.dislikes,
    usersDisliked: blog.usersDisliked,
  });
});
