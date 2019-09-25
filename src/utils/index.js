import jwt from 'jsonwebtoken';

const generateToken = (customer_id, next) => {
  const expiresIn = 60 * 60 * 24 * 1000; // 1 day
  const accessToken = jwt.sign({ customer_id }, process.env.JWT_KEY, {
    expiresIn, // expires in 24 hours
  });
  return next(accessToken);
};

const checkToken = req => {
  return new Promise((resolve, reject) => {
    let token = req.headers['user-key'];
    if (token) {
      token = token.slice(7, token.length);
      jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
          return reject({
            status: 400,
            code: 'AUT_02',
            message: 'Access Unauthorized',
          });
        }
        return resolve(decoded);
      });
    } else {
      return reject({
          status: 400,
          code: 'AUT_01',
          message: 'Authorization code is empty',
        },
      );
    }
  });
};

export { checkToken, generateToken };
