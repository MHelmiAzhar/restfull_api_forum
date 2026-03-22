import jwt from 'jsonwebtoken';
import config from '../../../Commons/config.js';
import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';

const authentication = (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw new AuthenticationError('Missing authentication');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AuthenticationError('invalid authentication format');
    }

    const payload = jwt.verify(token, config.auth.accessTokenKey);
    req.auth = payload;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
      return;
    }

    next(new AuthenticationError('access token tidak valid'));
  }
};

export default authentication;
