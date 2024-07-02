const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize,simple} = format;

const BadRequestException = require('../exceptions/badRequestException');
const UnauthorizedException = require('../exceptions/unauthorizedException');
 
const logger = createLogger({
	format: combine(
		timestamp(),
		colorize(),
		simple()
	),
	transports: [new transports.Console()]
});

module.exports = {
	log: async function(action,user_id,identification_string,exception) {
		if (exception instanceof BadRequestException) { 
			logger.log({
				level: 'warn',
				message: action + ' || '+ user_id +' || '+ identification_string +' || bad_request : ' + exception.msg
			});
		}
		else if (exception instanceof UnauthorizedException) { 
			logger.log({
				level: 'warn',
				message: action + ' || '+ user_id +' || '+ identification_string +' || unauthorized_action : ' + exception.msg
			});
		}
		else{
			logger.log({
				level: 'error',
				stack: exception.stack,
				message: action + ' || '+ user_id +' || '+ identification_string +' || server error : '  + exception
			});
		}
	}
};