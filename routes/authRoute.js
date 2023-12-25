const express=require("express");
const {createUser, loginUserCtrl, getallUser, getaUser, deleteaUser, updateaUser, blockUser, unblockUser, handleRefreshToken, logout, updatePassword, forgotPasswordToken, resetPassword, loginAdmin, getWishlist, saveAddress, userCart, getUserCart, createOrder, removeProductFromCart, updateProductQuantityFromCart}=require("../controller/userCtrl");
const {authMiddleware, isAdmin} = require("../middlewares/authMiddleware");
const { checkout, paymentVerification } = require("../controller/paymentCtrl");
const router=express.Router();

router.post("/register", createUser);
router.post('/forgot-password-token', forgotPasswordToken);
router.put('/reset-password/:token', resetPassword);
// router.put('/order/update-order/:id', authMiddleware, isAdmin, updateOrderStatus);

router.put('/password', authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/order/checkout", authMiddleware, async (req, res) => {
  try {
    const option = {
      amount: 5000,
      currency: "INR",
    };
    const order = await instance.orders.create(option);
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
router.post("/order/paymentVerification", authMiddleware, paymentVerification);
// router.post("/cart/applycoupon", authMiddleware, applyCoupon);
router.post("/cart/create-order", authMiddleware, createOrder);
router.get('/all-users', getallUser);
// router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
// router.get("/getorderbyuser/:id", authMiddleware, isAdmin, getAllOrders);
// router.get('/get-order', authMiddleware, getOrders);
router.get('/refresh', handleRefreshToken);
router.get('/logout', logout);
router.get('/wishlist', authMiddleware, getWishlist);
router.get("/cart", authMiddleware, getUserCart);

router.get('/:id', authMiddleware, isAdmin, getaUser);
router.delete("/delete-product-cart/:cartItemId", authMiddleware, removeProductFromCart);
router.delete("/update-product-cart/:cartItemId/:newQuantity", authMiddleware, updateProductQuantityFromCart);
// router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete('/:id', deleteaUser);

router.put('/edit-user', authMiddleware, updateaUser);
router.put('/save-address', authMiddleware, saveAddress);
router.put('/block-user/:id', authMiddleware, isAdmin, blockUser);
router.put('/unblock-user/:id', authMiddleware, isAdmin, unblockUser);



module.exports=router;