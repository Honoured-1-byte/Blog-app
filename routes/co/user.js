const { Router } = require('express');
const User = require('../../models/user');
const router = Router();

const path = require('path');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve('./public/images/profiles');
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

router.get('/signin', (req, res) => {
    return res.render('signin', { error: null });
});

router.get('/signup', (req, res) => {
    return res.render('signup');
});

router.get('/logout', (req, res) => {
    return res.clearCookie('token').redirect('/');
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const token = await User.matchaPasswordAndGenerateToken(email, password);
        if (!token) {
            return res.status(401).render('signin', { error: 'Invalid email or password' });
        }
        console.log(`User Login: ${token.fullName || email} (ID: ${token._id})`);
        console.log('User Signed In:', token);
        return res.cookie('token', token).redirect('/');
    } catch (err) {
        return res.status(400).render('signin', { error: "Incorrect email or password" });
    }
});

router.post('/signup', upload.single('profileImage'), async (req, res) => {
    console.log('Signup Request Received');
    // Fix for req.body being undefined in some environments with Multer/Express 5
    const body = req.body || {};
    const { fullName, email, password } = body;

    console.log('Body:', body);

    if (!fullName || !email || !password) {
        return res.status(400).render('signup', { error: "All fields are required." });
    }

    let profileImageURL = '/images/default.jpeg';
    if (req.file) {
        profileImageURL = `/images/profiles/${req.file.filename}`;
    }

    try {
        await User.create({
            fullName,
            email,
            password,
            profileImageURL
        });
        console.log(`User Created: ${fullName} (${email})`);
        return res.redirect('/');
    } catch (error) {
        console.error('Signup error:', error);
        return res.render('signup', { error: "Error creating account. Try again." });
    }
});

module.exports = router;