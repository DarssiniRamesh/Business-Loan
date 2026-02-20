import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuildingColumns,
  faBolt,
  faChartLine,
  faChevronRight,
  faCircleCheck,
  faLock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { getOpenApiDocsUrl } from "../api/axiosConfig";

/**
 * PUBLIC_INTERFACE
 * Landing page for the Applicant Portal (fintech-professional, scrollable).
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <TrustStrip />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur"
      data-cy="navbar"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2" data-cy="navbar-brand">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <FontAwesomeIcon icon={faBuildingColumns} />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-slate-900">
              BusinessLoan
            </div>
            <div className="text-xs font-medium text-slate-500">
              Applicant Portal
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <a className="hover:text-slate-900" href="#how-it-works">
            How it Works
          </a>
          <a className="hover:text-slate-900" href="#rates">
            Rates
          </a>
          <a className="hover:text-slate-900" href="#faq">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            data-cy="navbar-login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline-flex"
          >
            Login
          </Link>
          <Link
            to="/signup"
            data-cy="navbar-signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            Get Started <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-slate-900/10 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-4 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
          >
            Fund Your Business Growth{" "}
            <span className="text-blue-500">in Minutes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
            className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            A modern applicant experience built for trust and speed: secure
            onboarding, guided data entry, and fast decisions with transparent
            terms.
          </motion.p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
              >
                Check Eligibility <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </Link>
            </motion.div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FontAwesomeIcon icon={faCircleCheck} className="text-blue-500" />
              Bank-grade security. No impact to credit score.
            </div>
          </div>

          <div id="how-it-works" className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { title: "Apply", desc: "Guided steps in minutes." },
              { title: "Verify", desc: "Secure document upload." },
              { title: "Decide", desc: "Fast eligibility outcome." },
            ].map((it) => (
              <div
                key={it.title}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="text-sm font-bold text-slate-900">{it.title}</div>
                <div className="mt-1 text-xs text-slate-600">{it.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          {/* Abstract illustration (no external assets required): layered cards */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto max-w-md"
          >
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-3xl bg-blue-500/20 blur-xl" />
            <div className="absolute -bottom-8 -right-10 h-32 w-32 rounded-3xl bg-slate-900/10 blur-2xl" />

            <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900">Projected Cashflow</div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  12 mo
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Q1", "Q2", "Q3", "Q4"].map((q, idx) => (
                  <div
                    key={q}
                    className={[
                      "h-20 rounded-2xl",
                      idx === 2 ? "bg-blue-500/25" : "bg-slate-100",
                    ].join(" ")}
                  />
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-900 p-4 text-white">
                  <div className="text-xs text-white/70">Funding</div>
                  <div className="mt-1 text-lg font-extrabold">$50M+</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-500">Avg Decision</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900">
                    &lt; 5 min
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FontAwesomeIcon icon={faLock} className="text-blue-500" />
                  Secure, encrypted submissions
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Built for financial trust and compliance-ready workflows.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rates anchor section (simple placeholder section per requirements) */}
      <section id="rates" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Transparent rates and terms
            </h2>
            <p className="mt-3 text-slate-600">
              Clear, upfront pricing with no confusing surprises. Terms vary by
              eligibility and business profile.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { k: "APR Range", v: "8% – 24%" },
              { k: "Funding Speed", v: "As fast as 1–2 days" },
              { k: "Loan Amounts", v: "$10k – $500k" },
            ].map((card) => (
              <div
                key={card.k}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="text-xs font-semibold text-slate-500">{card.k}</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  {card.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

function Features() {
  const cards = [
    {
      icon: faShieldHalved,
      title: "Bank-Grade Security",
      desc: "Encrypted data flows, least-privilege access, and audit-friendly design.",
    },
    {
      icon: faBolt,
      title: "Instant Decisions",
      desc: "Fast eligibility outcomes to keep your business moving forward.",
    },
    {
      icon: faChartLine,
      title: "Transparent Rates",
      desc: "Clear pricing and terms designed for clarity and trust.",
    },
  ];

  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Built for speed, clarity, and trust
          </h2>
          <p className="mt-3 text-slate-600">
            A modern workflow for applicants—with careful attention to security,
            usability, and accessibility.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((c, idx) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: idx * 0.06, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600">
                  <FontAwesomeIcon icon={c.icon} />
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  {c.title}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.desc}</p>

              <div className="mt-6">
                <Link
                  to="/signup"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Get started <span aria-hidden="true">→</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Trusted by growing businesses
            </div>
            <div className="mt-2 text-lg font-extrabold text-slate-900">
              Secure funding workflows designed for financial confidence.
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:grid-cols-3">
            {[
              { k: "$50M+", v: "Funded" },
              { k: "&lt; 5 min", v: "Avg decision" },
              { k: "TLS 1.3", v: "In transit" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="text-sm font-extrabold text-slate-900">{s.k}</div>
                <div className="text-xs font-semibold text-slate-500">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grayscale “logos” placeholder strip */}
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {["Partner A", "Partner B", "Partner C", "Partner D", "Partner E"].map(
            (p) => (
              <div
                key={p}
                className="flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                {p}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: "Will this impact my credit score?",
      a: "Checking eligibility is designed to be low-impact. Final underwriting may require additional verification.",
    },
    {
      q: "What documents do I need?",
      a: "Common requirements include bank statements and tax returns (PDF/JPG/PNG).",
    },
    {
      q: "How is my data protected?",
      a: "We use encrypted connections (TLS), secure storage practices, and token-based authentication.",
    },
  ];

  return (
    <section id="faq" className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-slate-600">
            Quick answers to common questions about applying and security.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.q}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="text-sm font-extrabold text-slate-900">{it.q}</div>
              <div className="mt-2 text-sm leading-relaxed text-slate-600">
                {it.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                <FontAwesomeIcon icon={faBuildingColumns} />
              </span>
              <div className="text-sm font-extrabold text-slate-900">
                BusinessLoan
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              A secure, modern applicant portal for business financing.
            </p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Product
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a className="hover:text-slate-900" href="#how-it-works">
                  How it Works
                </a>
              </li>
              <li>
                <a className="hover:text-slate-900" href="#rates">
                  Rates
                </a>
              </li>
              <li>
                <a className="hover:text-slate-900" href="#faq">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Company
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a className="hover:text-slate-900" href="#faq">
                  Support
                </a>
              </li>
              <li>
                <a className="hover:text-slate-900" href="#faq">
                  Security
                </a>
              </li>
              <li>
                <a className="hover:text-slate-900" href="#faq">
                  Compliance
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Legal
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Terms</li>
              <li>Privacy</li>
              <li>Disclosures</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 text-xs text-slate-500">
          © {new Date().getFullYear()} BusinessLoan Applicant Portal. All rights reserved.
          <div className="mt-2">
            Disclaimer: This is an MVP experience; terms and eligibility vary by applicant and verification results.
          </div>

          {process.env.REACT_APP_NODE_ENV !== "production" ? (
            <div className="mt-3">
              <a
                href={getOpenApiDocsUrl()}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Backend API Docs (/v3/api-docs)
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
