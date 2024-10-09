module.exports = function (router) {
	var bodyParser = require('body-parser');
	var jsonParser = bodyParser.json();

	//router controllers 
	const productAttributeController = require('../../controllers/product/productAttributeController');

	router.post('/add_attribute',
		jsonParser,
		productAttributeController.addAttribute
	);

    router.get('/get_attributes',
		jsonParser,
		productAttributeController.getAttributes
	);
};