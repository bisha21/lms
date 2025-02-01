import mongoose from 'mongoose';
const Schema = mongoose.Schema;

enum Role {
  ADMIN = 'admin',
  STUDENT = 'student',
}
interface IUserType extends Document {
  username: string;
  email: string;
  profileImage: string;
  role: Role;
}
const userSchema = new Schema<IUserType>({
  username: String,
  email: String,
  role: {
    type: String,
    enum: [Role.ADMIN, Role.STUDENT],
    default: Role.STUDENT,
  },
  profileImage: {
    type: String,
  },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
