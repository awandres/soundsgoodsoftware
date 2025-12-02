import Link from "next/link";
import { Button } from "@soundsgood/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            SG
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            SoundsGood Software
          </h1>
          <p className="max-w-md text-center text-lg text-slate-400">
            Your client portal for managing projects, documents, and content.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">Learn More</Link>
          </Button>
        </div>

        {/* Status Badge */}
        <div className="mt-8 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-400">
          🚧 MVP in Development
        </div>
      </div>
    </main>
  );
}

