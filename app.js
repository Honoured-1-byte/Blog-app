require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/co/user');
const blogRoutes = require('./routes/co/blog');
const Blog = require('./models/blog');

const { checkForAuthenticationCookie } = require('./middlewares/authentication');

const app = express();
const PORT = process.env.PORT || 8002;

mongoose
    .connect(process.env.MONGO_URL)
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
    res.locals.path = req.path;
    next();
});

app.get('/test', (req, res) => {
    res.send('Server is active!');
});

app.get('/', async (req, res) => {
    console.log("Root route hit!");
    try {
        const allBlogs = await Blog.find({}).sort({ createdAt: -1 }).lean();

        // 2. TOP SLIDER (Most Liked)
        // We clone the array and sort by likes length
        const mostLiked = [...allBlogs].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 5);

        // 3. TALK OF THE TOWN (Most Comments) - "Trending" Logic: Views + Likes*2
        const trending = [...allBlogs].sort((a, b) => {
            const scoreA = (a.views || 0) + ((a.likes?.length || 0) * 2);
            const scoreB = (b.views || 0) + ((b.likes?.length || 0) * 2);
            return scoreB - scoreA;
        }).slice(0, 4);

        // 4. DEEPER DIVES (Longest Content)
        const deepDives = [...allBlogs].sort((a, b) => (b.body?.length || 0) - (a.body?.length || 0)).slice(0, 4);

        res.render('home', {
            user: req.user,
            latest: allBlogs.slice(0, 6), // Show top 6 new ones
            slider: mostLiked,
            trending: trending,
            deepDives: deepDives
        });
    } catch (error) {
        console.log("Error fetching home:", error);
        res.render('home', { user: req.user, slider: [], trending: [], latest: [], deepDives: [] });
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
        // If empty search, go home
        if (!query) return res.redirect('/');

        // Find blogs that match the title OR body (Case Insensitive 'i')
        const results = await Blog.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { body: { $regex: query, $options: 'i' } }
            ]
        });

        // Reuse the 'allBlogs' view to show results
        res.render('allBlogs', {
            user: req.user,
            blogs: results,
            query: query
        });
    } catch (error) {
        console.log("Search Error:", error);
        res.redirect('/');
    }
});

app.use('/user', userRoutes);
app.use('/blog', blogRoutes);

// The "Catch-All" 404 Route
// (Must be the last route in the file)
app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));