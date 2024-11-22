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

	router.post('/create_sale_order_to_orderwise',
		jsonParser,
		productController.createSaleOrderToOW
	);

	router.post('/get_ten_simple_products_ow',
		jsonParser,
		productController.getTenSimpleProductOW
	);

	router.post('/get_prodcuts_and_variants',
		jsonParser,
		productController.getProductsAndVariantsFromWoocommerce
	);
	
	router.post('/edit_meta_data',
		jsonParser,
		productController.editMetaData
	);
};