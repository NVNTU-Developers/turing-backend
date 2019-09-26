/* eslint-disable camelcase */
/**
 * Check each method in the shopping cart controller and add code to implement
 * the functionality or fix any bug.
 * The static methods and their function include:
 *
 * - generateUniqueCart - To generate a unique cart id
 * - addItemToCart - To add new product to the cart
 * - getCart - method to get list of items in a cart
 * - updateCartItem - Update the quantity of a product in the shopping cart
 * - emptyCart - should be able to clear shopping cart
 * - removeItemFromCart - should delete a product from the shopping cart
 * - createOrder - Create an order
 * - getOrder - method to get an order with order_id
 * - getCustomerOrders - get all orders of a customer
 * - getOrderSummary - get the details of an order
 * - processStripePayment - process stripe payment
 *
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import async from 'async';
import fetch from 'node-fetch';
import { ShoppingCart, Product, Sequelize, Order, OrderDetail, Customer } from '../database/models';
import { checkToken } from '../utils';

const { Op } = Sequelize;

/**
 *
 *
 * @class shoppingCartController
 */
class ShoppingCartController {
  /**
   * generate random unique id for cart identifier
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart_id
   * @memberof shoppingCartController
   */
  static generateUniqueCart(req, res) {
    const uuidv4 = () => {
      return 'xxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, () =>
        ((Math.random() * 16) | 0).toString(16)
      );
    };
    return res.status(200).json({ cart_id: uuidv4() });
  }

  /**
   * adds item to a cart with cart_id
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async addItemToCart(req, res, next) {
    try {
      const { cart_id, product_id, attributes, quantity } = req.body;

      const checkItem = await ShoppingCart.findOne({ where: { cart_id, product_id } });
      if (checkItem) {
        const updatedItem = await checkItem.update({
          quantity: parseInt(checkItem.quantity, 0) + parseInt(quantity, 0),
        });
        return res.status(201).json(updatedItem);
      }
      const cartItem = await ShoppingCart.create({
        cart_id,
        product_id,
        attributes,
        quantity: parseInt(quantity, 0),
      });
      return res.status(201).json(cartItem);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * get shopping cart using the cart_id
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async getCart(req, res, next) {
    const { cart_id } = req.params;  // eslint-disable-line
    try {
      const products = await ShoppingCart.findAll({
        where: { cart_id },
        include: { model: Product },
      });
      const returnProducts = products.map(item => {
        return {
          item_id: item.item_id,
          cart_id: item.cart_id,
          name: item.Product.name,
          attributes: item.attributes,
          product_id: item.Product.product_id,
          image: item.Product.image,
          price: item.Product.price,
          discounted_price: item.Product.discounted_price,
          quantity: item.quantity,
          subtotal: parseFloat(item.quantity * parseFloat(item.Product.discounted_price)).toFixed(
            2
          ),
        };
      });
      return res.status(200).json(returnProducts);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * update cart item quantity using the item_id in the request param
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async updateCartItem(req, res, next) {
    const { item_id } = req.params // eslint-disable-line
    const { quantity } = req.body;
    try {
      const cartItem = await ShoppingCart.findByPk(item_id);
      if (cartItem) {
        const updatedCartItem = await cartItem.update({ quantity });
        return res.status(200).json(updatedCartItem);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Cart item with id ${item_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * removes all items in a cart
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async emptyCart(req, res, next) {
    // implement method to empty cart
    const { cart_id } = req.params;
    try {
      const rowDeleted = await ShoppingCart.destroy({ where: { cart_id } });
      if (rowDeleted > 0) {
        return res.status(200).json([]);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `cart_id ${cart_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * remove single item from cart
   * cart id is obtained from current session
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with message
   * @memberof ShoppingCartController
   */
  static async removeItemFromCart(req, res, next) {
    const { item_id } = req.params;
    try {
      const rowDeleted = await ShoppingCart.destroy({ where: { item_id } });
      return res.status(200).json({
        message: `Deleted ${rowDeleted} record`,
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * create an order from a cart
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with created order
   * @memberof ShoppingCartController
   */
  static async createOrder(req, res, next) {
    const { cart_id } = req.body;
    try {
      const { customer_id } = await checkToken(req);
      const cartItems = await ShoppingCart.findAll({
        where: { cart_id },
        include: { model: Product },
      });
      const total_amount = cartItems.reduce((preVal, el) => {
        return preVal + (parseFloat(el.Product.discounted_price) > 0 ? parseFloat(el.Product.discounted_price) * el.quantity : parseFloat(el.Product.price) * el.quantity);
      }, 0);
      const newOrder = await Order.create({
        ...req.body,
        total_amount,
        customer_id,
      });
      // Create order detail
      return async.each(
        cartItems,
        (item, cb) => {
          OrderDetail.create({
            order_id: newOrder.order_id,
            product_id: item.Product.product_id,
            attributes: item.attributes,
            product_name: item.Product.name,
            quantity: item.quantity,
            unit_cost: item.Product.discounted_price,
          })
            .then(() => cb())
            .catch(err => cb(err));
        },
        err => {
          if (err) return next(err);
          return res.status(201).json(newOrder.order_id);
        }
      );
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with customer's orders
   * @memberof ShoppingCartController
   */
  static async getOrder(req, res, next) {
    const { order_id } = req.params;  // eslint-disable-line
    try {
      const order = await Order.findByPk(order_id, {
        include: { model: OrderDetail, as: 'orderItems' },
      });
      return res.status(200).json(order);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with customer's orders
   * @memberof ShoppingCartController
   */
  static async getCustomerOrders(req, res, next) {
    const { customer_id } = req.params;  // eslint-disable-line
    try {
      // implement code to get customer order
      const orders = await Order.findAll({ where: { customer_id } });
      return res.status(200).json(orders);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with order summary
   * @memberof ShoppingCartController
   */
  static async getOrderSummary(req, res, next) {
    const { order_id } = req.params;  // eslint-disable-line
    try {
      const order = await Order.findByPk(order_id);
      return res.status(200).json(order);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * @static
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async processStripePayment(req, res, next) {
    const { email, stripeToken, order_id } = req.body; // eslint-disable-line
    try {
      const { customer_id } = await checkToken(req);
      const objCustomer = await Customer.findByPk(customer_id);
      if (objCustomer) {
        const order = await Order.findByPk(order_id);
        const chargeBody = {
          amount: 100 * order.total_amount,
          currency: 'USD',
          source: stripeToken,
          'metadata[order_id]': order_id,
          'metadata[email]': email,
        };
        return fetch('https://api.stripe.com/v1/charges', {
          headers: {
            // Use the correct MIME type for your server
            Accept: 'application/json',
            // Use the correct Content Type to send data to Stripe
            'Content-Type': 'application/x-www-form-urlencoded',
            // Use the Stripe publishable key as Bearer
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
          method: 'post',
          body: Object.keys(chargeBody)
            .map(key => `${key}=${chargeBody[key]}`)
            .join('&'),
        })
          .then(res2 =>
            res2.json().then(returnData => {
              return res.status(200).json(returnData);
            })
          )
          .catch(err => {
            return next(err);
          });
      }
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }
}

export default ShoppingCartController;
