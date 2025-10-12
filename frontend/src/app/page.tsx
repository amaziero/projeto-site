// frontend/app/page.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Paperclip, // Unir PDFs
  Scissors, // Dividir
  Lock, // Proteger
  Image as ImageIcon, // Converter p/ Imagem
  PenLine, // Assinar
  Link2, // Encurtar Link
} from "lucide-react";

type Feature = {
  key: string;
  title: string;
  description: string;
  href: string; // rota alvo quando habilitada
  icon: React.ElementType;
  enabled: boolean;
};

const FEATURES: Feature[] = [
  {
    key: "merge",
    title: "Unir PDFs",
    description: "Junte vários PDFs em um só.",
    href: "/upload",
    icon: Paperclip,
    enabled: true,
  },
  {
    key: "split",
    title: "Dividir PDF",
    description: "Separe por páginas ou intervalos.",
    href: "/split",
    icon: Scissors,
    enabled: true,
  },
  {
    key: "img",
    title: "Converter p/ Imagem",
    description: "Transforme páginas em PNG/JPG.",
    href: "/to-image",
    icon: ImageIcon,
    enabled: false,
  },
  {
    key: "protect",
    title: "Proteger PDF",
    description: "Adicione senha e permissões.",
    href: "/protect",
    icon: Lock,
    enabled: false,
  },
  {
    key: "sign",
    title: "Assinar Digital",
    description: "Assine e posicione a assinatura.",
    href: "/sign",
    icon: PenLine,
    enabled: false,
  },
  {
    key: "shorten",
    title: "Encurtar Link",
    description: "Crie um link curto fácil de compartilhar.",
    href: "/shorten",
    icon: Link2,
    enabled: false,
  },
];

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-serif tracking-wide text-[var(--primary)]">
          TuttiTool
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ferramentas artesanais para seus documentos (e mais 😉)
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.key} feature={f} />
        ))}
      </section>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon } = feature;

  const disabledStyles = "opacity-50 grayscale pointer-events-none select-none";
  const enabledStyles = "hover:shadow-lg transition-shadow";

  const cardInner = (
    <Card
      className={`h-full ${feature.enabled ? enabledStyles : disabledStyles}`}
      aria-disabled={!feature.enabled}
      role="group"
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-[var(--secondary)]/60">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-medium">{feature.title}</h3>
          {!feature.enabled && (
            <span
              className="ml-auto text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300"
              aria-label="Em breve"
              title="Em breve"
            >
              Em breve
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
        {feature.enabled && (
          <span className="inline-block text-sm text-[var(--primary)]">
            Abrir →
          </span>
        )}
      </CardContent>
    </Card>
  );

  return feature.enabled ? (
    <Link href={feature.href} className="block" prefetch>
      {cardInner}
    </Link>
  ) : (
    <div className="block" aria-hidden title="Em breve">
      {cardInner}
    </div>
  );
}
