const { ResponseStatusCodes } = require('./../constants/responseStatusCodes');
const { ResponseCommonMessages } = require('./../constants/responseCommonMessages');

class ApplicationException extends Error {
	constructor(msg, status) {

		super();

		Error.captureStackTrace(this, this.constructor);

		this.name = this.constructor.name;

		this.msg = msg || ResponseCommonMessages.INTERNAL_SERVER_ERROR;

		this.status = status || ResponseStatusCodes.INTERNAL_SERVER_ERROR;
	}

}

module.exports = ApplicationException;