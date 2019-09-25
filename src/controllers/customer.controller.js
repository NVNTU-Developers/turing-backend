/**
 * Customer controller handles all requests that has to do with customer
 * Some methods needs to be implemented from scratch while others may contain one or two bugs
 *
 * - create - allow customers to create a new account
 * - login - allow customers to login to their account
 * - loginFacebook - allow customers to login to their account by facebook
 * - getCustomerProfile - allow customers to view their profile info
 * - updateCustomerProfile - allow customers to update their profile info like name, email, password, day_phone, eve_phone and mob_phone
 * - updateCustomerAddress - allow customers to update their address info
 * - updateCreditCard - allow customers to update their credit card number
 *
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { FB } from 'fb';
import { Customer } from '../database/models';
import { generateToken, checkToken } from '../utils';
/**
 *
 *
 * @class CustomerController
 */
class CustomerController {
  /**
   * create a customer record
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, customer data and access token
   * @memberof CustomerController
   */
  static async create(req, res, next) {
    try {
      const { email, password, name } = req.body;
      // Check Email and Password
      if (!email || !password || password.length < 8)
        return res.status(400).json({
          error: {
            status: 400,
            code: 'USR_01',
            message: 'Email or Password is invalid',
            field: 'email, password',
          },
        });
      if (!name)
        return res.status(400).json({
          error: {
            status: 400,
            code: 'USR_02',
            message: 'The field(s) are/is required.',
            field: 'name',
          },
        });
      // Validate email
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        return res.status(400).json({
          error: {
            status: 400,
            code: 'USR_03',
            message: 'The email is invalid.',
            field: 'email',
          },
        });
      // Check exist customer
      const customer = await Customer.findOne({ where: { email } });
      if (customer)
        return res.status(400).json({
          error: {
            status: 400,
            code: 'USR_04',
            message: 'The email already exists.',
            field: 'email',
          },
        });
      if (name.length > 50)
        return res.status(400).json({
          error: {
            status: 400,
            code: 'USR_07',
            message: `This is too long ${name}.`,
            field: 'name',
          },
        });
      // Create new customer
      const newCustomer = await Customer.create({ ...req.body });
      // Remove unnecessary information
      return res.status(200).json(newCustomer.getSafeDataValues());
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * log in a customer
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, and access token
   * @memberof CustomerController
   */
  static async login(req, res, next) {
    // implement function to login to user account
    try {
      const expiresIn = 60 * 60 * 24 * 1000; // 1 day
      const { email, password } = req.body;
      if (!email || !password || password.length < 8)
        return res.status(404).json({
          error: {
            status: 400,
            code: 'USR_01',
            message: 'Email or Password is invalid',
            field: 'email, password',
          },
        });
      const customer = await Customer.findOne({
        where: { email },
      });
      if (!customer) return next('Could not find your email in our system');
      if (!customer.validatePassword(password)) return next('Your email or password is incorrect');
      const userInfo = customer.getSafeDataValues();
      generateToken(userInfo.customer_id, (accessToken) => {
        return res.status(200).json({
          customer: userInfo,
          accessToken,
          expiresIn,
        });
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * log in a customer by facebook
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, and access token
   * @memberof CustomerController
   */
  static async loginFacebook(req, res, next) {
    // implement function to login to user account
    try {
      const expiresIn = 60 * 60 * 24 * 1000; // 1 day
      const { fbToken } = req.body;
      if (!fbToken) return next('Facebook token is invalid!');
      const FBUserData = await FB.api('me', {
        fields: 'id,email,name,gender,picture,link',
        access_token: fbToken,
      });
      let userInfo = {};
      // Check user exist
      const customer = await Customer.findOne({ where: { email: FBUserData.email } });
      if (customer) {
        userInfo = customer;
      } else {
        userInfo = await Customer.create({
          email: FBUserData.email,
          password: '<8Chars',
          name: FBUserData.name,
        });
      }
      // Generate Token
      generateToken(userInfo.customer_id, (accessToken) => {
        return res.status(200).json({
          customer: userInfo.getSafeDataValues(),
          accessToken,
          expiresIn,
        });
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * get customer profile data
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async getCustomerProfile(req, res, next) {
    // fix the bugs in this code
    try {
      const { customer_id } = await checkToken(req);
      const objCustomer = await Customer.findByPk(customer_id);
      return res.status(200).json(objCustomer.getSafeDataValues());
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * update customer profile data such as name, email, password, day_phone, eve_phone and mob_phone
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCustomerProfile(req, res, next) {
    try {
      const acceptUpdateFields = ['email', 'name', 'day_phone', 'eve_phone', 'mob_phone'];
      // better we create a separate api to update password
      const { customer_id } = await checkToken(req);
      const objCustomer = await Customer.findByPk(customer_id);
      const updateData = {};
      acceptUpdateFields.forEach(item => {
        if (req.body[item]) {
          updateData[item] = req.body[item];
        }
      });
      const objNewCustomer = await objCustomer.update(updateData);
      return res.status(200).json(objNewCustomer.getSafeDataValues());
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * update customer profile data such as address_1, address_2, city, region, postal_code, country and shipping_region_id
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCustomerAddress(req, res, next) {
    try {
      const acceptUpdateFields = ['address_1', 'address_2', 'region', 'postal_code', 'country', 'shipping_region_id'];
      const { customer_id } = await checkToken(req);
      const objCustomer = await Customer.findByPk(customer_id);
      const updateData = {};
      acceptUpdateFields.forEach(item => {
        if (req.body[item]) {
          updateData[item] = req.body[item];
        }
      });
      const objNewCustomer = await objCustomer.update(updateData);
      return res.status(200).json(objNewCustomer.getSafeDataValues());
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * update customer credit card
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCreditCard(req, res, next) {
    // write code to update customer credit card number
    try {
      const { credit_card } = req.body;

      const { customer_id } = await checkToken(req);
      const objCustomer = await Customer.findByPk(customer_id);
      const objNewCustomer = await objCustomer.update({ credit_card });
      return res.status(200).json(objNewCustomer.getSafeDataValues());
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }
}

export default CustomerController;
