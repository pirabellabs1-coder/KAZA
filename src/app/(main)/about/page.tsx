import type { Metadata } from "next";
import { Shield, MapPin, Users, Building2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "À propos",
  description: "Découvrez KAZA, la plateforme immobilière de référence en Afrique.",
};

const values = [
  {
    icon: Shield,
    title: "Confiance & Sécurité",
    description:
      "Vérification d'identité obligatoire, paiements sécurisés et contrats numériques pour protéger toutes les parties.",
  },
  {
    icon: MapPin,
    title: "Proximité Locale",
    description:
      "Conçu en Afrique, pour l'Afrique. Nous comprenons les défis locaux et y apportons des solutions numériques.",
  },
  {
    icon: Users,
    title: "Communauté",
    description:
      "Nous connectons propriétaires, locataires et étudiants dans un écosystème de confiance mutuelle.",
  },
  {
    icon: Building2,
    title: "Innovation",
    description:
      "paiement intégré intégré, visites virtuelles et contrats digitaux pour transformer le marché immobilier africain.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-kaza-navy py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Transformer le marché immobilier africain
          </h1>
          <p className="mt-4 text-lg text-white/70">
            KAZA est née de la volonté d&apos;éliminer les intermédiaires,
            réduire les coûts et apporter transparence et confiance dans le
            processus de location en Afrique.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-2xl font-bold">Notre Mission</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Créer la plus grande plateforme d&apos;immobilier en Afrique en
              numérisant complètement le processus de location. Notre couverture
              s&apos;étend à tout le continent africain — Afrique de l&apos;Ouest,
              de l&apos;Est, du Nord, centrale et australe.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="mb-12 text-center font-heading text-2xl font-bold">
            Nos Valeurs
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border bg-white p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-kaza-blue/10">
                  <value.icon className="size-6 text-kaza-blue" />
                </div>
                <h3 className="mb-2 font-semibold">{value.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Contactez-nous
              </h2>
              <p className="mt-4 text-muted-foreground">
                Une question, une suggestion ou un partenariat ? N&apos;hésitez
                pas à nous contacter.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Mail className="size-5 text-kaza-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      contact@pirabellabs.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <MapPin className="size-5 text-kaza-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">
                      Cotonou, Bénin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" placeholder="Jean Dupont" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jean@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input id="subject" placeholder="Votre sujet" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Votre message..."
                    rows={5}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Envoyer le message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
