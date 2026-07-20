import Link from "next/link";

export const metadata = {
  title: "Sustain-U Support",
  description: "Get help with Sustain-U, troubleshooting steps, and support contact information.",
};

const SUPPORT_EMAIL = "ecoclubsualberta@gmail.com";
const APP_VERSION = "1.0";

const TROUBLESHOOTING = [
  "Make sure the device has an active internet connection.",
  "Close and reopen the app.",
  "Refresh the page if content does not load.",
  "Confirm that Safari or the in-app browser is allowed to open external links.",
  "Update to the latest available version of Sustain-U.",
  "If a map, video, PDF, or external university resource does not load, try opening it again after checking the internet connection.",
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Sticky nav bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors no-underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Sustain-U
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight">
            Sustain-U Support
          </h1>
          <p className="mt-3 text-[15px] text-gray-500 leading-relaxed max-w-lg">
            Need help with Sustain-U? Review the common troubleshooting steps below or contact us
            directly.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Troubleshooting */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Basic Troubleshooting
          </p>
          <ul className="space-y-3">
            {TROUBLESHOOTING.map((step) => (
              <li key={step} className="flex items-start gap-3 text-[15px] text-gray-700 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Contact Us
          </p>
          <p className="text-[15px] text-gray-700 leading-relaxed">
            For technical support, accessibility concerns, privacy questions, or content
            corrections, contact:
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-[15px] no-underline hover:bg-emerald-100 transition-colors"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        {/* Privacy contact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Privacy Contact
          </p>
          <p className="text-[15px] text-gray-700 leading-relaxed">
            Questions about how Sustain-U handles your information can be sent to the same
            address above, or reviewed in full on the{" "}
            <Link href="/privacy" className="text-emerald-600 hover:underline">
              Privacy Policy
            </Link>{" "}
            page.
          </p>
        </div>

        {/* App version */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            App Version
          </p>
          <p className="text-[15px] text-gray-700">Sustain-U Version {APP_VERSION}</p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[14px] font-medium no-underline hover:border-emerald-200 hover:text-emerald-700 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[14px] font-medium no-underline hover:border-emerald-200 hover:text-emerald-700 transition-colors"
          >
            Back to Sustain-U
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-[12px] text-gray-400 leading-relaxed pt-2">
          Sustain-U is an independent educational application and is not an official University of
          Alberta application.
        </p>
      </div>
    </div>
  );
}
