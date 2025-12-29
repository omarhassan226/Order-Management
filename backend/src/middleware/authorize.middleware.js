/**
 * Authorization Middleware
 * Role-based access control
 */

const { AuthorizationError } = require('../utils/error.util');
const response = require('../utils/response.util');
const { USER_ROLES } = require('../config/constants');

/**
 * Authorize middleware - checks user roles
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthorizationError('User not authenticated');
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new AuthorizationError('Access forbidden');
            }

            next();
        } catch (error) {
            if (error instanceof AuthorizationError) {
                return response.error(res, error.message, 403);
            }
            return response.error(res, 'Authorization failed', 403);
        }
    };
};

/**
 * Check if user is admin
 */
const isAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Check if user is office boy
 */
const isOfficeBoy = authorize(USER_ROLES.OFFICE_BOY);

/**
 * Check if user is employee
 */
const isEmployee = authorize(USER_ROLES.EMPLOYEE);

/**
 * Check if user is admin or office boy
 */
const isAdminOrOfficeBoy = authorize(USER_ROLES.ADMIN, USER_ROLES.OFFICE_BOY);

module.exports = {
    authorize,
    isAdmin,
    isOfficeBoy,
    isEmployee,
    isAdminOrOfficeBoy,
};
