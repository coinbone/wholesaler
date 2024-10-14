const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = require('../config/index');
const RefreshToken = require('../models/token'); // Ensure correct import

class JWTService {
    // Sign access token
    static signAccessToken(payload, expiryTime) {
        try {
            return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: expiryTime });
        } catch (error) {
            console.error('Error signing access token:', error);
            throw new Error('Unable to sign access token');
        }
    }

    // Sign refresh token
    static signRefreshToken(payload, expiryTime) {
        try {
            return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiryTime });
        } catch (error) {
            console.error('Error signing refresh token:', error);
            throw new Error('Unable to sign refresh token');
        }
    }

    // Verify access token
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, ACCESS_TOKEN_SECRET);
        } catch (error) {
            console.error('Error verifying access token:', error);
            throw new Error('Invalid access token');
        }
    }

    // Verify refresh token
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, REFRESH_TOKEN_SECRET);
        } catch (error) {
            console.error('Error verifying refresh token:', error);
            throw new Error('Invalid refresh token');
        }
    }

    // Store refresh token in database
    static async storeRefreshToken(token, userId) {
        try {
            const newToken = new RefreshToken({
                token,
                userId
            });
            // Store in database
            await newToken.save();
        } catch (error) {
            console.error('Error storing refresh token:', error);
            throw new Error('Unable to store refresh token');
        }
    }
}

module.exports = JWTService;
