'use client';
import Form from '@/_component/Form';
import Modal from '@/_component/Modal';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  deleteCategory,
  fetchCategories,
} from '@/redux/category/categorySlice';
import { toast } from 'react-toastify';
import { setIsOpen } from '@/redux/modal/modalSlice';

interface ICategories {
  _id: string;
  name: string;
  description: string;
}

const Categories = () => {
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  // Local state to hold the category selected for editing.
  const [editCategory, setEditCategory] = useState<ICategories | null>(null);

  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((store) => store.categores);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleDelete = async (_id: string) => {
    dispatch(deleteCategory(_id));
    toast.success('Category deleted successfully');
    setIsDeleteModal(false);
  };

  const handleModal = (_id: string) => {
    setDeleteId(_id);
    setIsDeleteModal(true);
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
                placeholder="Search for company"
              />
              {/* Using Redux modal for adding a category */}
              <Button
                variant="default"
                onClick={() => dispatch(setIsOpen(true))}
              >
                Add Category
              </Button>
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
                    Id
                  </th>
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="p-5 text-left text-sm leading-6 font-semibold text-gray-900 capitalize rounded-t-xl"
                  >
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
                    <td className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="p-5 whitespace-nowrap text-sm leading-6 font-medium text-gray-900">
                      {item.description}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1">
                        <Button onClick={() => setEditCategory(item)}>
                          <Pencil />
                        </Button>
                        <Button onClick={() => handleModal(item._id)}>
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

      {/* Add Category Modal using Redux */}
      <Modal
        open={useAppSelector((store) => store.modal.isOpen)}
        onOpenChange={(open) => dispatch(setIsOpen(open))}
        header={{
          title: 'Add Category',
          description: 'Please fill out the form to add a new category.',
        }}
      >
        <Form />
      </Modal>

      {/* Edit Category Modal using Local State */}
      <Modal
        open={Boolean(editCategory)}
        onOpenChange={(open) => {
          if (!open) setEditCategory(null);
        }}
        header={{
          title: 'Edit Category',
          description: 'Update the details of the category.',
        }}
      >
        {editCategory && <Form defaultValues={editCategory} />}
      </Modal>

      {/* Delete Confirmation Modal using Local State */}
      <Modal
        open={isDeleteModal}
        onOpenChange={setIsDeleteModal}
        header={{
          title: 'Delete Confirmation',
          description: 'Are you sure you want to delete this category?',
        }}
      >
        <div className="flex justify-between">
          <Button variant="destructive" onClick={() => handleDelete(deleteId)}>
            Yes, Delete
          </Button>
          <Button onClick={() => setIsDeleteModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
