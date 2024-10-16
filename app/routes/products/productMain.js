var express = require('express');
var router = express.Router();


require('./productRoutes')(router);
require('./productCategoriesRoutes')(router);
require('./productAttributeRoutes')(router);
require('./testProductRoutes')(router);


module.exports = router;