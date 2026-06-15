const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  fullName: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});

//presave hook - autohash 
//only editpassword and don't hash
userSchema.pre('save',async function (next){
  if (!this.isModified('password')) return next();

  const alreadyHashed = typeof this.password === 'string' && this.password.startsWith('$2');
  if (alreadyHashed) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
})

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword,this.password);
  
}

module.exports = mongoose.model('User', userSchema); 