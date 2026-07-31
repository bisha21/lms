import mongoose, { Schema } from 'mongoose';

export interface IWishlist extends Document {
  student: mongoose.Types.ObjectId;
  items: mongoose.Types.ObjectId[];
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
