
/**
 * Tax controller contains methods which are needed for all tax request
 * Implement the functionality for the methods
 *
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { Tax, Sequelize } from '../database/models';

const { Op } = Sequelize;

class TaxController {
  /**
   * This method get all taxes
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAllTax(req, res, next) {
    try {
      const taxs = await Tax.findAll();
      return res.status(200).json(taxs);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method gets a single tax using the tax id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getSingleTax(req, res, next) {
    const { tax_id } = req.params;
    try {
      const tax = await Tax.findByPk(tax_id);
      if (tax) {
        return res.status(200).json(tax);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Tax with id ${tax_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }
}

export default TaxController;
