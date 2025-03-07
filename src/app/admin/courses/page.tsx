'use client';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { deleteCourse, fetchCourses } from '@/redux/courses/coursesSlice';
import { Button } from '@/components/ui/button';
import Modal from '@/_component/Modal';
import CourseForm from '@/_component/CourseForm';
import { Pencil, Trash } from 'lucide-react';
import { closeModal, openModal } from '@/redux/modal/modalSlice';

function Courses() {
  const courses = useAppSelector((store) => store.courses.courses);
  const [search, setSearch] = useState<string>('');
  const { isOpen, type, data } = useAppSelector((store) => store.modal);
  console.log("HI ",courses)

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
                  className="block w-80 h-11 pr-5 pl-12 py-2.5 text-base font-normal shadow-xs text-gray-900 bg-transparent border border-gray-300 rounded-full placeholder-gray-400 focus:outline-none"
                  placeholder="Search for company"
                />
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.5 17.5L15.4167 15.4167M15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333C11.0005 15.8333 12.6614 15.0929 13.8667 13.8947C15.0814 12.6872 15.8333 11.0147 15.8333 9.16667Z"
                    stroke="#9CA3AF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
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
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize rounded-t-xl"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize"
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize"
                  >
                    Created At
                  </th>
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize rounded-t-xl"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 ">
                {courses.length > 0 ? (
                  courses?.map((course) => {
                    return (
                      <tr
                        key={course.title}
                        className="bg-white transition-all duration-500 hover:bg-gray-50"
                      >
                        <td
                          //   onClick={() =>
                          //     router.push(`/admin/courses/${course?._id}/lessons`)
                          //   }
                          className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900"
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
                          {course?.category?.name}
                        </td>
                        <td className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900">
                          {new Date(
                            course.createdAt.toString()
                          ).toLocaleDateString()}
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-1">
                            <td className="p-5">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    dispatch(
                                      openModal({ type: 'edit', data: course })
                                    )
                                  }
                                >
                                  <Pencil color="blue" />
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    dispatch(
                                      openModal({
                                        type: 'delete',
                                        data: course,
                                      })
                                    )
                                  }
                                >
                                  <Trash color="red" />
                                </Button>
                              </div>
                            </td>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
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
          description: 'Are you sure you want to delete this category?',
        }}
      >
        <div className="flex justify-between">
          <Button variant="destructive " onClick={handleDelete}>
            Yes, Delete
          </Button>
          <Button onClick={() => dispatch(closeModal())}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

export default Courses;
