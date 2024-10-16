var express = require("express");
var router = express.Router();


var productRoutes = require('./routes/products/productMain');
var orderRoutes = require('./routes/order/orderMain')

router.use('/product', productRoutes);
router.use('/order', orderRoutes);

module.exports = router;

