import { HeroSection } from '@/components/home/HeroSection';
import { SupportedModesSection } from '@/components/home/SupportedModesSection';

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <SupportedModesSection />
    </div>
  );
}
