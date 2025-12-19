const { Router } = require('express');
const User = require('../../models/user');
const Blog = require('../../models/blog');
const router = Router();

const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { uploadToImgCDN } = require('../../services/imgcdn');
const { createTokenForUser } = require('../../services/authentication');

// Helper for local fallback
function saveBufferToLocal(buffer, originalname) {
    const uploadDir = path.resolve('./public/images/profiles');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = `${Date.now()}-${originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/images/profiles/${fileName}`;
}

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.get('/signin', (req, res) => {
    return res.render('signin', { error: null });
});

router.get('/signup', (req, res) => {
    return res.render('signup');
});

router.get("/profile", async (req, res) => {
    if (!req.user) return res.redirect("/user/signin");

    const realUser = await User.findById(req.user._id);
    const tab = req.query.tab || 'work'; // Default to 'work' tab

    let blogsToRender = [];

    if (tab === 'saved') {
        // Fetch SAVED blogs (we need to populate them because they are just IDs in the array)
        const userWithSaved = await User.findById(req.user._id).populate('savedBlogs');
        blogsToRender = userWithSaved.savedBlogs || []; // Safety check
    } else if (tab === 'about') {
        // We don't need to fetch blogs for the about tab
        blogsToRender = [];
    } else {
        // Fetch MY WORK
        blogsToRender = await Blog.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    }

    // Calculate total likes (always based on MY work, not saved work)
    const myWork = await Blog.find({ createdBy: req.user._id });
    const totalLikes = myWork.reduce((acc, blog) => acc + (blog.likes ? blog.likes.length : 0), 0);

    res.render("profile", {
        profileUser: realUser,
        currentUser: req.user,
        blogs: blogsToRender,
        totalLikes: totalLikes,
        isOwner: true,
        currentTab: tab // Pass this so we can highlight the active tab in CSS
    });
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

        return res.cookie('token', token).redirect('/');
    } catch (err) {
        return res.status(400).render('signin', { error: "Incorrect email or password" });
    }
});

router.post('/signup', upload.single('profileImage'), async (req, res) => {
    // Fix for req.body being undefined in some environments with Multer/Express 5
    const body = req.body || {};
    const { fullName, email, password } = body;



    if (!fullName || !email || !password) {
        return res.status(400).render('signup', { error: "All fields are required." });
    }

    let profileImageURL = '/images/default.jpeg';
    if (req.file) {
        try {
            profileImageURL = await uploadToImgCDN(req.file.buffer, req.file.originalname);
        } catch (err) {
            console.error("Failed to upload to IMGCDN:", err);
            // Fallback to local
            try {
                profileImageURL = saveBufferToLocal(req.file.buffer, req.file.originalname);
            } catch (localErr) {
                console.error("Local fallback also failed:", localErr);
            }
        }
    }

    try {
        await User.create({
            fullName,
            email,
            password,
            profileImageURL
        });

        // 2. Fetch the user we just created (to get their ID)
        const user = await User.findOne({ email });

        // 3. Create the Token (Auto-Login)
        const token = createTokenForUser(user);

        // 4. Save the Cookie
        return res.cookie("token", token).redirect("/");
    } catch (error) {
        console.error('Signup error:', error);
        return res.render('signup', { error: "Error creating account. Try again." });
    }
});

// 1. PUBLIC PROFILE (View someone else)
router.get("/u/:id", async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).send("User not found");

        const blogs = await Blog.find({ createdBy: userId }).sort({ createdAt: -1 });

        // Calculate total likes for this user
        const totalLikes = blogs.reduce((acc, blog) => acc + (blog.likes ? blog.likes.length : 0), 0);

        res.render("profile", {
            profileUser: user,      // The person we are looking at (Renamed from 'user' to avoid conflict)
            currentUser: req.user,  // ME (The one logged in)
            blogs: blogs,
            totalLikes: totalLikes,
            isOwner: req.user && req.user._id.toString() === userId // Are we looking at ourselves?
        });
    } catch (err) {
        console.log("Profile Error:", err);
        res.redirect('/');
    }
});

// 1. GET: Show the Edit Page
router.get("/edit-profile", (req, res) => {
    if (!req.user) return res.redirect("/user/signin");
    res.render("editProfile", { user: req.user });
});

// 2. POST: Handle the Update
router.post("/edit-profile", upload.single("profileImage"), async (req, res) => {
    try {
        if (!req.user) return res.redirect("/user/signin");

        const { fullName, bio } = req.body;
        const userId = req.user._id;

        // Prepare update data
        let updateData = { fullName, bio };

        // If a new image was uploaded, update the URL
        if (req.file) {
            try {
                updateData.profileImageURL = await uploadToImgCDN(req.file.buffer, req.file.originalname);
            } catch (err) {
                console.error("Failed to upload to IMGCDN during edit:", err);
                try {
                    updateData.profileImageURL = saveBufferToLocal(req.file.buffer, req.file.originalname);
                } catch (localErr) {
                    return res.render("editProfile", { user: req.user, error: "Image upload failed" });
                }
            }
        }

        // Update the database
        await User.findByIdAndUpdate(userId, updateData);

        // Redirect to profile
        return res.redirect("/user/profile");

    } catch (error) {
        console.log(error);
        return res.render("editProfile", { user: req.user, error: "Update failed" });
    }
});

// 2. TOGGLE FOLLOW API
router.get("/follow/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Login required" });

    const targetUserId = req.params.id;
    const myUserId = req.user._id;

    // You can't follow yourself
    if (targetUserId === myUserId.toString()) return res.json({ status: "error" });

    const me = await User.findById(myUserId);
    const target = await User.findById(targetUserId);

    if (!me || !target) return res.json({ error: "User not found" });

    // Initialize arrays if they don't exist (just safety, though schema handles it)
    if (!me.following) me.following = [];
    if (!target.followers) target.followers = [];

    const isFollowing = me.following.includes(targetUserId);

    if (isFollowing) {
        // UNFOLLOW
        await User.findByIdAndUpdate(myUserId, { $pull: { following: targetUserId } });
        await User.findByIdAndUpdate(targetUserId, { $pull: { followers: myUserId } });

        // Fetch updated target to return correct count
        const updatedTarget = await User.findById(targetUserId);
        return res.json({ status: "unfollowed", count: updatedTarget.followers.length });
    } else {
        // FOLLOW
        await User.findByIdAndUpdate(myUserId, { $push: { following: targetUserId } });
        await User.findByIdAndUpdate(targetUserId, { $push: { followers: myUserId } });

        // Fetch updated target to return correct count
        const updatedTarget = await User.findById(targetUserId);
        return res.json({ status: "followed", count: updatedTarget.followers.length });
    }
});

module.exports = router;