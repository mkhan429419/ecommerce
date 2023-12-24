const User=require('../models/userModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');
const Order=require('../models/orderModel');
const uniqid=require("uniqid");
const asyncHandler=require('express-async-handler');
const { generateToken } = require('../config/jwtToken');
const validateMongoDbId = require('../utils/validateMongodbId');
const { generateRefreshToken } = require('../config/refreshtoken');
const crypto = require('crypto');
const jwt=require('jsonwebtoken');
const { sendEmail } = require('./emailCtrl');

const createUser=asyncHandler(async(req,res)=> {
  const email=req.body.email;
  const findAdmin=await User.findOne({email:email});
  if (!findAdmin) {
    //Create new user
    const newUser=await User.create(req.body);
    res.json(newUser);
  } else {
    //User already exists
    throw new Error("User Already Exists");
  }
});

const loginUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists or not
    const findUser = await User.findOne({ email });

    if (findUser && (await findUser.isPasswordMatched(password))) {
      const refreshToken = await generateRefreshToken(findUser?._id);
      const updatedUser = await User.findByIdAndUpdate(
        findUser.id,
        { refreshToken },
        { new: true }
      );

      console.log('User:', updatedUser);
      console.log('Refresh Token:', refreshToken);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000,
      });

      res.json({
        _id: updatedUser?._id,
        firstname: updatedUser?.firstname,
        lastname: updatedUser?.lastname,
        email: updatedUser?.email,
        mobile: updatedUser?.mobile,
        token: generateToken(updatedUser?._id),
      });
    } else {
      throw new Error('Invalid Credentials');
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const loginAdmin=asyncHandler(async(req,res)=>{
  const {email,password}=req.body;
  // check if user exists or not
  const findAdmin=await User.findOne({email});
  if (findAdmin.role!=='admin') throw new errorMonitor("Not Authorised")
  if (findAdmin && await findAdmin.isPasswordMatched(password)) {
    const refreshToken=await generateRefreshToken(findAdmin?._id);
    const updateuser=await User.findByIdAndUpdate(findAdmin.id, {
      refreshToken :refreshToken,
    }, {
      new:true,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly:true,
      maxAge:72*60*60*1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token:generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// get all users
const getallUser=asyncHandler(async (req, res)=> {
  try {
    const getUsers=await User.find();
    res.json(getUsers);
  }
  catch (error) {
    throw new Error(error);
  }
});

// get a single user

const getaUser=asyncHandler(async(req, res)=> {
  const{id}=req.params;
  validateMongoDbId(id);
  try {
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    })
  }
  catch (error) {
    throw new Error(error);
  }
});

//delete a user 

const deleteaUser=asyncHandler(async(req, res)=> {
  const{id}=req.params;
  validateMongoDbId(id);
  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    })
  }
  catch (error) {
    throw new Error(error);
  }
});

//handle refresh tokem

const handleRefreshToken=asyncHandler(async(req,res)=> {
  const cookie=req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken=cookie.refreshToken;
  const user=await User.findOne({refreshToken});
  if (!user) throw new Error("No Refresh Token present in database or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded)=> {
    if (err||user.id!==decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken=generateToken(user?._id);
    res.json({accessToken});
  });
});

// logout

const logout=asyncHandler(async (req,res)=>{
  const cookie=req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken=cookie.refreshToken;
  const user=await User.findOne({refreshToken});
  if (!user) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure:true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findByIdAndUpdate(user._id, {
    refreshToken: "",
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:true,
  });
  res.sendStatus(204); // forbidden
});

//update a user

const updateaUser=asyncHandler(async(req,res)=>{
  const {_id}=req.user;
  validateMongoDbId(_id);
  try {
    const updateUser=await User.findByIdAndUpdate(_id, {
      firstname: req?.body?.firstname,
      lastname:req?.body?.lastname,
      email:req?.body?.email,
      mobile: req?.body?.mobile,
    }, {
      new: true,
    });
    res.json(updateUser);
  }
  catch(error) {
    throw new Error(error);
  }
})

const blockUser=asyncHandler(async(req,res)=>{
  const{id}=req.params;
  validateMongoDbId(id);
  try {
    const block= await User.findByIdAndUpdate(id, {
      isBlocked: true,
    }, {
      new: true,
    });
    res.json(block);
  }
  catch (error) {
    throw new Error(error);
  }
});

const unblockUser=asyncHandler(async(req, res)=> {
  const{id}=req.params;
  validateMongoDbId(id);
  try {
    const unblock=await User.findByIdAndUpdate(id, {
      isBlocked: false,
    }, {
      new: true,
    });
    res.json({
      message: "User unblocked",
      unblock
    });
  }
  catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const newPassword = req.body.password; 
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (newPassword) {
    user.password = newPassword; 
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken=asyncHandler(async(req,res)=> {
  const {email}=req.body;
  const user=await User.findOne({email});
  if (!user) throw new Error("User not found with this email");
  try {
    const token=await user.createPasswordResetToken();
    await user.save();
    const resetURL=`Hi, please follow this link to reset Your Password. This link is valid for 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</a>`;
    const data= {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      html: resetURL
    };
    sendEmail(data);
    res.json(token);
  }
  catch(error) {
    throw new Error(error);
  }
})

const resetPassword=asyncHandler(async(req, res)=> {
  const {password}=req.body;
  const {token}=req.params;
  const hashedToken=crypto.createHash('sha256').update(token).digest('hex');
  const user=await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {$gt: Date.now()},
  })
  if (!user) throw new Error("Token Expired, please try again later.");
  user.password=password;
  user.passwordResetToken=undefined;
  user.passwordResetToken=undefined;
  await user.save();
  res.json(user);
})

const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

const saveAddress=asyncHandler(async (req,res)=>{
  const {_id}=req.user;
  validateMongoDbId(_id);
  try {
    const updateUser=await User.findByIdAndUpdate(_id, {
      address: req?.body?.address,
    }, {
      new: true,
    });
    res.json(updateUser);
  }
  catch(error) {
    throw new Error(error);
  }
})

const userCart = asyncHandler(async (req, res) => {
  const { productId, color, quantity, price } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    let newCart = await new Cart({
      userId: _id,
      productId,
      color,
      price,
      quantity
    }).save();
    res.json(newCart);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const cart = await Cart.find({ userId: _id }).populate(
      "productId"
    ).populate("color");
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const user = await User.findOne({ _id });
    const cart = await Cart.findOneAndDelete({ orderby: user._id });
    
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { coupon } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);

  const validCoupon = await Coupon.findOne({ name: coupon });
  if (!validCoupon) {
    throw new Error("Invalid Coupon");
  }

  const user = await User.findOne({ _id });

  // Use try-catch block to handle potential null value
  try {
    const cartData = await Cart.findOne({ orderby: user._id }).populate("products.product");

    if (!cartData) {
      throw new Error("Cart not found for the user");
    }

    const { cartTotal } = cartData;

    if (cartTotal === null || cartTotal === undefined) {
      throw new Error("Cart total is null or undefined");
    }

    let totalAfterDiscount = (
      cartTotal - (cartTotal * validCoupon.discount) / 100
    ).toFixed(2);

    await Cart.findOneAndUpdate(
      { orderby: user._id },
      { totalAfterDiscount },
      { new: true }
    );

    res.json(totalAfterDiscount);
  } catch (error) {
    throw new Error(error);
  }
});

const createOrder = asyncHandler(async (req, res) => {
  const { COD, couponApplied } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    if (!COD) throw new Error("Create cash order failed");
    const user = await User.findById(_id);
    let userCart = await Cart.findOne({ orderby: user._id });
    let finalAmout = 0;
    if (couponApplied && userCart.totalAfterDiscount) {
      finalAmout = userCart.totalAfterDiscount;
    } else {
      finalAmout = userCart.cartTotal;
    }

    let newOrder = await new Order({
      products: userCart.products,
      paymentIntent: {
        id: uniqid(),
        method: "COD",
        amount: finalAmout,
        status: "Cash on Delivery",
        created: Date.now(),
        currency: "usd",
      },
      orderby: user._id,
      orderStatus: "Cash on Delivery",
    }).save();
    let update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      };
    });
    const updated = await Product.bulkWrite(update, {});
    res.json({ message: "success" });
  } catch (error) {
    throw new Error(error);
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const userorders = await Order.findOne({ orderby: _id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const alluserorders = await Order.find()
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(alluserorders);
  } catch (error) {
    throw new Error(error);
  }
});

const getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const userorders = await Order.findOne({ orderby: id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updateOrderStatus = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus: status,
        paymentIntent: {
          status: status,
        },
      },
      { new: true }
    );
    res.json(updateOrderStatus);
  } catch (error) {
    throw new Error(error);
  }
});

const getMonthWiseOrderIncome=asyncHandler(async(req,res)=>{
  let monthNames=[ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
  let d=new Date();
  let endDate='';
  d.setDate(1)
  for (let index=0;index<11;index++) {
    d.setMonth(d.getMonth()-1);
    endDate=monthNames[d.getMonth()]+" "+d.getFullYear()
    console.log(endDate)
  }

})

module.exports={createUser, loginUserCtrl, getallUser, getaUser, deleteaUser, updateaUser, blockUser, unblockUser, handleRefreshToken, logout, updatePassword, forgotPasswordToken, resetPassword, loginAdmin, getWishlist, saveAddress, userCart, getUserCart, emptyCart, applyCoupon, createOrder, getOrders, getAllOrders, updateOrderStatus, getOrderByUserId, getMonthWiseOrderIncome};