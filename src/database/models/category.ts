import mongoose, { Schema } from 'mongoose';
import { slugify } from '@/lib/slugify';

export interface ICategory extends Document {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

categorySchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

const Category =
  mongoose.models.Category || mongoose.model('Category', categorySchema);
export default Category;
