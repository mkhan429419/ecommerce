const express=require('express');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, likedBlog, liketheBlog } = require('../controller/blogCtrl');
const router=express.Router();

router.post('/', authMiddleware, isAdmin, createBlog);
router.put('/:id', authMiddleware, isAdmin, updateBlog);
router.get('/:id', getBlog);
router.get('/', getAllBlogs);
router.put('/likes', authMiddleware, liketheBlog);
router.delete('/:id', authMiddleware, isAdmin, deleteBlog);

module.exports=router;