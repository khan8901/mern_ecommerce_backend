const express = require("express");
const router = express.Router();

const {
  register,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  allUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  /* getUserProfile,
    updatePassword,
    updateProfile,
    logout,*/
} = require("../controllers/authController");

const { isAuthenticatedUser } = require("../middlewares/authMiddleware");

router.route("/register").post(register);
router.route("/login").post(loginUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset").put(resetPassword);
router.route("/me").get(isAuthenticatedUser, getUserProfile);
router.route("/admin/user/:id").delete(deleteUser);

/* 
router.route('/password/reset').put(resetPassword)

router.route('/logout').get(logout);

router.route('/me').get(isAuthenticatedUser, getUserProfile)
router.route('/password/update').put(isAuthenticatedUser, updatePassword)
router.route('/me/update').put(isAuthenticatedUser, updateProfile)
*/
router.route("/admin/users/:id").put(updateUser);
router.route("/admin/users").get(isAuthenticatedUser, allUsers);
router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, getUserDetails)
  .delete(deleteUser);

module.exports = router;
