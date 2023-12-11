const express = require("express");
const app = express();
const errorMiddleware = require("./middlewares/error");

const bodyparser = require("body-parser");

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

const products = require("./routes/product");

app.use("/api/v1/", products);

app.use(errorMiddleware);

module.exports = app;
