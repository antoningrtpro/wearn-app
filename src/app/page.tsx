import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { AdminButton } from "@/components/admin/admin-button";
import Logo from "@/components/shared/logo";

const HERO_PHOTO_URL = "https://images.pexels.com/photos/10313672/pexels-photo-10313672.jpeg";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-admin-canvas p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-[32px] shadow-[0_24px_60px_-12px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.04)]">
        {/* Left — short pitch over a photo, darkened enough for the text to read */}
        <div className="relative hidden w-[460px] shrink-0 flex-col justify-between overflow-hidden text-white lg:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_PHOTO_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-ink/65" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />

          <div className="relative flex items-center gap-2 px-8 py-8">
            <Logo className="text-body-lg font-bold tracking-heading-sm" />
          </div>

          <div className="relative px-8 pb-8">
            <h1 className="text-heading-sm font-bold tracking-heading-sm">
              Vos tenues de course, votre nouvel espace publicitaire.
            </h1>
            <p className="mt-2 text-caption text-white/85">Marques et coureurs, connectés en un clic.</p>
            <p className="mt-5 text-caption text-white/70">© {new Date().getFullYear()} Wearn</p>
          </div>
        </div>

        {/* Right — the actual login card */}
        <div className="flex w-full flex-1 items-center justify-center bg-paper px-6 py-8 sm:px-8">
          <Card className="w-full max-w-[320px] border-transparent shadow-none">
            <LoginForm />

            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-hairline" />
              <span className="text-caption tracking-caption uppercase text-mid-gray">ou</span>
              <div className="h-px flex-1 bg-hairline" />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link href="/inscription-coureur">
                <AdminButton variant="outline" className="w-full justify-center whitespace-nowrap">
                  Inscription coureur
                </AdminButton>
              </Link>
              <a
                href="https://www.wearn.fr/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-buttons border border-hairline bg-transparent px-4 text-body font-medium text-ink transition-colors hover:bg-ink/5"
              >
                Vous êtes une marque ? Contactez-nous
              </a>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
