import Link from "next/link";
import { Map, TrendingUp, Shield, Users, Target, Sparkles, BarChart2, CreditCard } from "lucide-react";

const FEATURES = [
  { icon: TrendingUp, title: "Net Worth Tracking", desc: "See all your accounts, assets, and liabilities in one clean dashboard." },
  { icon: BarChart2, title: "Smart Budgeting", desc: "Monthly budgets with zero-based or flexible spending plans." },
  { icon: Target, title: "Goals", desc: "Save for vacations, emergency funds, down payments, and more." },
  { icon: CreditCard, title: "Debt Payoff", desc: "Avalanche and snowball calculators to crush your debt faster." },
  { icon: Sparkles, title: "AI Assistant", desc: "Ask questions about your spending, income, and financial health." },
  { icon: Users, title: "Household Sharing", desc: "Share finances with a partner or advisor with role-based access." },
  { icon: Shield, title: "Private & Secure", desc: "Your data is encrypted. We never store bank login credentials." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <Map className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">MoneyMap</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-6">
          <Sparkles className="h-3.5 w-3.5" /> Now with AI-powered financial insights
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
          Your complete financial map.<br />
          <span className="text-indigo-600">All in one place.</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          MoneyMap helps you track net worth, budget smarter, crush debt, hit savings goals, and plan your financial future — with a clean modern interface inspired by Monarch Money and YNAB.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
            Start for free →
          </Link>
          <Link href="/login" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-200 hover:border-gray-300 transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Everything you need to master your money</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 mb-4">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to map your money?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Join thousands taking control of their financial future with MoneyMap.</p>
        <Link href="/signup" className="inline-flex rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
          Create your free account →
        </Link>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100 dark:border-gray-800">
        © {new Date().getFullYear()} MoneyMap. Built for your financial freedom.
      </footer>
    </div>
  );
}
