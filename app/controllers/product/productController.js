const productService = require('../../services/product/productService');
const { ResponseStatusCodes } = require('./../../util/constants/responseStatusCodes');
const { ResponseCommonMessages } = require('./../../util/constants/responseCommonMessages');
const Logger = require('../../util/logging/logger');

module.exports.addProduct = async (req, res) => {
	try {
		const serviceResponse = await productService.addProduct(req.body);
		return res.status(200).json({ success: true, msg: serviceResponse.msg , showMessage:false, data:  serviceResponse.data });
	} catch (err) {
		Logger.log('addProduct', null, null,err);
		return res.status(err.status || ResponseStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: err.msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR });
	}
};


module.exports.addProductVariant = async (req, res) => {
	try {
		const serviceResponse = await productService.addProductVariant(req.body);
		return res.status(200).json({ success: true, msg: serviceResponse.msg , showMessage:false, data:  serviceResponse.data });
	} catch (err) {
		Logger.log('addProductVariant', null, null,err);
		return res.status(err.status || ResponseStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: err.msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR });
	}
};


module.exports.getProduct = async (req, res) => {
	try {
		const serviceResponse = await productService.getProduct(req.body);
		return res.status(200).json({ success: true, msg: serviceResponse.msg , showMessage:false, data:  serviceResponse.data });
	} catch (err) {
		Logger.log('getProduct', null, null,err);
		return res.status(err.status || ResponseStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: err.msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR });
	}
};

module.exports.addProductUsingOrderwise = async (req, res) => {
	try {
		const serviceResponse = await productService.addProductUsingOrderwise(req.body);
		return res.status(200).json({ success: true, msg: serviceResponse.msg , showMessage:false, data:  serviceResponse.data });
	} catch (err) {
		Logger.log('addProductUsingOrderwise', null, null,err);
		return res.status(err.status || ResponseStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: err.msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR });
	}
};

module.exports.getAllProductUsingOrderwise = async (req, res) => {
	try {
		const serviceResponse = await productService.getAllProductUsingOrderwise(req.body);
		return res.status(200).json({ success: true, msg: serviceResponse.msg , showMessage:false });
	} catch (err) {
		Logger.log('getAllProductUsingOrderwise', null, null,err);
		return res.status(err.status || ResponseStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: err.msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR });
	}
};
