import { Button } from '@/components/ui/button';
import { fetchCategories } from '@/redux/category/categorySlice';
import { Status } from '@/redux/category/type';
import { createCourse, updateCourse } from '@/redux/courses/coursesSlice';
import { ICourseForData } from '@/redux/courses/type';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ChangeEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface CourseFormProps {
  defaultValues?: ICourseForData; // Accept default values
}

const CourseForm: React.FC<CourseFormProps> = ({ defaultValues }) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((store) => store.courses);
  const { categories } = useAppSelector((store) => store.categores);
  const [data, setData] = useState<ICourseForData>({
    title: '',
    courseDescription: '',
    coursePrice: 0,
    category: '',
    duration: '',
  });

  // Set default values if provided
  useEffect(() => {
    if (defaultValues) {
        console.log("hahaha",defaultValues._id)
      setData(defaultValues);
    }
  }, [defaultValues]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
    });
  };

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch]);

  const createCourseHandle = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (defaultValues) {
        
      dispatch(updateCourse(data,defaultValues._id));
    } else {
      dispatch(createCourse(data));
    }
  };

  //   useEffect(() => {
  //     if (status === Status.SUCCESS) {
  //       const message = defaultValues
  //         ? 'Course updated successfully'
  //         : 'Course created successfully';

  //       toast.success(message);
  //     }
  //   }, [status, defaultValues]);

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
        <div className="flex justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Price
            </label>
            <input
              onChange={handleChange}
              name="coursePrice"
              type="number"
              value={data.coursePrice}
              className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="999"
              required
            />
          </div>
          <div>
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
            value={data.category}
            className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
            required
          >
            <option value="">Select Category</option>
            {categories.length &&
              categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
          </select>
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
            {defaultValues ? 'Update Courses' : 'Add Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
