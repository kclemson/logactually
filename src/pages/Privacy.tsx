import { useNavigate } from "react-router-dom";
import { Shield, Database, Bot, Code, Eye, Wrench, ScrollText, X } from "lucide-react";
import { CollapsibleSection } from "@/components/CollapsibleSection";

// ============================================
// EDITABLE CONTENT - Modify strings here
// ============================================
const PRIVACY_CONTENT = {
  header: {
    title: "Privacy, Security & Terms",
  },
  shortVersion: {
    title: "The Short Version",
    text: "Your data is yours. It's not sold, there are no ads, and no tracking pixels. This is a passion project built by one person (hi! it's me!), currently free to use. I originally built this for myself and find it genuinely useful, and hope others might too.",
  },
  collected: {
    title: "What Data Is Collected",
    items: [
      { label: "Email address", description: "for login" },
      { label: "Food and exercise entries", description: "what you choose to log" },
      { label: "Saved meals and routines", description: "for quick re-logging" },
      { label: "Preferences", description: "like theme and weight units" },
    ],
  },
  notCollected: {
    title: "What Data Is",
    titleEmphasis: "Not",
    titleEnd: "Collected",
    items: ["No third-party analytics", "No tracking cookies or pixels", "No selling or sharing data with anyone"],
  },
  control: {
    title: "Your Data, Your Control",
    items: [
      { text: "Export your data anytime as CSV", link: "Settings → Export" },
      { text: "Delete your account permanently", link: "Settings → Account" },
      { text: "Questions or concerns? Drop a note in the Help section" },
    ],
  },
  aiProcessing: {
    title: "How AI Processing Works",
    text: "When you log food or exercise, your input is sent to an AI model that parses your freeform text and returns structured data — calories, macros, sets, reps — so you don't have to do the formatting or math yourself. Only the text you enter is sent — no user identifiers, account info, or other context. The AI knows the request came from this app, but nothing more specific than that.",
  },
  technical: {
    title: "For the Technically Curious",
    intro: "If you're wondering about the security implementation:",
    items: [
      {
        label: "Passwords",
        description: "are hashed using bcrypt — never stored in plaintext, and not visible to anyone (including me)",
      },
      {
        label: "Data isolation",
        description:
          "is enforced through Row-Level Security (RLS) policies — authenticated users can only access their own data",
      },
      {
        label: "Sessions",
        description: "use JWT access tokens (1-hour expiry by default) with single-use refresh tokens",
      },
      {
        label: "All traffic",
        description:
          "is encrypted via HTTPS/TLS — both between your device and the server, and between the server and AI services",
      },
      { label: "Infrastructure", description: "runs on SOC2 Type II compliant hosting" },
      {
        label: "Browser storage",
        description: "(localStorage) is used only for UI preferences like theme and collapsed sections — no tracking or analytics cookies",
      },
    ],
    links: [
      { label: "Supabase Security", url: "https://supabase.com/docs/guides/security/soc-2-compliance" },
      { label: "Lovable Security", url: "https://lovable.dev/security" },
    ],
  },
  howBuilt: {
    title: "How This Was Built",
    text: "This app was built using AI-assisted development tools. The security mechanisms described above — password hashing, data isolation, session management — are handled at the infrastructure level, not custom code. If I ever need to debug something that requires looking at raw data logged, I use my own data (since I use this app daily).",
    socialText: "I recently retired after >25 years in the tech industry — but once a product-maker, always a product-maker. I've done my best to make sure this app is built with care. You can find me on social media at the links below.",
    socialLinks: [
      { name: "Bluesky", url: "https://bsky.app/profile/kclemson.bsky.social" },
      { name: "Mastodon", url: "https://mastodon.social/@kclemson" },
    ],
  },
  terms: {
    title: "Terms of Use",
    items: [
      {
        label: "As-is service",
        description: "This app is provided as-is, without warranties of any kind. Use it at your own discretion.",
      },
      {
        label: "AI-generated data",
        description: "Nutritional estimates and exercise parsing are AI-generated and may contain errors. Always verify important health data.",
      },
      {
        label: "Service availability",
        description: "The service may be modified, suspended, or discontinued at any time without notice.",
      },
      {
        label: "Account termination",
        description: "Accounts may be removed for abuse or at the operator's discretion. You can delete your own account anytime.",
      },
      {
        label: "Liability",
        description: "The developer is not liable for any damages arising from use of this service.",
      },
    ],
  },
  footer: {
    lastUpdated: "Last updated: January 30, 2026",
  },
};

