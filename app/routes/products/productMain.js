var express = require('express');
var router = express.Router();


require('./productRoutes')(router);

module.exports = router;