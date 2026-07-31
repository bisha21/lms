import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_VALUES, Role } from '@/lib/rbac/roles';

const Schema = mongoose.Schema;

export { Role };

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  profileImage: string;
  role: Role;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    select: false,
  },
  role: {
    type: String,
    enum: ROLE_VALUES,
    default: Role.STUDENT,
  },
  profileImage: {
    type: String,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
