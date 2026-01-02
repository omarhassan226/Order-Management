/**
 * Auth Service
 * Business logic for authentication
 */

const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const userSessionRepository = require('../repositories/userSession.repository');
const { AuthenticationError } = require('../utils/error.util');
const logger = require('../utils/logger.util');
const env = require('../config/env');

class AuthService {
    /**
     * Login user with username and password
     */
    async login(username, password, ipAddress = null, userAgent = null) {
        try {
            // Find user by username
            const user = await userRepository.findByUsername(username);

            if (!user || !user.is_active) {
                throw new AuthenticationError('Invalid credentials');
            }

            // Verify password
            const isValidPassword = await user.verifyPassword(password);
            if (!isValidPassword) {
                throw new AuthenticationError('Invalid credentials');
            }

            // Update last login
            await user.updateLastLogin();

            // Create session tracking
            const session = await userSessionRepository.createSession(
                user._id,
                ipAddress,
                userAgent
            );

            // Generate JWT token with session id
            const token = this.generateToken(user, session._id);

            logger.info(`User ${username} logged in successfully`);

            return {
                token,
                user: user.toSafeObject(),
                sessionId: session._id
            };
        } catch (error) {
            if (error instanceof AuthenticationError) throw error;
            logger.error('Login error:', error);
            throw new AuthenticationError('Login failed');
        }
    }

    /**
     * Logout user and end session
     */
    async logout(userId, sessionId = null) {
        try {
            // If sessionId is provided, end that specific session
            if (sessionId) {
                await userSessionRepository.endSession(sessionId);
            } else {
                // Otherwise end all active sessions for the user
                await userSessionRepository.endAllUserSessions(userId);
            }

            logger.info(`User ${userId} logged out successfully`);
            return { success: true };
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    /**
     * Generate JWT token for user
     */
    generateToken(user, sessionId = null) {
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role,
            sessionId: sessionId
        };

        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
        });
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, env.JWT_SECRET);
        } catch (error) {
            throw new AuthenticationError('Invalid or expired token');
        }
    }

    /**
     * Get current user from token
     */
    async getCurrentUser(userId) {
        try {
            const user = await userRepository.findById(userId);
            return user.toSafeObject();
        } catch (error) {
            throw new AuthenticationError('User not found');
        }
    }
}

module.exports = new AuthService();
