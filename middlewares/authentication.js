const { validateToken } = require('../services/authentication');

function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies && req.cookies[cookieName];

        // If no cookie, ensure req.user is null and continue
        if (!tokenCookieValue) {
            req.user = null;
            return next();
        }

        try {
            const userPayLoad = validateToken(tokenCookieValue);
            req.user = userPayLoad;
        } catch (err) {
            req.user = null;
        }

        return next();
    };
}

module.exports = { checkForAuthenticationCookie };