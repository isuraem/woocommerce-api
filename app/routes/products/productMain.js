var express = require('express');
var router = express.Router();


require('./productRoutes')(router);
require('./productCategoriesRoutes')(router);
require('./productAttributeRoutes')(router);

module.exports = router;