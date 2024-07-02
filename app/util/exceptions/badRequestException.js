const ApplicationException = require('./applicationException');
const { ResponseStatusCodes } = require('./../constants/responseStatusCodes');
const { ResponseCommonMessages } = require('./../constants/responseCommonMessages');
class BadRequestException extends ApplicationException {
	constructor(msg) {
		super(msg || ResponseCommonMessages.BAD_REQUEST, ResponseStatusCodes.BAD_REQUEST);
	}
}
module.exports = BadRequestException;