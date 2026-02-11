import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header/Nav */}
      <header className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Misbah <span className="text-emerald-600">Fruits</span>
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex text-sm font-medium">
            <a href="#features" className="text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
            <a href="#about" className="text-slate-600 hover:text-emerald-600 transition-colors">About</a>
            <a href="#contact" className="text-slate-600 hover:text-emerald-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <SignedOut>
              <div className="hidden sm:block">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </div>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:shadow-none active:scale-95">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-none active:scale-95">
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="grow pt-20">
        <section className="relative overflow-hidden py-24 sm:py-32">
          {/* Background Blobs */}
          <div className="absolute -top-24 -left-20 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute top-1/2 -right-20 h-96 w-96 rounded-full bg-amber-100/50 blur-3xl opacity-60"></div>

          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700 mb-8 animate-bounce shadow-sm">
                ✨ Internal Management System
              </div>

              <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
                Fresh produce, <span className="bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Powerfully Managed.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                The ultimate enterprise solution for Misbah Fruits and Vegetables. Streamline inventory, track sales, and manage multiple branches with precision and ease.
              </p>

              <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <button className="h-14 rounded-full bg-emerald-600 px-10 text-lg font-semibold text-white shadow-2xl shadow-emerald-200 transition-all hover:bg-emerald-700 hover:translate-y-[-2px] hover:shadow-none active:scale-95">
                      Join the Team
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" className="h-14 flex items-center justify-center rounded-full bg-emerald-600 px-10 text-lg font-semibold text-white shadow-2xl shadow-emerald-200 transition-all hover:bg-emerald-700 hover:translate-y-[-2px] hover:shadow-none active:scale-95">
                    Open Dashboard
                  </Link>
                </SignedIn>
                <Link href="#features" className="group flex items-center gap-2 text-lg font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                  Learn more
                  <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Stats / Proof */}
              <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-16 border-t border-slate-200 pt-16">
                {[
                  { label: "Daily Sales", value: "2.5k+" },
                  { label: "Active Branches", value: "12" },
                  { label: "Products", value: "150+" },
                  { label: "Happy Clients", value: "500+" }
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center">
                    <dt className="text-sm font-medium text-slate-500">{stat.label}</dt>
                    <dd className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</dd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Placeholder */}
        <section id="features" className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wider">Everything you need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Unified Operations Management</p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                A purpose-built platform designed specifically for the wholesale fruits and vegetable trade.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    title: "Live Inventory Tracking",
                    description: "Monitor stock levels across all branches in real-time. Automatically calculate conversions between cartons, trays, and kilograms.",
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )
                  },
                  {
                    title: "Seamless Sales & Ledger",
                    description: "Fast-entry POS for salesmen with automated customer ledger updates and FIFO payment allocation.",
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  {
                    title: "Advanced Analytics",
                    description: "Daily profit reports, branch performance metrics, and receivables/payables at a glance for administrators.",
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )
                  }
                ].map((feature) => (
                  <div key={feature.title} className="flex flex-col items-start p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:bg-emerald-50/50 hover:border-emerald-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200 mb-6">
                      {feature.icon}
                    </div>
                    <dt className="text-xl font-bold leading-7 text-slate-900">{feature.title}</dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2 grayscale brightness-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Misbah <span className="text-slate-500">Fruits</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Misbah Fruits and Vegetables. All rights reserved. Registered in Sharjah, UAE.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-slate-600"><span className="sr-only">Twitter</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></a>
            <a href="#" className="text-slate-400 hover:text-slate-600"><span className="sr-only">GitHub</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026a9.564 9.564 0 015.002 0c1.91-1.296 2.75-1.026 2.75-1.026.545 1.378.202 2.397.1 2.65.64.7 1.03 1.595 1.03 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
