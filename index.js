// Import From Packages 
const express = require("express");
const mongoose = require("mongoose");

// Import From Other Files 
const authRouter = require("./routes/auth_route");
const sellerRoute = require("./routes/seller_route");
const productRouter = require("./routes/product_route");
const userRouter = require("./routes/user_route");


const PORT = process.env.PORT || 3000;
const app = express();

console.log("Hello Server");


// middlewares 
app.use(express.json());
app.use(authRouter);
app.use(sellerRoute);
app.use(productRouter);
app.use(userRouter);

// DataBase Connection 
var mongoDB = 'mongodb://localhost:27017/my_database';
mongoose.connect(mongoDB)
    .then(() => { console.log("Connection successful") })
    .catch((e) => console.log(e));

// last line of any express js project 
app.listen(PORT, "0.0.0.0", () => { console.log(`Conneted Port at ${PORT}`) })