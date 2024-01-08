const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const expressAsyncHandler = require('express-async-handler');

const seller_middleware = expressAsyncHandler(
    async (req, res, next) => {
        // fetching token 
        const token = req.header("x-auth-token");
        // if token is empty 
        if (!token) {
            return res.status(401).json({ msg: "No auth token, access denied" });
        }
        // if token is not empty, verify the token 
        const verified = jwt.verify(token, "passwordKey");

        // if token is not verified 
        if (!verified) {
            return res.status(400).json({ msg: "Token verification failed, authorization failed" });
        }

        // fetch the user based on the token, if the token is verified 
        const user = await User.findById(verified.id);

        if (user.type == "user") {
            return res.status(401).json({ msg: "You are not an admin" });
        }
        // if token is verified 
        req.user = verified;
        req.token = token;
        next();
    }
);



module.exports = seller_middleware;