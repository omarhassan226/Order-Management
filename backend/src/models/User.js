/**
 * User Model
 * Defines the User entity with authentication support using Mongoose
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [50, 'Username must be less than 50 characters'],
    },
    password_hash: {
        type: String,
        required: [true, 'Password is required'],
    },
    full_name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    department: {
        type: String,
        trim: true,
        default: null,
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.EMPLOYEE,
        required: true,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    last_login: {
        type: Date,
        default: null,
    },
    work_start_time: {
        type: String,
        default: null,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow null
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Invalid time format. Use HH:MM format (e.g., 09:00)',
        },
    },
    work_end_time: {
        type: String,
        default: null,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow null
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Invalid time format. Use HH:MM format (e.g., 17:00)',
        },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes (username and email indexes are already created by unique: true)
userSchema.index({ role: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password_hash')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

/**
 * Instance method to verify password
 */
userSchema.methods.verifyPassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

/**
 * Instance method to get safe user object (without password)
 */
userSchema.methods.toSafeObject = function () {
    const userObject = this.toObject();
    delete userObject.password_hash;
    return userObject;
};

/**
 * Update last login timestamp
 */
userSchema.methods.updateLastLogin = async function () {
    this.last_login = new Date();
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
