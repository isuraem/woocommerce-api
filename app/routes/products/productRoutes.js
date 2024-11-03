module.exports = function (router) {
	var bodyParser = require('body-parser');
	var jsonParser = bodyParser.json();

	//router controllers 
	const productController = require('../../controllers/product/productController');

	router.post('/add_product',
		jsonParser,
		productController.addProduct
	);

	router.post('/add_product_variant',
		jsonParser,
		productController.addProductVariant
	);

	router.get('/get_product',
		jsonParser,
		productController.getProduct
	);

	router.post('/add_product_using_orderwise',
		jsonParser,
		productController.addProductUsingOrderwise
	);

	router.post('/get_all_product_using_orderwise',
		jsonParser,
		productController.getAllProductUsingOrderwise
	);

};