/**
 * The Product controller contains all static methods that handles product request
 * Some methods work fine, some needs to be implemented from scratch while others may contain one or two bugs
 * The static methods and their function include:
 *
 * - getAllProducts - Return a paginated list of products
 * - searchProducts - Returns a list of product that matches the search query string
 * - getProductsByCategory - Returns all products in a product category
 * - getProductsByDepartment - Returns a list of products in a particular department
 * - getSingleProduct - Returns a single product with a matched id in the request params
 * - getAllDepartments - Returns a list of all product departments
 * - getDepartment - Returns a single department
 * - getAllCategories - Returns all categories
 * - getSingleCategory - Returns a single category
 * - getDepartmentCategories - Returns all categories in a department
 * - getProductCategory - Return all categories of a product
 * - getProductReviews - Return all review of a product
 * - createProductReview - Create a review for a product
 *
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { checkToken } from '../utils';
import {
  Product,
  Department,
  Category,
  Review,
  Customer,
  AttributeValue,
  Sequelize,
  sequelize,
} from '../database/models';

const { Op } = Sequelize;

/**
 *
 *
 * @class ProductController
 */
class ProductController {
  /**
   * get all products
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getAllProducts(req, res, next) {
    const { query } = req;
    let { page, limit, where, conditions } = query;
    page = parseInt(page, 0) || 1;
    limit = parseInt(limit, 0) || 20;
    let sqlQueryMap = {
      limit,
      offset: (page - 1) * limit,
    };
    if (where) {
      where = JSON.parse(decodeURIComponent(where));
      if (where.department_id && !where.category_id) {
        sqlQueryMap = {
          ...sqlQueryMap,
          include: {
            model: Category,
            where: {
              department_id: where.department_id,
            },
          },
        };
      }
      if (where.category_id) {
        sqlQueryMap = {
          ...sqlQueryMap,
          include: {
            model: Category,
            where: {
              category_id: where.category_id,
            },
          },
        };
      }
    }
    if (conditions) {
      conditions = JSON.parse(decodeURIComponent(conditions));
      if (conditions.discounted_price) {
        sqlQueryMap = {
          ...sqlQueryMap,
          where: {
            discounted_price: {
              [Op.between]: conditions.discounted_price.between,
            },
          },
        };
      }
      if (conditions.name) {
        sqlQueryMap = {
          ...sqlQueryMap,
          where: {
            ...sqlQueryMap.where,
            name: {
              [Op.like]: `%${conditions.name}%`.split('"').join(''),
            },
          },
        };
      }
    }
    try {
      console.log('sqlQueryMap', sqlQueryMap);
      const products = await Product.findAndCountAll(sqlQueryMap);
      return res.status(200).json({
        paginationMeta: {
          currentPage: page,
          currentPageSize: limit,
          totalPages: Math.ceil(products.count / limit),
          totalRecords: products.count,
        },
        rows: products.rows,
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * get all products
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getSizeColorRange(req, res, next) {
    const { query } = req;
    let { where } = query;
    try {
      if (where) {
        where = JSON.parse(decodeURIComponent(where));
        if (where.department_id && !where.category_id) {
          const sizes = await sequelize.query(`
          select distinct(attribute_value.value) from product, product_attribute, attribute_value, attribute, category, product_category, department
          where department.department_id=${where.department_id}
          and attribute.name='Size'
          and product.product_id = product_attribute.product_id
          and product_attribute.attribute_value_id = attribute_value.attribute_value_id
          and attribute.attribute_id = attribute_value.attribute_id
          and product_category.product_id = product.product_id
          and product_category.category_id = category.category_id
          and department.department_id = category.department_id;
          `);
          const colors = await sequelize.query(`
          select distinct(attribute_value.value) from product, product_attribute, attribute_value, attribute, category, product_category, department
          where department.department_id=${where.department_id}
          and attribute.name='Color'
          and product.product_id = product_attribute.product_id
          and product_attribute.attribute_value_id = attribute_value.attribute_value_id
          and attribute.attribute_id = attribute_value.attribute_id
          and product_category.product_id = product.product_id
          and product_category.category_id = category.category_id
          and department.department_id = category.department_id;
          `);
          return res.status(200).json({ sizes: sizes[0], colors: colors[0] });
        }
        if (where.department_id && where.category_id) {
          const sizes = await sequelize.query(`
          select distinct(attribute_value.value) from product, product_attribute, attribute_value, attribute, category, product_category, department
          where department.department_id=${where.department_id}
          and category.category_id=${where.category_id}
          and attribute.name='Size'
          and product.product_id = product_attribute.product_id
          and product_attribute.attribute_value_id = attribute_value.attribute_value_id
          and attribute.attribute_id = attribute_value.attribute_id
          and product_category.product_id = product.product_id
          and product_category.category_id = category.category_id
          and department.department_id = category.department_id;
          `);
          const colors = await sequelize.query(`
          select distinct(attribute_value.value) from product, product_attribute, attribute_value, attribute, category, product_category, department
          where department.department_id=${where.department_id}
          and category.category_id=${where.category_id}
          and attribute.name='Color'
          and product.product_id = product_attribute.product_id
          and product_attribute.attribute_value_id = attribute_value.attribute_value_id
          and attribute.attribute_id = attribute_value.attribute_id
          and product_category.product_id = product.product_id
          and product_category.category_id = category.category_id
          and department.department_id = category.department_id;
          `);
          return res.status(200).json({ sizes: sizes[0], colors: colors[0] });
        }
      } else {
        const sizes = await sequelize.query(`
          select distinct(attribute_value.value)
          from product, product_attribute, attribute_value, attribute
          where product.product_id = product_attribute.product_id
          and product_attribute.attribute_value_id = attribute_value.attribute_value_id
          and attribute.attribute_id = attribute_value.attribute_id
          and attribute.name='Size'`);
        const colors = await sequelize.query(`
          select distinct(attribute_value.value)
          from product, product_attribute, attribute_value, attribute
          where product.product_id = product_attribute.product_id
          and product_attribute.attribute_value_id = attribute_value.attribute_value_id
          and attribute.attribute_id = attribute_value.attribute_id
          and attribute.name='Color'`);
        return res.status(200).json({ sizes: sizes[0], colors: colors[0] });
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * search all products
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async searchProducts(req, res, next) {
    // description_length unclear
    try {
      let { query_string, all_words, page, limit } = req.query;  // eslint-disable-line
      page = parseInt(page, 0) || 0;
      limit = parseInt(limit, 0) || 20;
      const sqlQueryMap = {
        limit,
        offset: (page - 1) * limit,
      };
      if (all_words && all_words === 'on') {
        sqlQueryMap.where = {
          name: {
            [Op.like]: `% ${query_string} %`.split('"').join(''), // Return if product name contain this word
          },
        };
      } else {
        sqlQueryMap.where = {
          name: {
            [Op.like]: `%${query_string}%`.split('"').join(''), // Return if product name contain this characters
          },
        };
      }
      const products = await Product.findAll(sqlQueryMap);
      return res.status(200).json({
        rows: products,
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * get all products by caetgory
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getProductsByCategory(req, res, next) {
    try {
      const { category_id } = req.params; // eslint-disable-line
      let { page, limit } = req.query;
      page = parseInt(page, 0) || 0;
      limit = parseInt(limit, 0) || 20;

      const products = await Product.findAll({
        include: [
          {
            model: Category,
            where: {
              category_id,
            },
          },
        ],
        limit,
        offset: page,
      });
      return res.status(200).json({
        rows: products,
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * get all products by department
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getProductsByDepartment(req, res, next) {
    try {
      const { department_id } = req.params; // eslint-disable-line
      let { page, limit } = req.query;
      page = parseInt(page, 0) || 0;
      limit = parseInt(limit, 0) || 20;

      const products = await Product.findAll({
        include: [
          {
            model: Category,
            include: {
              model: Department,
              where: {
                department_id,
              },
            },
          },
        ],
        limit,
        offset: page,
      });
      return res.status(200).json({
        rows: products,
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * get single product details
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product details
   * @memberof ProductController
   */
  static async getSingleProduct(req, res, next) {
    const { product_id } = req.params;  // eslint-disable-line
    try {
      const product = await Product.findByPk(product_id);
      if (product) {
        return res.status(200).json(product);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Product with id ${product_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * get single product details
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product details
   * @memberof ProductController
   */
  static async getProductLocations(req, res, next) {
    const { product_id } = req.params;  // eslint-disable-line
    try {
      const product = await Product.findByPk(product_id, {
        include: {
          model: Category,
          include: {
            model: Department,
          },
        },
      });
      if (product) {
        const categories = product.Categories;
        const returnObject = categories.map(cat => {
          return {
            category_id: cat.category_id,
            category_name: cat.name,
            department_id: cat.Department.department_id,
            department_name: cat.Department.name,
          };
        });
        return res.status(200).json(returnObject);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Product with id ${product_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * get all departments
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and department list
   * @memberof ProductController
   */
  static async getAllDepartments(req, res, next) {
    try {
      const departments = await Department.findAll();
      return res.status(200).json(departments);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * Get a single department
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getDepartment(req, res, next) {
    const { department_id } = req.params; // eslint-disable-line
    if (!parseInt(department_id, 1))
      return res.status(400).json({
        error: {
          status: 400,
          code: 'DEP_01',
          message: 'This ID is not a number',
        },
      });
    try {
      const department = await Department.findByPk(department_id);
      if (department) {
        return res.status(200).json(department);
      }
      return res.status(400).json({
        error: {
          status: 400,
          code: 'DEP_02',
          message: `Don't exist department with this ID.`,
        },
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method should get all categories
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAllCategories(req, res, next) {
    try {
      const categories = await Category.findAll();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method should get a single category using the categoryId
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getSingleCategory(req, res, next) {
    const { category_id } = req.params;  // eslint-disable-line
    try {
      const category = await Category.findByPk(category_id);
      if (category) {
        return res.status(200).json(category);
      }
      return res.status(400).json({
        error: {
          status: 400,
          code: 'CAT_01',
          message: `Don't exist category with this ID.`,
        },
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method should get list categories(not single as the API Document) of a particular product
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getProductCategory(req, res, next) {
    const { product_id } = req.params;  // eslint-disable-line
    try {
      const product = await Product.findByPk(product_id, {
        include: {
          model: Category,
        },
      });
      return res.status(200).json(product.Categories);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method should get list of categories in a department
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getDepartmentCategories(req, res, next) {
    const { department_id } = req.params;  // eslint-disable-line
    try {
      const department = await Department.findByPk(department_id, {
        include: {
          model: Category,
        },
      });
      return res.status(200).json(department.Categories);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method should get list of reviews in a product
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getProductReviews(req, res, next) {
    const { product_id } = req.params;  // eslint-disable-line
    try {
      const product = await Product.findByPk(product_id, {
        include: {
          model: Review,
          include: {
            model: Customer,
            attributes: ['name'],
          },
        },
      });
      const reviews = product.Reviews.map(item => {
        return {
          name: item.Customer.name,
          review: item.review,
          rating: item.rating,
          created_on: item.created_on,
        };
      })
      return res.status(200).json(reviews);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method to use create a review for a product
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async createProductReview(req, res, next) {
    const { product_id } = req.params;  // eslint-disable-line
    try {
      const { customer_id } = await checkToken(req);
      const data = {
        ...req.body,
        product_id,
        customer_id,
      };
      const review = await Review.create(data);
      return res.status(201).json(review);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }

  /**
   * This method should get list of categories in a department
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getDepartmentAndCategory(req, res, next) {
    try {
      const departments = await Department.findAll({
        include: {
          model: Category,
        },
      });
      return res.status(200).json(departments);
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  }
}

export default ProductController;
