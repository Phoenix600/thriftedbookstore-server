const express = require("express");
const User = require("../models/user_model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// creating the router 
const sellerRoute = express.Router();
const auth_middleware = require("../middlewares/auth_middleware").auth_middleware;
const expressAsyncHandler = require("express-async-handler");
const seller_middleware = require("../middlewares/seller_middleware");
const Order = require("../models/order_model");
const { Product } = require("../models/product_model");



/**
 * @description The below seller REST API is used for creating the seller account  
 * @route POST /api/seller/signup
 * @access public 
 */
sellerRoute.post(
    "/api/seller/signup",
    expressAsyncHandler(async (req, res) => {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        // If user exists
        if (existingUser) {
            return res.status(400).json({ msg: "User with the email already exists" });
        }

        // hashing the password entered by the user, to 60 characters length of string
        const hashPassword = await bcrypt.hash(password, 8);

        let user = new User({ email, password: hashPassword, name, type: "seller" });

        user = await user.save();
        res.json(user);
    }
    ),
); // expressasynchandler 


/**
 * @description This POST API is used to signin the seller account 
 * @route POST/api/seller/sigin
 * @access public  
 */
sellerRoute.post(
    "/api/seller/signin",
    expressAsyncHandler(async (req, res) => {
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
    }),
);

/**
 * @description This REST API is used to check whether the token is valid or not 
 * @access public
 * @route POST /token-is-valid 
 */
sellerRoute.post(
    "/token-is-valid",
    expressAsyncHandler(async (req, res) => {
        // fetching token from request 
        const token = req.header("x-auth-token");

        // token is empty 
        if (!token) return res.json(false);
        console.log(token);

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
 * @description Once the token is passed through the req, if the token in correct seller details will be displayed or sent via response 
 * @route GET/
 * @access public 
*/
sellerRoute.get("/", auth_middleware, async (req, res) => {
    const user = await User.findById(req.user);
    res.json({ ...user._doc, token: req.token });
});


/**
 * @description The below api is used to add the product in database 
 * @route POST /seller/add-product
 * @access public 
 */
sellerRoute.post(
    "/seller/add-product",
    expressAsyncHandler(
        async (req, res) => {
            const { name, description, images, quantity, price, category } = req.body;
            let product = new Product({
                name,
                description,
                images,
                quantity,
                price,
                category
            });

            product = await product.save();
            res.json(product);
        }
    ),
);

/**
 * @description This API is used to get the all the prodcuts added by the seller 
 * @route GET /seller/get-products 
 * @access private  
 */
sellerRoute.get(
    "/seller/get-products",
    seller_middleware,
    expressAsyncHandler(
        async (req, res) => {
            const products = await Product.find({});
            res.json(products);
        }
    ), // expressAsyncHandler 
); // 


/**
 * @description This API is used to delete the product from the data base 
 * @route POST /seller/delete-product 
 * @access private 
 */
sellerRoute.post(
    "/seller/delete-product",
    seller_middleware,
    expressAsyncHandler(
        async (req, res) => {
            const { id } = req.body;
            let product = await Product.findByIdAndDelete(id);
            res.json(product);
        }
    ),
);


/**
 * @description This API used to fetch orders requested by normal users 
 * @route GET /seller/get-orders 
 * @access private 
 */
sellerRoute.get(
    "/seller/get-orders",
    seller_middleware,
    expressAsyncHandler(
        async (req, res) => {
            const orders = Order.find({});
            res.status(200).json(orders)
        }
    ),
);

/**
 * @description This api is used to get the order status  
 * @route POST /seller/change-order-status
 * @access private 
*/
sellerRoute.post(
    "/seller/change-order-status",
    seller_middleware,
    expressAsyncHandler(
        async (req, res) => {
            const { id, status } = req.body;
            let order = Order.findById(id);
            order.status = status;
            order = await order.save();
            res.json(order);
        }
    ),
);

/**
 * @description This API is used to get the 
 * @route GET /seller/analytics 
 * @access private 
 */
sellerRoute.get(
    "/seller/analytics",
    seller_middleware,
    expressAsyncHandler(
        async (req, res) => {
            const orders = await Order.find({});
            let total_earnings = 0;

            for (let i = 0; i < orders.length; i++) {
                for (let j = 0; j < orders[i].products.length; j++) {
                    total_earnings += orders[i].products[j].quantity * orders[i].products[j].product.price;
                }
            }

            // Category Wise Order Fetching 
            let academicsEarnings = await fetchCategoryWiseProduct("Academics");
            let comicEarnings = await fetchCategoryWiseProduct("Comic");
            let fictionEarnings = await fetchCategoryWiseProduct("Fiction");
            let novelEarnings = await fetchCategoryWiseProduct("Novel");
            let collectiblesEarnings = await fetchCategoryWiseProduct("Collectibles");


            let earnings = {
                total_earnings,
                academicsEarnings,
                comicEarnings,
                fictionEarnings,
                novelEarnings,
                collectiblesEarnings
            };

            res.json(earnings);
        }
    ),
);



/**
 * 
 * @description Utility method to fetch prodcuts categorywise 
 */
async function fetchCategoryWiseProduct(category) {
    let earnings = 0;
    let categoryOrders = await Order.find({
        "products.product.category": category,
    });

    for (let i = 0; i < categoryOrders.length; i++) {
        for (let j = 0; j < categoryOrders[i].products.length; j++) {
            earnings +=
                categoryOrders[i].products[j].quantity *
                categoryOrders[i].products[j].product.price;
        }
    }
    return earnings;
}


module.exports = sellerRoute;