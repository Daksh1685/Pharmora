const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  });
};

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email, and password', 400));
  }

  let user = await User.findOne({ email });
  if (user) {
    return next(new AppError('Email already registered', 409));
  }

  user = await User.create({
    name,
    email,
    password,
    role: role || 'staff', 
  });

  const token = generateToken(user._id, user.role);

  user.lastLogin = new Date();
  await user.save();

  logger.info(`User registered successfully: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    statusCode: 201,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPassword: user.hasPassword,
        phone: user.phone,
        address: user.address,
      },
      token,
    },
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('User account is inactive', 403));
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password', 401));
  }

  const token = generateToken(user._id, user.role);

  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in successfully: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    statusCode: 200,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPassword: user.hasPassword,
        phone: user.phone,
        address: user.address,
      },
      token,
    },
  });
});

const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPassword: user.hasPassword,
        phone: user.phone,
        address: user.address
      }
    }
  });
});

const logout = asyncHandler(async (req, res, next) => {
  logger.info(`User logged out: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    statusCode: 200,
    data: null,
  });
});

const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email, phone, address } = req.body;
  const userId = req.user.id;

  if (!name && !email && !phone && !address) {
    return next(new AppError('Please provide at least one field to update', 400));
  }

  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return next(new AppError('Email already in use', 409));
    }
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  logger.info(`User profile updated: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    statusCode: 200,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPassword: user.hasPassword,
        phone: user.phone,
        address: user.address,
      }
    },
  });
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return next(new AppError('Please provide old password and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long', 400));
  }

  const user = await User.findById(userId).select('+password');

  if (user.hasPassword) {
    if (!oldPassword) {
      return next(new AppError('Please provide your old password', 400));
    }
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      return next(new AppError('Old password is incorrect', 401));
    }
  }

  user.password = newPassword;
  user.hasPassword = true; 
  await user.save();

  logger.info(`User password changed: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    statusCode: 200,
    data: null,
  });
});

const googleAuth = asyncHandler(async (req, res, next) => {
  const { email, name, googleId } = req.body;

  if (!email || !name) {
    return next(new AppError('Please provide email and name', 400));
  }

  let user = await User.findOne({ email });

  if (!user) {
    
    user = await User.create({
      name,
      email,
      googleId,
      password: Math.random().toString(36).substring(2, 15), 
      role: 'staff', 
      emailVerified: true, 
      hasPassword: false,
    });
    logger.info(`New user created via Google OAuth: ${email}`);
  } else {
    
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  }

  if (!user.isActive) {
    return next(new AppError('User account is inactive', 403));
  }

  const token = generateToken(user._id, user.role);

  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in via Google: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Google authentication successful',
    statusCode: 200,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPassword: user.hasPassword,
        phone: user.phone,
        address: user.address,
      },
      token,
    },
  });
});

const getDevices = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const currentUserAgent = req.get('user-agent');

  const devices = (user.devices || []).map((device) => {
    
    const isCurrent = device.userAgent === currentUserAgent;
    return {
      ...device.toObject ? device.toObject() : device,
      isCurrent,
    };
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      devices: devices.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive)),
    },
  });
});

const registerDevice = asyncHandler(async (req, res, next) => {
  const { deviceName, deviceType, osName, browserName } = req.body;
  const userId = req.user.id;

  if (!deviceName || !deviceType || !osName || !browserName) {
    return next(new AppError('Please provide deviceName, deviceType, osName, and browserName', 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const device = {
    deviceId: `device-${Date.now()}`,
    deviceName,
    deviceType,
    osName,
    browserName,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    lastActive: new Date(),
    createdAt: new Date(),
  };

  const existingDeviceIndex = user.devices.findIndex(
    (d) => d.browserName === browserName && d.osName === osName && d.deviceType === deviceType
  );

  if (existingDeviceIndex !== -1) {
    
    user.devices[existingDeviceIndex].lastActive = new Date();
  } else {
    
    user.devices.push(device);
  }

  await user.save();

  logger.info(`Device registered for user: ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Device registered successfully',
    statusCode: 201,
    data: {
      device: user.devices[existingDeviceIndex !== -1 ? existingDeviceIndex : user.devices.length - 1],
    },
  });
});

const removeDevice = asyncHandler(async (req, res, next) => {
  const { deviceId } = req.params;
  const userId = req.user.id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.devices = user.devices.filter((device) => device.deviceId !== deviceId);

  await user.save();

  logger.info(`Device removed for user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Device removed successfully',
    statusCode: 200,
    data: null,
  });
});

const removeAllOtherDevices = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const currentDeviceId = req.body.currentDeviceId;

  if (currentDeviceId) {
    user.devices = user.devices.filter((device) => device.deviceId === currentDeviceId);
  } else {
    
    user.devices = [];
  }

  await user.save();

  logger.info(`All other devices removed for user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'All other devices removed successfully',
    statusCode: 200,
    data: null,
  });
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
  googleAuth,
  getDevices,
  registerDevice,
  removeDevice,
  removeAllOtherDevices,
};
