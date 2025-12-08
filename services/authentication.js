const JWT = require("jsonwebtoken");

const secret = "PrisionRealm";

function createTokenForUser(user) {
    const payload = {
        _id: user._id,
        email: user.email,
        profileImageURL: user.profileImageURL,
        role: user.role,
        fullName: user.fullName,
    };
    const token = JWT.sign(payload, secret, { expiresIn: '1d' });
    return token;
}

function validateToken(token) {
    const payload = JWT.verify(token, secret);
    return payload;
}

module.exports = { createTokenForUser, validateToken };