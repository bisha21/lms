import HeroSection from '@/_component/landing/HeroSection';
import StatsSection from '@/_component/landing/StatsSection';
import CategoriesSection from '@/_component/landing/CategoriesSection';
import PopularCoursesSection from '@/_component/landing/PopularCoursesSection';
import TestimonialsSection from '@/_component/landing/TestimonialsSection';
import CTASection from '@/_component/landing/CTASection';

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <CategoriesSection />
      <PopularCoursesSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
