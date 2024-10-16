module.exports = function (router) {
    var bodyParser = require('body-parser');
    var jsonParser = bodyParser.json();

    //router controllers 
    const orderController = require('../../controllers/order/orderController');

    router.post('/get_order_woocommerce',
        jsonParser,
        orderController.getOrderWoocommerce
    );

    router.post('/add_order_OW',
        jsonParser,
        orderController.addOrderOW
    );
};