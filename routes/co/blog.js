const { Router } = require('express');
const path = require('path');
const multer = require('multer');


const Blog = require('../../models/blog');
const Comment = require('../../models/comments');
const { create } = require('../../models/user');
const fs = require('fs');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDomPurify = require('dompurify');

const window = new JSDOM('').window;
const dompurify = createDomPurify(window);

const router = Router();

// Store uploads in public/uploads (ensure dir exists)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve('./public/uploads');
        try {
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        } catch (e) {
            return cb(e);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage });


router.get('/add-new', (req, res) => {
    return res.render('addBlog', {
        user: req.user,
    });
});

router.get('/:id', async (req, res) => {
    const blog = await Blog.findById(req.params.id).populate('createdBy');
    const comments = await Comment.find({ blogId: req.params.id }).populate('createdBy');

    // Normalize image URLs so views can safely render them
    if (!blog.coverImageURL || !String(blog.coverImageURL).startsWith('/')) {
        blog.coverImageURL = '/images/defaultBlog.png';
    }

    if (blog.createdBy && blog.createdBy.profileImageURL) {
        if (!String(blog.createdBy.profileImageURL).startsWith('/')) {
            blog.createdBy.profileImageURL = '/images/default.jpeg';
        }
    } else if (blog.createdBy) {
        blog.createdBy.profileImageURL = '/images/default.jpeg';
    }

    // Normalize comment author images
    if (comments && comments.length) {
        for (const c of comments) {
            if (c.createdBy && c.createdBy.profileImageURL) {
                if (!String(c.createdBy.profileImageURL).startsWith('/')) {
                    c.createdBy.profileImageURL = '/images/default.jpeg';
                }
            } else if (c.createdBy) {
                c.createdBy.profileImageURL = '/images/default.jpeg';
            }
        }
    }

    const relatedBlogs = await Blog.find({ _id: { $ne: req.params.id } }).sort({ createdAt: -1 }).limit(3);

    const blogObject = blog.toObject();

    // Parse and sanitize markdown
    if (blogObject.body) {
        console.log('Original body length:', blogObject.body.length);
        const parsedBody = marked.parse(blogObject.body);
        console.log('Parsed body length:', parsedBody.length);
        blogObject.body = dompurify.sanitize(parsedBody);
    }

    return res.render('blog', {
        blog: blogObject,
        user: req.user,
        comments,
        relatedBlogs,
    });
});

router.post('/comment/:blogId', async (req, res) => {
    await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });
    console.log(`New Comment on Blog ${req.params.blogId} by User ${req.user.fullName} (${req.user._id})`);
    return res.redirect(`/blog/${req.params.blogId}`);
});

// Edit blog - show form
router.get('/:id/edit', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Not found');
        if (!req.user || String(req.user._id) !== String(blog.createdBy)) return res.status(403).send('Forbidden');
        return res.render('editBlog', { blog, user: req.user });
    } catch (err) {
        console.error('Edit page error:', err.message);
        return res.status(500).send('Server error');
    }
});

// Handle edit submission
router.post('/:id/edit', upload.single('coverImage'), async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Not found');
        if (!req.user || String(req.user._id) !== String(blog.createdBy)) return res.status(403).send('Forbidden');

        const { title, body } = req.body;
        if (req.file) {
            // remove old file if exists
            if (blog.coverImageURL && blog.coverImageURL.startsWith('/uploads/')) {
                const oldPath = path.resolve('./public' + blog.coverImageURL);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            blog.coverImageURL = `/uploads/${req.file.filename}`;
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

// Delete blog
router.get('/:id/delete', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Not found');
        if (!req.user || String(req.user._id) !== String(blog.createdBy)) return res.status(403).send('Forbidden');

        // remove cover file
        if (blog.coverImageURL && blog.coverImageURL.startsWith('/uploads/')) {
            const oldPath = path.resolve('./public' + blog.coverImageURL);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        // delete comments
        await Comment.deleteMany({ blogId: blog._id });
        await Blog.findByIdAndDelete(blog._id);
        return res.redirect('/');
    } catch (err) {
        console.error('Delete error:', err.message);
        return res.status(500).send('Server error');
    }
});
// Accept a single file field named 'coverImage'
router.post('/', upload.single('coverImage'), async (req, res) => {
    try {
        const { title, body } = req.body;
        const blog = await Blog.create({
            body,
            title,
            createdBy: req.user._id,
            coverImageURL: `/uploads/${req.file.filename}`,
        });
        console.log(`New Blog Created: "${title}" by User ${req.user.fullName} (${req.user._id})`);
        return res.redirect(`/blog/${blog._id}`);
    } catch (err) {
        console.error('Blog creation error:', err.message);
        return res.status(400).render('addBlog', { user: req.user, error: err.message });
    }
});

// Display a single blog post by ID
// NOTE: removed duplicate route. The earlier route fetches comments separately
// and renders the view with both `blog` and `comments` variables.

module.exports = router;