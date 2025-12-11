const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Keep for safety, though used less now

const Blog = require('../../models/blog');
const Comment = require('../../models/comments');

// --- CLOUDINARY SETUP ---
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
// Markdown & Sanitization
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDomPurify = require('dompurify');
const window = new JSDOM('').window;
const dompurify = createDomPurify(window);

const router = Router();

// 1. Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Storage Engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "blogify_uploads",
        allowed_formats: ["jpg", "png", "jpeg", "webp", "mp4", "mkv", "gif"],
    },
});

const upload = multer({ storage: storage });


// --- ROUTES ---

router.get('/add-new', (req, res) => {
    return res.render('addBlog', {
        user: req.user,
    });
});

// Create New Blog (POST)
router.post('/', upload.single('coverImage'), async (req, res) => {
    try {
        const { title, body } = req.body;

        // Cloudinary provides the URL in req.file.path
        // If upload fails or no file, fallback to default
        const coverImageURL = req.file ? req.file.path : '/images/defaultBlog.png';

        const blog = await Blog.create({
            body,
            title,
            createdBy: req.user._id,
            coverImageURL: coverImageURL,
        });

        console.log(`New Blog Created: "${title}"`);
        return res.redirect(`/blog/${blog._id}`);
    } catch (err) {
        console.error('Blog creation error:', err.message);
        return res.status(400).render('addBlog', { user: req.user, error: err.message });
    }
});

// View Single Blog
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('createdBy');
        const comments = await Comment.find({ blogId: req.params.id }).populate('createdBy');

        if (!blog) return res.status(404).redirect('/');

        // --- URL NORMALIZATION FIX ---
        // Only force default if it's missing entirely. 
        // Don't force "/" prefix because Cloudinary URLs start with "http"
        if (!blog.coverImageURL) {
            blog.coverImageURL = '/images/defaultBlog.png';
        }

        // Handle Author Profile Image
        if (blog.createdBy) {
            if (!blog.createdBy.profileImageURL) {
                blog.createdBy.profileImageURL = '/images/default.jpeg';
            }
        }

        // Handle Comment Author Images
        if (comments) {
            comments.forEach(c => {
                if (c.createdBy && !c.createdBy.profileImageURL) {
                    c.createdBy.profileImageURL = '/images/default.jpeg';
                }
            });
        }

        const relatedBlogs = await Blog.find({ _id: { $ne: req.params.id } }).sort({ createdAt: -1 }).limit(3);

        const blogObject = blog.toObject();

        // Parse Markdown
        if (blogObject.body) {
            const parsedBody = marked.parse(blogObject.body);
            blogObject.body = dompurify.sanitize(parsedBody);
        }

        return res.render('blog', {
            blog: blogObject,
            user: req.user,
            comments,
            relatedBlogs,
        });
    } catch (err) {
        console.log("Error loading blog:", err);
        return res.redirect('/');
    }
});

// Post Comment
router.post('/comment/:blogId', async (req, res) => {
    await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
});

// Edit Page
router.get('/:id/edit', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Not found');

        // Authorization Check
        if (!req.user || String(req.user._id) !== String(blog.createdBy)) {
            return res.status(403).send('Forbidden');
        }

        return res.render('editBlog', { blog, user: req.user });
    } catch (err) {
        return res.status(500).send('Server error');
    }
});

// Edit Submit
router.post('/:id/edit', upload.single('coverImage'), async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Not found');
        if (!req.user || String(req.user._id) !== String(blog.createdBy)) return res.status(403).send('Forbidden');

        const { title, body } = req.body;

        // Update image ONLY if a new one is uploaded
        if (req.file) {
            blog.coverImageURL = req.file.path; // Save new Cloudinary URL
        }

        blog.title = title;
        blog.body = body;
        await blog.save();

        return res.redirect(`/blog/${blog._id}`);
    } catch (err) {
        console.error('Edit submit error:', err.message);
        return res.status(500).send('Server error');
    }
});

// Delete Blog
router.get('/:id/delete', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Not found');
        if (!req.user || String(req.user._id) !== String(blog.createdBy)) return res.status(403).send('Forbidden');

        // We skip fs.unlink because files are now on Cloudinary
        // and deleting from Cloudinary requires more setup (public_id).
        // For now, just removing the database entry is enough.

        await Comment.deleteMany({ blogId: blog._id });
        await Blog.findByIdAndDelete(blog._id);

        return res.redirect('/');
    } catch (err) {
        console.error('Delete error:', err.message);
        return res.status(500).send('Server error');
    }
});

module.exports = router;