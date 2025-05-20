// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, unique: true, sparse: true },
//   phone: { type: String, unique: true, sparse: true },
//   password: String,
// });

// // Password match function
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  city: String,
  password: String,
  otp: String,
  otpExpires: Date,
});

// Compare plain text password
userSchema.methods.matchPassword = function (enteredPassword) {
  return this.password === enteredPassword;
};

module.exports = mongoose.model('User', userSchema);
