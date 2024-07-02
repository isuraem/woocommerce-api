const ApplicationException = require('./applicationException');
const { ResponseStatusCodes } = require('./../constants/responseStatusCodes');
const { ResponseCommonMessages } = require('./../constants/responseCommonMessages');
class PageNotFoundException extends ApplicationException {
	constructor(msg) {
		super(msg || ResponseCommonMessages.NOT_FOUND, ResponseStatusCodes.NOT_FOUND);
	}
}
module.exports = PageNotFoundException;