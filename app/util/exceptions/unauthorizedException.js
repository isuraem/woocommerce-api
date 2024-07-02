const ApplicationException = require('./applicationException');
const { ResponseStatusCodes } = require('./../constants/responseStatusCodes');
const { ResponseCommonMessages } = require('./../constants/responseCommonMessages');
class UnauthorizedException extends ApplicationException {
	constructor(msg) {
		super(msg || ResponseCommonMessages.UNAUTHORIZED, ResponseStatusCodes.UNAUTHORIZED);
	}
}
module.exports = UnauthorizedException;