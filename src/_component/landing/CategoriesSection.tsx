'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { useCategories } from '@/features/categories/hooks';
import CategoryIcon from '@/_component/CategoryIcon';
import SectionHeading from '@/_component/SectionHeading';

export default function CategoriesSection() {
  const { data: categories = [], isLoading } = useCategories();

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeading
        title="Featured categories"
        subtitle="Explore learning paths tailored to your interests"
        action={
          <Link
            href="/courses"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/courses?category=${category._id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <CategoryIcon name={category.name} />
            <span className="font-medium text-foreground">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
