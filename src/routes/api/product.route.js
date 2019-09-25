import { Router } from 'express';
import ProductController from '../../controllers/product.controller';

// These are valid routes but they may contain a bug, please try to define and fix them

const router = Router();
router.get('/products', ProductController.getAllProducts);
router.get('/products/search', ProductController.searchProducts);
router.get('/products/:product_id', ProductController.getSingleProduct);
router.get('/products/:product_id/locations', ProductController.getProductLocations);
router.get('/products/inCategory/:category_id', ProductController.getProductsByCategory);
router.get('/products/inDepartment/:department_id', ProductController.getProductsByDepartment);
router.get('/departments', ProductController.getAllDepartments);
router.get('/departments/:department_id', ProductController.getDepartment);
router.get('/categories', ProductController.getAllCategories);
router.get('/department/andCategories', ProductController.getDepartmentAndCategory);
router.get('/categories/inProduct/:product_id', ProductController.getProductCategory);
router.get('/categories/:category_id', ProductController.getSingleCategory);
router.get('/categories/inDepartment/:department_id', ProductController.getDepartmentCategories);
router.get('/reviews/inProduct/:product_id', ProductController.getProductReviews);
router.post('/products/:product_id/reviews', ProductController.createProductReview);

export default router;
