const winston = require('winston');

const logger = winston.createLogger({
  level: 'info', // Can be 'debug', 'info', 'warn', 'error' 
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ level, message, timestamp }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(), // Logs to terminal
    new winston.transports.File({ filename: 'logs/server.log' }), // Logs to file
  ],
});

module.exports = logger;
