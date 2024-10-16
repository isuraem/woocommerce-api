const orderService = require('../../services/order/orderService');
const { ResponseStatusCodes } = require('./../../util/constants/responseStatusCodes');
const { ResponseCommonMessages } = require('./../../util/constants/responseCommonMessages');
const Logger = require('../../util/logging/logger');

module.exports.getOrderWoocommerce = async (req, res) => {
	try {
		const serviceResponse = await orderService.getOrderWoocommerce(req.body);
		return res.status(200).json({ success: true, msg: serviceResponse.msg , showMessage:false, data:  serviceResponse.data });
	} catch (err) {
		Logger.log('getOrderWoocommerce', null, null,err);
		return res.status(err.status || ResponseStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: err.msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR });
	}
};

module.exports.addOrderOW = async (req, res) => {
	try {
		const serviceResponse = await orderService.addOrderOW(req.body);
		return res.status(200).json({ success: true, msg: serviceResponse.msg , showMessage:false, data:  serviceResponse.data });
	} catch (err) {
		Logger.log('addOrderOW', null, null,err);
		return res.status(err.status || ResponseStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: err.msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR });
	}
};