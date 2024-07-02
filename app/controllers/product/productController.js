const productService = require('../../services/product/productService');
const { ResponseStatusCodes } = require('./../../util/constants/responseStatusCodes');
const { ResponseCommonMessages } = require('./../../util/constants/responseCommonMessages');
const Logger = require('../../util/logging/logger');

module.exports.addProduct = async (req, res) => {
	try {
		const serviceResponse = await productService.addProduct(req.body);
		return res.status(200).json({ success: true, msg: serviceResponse.msg , showMessage:false });
	} catch (err) {
		Logger.log('addProduct', null, null,err);
		return res.status(err.status || ResponseStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: err.msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR });
	}
};

