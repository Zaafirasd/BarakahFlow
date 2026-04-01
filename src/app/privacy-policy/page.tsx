import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Privacy Policy — BarakahFlow' };

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/more"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: March 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300">

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">1. Who we are</h2>
            <p>
              BarakahFlow is a personal Islamic finance tracker designed to help Muslims manage income, expenses, bills, and Zakat. Your financial data stays private and is never sold or shared with advertisers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">2. Data we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-slate-900 dark:text-white">Account data</strong> — your email address, used only for authentication.</li>
              <li><strong className="text-slate-900 dark:text-white">Financial data</strong> — income, transactions, bills, and budgets you enter. This is stored securely in your private account and visible only to you.</li>
              <li><strong className="text-slate-900 dark:text-white">Zakat data</strong> — asset values you enter for Zakat calculations. Stored in your account and optionally cached locally on your device.</li>
              <li><strong className="text-slate-900 dark:text-white">Usage analytics</strong> — anonymous, aggregated event counts (e.g. how many users enabled Zakat). No personally identifiable information is attached to these events.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">3. How we use your data</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>To provide and sync the app across your devices.</li>
              <li>To calculate your budget, Zakat estimates, and bill schedules.</li>
              <li>To allow you to export or delete your data at any time.</li>
            </ul>
            <p className="mt-3">We do <strong className="text-slate-900 dark:text-white">not</strong> use your financial data for advertising, profiling, or any purpose outside of operating the app for you.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">4. Third-party services</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-slate-900 dark:text-white">Supabase</strong> — our database and authentication provider. Your data is stored on Supabase servers. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline hover:text-emerald-400">supabase.com/privacy</a>.</li>
              <li><strong className="text-slate-900 dark:text-white">Vercel</strong> — our hosting provider. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline hover:text-emerald-400">vercel.com/legal/privacy-policy</a>.</li>
              <li><strong className="text-slate-900 dark:text-white">Vercel Analytics & Speed Insights</strong> — anonymous, aggregated performance monitoring. No cookies, no fingerprinting.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">5. Data retention</h2>
            <p>
              Your data is retained as long as you have an account. You can delete your account at any time from <strong className="text-slate-900 dark:text-white">Profile → Delete Account</strong>, which permanently removes all your data from our systems.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">6. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc space-y-2 pl-5 mt-2">
              <li>Access the data we hold about you (all visible in the app).</li>
              <li>Delete your account and all associated data.</li>
              <li>Request a copy of your data by contacting us.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">7. Security</h2>
            <p>
              All data is encrypted in transit (HTTPS) and at rest. Authentication is handled by Supabase with industry-standard security practices. We never store passwords in plain text.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">8. Changes to this policy</h2>
            <p>
              We may update this policy as the app evolves. The &ldquo;Last updated&rdquo; date at the top will reflect any changes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">9. Contact</h2>
            <p>
              Questions about your privacy? Reach us through the app or at the contact details provided in the App Store listing.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
