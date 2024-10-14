const Joi = require('joi');
const User = require('../models/users.js');
const bcrypt = require('bcryptjs');
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
const UserDTO = require('../dto/userdto.js');
const JWTService = require('../services/jwtservices.js');
const RefreshToken = require('../models/token.js');

const authController = {
    // Register a new user
    async register(req, res, next) {
        const userRegisterSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            name: Joi.string().max(30),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern).required(),
            confirmPassword: Joi.ref('password')
        });

        const { error } = userRegisterSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { username, email, password, name } = req.body;

        try {
            const emailInUse = await User.exists({ email });
            const usernameInUse = await User.exists({ username });

            if (emailInUse) {
                const error = {
                    status: 409,
                    message: 'Email is already registered'
                };
                return next(error);
            }

            if (usernameInUse) {
                const error = {
                    status: 409,
                    message: 'Username is already taken'
                };
                return next(error);
            }

            // Hash the password
            const hashPassword = await bcrypt.hash(password, 10);

            // Store user data in DB
            const userToRegister = new User({
                username,
                email,
                name,
                password: hashPassword
            });

            const user = await userToRegister.save();

            // Token generation
            const accessToken = JWTService.signAccessToken({ _id: user._id }, '30m');
            const refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');

            // Store refresh token in DB
            await JWTService.storeRefreshToken(refreshToken, user._id);

            // Send tokens in cookies
            res.cookie('accessToken', accessToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });

            res.cookie('refreshToken', refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });

            // Send response
            const userDto = new UserDTO(user);
            return res.status(201).json({ user: userDto, auth: true });
        } catch (error) {
            return next(error);
        }
    },

    // Login a user
    async login(req, res, next) {
        const userLoginSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            password: Joi.string().pattern(passwordPattern).required()
        });

        const { error } = userLoginSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { username, password } = req.body;

        try {
            // Match username
            const user = await User.findOne({ username });

            if (!user) {
                const error = {
                    status: 401,
                    message: 'Invalid username'
                };
                return next(error);
            }

            // Match password
            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                const error = {
                    status: 401,
                    message: 'Invalid password'
                };
                return next(error);
            }

            const accessToken = JWTService.signAccessToken({ _id: user._id }, '30m');
            const refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');

            // Update refresh token in DB
            await RefreshToken.updateOne(
                { _id: user._id },
                { token: refreshToken },
                { upsert: true }
            );

            res.cookie('accessToken', accessToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });

            res.cookie('refreshToken', refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });

            const userDto = new UserDTO(user);
            return res.status(200).json({ user: userDto, auth: true });
        } catch (error) {
            return next(error);
        }
    },

    // Logout a user
    async logout(req, res, next) {
        const { refreshToken } = req.cookies;

        try {
            await RefreshToken.deleteOne({ token: refreshToken });
        } catch (error) {
            return next(error);
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        return res.status(200).send({ user: null, auth: false });
    },

    // Refresh tokens
    async refresh(req, res, next) {
        const originalRefreshToken = req.cookies.refreshToken;

        let id;
        try {
            id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
        } catch (error) {
            const err = {
                status: 401,
                message: 'Unauthorized'
            };
            return next(err);
        }

        try {
            const match = await RefreshToken.findOne({ _id: id, token: originalRefreshToken });

            if (!match) {
                const error = {
                    status: 401,
                    message: 'Unauthorized'
                };
                return next(error);
            }

            const accessToken = JWTService.signAccessToken({ _id: id }, '30m');
            const refreshToken = JWTService.signRefreshToken({ _id: id }, '60m');

            await RefreshToken.updateOne({ _id: id }, { token: refreshToken });

            res.cookie('accessToken', accessToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });

            res.cookie('refreshToken', refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });

            const user = await User.findOne({ _id: id });
            const userDto = new UserDTO(user);

            return res.status(200).json({ user: userDto, auth: true });
        } catch (error) {
            return next(error);
        }
    }
};

module.exports = authController;
