const express = require("express");
const app = express();
const errorMiddleware = require("./middlewares/error");
const cookieParser = require("cookie-parser");

const bodyparser = require("body-parser");

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cookieParser());

const products = require("./routes/product");
const auth = require("./routes/auth");

app.use("/api/v1/", products);
app.use("/api/v1/", auth);

app.use(errorMiddleware);

module.exports = app;
