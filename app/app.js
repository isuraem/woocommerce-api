var express = require("express");
var router = express.Router();


var productRoutes = require('./routes/products/productMain');

router.use('/product', productRoutes);

module.exports = router;
