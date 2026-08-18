import type { Metadata } from "next";
import KoiFinalHomepage from "@/components/studio/KoiFinalHomepage";

export const metadata: Metadata = {
  title: "Koinophobia Labs | AI-Native Products and Systems",
  description:
    "A founder-led Chicago studio building AI-native products, websites, and business systems from first principles.",
  alternates: { canonical: "https://koinophobialabs.com/" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Koinophobia Labs",
  url: "https://koinophobialabs.com",
  image: "https://koinophobialabs.com/koi-mark.png",
  email: "koinophobia999@gmail.com",
  founder: { "@type": "Person", name: "Blake Taylor" },
  areaServed: ["Chicago", "United States"],
  description:
    "A founder-led studio building AI-native products, websites, and business systems.",
};

export default function Home() {
  return (
    <div className="studio-site studio-site-shell">
      <KoiFinalHomepage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </div>
  );
}