// Social media icon components
const BlueskyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
  </svg>
);

const MastodonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.668 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
  </svg>
);
// ============================================

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4 relative">
          {/* Close button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute right-0 top-0 p-2 -mr-2 -mt-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{PRIVACY_CONTENT.header.title}</h1>
          </div>

          {/* The Short Version - always visible */}
          <section className="rounded-lg border bg-muted/30 p-4">
            <h2 className="text-sm font-medium mb-2">{PRIVACY_CONTENT.shortVersion.title}</h2>
            <p className="text-sm text-muted-foreground">{PRIVACY_CONTENT.shortVersion.text}</p>
          </section>

          {/* What Data Is Collected */}
          <CollapsibleSection
            title={PRIVACY_CONTENT.collected.title}
            icon={Database}
            defaultOpen
            storageKey="privacy-collected"
          >
            <ul className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.collected.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span>•</span>
                  <span>
                    {item.label} — {item.description}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* What Data Is Not Collected */}
          <CollapsibleSection
            title={
              <>
                What Data Is <u>Not</u> Collected
              </>
            }
            icon={Eye}
            defaultOpen
            storageKey="privacy-not-collected"
          >
            <ul className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.notCollected.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Your Data, Your Control */}
          <CollapsibleSection title={PRIVACY_CONTENT.control.title} icon={Shield} defaultOpen storageKey="privacy-control">
            <ul className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.control.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span>•</span>
                  <span>
                    {item.text}
                    {item.link && <span> ({item.link})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* How AI Processing Works */}
          <CollapsibleSection title={PRIVACY_CONTENT.aiProcessing.title} icon={Bot} defaultOpen storageKey="privacy-ai">
            <p className="text-sm text-muted-foreground">{PRIVACY_CONTENT.aiProcessing.text}</p>
          </CollapsibleSection>

          {/* For the Technically Curious */}
          <CollapsibleSection title={PRIVACY_CONTENT.technical.title} icon={Code} defaultOpen storageKey="privacy-technical">
            <p className="text-sm text-muted-foreground mb-2">{PRIVACY_CONTENT.technical.intro}</p>
            <ul className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.technical.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span>•</span>
                  <span>
                    {item.label} {item.description}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Reference:{" "}
              {PRIVACY_CONTENT.technical.links.map((link, index) => (
                <span key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                  {index < PRIVACY_CONTENT.technical.links.length - 1 && " · "}
                </span>
              ))}
            </p>
          </CollapsibleSection>

          {/* How This Was Built */}
          <CollapsibleSection title={PRIVACY_CONTENT.howBuilt.title} icon={Wrench} defaultOpen storageKey="privacy-how-built">
            <p className="text-sm text-muted-foreground">{PRIVACY_CONTENT.howBuilt.text}</p>
            <p className="text-sm text-muted-foreground mt-3">{PRIVACY_CONTENT.howBuilt.socialText}</p>
            <div className="flex justify-center gap-4 mt-2">
              {PRIVACY_CONTENT.howBuilt.socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={link.name}
                >
                  {link.name === "Bluesky" && <BlueskyIcon className="h-5 w-5" />}
                  {link.name === "Mastodon" && <MastodonIcon className="h-5 w-5" />}
                </a>
              ))}
            </div>
          </CollapsibleSection>

          {/* Terms of Use */}
          <CollapsibleSection title={PRIVACY_CONTENT.terms.title} icon={ScrollText} defaultOpen storageKey="privacy-terms">
            <ul className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.terms.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>{item.label}:</strong> {item.description}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Footer */}
          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground italic">{PRIVACY_CONTENT.footer.lastUpdated}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
