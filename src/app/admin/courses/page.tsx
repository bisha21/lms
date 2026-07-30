'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { deleteCourse, fetchCourses, togglePublishCourse } from '@/redux/courses/coursesSlice';
import { Button } from '@/components/ui/button';
import Modal from '@/_component/Modal';
import CourseForm from '@/_component/CourseForm';
import { Pencil, Trash } from 'lucide-react';
import { closeModal, openModal } from '@/redux/modal/modalSlice';

function Courses() {
  const courses = useAppSelector((store) => store.courses.courses);
  const [search, setSearch] = useState<string>('');
  const { isOpen, type, data } = useAppSelector((store) => store.modal);
  const router = useRouter();

  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );
  const handleDelete = () => {
    if (data?._id) {
      dispatch(deleteCourse(data._id));
      dispatch(closeModal());
    }
  };

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="relative text-gray-500 focus-within:text-gray-900 mb-4">
            <div className="flex justify-between items-center border">
              <div className="flex flex-row">
                <input
                  type="text"
                  id="default-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-80 h-11 pr-5 pl-12 py-2.5 text-base font-normal shadow-xs text-gray-900 bg-transparent border border-gray-300 rounded-full placeholder-gray-400 focus:outline-none"
                  placeholder="Search for course"
                />
              </div>
              <div>
                <Button onClick={() => dispatch(openModal({ type: 'add' }))}>
                  + Add Courses
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full rounded-xl">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize rounded-t-xl">
                    Title
                  </th>
                  <th className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize">
                    Price
                  </th>
                  <th className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize">
                    Duration
                  </th>
                  <th className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize">
                    Category
                  </th>
                  <th className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize">
                    Status
                  </th>
                  <th className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize rounded-t-xl">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 ">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => {
                    const categoryName =
                      typeof course.category === 'string' ? course.category : course.category?.name;
                    return (
                      <tr
                        key={course._id}
                        className="bg-white transition-all duration-500 hover:bg-gray-50"
                      >
                        <td
                          onClick={() => router.push(`/admin/courses/${course._id}/lessons`)}
                          className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900 cursor-pointer hover:underline"
                        >
                          {course?.title}
                        </td>
                        <td className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900">
                          {course?.coursePrice}
                        </td>
                        <td className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900">
                          {course?.duration}
                        </td>
                        <td className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900">
                          {categoryName}
                        </td>
                        <td className="p-5 whitespace-nowrap text-sm leading-6 font-medium">
                          <button
                            onClick={() =>
                              dispatch(
                                togglePublishCourse(
                                  course._id as string,
                                  course.status === 'published' ? 'draft' : 'published'
                                )
                              )
                            }
                            className={`px-2 py-1 rounded-full text-xs ${
                              course.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {course.status === 'published' ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              onClick={() =>
                                dispatch(openModal({ type: 'edit', data: course }))
                              }
                            >
                              <Pencil color="blue" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                dispatch(openModal({ type: 'delete', data: course }))
                              }
                            >
                              <Trash color="red" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-5 text-center text-sm leading-6 font-medium text-gray-900"
                    >
                      No courses available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={isOpen && (type === 'add' || type === 'edit')}
        onOpenChange={(open) => !open && dispatch(closeModal())}
        header={{
          title: type === 'edit' ? 'Edit Course' : 'Add course',
          description:
            type === 'edit'
              ? 'Update the courses details.'
              : 'Fill out the form to add a new category.',
        }}
      >
        <CourseForm defaultValues={type === 'edit' ? data : undefined} />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isOpen && type === 'delete'}
        onOpenChange={(open) => !open && dispatch(closeModal())}
        header={{
          title: 'Delete Confirmation',
          description: 'Are you sure you want to delete this course?',
        }}
      >
        <div className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Yes, Delete
          </Button>
          <Button onClick={() => dispatch(closeModal())}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

export default Courses;
