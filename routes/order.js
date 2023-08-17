const express = require('express')
const router = express.Router();

const {
    newOrder,
    getSingleOrder,
    myOrders,
    allOrders,
    updateOrder,
    deleteOrder,
    sellerOrders

} = require('../controllers/orderController')

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authMiddleware')



//order user 
router.route('/order/new').post(isAuthenticatedUser, newOrder);
router.route('/order/:id').get(isAuthenticatedUser, getSingleOrder);
router.route('/orders/me').get(isAuthenticatedUser, myOrders);


//seller orders 
router.route('/seller/orders/me').get (isAuthenticatedUser, sellerOrders); 
router.route('/seller/order/:id').put(isAuthenticatedUser, updateOrder); 




router.route('/admin/orders/').get(isAuthenticatedUser,  allOrders);
router.route('/admin/order/:id')
    .put(isAuthenticatedUser,  updateOrder)
    .delete(isAuthenticatedUser,  deleteOrder);

module.exports = router;