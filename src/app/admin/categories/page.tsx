'use client';
import Form from '@/_component/Form';
import Modal from '@/_component/Modal';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  deleteCategory,
  fetchCategories,
} from '@/redux/category/categorySlice';
import { openModal, closeModal } from '@/redux/modal/modalSlice';
import { toast } from 'react-toastify';

const Categories = () => {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((store) => store.categores);
  const { isOpen, type, data } = useAppSelector((store) => store.modal);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleDelete = () => {
    if (data?._id) {
      dispatch(deleteCategory(data._id));
      toast.success('Category deleted successfully');
      dispatch(closeModal());
    }
  };

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="relative text-gray-500 focus-within:text-gray-900 mb-4">
            <div className="flex items-center justify-between">
              <input
                type="text"
                id="default-search"
                className="block w-80 h-11 pr-5 pl-12 py-2.5 text-base font-normal shadow-xs text-gray-900 bg-transparent border border-gray-300 rounded-full placeholder-gray-400 focus:outline-none"
                placeholder="Search for category"
              />
              <Button
                variant="default"
                onClick={() => dispatch(openModal({ type: 'add' }))}
              >
                Add Category
              </Button>
            </div>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full rounded-xl">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-5 text-left text-sm font-semibold text-gray-900 capitalize rounded-t-xl">
                    Id
                  </th>
                  <th className="p-5 text-left text-sm font-semibold text-gray-900 capitalize">
                    Name
                  </th>
                  <th className="p-5 text-left text-sm font-semibold text-gray-900 capitalize">
                    Description
                  </th>
                  <th className="p-5 text-left text-sm font-semibold text-gray-900 capitalize rounded-t-xl">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {categories.map((item, index) => (
                  <tr
                    key={item._id}
                    className="bg-white transition-all duration-500 hover:bg-gray-50"
                  >
                    <td className="p-5 text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="p-5 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="p-5 text-sm font-medium text-gray-900">
                      {item.description}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() =>
                            dispatch(openModal({ type: 'edit', data: item }))
                          }
                        >
                          <Pencil />
                        </Button>
                        <Button
                          onClick={() =>
                            dispatch(openModal({ type: 'delete', data: item }))
                          }
                        >
                          <Trash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      <Modal
        open={isOpen && (type === 'add' || type === 'edit')}
        onOpenChange={(open) => !open && dispatch(closeModal())}
        header={{
          title: type === 'edit' ? 'Edit Category' : 'Add Category',
          description:
            type === 'edit'
              ? 'Update the category details.'
              : 'Fill out the form to add a new category.',
        }}
      >
        <Form defaultValues={type === 'edit' ? data : undefined} />
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
          <Button variant="destructive" onClick={handleDelete}>
            Yes, Delete
          </Button>
          <Button onClick={() => dispatch(closeModal())}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
