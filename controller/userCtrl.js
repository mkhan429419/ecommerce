const User=require('../models/userModel');
const asyncHandler=require('express-async-handler');
const { generateToken } = require('../config/jwtToken');
const validateMongoDbId = require('../utils/validateMongodbId');

const createUser=asyncHandler(async(req,res)=> {
  const email=req.body.email;
  const findUser=await User.findOne({email:email});
  if (!findUser) {
    //Create new user
    const newUser=await User.create(req.body);
    res.json(newUser);
  } else {
    //User already exists
    throw new Error("User Already Exists");
  }
});

const loginUserCtrl=asyncHandler(async(req,res)=>{
  const {email,password}=req.body;
  // check if user exists or not
  const findUser=await User.findOne({email});
  if (findUser && await findUser.isPasswordMatched(password)) {
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token:generateToken(findUser?._id),
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

module.exports={createUser, loginUserCtrl, getallUser, getaUser, deleteaUser, updateaUser, blockUser, unblockUser,};