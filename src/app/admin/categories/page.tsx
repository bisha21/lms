'use client';
import { useState } from 'react';
import { Pencil, Plus, Search, Trash } from 'lucide-react';

import Form from '@/_component/Form';
import Modal from '@/_component/Modal';
import SectionHeading from '@/_component/SectionHeading';
import Reveal from '@/_component/motion/Reveal';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openModal, closeModal } from '@/redux/modal/modalSlice';
import { useCategories, useDeleteCategory } from '@/features/categories/hooks';

const Categories = () => {
  const dispatch = useAppDispatch();
  const { data: categories = [] } = useCategories();
  const deleteCategory = useDeleteCategory();
  const { isOpen, type, data } = useAppSelector((store) => store.modal);
  const [search, setSearch] = useState('');

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = () => {
    if (data?._id) {
      deleteCategory.mutate(data._id);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        title="Categories"
        subtitle="Organize the course catalog into learning paths."
        action={
          <Button onClick={() => dispatch(openModal({ type: 'add' }))}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        }
      />

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
          placeholder="Search for category"
        />
      </div>

      <Reveal className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, index) => (
                <TableRow key={item._id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch(openModal({ type: 'edit', data: item }))}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch(openModal({ type: 'delete', data: item }))}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Reveal>

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
