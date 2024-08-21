module.exports = function (router) {
	var bodyParser = require('body-parser');
	var jsonParser = bodyParser.json();

	//router controllers 
	const productCategoriesController = require('../../controllers/product/productCategoriesController');

	router.post('/add_category',
		jsonParser,
		productCategoriesController.addCategory
	);

    router.get('/get_category',
		jsonParser,
		productCategoriesController.getCategory
	);

    router.get('/get_categories',
		jsonParser,
		productCategoriesController.getCategories
	);

};