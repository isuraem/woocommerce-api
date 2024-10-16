module.exports = function (router) {
	var bodyParser = require('body-parser');
	var jsonParser = bodyParser.json();

	//router controllers 
	const productController = require('../../controllers/product/prdouctTestController');

	router.get('/get_mismatched_product',
		jsonParser,
		productController.getProduct
	);
    
	router.post('/get_many_product_in_orderwise',
		jsonParser,
		productController.getManyProductInOrderwise
	);
};