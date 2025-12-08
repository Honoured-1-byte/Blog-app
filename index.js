const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/co/user');
const blogRoutes = require('./routes/co/blog');
const Blog = require('./models/blog');

const { checkForAuthenticationCookie } = require('./middlewares/authentication');

const app = express();
const PORT = 8000;

mongoose
    .connect('mongodb://127.0.0.1:27017/blogify')
    .then((e) => console.log('DB Connected'))
    .catch((err) => console.log('DB Connection Error:', err));


app.set('view engine', 'ejs');
app.set("views", path.resolve("./views"));

app.use(express.static(path.resolve('./public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token'));

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.get('/', async (req, res) => {
    try {
        // 1. Fetch EVERYTHING (Nuclear Option to guarantee data availability)
        // We fetch all blogs and populate their createdBy user
        const allBlogsOriginal = await Blog.find({}).populate('createdBy');

        // We fetch ALL comments to manually map them (safest way if lookup fails)
        const allComments = await require('./models/comments').find({});

        // 2. Process Data in JavaScript (Fail-proof)
        const allBlogs = allBlogsOriginal.map(blog => {
            const blogObj = blog.toObject();
            // Attach comments count manually
            const blogComments = allComments.filter(c => String(c.blogId) === String(blog._id));
            blogObj.commentsCount = blogComments.length;
            // Ensure body exists
            blogObj.body = blogObj.body || "";
            return blogObj;
        });

        // 3. Create Lists using JS Sort

        // Latest: Sort by createdAt descending
        const latestBlogs = [...allBlogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

        // Talk of the Town: Sort by commentsCount descending
        const mostCommented = [...allBlogs].sort((a, b) => b.commentsCount - a.commentsCount).slice(0, 8);

        // Deep Dives: Sort by body length descending
        const longReads = [...allBlogs].sort((a, b) => b.body.length - a.body.length).slice(0, 4);

        // Featured: Top 3 most commented (or latest if no comments)
        let featuredBlogs = mostCommented.slice(0, 3);
        if (featuredBlogs.length === 0) featuredBlogs = latestBlogs.slice(0, 3);

        res.render('home', {
            user: req.user,
            featuredBlogs: featuredBlogs,
            talkOfTheTown: mostCommented,
            latest: latestBlogs,
            deepDives: longReads
        });

    } catch (error) {
        console.log("Error fetching home:", error);
        // Absolute fallback to empty arrays to prevent crash
        res.render('home', { user: req.user, featuredBlogs: [], talkOfTheTown: [], latest: [], deepDives: [] });
    }
});

// Get ALL blogs (The Archive Page)
app.get('/blogs', async (req, res) => {
    try {
        const allBlogs = await Blog.find({}).populate('createdBy').sort({ createdAt: -1 }); // Newest first
        res.render('allBlogs', {
            user: req.user,
            blogs: allBlogs
        });
    } catch (error) {
        console.log("Error fetching archive:", error);
        res.redirect('/');
    }
});


app.get('/search', async (req, res) => {
    try {
        const query = req.query.query;
        // Search title OR body, case-insensitive
        const blogs = await Blog.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { body: { $regex: query, $options: "i" } }
            ]
        }).populate('createdBy');

        res.render('allBlogs', {
            user: req.user,
            blogs: blogs,
            query: query // Pass query back to view
        });
    } catch (error) {
        console.log("Error searching:", error);
        res.redirect('/');
    }
});

app.use('/user', userRoutes);
app.use('/blog', blogRoutes);

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));