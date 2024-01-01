const catchAsyncError = require("../middlewares/catchAsyncError");
const User = require("../models/userModel");
const sendEmail = require("../utils/email");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwt");
const crypto = require("crypto");

// register new user   -   /api/v1/register
exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  let avatar;
  if (req.file) {
    avatar = `${process.env.BACKEND_URL}/uploads/user/${req.file.originalname}`;
  }

  const user = await User.create({
    name,
    email,
    password,
    avatar,
  });

  sendToken(user, 201, res);
});

// logIn existing user  -  /api/v1/login
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password", 400));
  }

  //finding the user database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  if (!(await user.isValidPassword(password))) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  sendToken(user, 201, res);
});

// LogOut user     - /api/v1/logout
exports.logoutUser = (req, res, next) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .status(200)
    .json({
      success: true,
      message: "Logged Out",
    });
};

// forgot password   -  /api/v1/password/forgot
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  // const userEmail = await req.body.email;
  // console.log(userEmail);
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("user not found with this email", 400));
  }

  const resetToken = user.getResetToken();

  console.log(resetToken);
  await user.save({ validateBeforeSave: false });

  //Create reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `Your password reset token url is as follow \n\n
  ${resetUrl}  \n\n If you have not requested email, then ingore it.`;

  try {
    sendEmail({
      email: user.email,
      subject: `Password Recovery`,
      message: message,
    });

    res.status(200).json({
      success: true,
      message: `Email send to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message), 500);
  }
});

// reset password   -   /api/v1/password/reset/:token
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new ErrorHandler("Password reset token is invalid or expired"));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match"));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 201, res);
});

// Get User Profile - /api/v1/myprofile
exports.getUserProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  console.log(req.user.id);
  console.log(user);
  res.status(200).json({
    success: true,
    user,
  });
});

//Change Password - /api/v1/password/change
exports.changePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // Checking old password
  if (!(await user.isValidPassword(req.body.oldPassword))) {
    return next(new ErrorHandler("Old Password is incorrect"));
  }

  //assigning new password
  user.password = req.body.password;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

//Update Profile  -  /api/v1/update
exports.updateProfile = catchAsyncError(async (req, res, next) => {
  let newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  let avatar;
  if (req.file) {
    try {
      avatar = `${process.env.BACKEND_URL}/uploads/user/${req.file.originalname}`;
      newUserData = {...newUserData, avatar}
    } catch (error) {
      console.log(error);
    }
  }


  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
  });
});

//Admin : Get all users -  /api/v1/admin/users/
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

//Admin : Get specific user -  /api/v1/admin/user/:id
exports.getUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User not found with this id : ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Admin : Update user -  /api/v1/admin/user/:id
exports.updateUser = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

//Admin : Delete user -  /api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`user not foud with this id : ${req.params.id}`)
    );
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
  });
});
