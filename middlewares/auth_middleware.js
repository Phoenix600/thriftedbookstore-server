const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");


const auth_middleware = asyncHandler(async (req, res, next) => {
    const token = req.header("x-auth-token");
    if (!token)
        return res.status(401).json({ msg: "No Auth Token, access denied" });

    const verified = jwt.verify(token, "passwordKey");

    if (!verified) {
        return res.status(401).json({ msg: "Token Verification Failed, Authorization Denied" });
    }

    req.user = verified.id;
    req.token = token;
    next();
});



module.exports = { auth_middleware };