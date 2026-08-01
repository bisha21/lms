import SectionHeading from '@/_component/SectionHeading';
import RatingStars from '@/_component/RatingStars';

const TESTIMONIALS = [
  {
    initials: 'AR',
    name: 'Aisha R.',
    role: 'Frontend Developer',
    quote:
      'The course quality is outstanding. Each lesson is structured logically and the instructors explain complex topics in a way that actually sticks.',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    initials: 'MK',
    name: 'Marcus K.',
    role: 'Product Designer',
    quote:
      'Beautifully designed platform. The courses are practical, project-based, and helped me land freelance work within weeks.',
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    initials: 'TN',
    name: 'Tara N.',
    role: 'Data Analyst',
    quote:
      'I love how self-paced everything is. The dashboards keep me motivated and I can actually see my progress add up over time.',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeading title="Loved by learners worldwide" subtitle="Real feedback from our student community" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            <RatingStars rating={5} />
            <p className="text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-auto flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${t.color}`}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
