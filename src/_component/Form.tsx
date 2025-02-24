import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../redux/hooks';
import { createCategory, updateCategory } from '@/redux/category/categorySlice';
import { setIsOpen } from '@/redux/modal/modalSlice';

interface FormProps {
  defaultValues?: { _id: string; name: string; description: string };
}

const Form: React.FC<FormProps> = ({ defaultValues }) => {
  const [name, setName] = useState<string>(defaultValues?.name || '');
  const [description, setDescription] = useState<string>(
    defaultValues?.description || ''
  );
  const dispatch = useAppDispatch();

  // In case defaultValues update dynamically:
  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name);
      setDescription(defaultValues.description);
    }
  }, [defaultValues]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = { name, description };
    try {
      if (defaultValues) {
        // Update category if default values exist.
        await dispatch(updateCategory(defaultValues._id, data));
        toast.success('Category updated successfully');
      } else {
        // Create category if no default values provided.
        await dispatch(createCategory(data));
        toast.success('Category created successfully');
      }
      setName('');
      setDescription('');
      dispatch(setIsOpen(false));
    } catch (err) {
      console.log('Error', err);
      toast.error(
        defaultValues ? 'Error updating category' : 'Error creating category'
      );
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">
          {defaultValues ? 'Edit Category' : 'Add a Category'}
        </h1>
        <form method="POST" onSubmit={handleSubmit}>
          {/* Category Name */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Category Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="FrontEnd development"
              className="mt-1 block w-full p-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="Category description"
              className="mt-1 block w-full p-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          {/* Submit Button */}
          <div>
            <Button type="submit">{defaultValues ? 'Update' : 'Submit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;
