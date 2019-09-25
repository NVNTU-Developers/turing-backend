/**
 * The controller defined below is the attribute controller, highlighted below are the functions of each static method
 * in the controller
 *  Some methods needs to be implemented from scratch while others may contain one or two bugs
 *
 * - getAllAttributes - This method should return an array of all attributes
 * - getSingleAttribute - This method should return a single attribute using the attribute_id in the request parameter
 * - getAttributeValues - This method should return an array of all attribute values of a single attribute using the attribute id
 * - getProductAttributes - This method should return an array of all the product attributes
 * NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { AttributeValue, Attribute, Product } from '../database/models';

class AttributeController {
  /**
   * This method get all attributes
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAllAttributes(req, res, next) {
    try {
      const attributes = await Attribute.findAll();
      return res.status(200).json(attributes);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method gets a single attribute using the attribute id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getSingleAttribute(req, res, next) {
    const { attribute_id } = req.params; // eslint-disable-line
    try {
      const attribute = await Attribute.findByPk(attribute_id);
      if (attribute) {
        return res.status(200).json(attribute);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Department with id ${attribute_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method gets a list attribute values in an attribute using the attribute id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAttributeValues(req, res, next) {
    const { attribute_id } = req.params;  // eslint-disable-line
    try {
      const attribute = await Attribute.findByPk(attribute_id, {
        include: {
          model: AttributeValue,
        },
      });
      return res.status(200).json(attribute.AttributeValues);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method gets a list attribute values in a product using the product id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getProductAttributes(req, res, next) {
    const { product_id } = req.params;  // eslint-disable-line
    try {
      const product = await Product.findByPk(product_id, {
        include: {
          model: AttributeValue,
          as: 'attributes',
        },
      });
      return res.status(200).json(product.attributes);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }
}

export default AttributeController;
