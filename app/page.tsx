import { Navigation } from "./components/Navigation";
import { HeroSection } from "./components/HeroSection";
import { ProblemSection } from "./components/ProblemSection";
import { SolutionSection } from "./components/SolutionSection";
import { AgenticSection } from "./components/AgenticSection";
import { FeatureGrid } from "./components/FeatureGrid";
import { HowItWorks, ForWhom, Outcomes } from "./components/HowItWorks";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <AgenticSection />
      <FeatureGrid />
      <HowItWorks />
      <ForWhom />
      <Outcomes />
      <FinalCTA />
      <Footer />
    </main>
  );
}
