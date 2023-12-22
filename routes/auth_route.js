const express = require("express");
const User = require("../models/user_model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const expressAsyncHandler = require("express-async-handler");

// creating the router 
const authRouter = express.Router();

// Importing the middleware 
const auth_middleware = require("../middlewares/auth_middleware").auth_middleware


/**
 * @description The below REST API is used for creating the customer account
 * @route POST/api/signup 
 * @access public  
 */
authRouter.post(
    "/api/signup",
    expressAsyncHandler(async (req, res) => {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        // If user exists
        if (existingUser) {
            return res.status(400).json({ msg: "User with the email already exists" });
        }

        // hashing the password entered by the user, to 60 characters length of string
        const hashPassword = await bcrypt.hash(password, 8);

        let user = new User({ email, password: hashPassword, name });

        user = await user.save();
        res.json(user);
    }
    ),
); // expressasynchandler 


/**
 * @description The below REST API is used to login as customer 
 * @route POST /api/signin
 * @access public 
 */
authRouter.post("/api/signin",
    expressAsyncHandler(
        async (req, res) => {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res
                    .status(400)
                    .json({ msg: "User with this email does not exist!" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: "Incorrect password." });
            }

            const token = jwt.sign({ id: user._id }, "passwordKey");
            res.json({ token, ...user._doc });
        }
    ));

/**
 * @description 
 */
authRouter.post(
    "/token-is-valid",
    expressAsyncHandler(async (req, res) => {
        // fetching token from request 
        const token = req.header("x-auth-token");

        // token is empty 
        if (!token) return res.json(false);

        // If token is not empty then verifiy the token 
        const isverified = jwt.verify(token, "passwordKey");

        // token is invalid or tampered by some hacker, then return false as response or some message with error 
        if (!isverified) {
            return res.json(false);
        }

        // if token is not tampered, mean we have some kind of authentic token but still it can be manupilated 
        // based on the token, fetch the user stored in data base if the user exists or not 
        const user = User.findById(isverified.id);

        // if user doesn't exists 
        if (!user) {
            return res.json(false);
        }
        // send true as a response if the user exists 
        res.json(true);

    },//async function
    ),//expressAsyncHandler  
); // post method 


/**
 * @description Once the token is passed through the req, if the token in correct user details will be displayed or sent via response 
 * @route GET/
 * @access public 
*/
authRouter.get("/", auth_middleware, async (req, res) => {
    const user = await User.findById(req.user);
    res.json({ ...user._doc, token: req.token });
});



module.exports = authRouter