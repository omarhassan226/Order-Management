/**
 * UserSession Model
 * Tracks user login/logout activity
 */

const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    login_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    logout_time: {
      type: Date,
      default: null,
    },
    session_duration: {
      type: Number, // in minutes
      default: null,
    },
    ip_address: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
userSessionSchema.index({ user_id: 1, login_time: -1 });
userSessionSchema.index({ is_active: 1 });

/**
 * Calculate and update session duration
 */
userSessionSchema.methods.endSession = async function () {
  this.logout_time = new Date();
  this.is_active = false;

  // Calculate duration in minutes
  const durationMs = this.logout_time - this.login_time;
  this.session_duration = Math.round(durationMs / 1000 / 60); // Convert to minutes

  await this.save();
  return this;
};

/**
 * Static method to get active sessions by user
 */
userSessionSchema.statics.getActiveSessions = async function (userId) {
  return await this.find({
    user_id: userId,
    is_active: true,
  }).sort({ login_time: -1 });
};

/**
 * Static method to end all active sessions for a user
 */
userSessionSchema.statics.endAllUserSessions = async function (userId) {
  const sessions = await this.find({
    user_id: userId,
    is_active: true,
  });

  for (const session of sessions) {
    await session.endSession();
  }

  return sessions;
};

const UserSession = mongoose.model("UserSession", userSessionSchema);

module.exports = UserSession;
