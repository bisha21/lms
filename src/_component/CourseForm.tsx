import { Button } from '@/components/ui/button';
import { useCategories } from '@/features/categories/hooks';
import { useCreateCourse, useUpdateCourse } from '@/features/courses/hooks';
import { ICourseForData } from '@/features/courses/types';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

interface CourseFormProps {
  defaultValues?: ICourseForData; // Accept default values
}

const emptyForm: ICourseForData = {
  title: '',
  courseDescription: '',
  coursePrice: 0,
  category: '',
  duration: '',
  thumbnail: '',
};

const CourseForm: React.FC<CourseFormProps> = ({ defaultValues }) => {
  const { data: categories = [] } = useCategories();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const [data, setData] = useState<ICourseForData>(emptyForm);

  useEffect(() => {
    if (defaultValues) {
      setData({
        ...defaultValues,
        category:
          typeof defaultValues.category === 'string'
            ? defaultValues.category
            : defaultValues.category?._id ?? '',
      });
    }
  }, [defaultValues]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: name === 'coursePrice' ? Number(value) : value,
    });
  };

  const createCourseHandle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (defaultValues?._id) {
      updateCourse.mutate({ id: defaultValues._id, data });
    } else {
      createCourse.mutate(data);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={createCourseHandle}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Course Title
          </label>
          <input
            onChange={handleChange}
            name="title"
            type="text"
            value={data.title}
            className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="HTML, NEXTJS, REACTJS"
            required
          />
        </div>
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Price
            </label>
            <input
              onChange={handleChange}
              name="coursePrice"
              type="number"
              min={0}
              value={data.coursePrice}
              className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="999"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Duration
            </label>
            <input
              name="duration"
              onChange={handleChange}
              type="text"
              value={data.duration}
              className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="30 Days"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            name="category"
            onChange={handleChange}
            value={data.category as string}
            className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Thumbnail URL
          </label>
          <input
            onChange={handleChange}
            name="thumbnail"
            type="text"
            value={data.thumbnail ?? ''}
            className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Course Description
          </label>
          <textarea
            onChange={handleChange}
            name="courseDescription"
            value={data.courseDescription}
            className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="About course.."
            required
          ></textarea>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">
            {defaultValues?._id ? 'Update Courses' : 'Add Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
