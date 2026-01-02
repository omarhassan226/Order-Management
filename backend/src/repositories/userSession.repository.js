/**
 * UserSession Repository
 * Data access layer for UserSession model
 */

const BaseRepository = require('./base.repository');
const { UserSession } = require('../models');

class UserSessionRepository extends BaseRepository {
    constructor() {
        super(UserSession);
    }

    /**
     * Create a new session on login
     */
    async createSession(userId, ipAddress = null, userAgent = null) {
        return await this.create({
            user_id: userId,
            login_time: new Date(),
            ip_address: ipAddress,
            user_agent: userAgent,
            is_active: true
        });
    }

    /**
     * End a session on logout
     */
    async endSession(sessionId) {
        const session = await this.findById(sessionId);
        if (session && session.is_active) {
            return await session.endSession();
        }
        return null;
    }

    /**
     * End all active sessions for a user
     */
    async endAllUserSessions(userId) {
        return await UserSession.endAllUserSessions(userId);
    }

    /**
     * Get active sessions for a user
     */
    async getActiveSessions(userId) {
        return await UserSession.getActiveSessions(userId);
    }

    /**
     * Get session history for a user
     */
    async getUserSessionHistory(userId, limit = 50) {
        return await this.model.find({ user_id: userId })
            .populate('user_id', 'full_name email role')
            .sort({ login_time: -1 })
            .limit(limit);
    }

    /**
     * Get sessions by date range
     */
    async getSessionsByDateRange(startDate, endDate) {
        return await this.model.find({
            login_time: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).populate('user_id', 'full_name email role department')
          .sort({ login_time: -1 });
    }

    /**
     * Get employee activity statistics
     */
    async getEmployeeActivityStats(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            const result = await this.model.aggregate([
                {
                    $match: {
                        login_time: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: '$user_id',
                        totalSessions: { $sum: 1 },
                        activeSessions: {
                            $sum: { $cond: ['$is_active', 1, 0] }
                        },
                        totalDuration: { $sum: '$session_duration' },
                        avgDuration: { $avg: '$session_duration' },
                        lastLogin: { $max: '$login_time' },
                        lastLogout: { $max: '$logout_time' }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        user_id: '$_id',
                        'user.full_name': 1,
                        'user.email': 1,
                        'user.role': 1,
                        'user.department': 1,
                        totalSessions: 1,
                        activeSessions: 1,
                        totalDuration: 1,
                        avgDuration: 1,
                        lastLogin: 1,
                        lastLogout: 1
                    }
                },
                { $sort: { totalSessions: -1 } }
            ]);

            return result || [];
        } catch (error) {
            console.error('Error in getEmployeeActivityStats:', error);
            return [];
        }
    }

    /**
     * Get daily login count statistics
     */
    async getDailyLoginStats(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            const result = await this.model.aggregate([
                {
                    $match: {
                        login_time: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$login_time' }
                        },
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$user_id' }
                    }
                },
                {
                    $project: {
                        date: '$_id',
                        loginCount: '$count',
                        uniqueUserCount: { $size: '$uniqueUsers' },
                        _id: 0
                    }
                },
                { $sort: { date: 1 } }
            ]);

            return result || [];
        } catch (error) {
            console.error('Error in getDailyLoginStats:', error);
            return [];
        }
    }

    /**
     * Get currently logged in users
     */
    async getCurrentlyOnlineUsers() {
        return await this.model.find({ is_active: true })
            .populate('user_id', 'full_name email role department')
            .sort({ login_time: -1 });
    }
}

module.exports = new UserSessionRepository();
