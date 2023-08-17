const express = require('express')
const router = express.Router();


const {
    getProducts,
    getAdminProducts,
    newProduct,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductReviews,
    deleteReview, 
    sellerProducts, 
    productliked, 
    productunliked, 
    productviewed, 
    searchProducts, 
    getProductsnew
    

} = require('../controllers/productController')

const { isAuthenticatedUser } = require('../middlewares/authMiddleware');

  
//search rpoducts 
router.route('/search', searchProducts ); 


router.route('/products').get(getProducts);

//new api for getting products  includes pagination too 
router.route('/getproducts').get(getProductsnew);

router.route('/admin/products').get(getAdminProducts);
router.route('/product/:id').get(getSingleProduct);
router.route("/productviewed/:id").put(productviewed); 
router.route('/admin/product/new').post(isAuthenticatedUser,  newProduct);

router.route('/admin/product/:id')
    .put(isAuthenticatedUser,  updateProduct)
    .delete(isAuthenticatedUser,  deleteProduct);

// SELLER ROUTES 
router.route('/sellerproducts/:sellerId/:page').get(isAuthenticatedUser,sellerProducts); 
router.route('/seller-products').get( isAuthenticatedUser,sellerProducts); 
router.route('/seller/product/new').post(isAuthenticatedUser, newProduct); 
router.route('/seller/product/:id') 
      .put(isAuthenticatedUser,updateProduct)
      .delete(isAuthenticatedUser, deleteProduct);  

      // will have to authenticate user ownership with it 
router.route('/review').put(isAuthenticatedUser, createProductReview)
router.route('/reviews').get(isAuthenticatedUser, getProductReviews)
router.route('/reviews').delete(isAuthenticatedUser, deleteReview)
router.route('/productliked').put(isAuthenticatedUser,productliked)
router.route('/productunliked').put(isAuthenticatedUser,productunliked)


module.exports = router;