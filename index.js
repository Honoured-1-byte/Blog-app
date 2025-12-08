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
    const allBlogs = await Blog.find({}).sort({ createdAt: -1 });
    console.log('GET / - blogs count:', allBlogs.length);
    res.render('home', {
        user: req.user,
        blogs: allBlogs,
    });
});


app.use('/user', userRoutes);
app.use('/blog', blogRoutes);

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));