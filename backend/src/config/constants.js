/**
 * Application Constants
 * Centralized constant values used throughout the application
 */

const USER_ROLES = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    OFFICE_BOY: 'office_boy',
};

const ORDER_STATUS = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    CANCELLED: 'cancelled',
};

const BEVERAGE_CATEGORIES = {
    COFFEE: 'coffee',
    TEA: 'tea',
    JUICE: 'juice',
    SMOOTHIE: 'smoothie',
    OTHER: 'other',
};

const CAFFEINE_LEVELS = {
    NONE: 'none',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};

const CUP_SIZES = {
    SMALL: 'small',
    LARGE: 'large',
};

const SUGAR_QUANTITIES = {
    NONE: 'none',
    ONE: '1',
    TWO: '2',
    THREE: '3',
};

const TRANSACTION_TYPES = {
    STOCK_IN: 'stock_in',
    STOCK_OUT: 'stock_out',
    ORDER_DEDUCTION: 'order_deduction',
    ADJUSTMENT: 'adjustment',
};

const STOCK_STATUS = {
    IN_STOCK: 'in',
    LOW_STOCK: 'low',
    OUT_OF_STOCK: 'out',
};

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
};

const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};

module.exports = {
    USER_ROLES,
    ORDER_STATUS,
    BEVERAGE_CATEGORIES,
    CAFFEINE_LEVELS,
    CUP_SIZES,
    SUGAR_QUANTITIES,
    TRANSACTION_TYPES,
    STOCK_STATUS,
    HTTP_STATUS,
    PAGINATION,
};
