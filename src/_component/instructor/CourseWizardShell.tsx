import type { ReactNode } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const STEPS = ['Basic Info', 'Curriculum', 'Pricing', 'Publish'];

interface CourseWizardShellProps {
  courseTitle?: string;
  step: 1 | 2 | 3 | 4;
  children: ReactNode;
  footer?: ReactNode;
}

export default function CourseWizardShell({ courseTitle, step, children, footer }: CourseWizardShellProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          <Link href="/instructor/courses" className="hover:text-foreground">
            Courses
          </Link>
          {courseTitle && (
            <>
              <span className="mx-1.5">&gt;</span>
              <span className="text-foreground">{courseTitle}</span>
            </>
          )}
          <span className="mx-1.5">&gt;</span>
          <span className="text-foreground">{STEPS[step - 1]}</span>
        </p>

        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => {
            const stepNumber = i + 1;
            const state = stepNumber < step ? 'done' : stepNumber === step ? 'current' : 'upcoming';
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                    state === 'done' && 'bg-success text-white',
                    state === 'current' && 'bg-foreground text-background',
                    state === 'upcoming' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {state === 'done' ? <Check className="h-3 w-3" /> : stepNumber}
                </span>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
              </div>
            );
          })}
          <span className="ml-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Step {step} of {STEPS.length}
          </span>
        </div>
      </div>

      {children}

      {footer && <div className="mt-6 flex items-center justify-between">{footer}</div>}
    </div>
  );
}
