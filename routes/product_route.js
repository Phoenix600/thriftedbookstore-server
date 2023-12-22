const express = require("express");
const productRouter = express.Router();
const expressAsyncHandler = require("express-async-handler");

// Imports from other files 
const auth_middleware = require("../middlewares/auth_middleware").auth_middleware;
const { Product } = require("../models/product_model");
const { purge } = require("./seller_route");


/**
 * @description
 * @route GET /api/products
 * @access public  
 */
productRouter.get(
    "api/products/",
    auth_middleware,
    expressAsyncHandler(
        async (req, res) => {
            const products = await Product.find({ category: req.query.category });
            res.json(products);
        }
    ),
);


/**
 * @description The given api used to search the product by their names 
 * @route GET /api/products/search/:name 
 * @access public  
 */
productRouter.get(
    "/api/products/search/:name",
    auth_middleware,
    expressAsyncHandler(async (req, res) => {
        const products = await Product.find(
            {
                name: { $regex: req.params.name, $options: "i" },
            }
        );
        res.json(products);
    })
);

/**
 * @descripton This this api is used to rate the product, then the average rating of the product will be saved 
 * to the database 
 * @route POST /api/rate-product 
 * @access public 
 */
productRouter.post(
    "/api/rate-product",
    auth_middleware,
    expressAsyncHandler(async (req, res) => {
        const { id, rating } = req.body;
        let product = await Product.findById(id);

        for (let i = 0; i < product.ratings.length; i++) {
            if (product.ratings[i].userI == req.user) {
                product.ratings.splice(i, 1);
                break;
            }
        }

        const ratingSchema = {
            userId: req.user,
            rating
        }


        product.ratings.push(ratingSchema);
        product = await product.save();
        res.json(product);

    }),
);


/**
 * @description The the given api fetches the product based on their highest-rating,  
 * @route GET /api/deal-of-day
 * @access public 
 */
productRouter.get("/api/deal-of-day", auth_middleware, expressAsyncHandler(async (req, res) => {
    let products = await Product.find({});
    // comparator logic 
    products = products.sort((a, b) => {
        let aSum = 0;
        let bSum = 0;

        for (let i = 0; i < a.ratings.length; i++) {
            aSum += a.ratings[i].rating;
        }

        for (let i = 0; i < b.ratings.length; i++) {
            bSum += b.ratings[i].rating;
        }

        return aSum < bSum ? 1 : -1;
    });
}))

module.exports = productRouter;