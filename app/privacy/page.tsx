import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Sustain-U",
  description: "How Sustain-U collects, stores, and uses information.",
};

const CONTACT_EMAIL = "akchr@ualberta.ca";
const EFFECTIVE_DATE = "July 20, 2026";

type Section = { title: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    title: "Information We Collect",
    body: (
      <>
        <p>
          Sustain-U does not require an account, sign-in, name, or email address to use any
          feature of the app. We do not operate a server-side database and do not collect,
          transmit, or store personal information such as your name, email address, or precise or
          approximate location.
        </p>
        <p className="mt-3">
          The app does not use analytics, advertising identifiers, cookies, or tracking pixels of
          any kind.
        </p>
      </>
    ),
  },
  {
    title: "How Information Is Used",
    body: (
      <p>
        Because Sustain-U does not collect personal information, there is no personal data for us
        to use, profile, or monetize. Any information described below in &quot;Local Device
        Storage&quot; is used only to make the app function on your own device (for example,
        remembering your CO₂ tracker entries between visits).
      </p>
    ),
  },
  {
    title: "Local Device Storage",
    body: (
      <>
        <p>
          Several features save data directly on your device using your browser&apos;s local
          storage (or the equivalent storage inside the Capacitor app on iOS/Android). This data
          stays on your device — it is not transmitted to us or to any third party. It includes:
        </p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>CO₂ self-tracker profiles and entries (a nickname you choose is stored locally, not tied to any account)</li>
          <li>Barcode/carbon-footprint scan history</li>
          <li>Eco-anxiety check-in responses</li>
          <li>Gratitude journal notes</li>
        </ul>
        <p className="mt-3">
          No login is required to use these features. Deleting the app, or clearing your
          browser&apos;s site data, permanently deletes this locally stored information.
        </p>
      </>
    ),
  },
  {
    title: "Third-Party Services and External Links",
    body: (
      <>
        <p>Sustain-U connects to the following third-party services to provide its features:</p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>
            <strong>Open Food Facts</strong> — when you scan or enter a product barcode, the
            barcode number is sent to the Open Food Facts public API to look up product
            information. No personal information is included in this request.
          </li>
          <li>
            <strong>Anthropic API</strong> — the carbon-footprint scanner may send basic product
            details (such as product name, brand, and category) to Anthropic&apos;s API to help
            classify a scanned product. No personal information about you is included in this
            request.
          </li>
          <li>
            <strong>MapLibre</strong> — the campus study-space map loads map style data from a
            MapLibre demo tile server to render map imagery.
          </li>
          <li>
            <strong>Esri/ArcGIS</strong> — the Official Campus Map page embeds the University of
            Alberta&apos;s ArcGIS-hosted map viewer directly from Esri&apos;s servers.
          </li>
          <li>
            <strong>Google Fonts</strong> — the app loads web fonts from Google Fonts.
          </li>
          <li>
            <strong>YouTube (no-cookie mode)</strong> and external PDF/document links (for
            example, an eco-anxiety guide) — these load content directly from their source when
            you view them.
          </li>
        </ul>
        <p className="mt-3">
          These services are operated by third parties and are governed by their own privacy
          policies. Loading any embedded map, video, or external resource causes your device to
          connect directly to that provider&apos;s servers, which may log standard technical
          information such as your IP address, as is common for any web request.
        </p>
        <p className="mt-3">
          The app also links out to external university and community resources (for example, the
          UAlberta Library, ETS Trip Planner, mental health resources, and campus walking trails).
          Sustain-U is not responsible for the privacy practices of these external sites.
        </p>
      </>
    ),
  },
  {
    title: "Embedded Maps, Videos, PDFs, and University Resources",
    body: (
      <p>
        Where Sustain-U embeds a map, video, or PDF (such as the ArcGIS campus map, YouTube
        wellness videos, or a linked PDF guide), that content is loaded directly from the
        provider&apos;s servers inside the app. Sustain-U does not intercept, store, or add
        tracking to this content beyond what the provider itself includes.
      </p>
    ),
  },
  {
    title: "Children's Privacy",
    body: (
      <p>
        Sustain-U does not knowingly collect personal information from anyone, including children.
        Because the app does not require accounts and does not collect personal information, it
        does not target or knowingly gather data from children under 13.
      </p>
    ),
  },
  {
    title: "Data Retention",
    body: (
      <p>
        We do not operate a server-side database of user data, so we do not retain personal
        information. Locally stored data (described above) remains on your device until you clear
        it or uninstall the app.
      </p>
    ),
  },
  {
    title: "Data Sharing",
    body: (
      <p>
        Sustain-U does not sell personal data. We do not share personal information with third
        parties for advertising or marketing purposes. The only data sent off your device is the
        minimal information described in &quot;Third-Party Services&quot; above (for example, a
        scanned barcode number, or basic product details for classification), which is required
        for those specific features to work.
      </p>
    ),
  },
  {
    title: "Security Limitations",
    body: (
      <p>
        We take reasonable care in how Sustain-U is built, but no method of electronic storage or
        transmission is completely secure. Data stored locally on your device is only as secure as
        the device itself. Requests to third-party services described above travel over HTTPS.
      </p>
    ),
  },
  {
    title: "Your Choices",
    body: (
      <p>
        You can use Sustain-U without providing any personal information. You can clear locally
        stored data at any time by clearing your scan history within the app, clearing your
        browser/app site data, or uninstalling the app. You can also choose not to use features
        that connect to third-party services (for example, the barcode scanner or campus map).
      </p>
    ),
  },
  {
    title: "Contact Information",
    body: (
      <p>
        Questions about this Privacy Policy or how Sustain-U works can be sent to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
  {
    title: "Policy Updates",
    body: (
      <p>
        If this Privacy Policy changes, the updated version will be posted on this page with a
        revised effective date. Continued use of the app after changes are posted constitutes
        acceptance of the updated policy.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-3 text-[15px] text-gray-500 leading-relaxed max-w-lg">
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
              {section.title}
            </p>
            <div className="text-[15px] text-gray-700 leading-relaxed">{section.body}</div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/support"
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[14px] font-medium no-underline hover:border-emerald-200 hover:text-emerald-700 transition-colors"
          >
            Support
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[14px] font-medium no-underline hover:border-emerald-200 hover:text-emerald-700 transition-colors"
          >
            Back to Sustain-U
          </Link>
        </div>

        <p className="text-[12px] text-gray-400 leading-relaxed pt-2">
          Sustain-U is an independent educational application and is not an official University of
          Alberta application.
        </p>
      </div>
    </div>
  );
}
