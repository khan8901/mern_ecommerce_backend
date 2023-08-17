const express = require('express');
const app = express();

const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const cors = require("cors");
const morgan = require("morgan");

// const dotenv = require('dotenv');
const path = require('path')


// Setting up config file 
require('dotenv').config({ path: 'config/config.env' })
// dotenv.config({ path: 'backend/config/config.env' })

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(fileUpload());
app.use(cors());
app.use(morgan("dev"));


// Import all routes
const auth = require('./routes/auth');
const payment = require('./routes/payment');
const order = require('./routes/order');
const products = require("./routes/product");



app.use('/api/v1', products)
app.use('/api/v1', auth)
app.use('/api/v1', payment)
app.use('/api/v1', order)




module.exports = app