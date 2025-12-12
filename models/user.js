const { createHmac, randomBytes } = require('crypto');

const { Schema, model } = require('mongoose');
const { createTokenForUser } = require('../services/authentication');

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    profileImageURL: {
        type: String,
        default: "https://res.cloudinary.com/dnyg7ue5v/image/upload/v1765452799/sheeoDP_onhkub.jpg",
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    // --- ADD THIS ---
    bio: {
        type: String,
        default: "Keeper of the Akashic Records. Documenting the anomalies of the digital universe."
    },
    // ----------------
    // --- NEW FOLLOWER SYSTEM ---
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // --- ADD THIS ---
    savedBlogs: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
    // ----------------
    // ---------------------------
}, { timestamps: true }
);

userSchema.pre('save', async function () {
    const user = this;

    // 1. If password didn't change, just return.
    if (!user.isModified('password')) return;

    // 2. Generate Salt
    const salt = randomBytes(16).toString('hex');

    // 3. Hash Password
    const hashedPassword = createHmac('sha256', salt)
        .update(user.password)
        .digest('hex');

    // 4. Set values
    user.salt = salt;
    user.password = hashedPassword;

    // 5. No need to call next()! The function simply ends.
});

userSchema.statics.matchaPasswordAndGenerateToken = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error('User not found');
    // return null;
    const userProvidedHash = createHmac('sha256', user.salt)
        .update(password)
        .digest('hex');

    if (userProvidedHash !== user.password) throw new Error('Invalid password');
    // return null;

    const token = createTokenForUser(user);
    return token;

    // const userObj = user.toObject();
    // delete userObj.password;
    // delete userObj.salt;
    // return userObj;
};

const User = model('User', userSchema);

module.exports = User;