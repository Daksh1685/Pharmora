const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    
    if (!req.user) {
      return next(new AppError('Please authenticate first', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt: ${req.user.email} (${req.user.role}) tried to access ${req.method} ${req.path}`
      );

      return next(
        new AppError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    logger.debug(
      `Authorization granted: ${req.user.email} (${req.user.role}) accessing ${req.method} ${req.path}`
    );

    next();
  };
};

const adminOnly = authorize('admin', 'staff');

const adminOrPharmacist = authorize('admin', 'pharmacist', 'staff');

const authenticated = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Please authenticate first', 401));
  }
  next();
};

module.exports = {
  authorize,
  adminOnly,
  adminOrPharmacist,
  authenticated,
};
