var express = require('express');
var router = express.Router();


require('./orderRoutes')(router);

module.exports = router;