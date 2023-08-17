const crypto = require("crypto");
const cloudinary = require("cloudinary");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET;

// Register a user   => /api/v1/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    const success = true;

    res.status(201).json({ user, token, success });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login User  =>  /a[i/v1/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const secret = JWT_SECRET;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password is correct
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userId = user._id;

    // Create JWT token
    const token = jwt.sign({ userId }, secret);
    const success = true;

    res.status(200).json({ user, token, success });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot Password   =>  /api/v1/password/forgot
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(("User not found with this email", 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset password url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;

  const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Anokha Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to: ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next((error.message, 500));
  }
};

// Reset Password   =>  /api/v1/password/reset/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, password, resetCode } = req.body;
    // find user based on email and resetCode
    const user = await User.findOne({ email });
    // if user not found
    if (resetCode == user.resetCode) {
      if (!user) {
        return res.json({ error: "Email or reset code is invalid" });
      }

      // if password is short
      if (!password || password.length < 6) {
        return res.json({
          error: "Password is required and should be 6 characters long",
        });
      }
      // hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      user.password = hashedPassword;
      user.resetCode = "";
      user.save();
      return res.json({ ok: true });
    }
  } catch (err) {
    console.log(err);
  }
};

// Get currently logged in user details   =>   /api/v1/me
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.log(err);
  }
};

// Update / Change password   =>  /api/v1/password/update
exports.updatePassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (password && password.length < 6) {
      return res.json({
        error: "Password is required and should be min 6 characters long",
      });
    } else {
      // update db
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const user = await User.findByIdAndUpdate(req.user._id, {
        password: hashedPassword,
      });
      user.password = undefined;
      user.secret = undefined;
      return res.json(user);
    }
  } catch (err) {
    console.log(err);
  }
};
// Update user profile   =>   /api/v1/me/update
exports.updateProfile = async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  // Update avatar

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
};

// Logout user   =>   /api/v1/logout

// Admin Routes

// Get all users   =>   /api/v1/admin/users
exports.allUsers = async (req, res, next) => {
  console.log("Inside all Users");
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
};

// Get user details   =>   /api/v1/admin/user/:id
exports.getUserDetails = async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(`User does not found with id: ${req.params.id}`);
  }

  res.status(200).json({
    success: true,
    user,
  });
};

// Update user profile   =>   /api/v1/admin/user/:id
exports.updateUser = async (req, res, next) => {
 
 
  const newUserData = {
isAdmin:req.body.isAdmin
};



  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user
  });
};

// Delete user   =>   /api/v1/admin/user/:id
exports.deleteUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(`User does not found with id: ${req.params.id}`);
  }

  // Remove avatar from cloudinary
  // const image_id = user.avatar.public_id;
  // await cloudinary.v2.uploader.destroy(image_id);

  await user.remove();

  res.status(200).json({
    success: true,
  });
};
