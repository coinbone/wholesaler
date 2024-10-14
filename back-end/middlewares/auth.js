const JWTService = require('../services/jwtservices');
const User = require('../models/users');
const UserDTO = require('../dto/userdto');

const auth = async (req, res, next) => {
    try {
        // 1. Validation of refreshToken, accessToken
        const { refreshToken, accessToken } = req.cookies;
        console.log('Cookies:', req.cookies); // Log cookies

        if (!refreshToken || !accessToken) {
            console.error('Missing tokens'); // Log missing tokens
            const error = {
                status: 401,
                message: 'Unauthorized'
            };
            return next(error);
        }

        let _id;
        try {
            // Verify the access token and extract the user ID
            const decodedToken = JWTService.verifyAccessToken(accessToken);
            console.log('Decoded Token:', decodedToken); // Log decoded token
            _id = decodedToken._id;
        } catch (error) {
            console.error('Invalid access token:', error.message); // Log invalid token error
            const err = {
                status: 401,
                message: 'Invalid access token'
            };
            return next(err);
        }

        let user;
        try {
            // Find the user by ID
            user = await User.findOne({ _id });
            console.log('User:', user); // Log user

            if (!user) {
                const error = {
                    status: 404,
                    message: 'User not found'
                };
                return next(error);
            }
        } catch (error) {
            console.error('Database error:', error.message); // Log database error
            return next(error);
        }

        // Create a user DTO and attach it to the request
        const userDto = new UserDTO(user);
        req.user = userDto;
        console.log('User DTO:', userDto); // Log user DTO

        next();
    } catch (error) {
        console.error('Unexpected error:', error.message); // Log unexpected error
        return next(error);
    }
};

module.exports = auth;
