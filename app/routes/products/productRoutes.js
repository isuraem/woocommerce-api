module.exports = function (router) {
	var bodyParser = require('body-parser');
	var jsonParser = bodyParser.json();

	//router controllers 
	const productController = require('../../controllers/product/productController');


	router.post('/add_product',
		jsonParser,
		productController.addProduct
	);

	router.get('/status',
		jsonParser,
		productController.statusProduct
	);
};