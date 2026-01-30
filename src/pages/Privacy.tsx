import { useNavigate } from "react-router-dom";
import { Shield, Database, Bot, Code, Eye, Wrench, X } from "lucide-react";
import { CollapsibleSection } from "@/components/CollapsibleSection";

// ============================================
// EDITABLE CONTENT - Modify strings here
// ============================================
const PRIVACY_CONTENT = {
  header: {
    title: "Privacy & Security",
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
    ],
    links: [
      { label: "Lovable Security", url: "https://lovable.dev/security" },
      { label: "Infrastructure Security", url: "https://supabase.com/docs/guides/security/soc-2-compliance" },
    ],
  },
  howBuilt: {
    title: "How This Was Built",
    text: "This app was built using AI-assisted development tools. The security mechanisms described above — password hashing, data isolation, session management — are handled at the infrastructure level, not custom code. I can see your email address in the database, but not your password (it's hashed). If I ever need to debug something that requires looking at raw data, I use my own data (since I use this app daily).",
  },
  footer: {
    lastUpdated: "Last updated: January 29, 2026",
  },
};
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
          <CollapsibleSection title={PRIVACY_CONTENT.control.title} icon={Shield} storageKey="privacy-control">
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
          <CollapsibleSection title={PRIVACY_CONTENT.aiProcessing.title} icon={Bot} storageKey="privacy-ai">
            <p className="text-sm text-muted-foreground">{PRIVACY_CONTENT.aiProcessing.text}</p>
          </CollapsibleSection>

          {/* For the Technically Curious */}
          <CollapsibleSection title={PRIVACY_CONTENT.technical.title} icon={Code} storageKey="privacy-technical">
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
              For verification:{" "}
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
          <CollapsibleSection title={PRIVACY_CONTENT.howBuilt.title} icon={Wrench} storageKey="privacy-how-built">
            <p className="text-sm text-muted-foreground">{PRIVACY_CONTENT.howBuilt.text}</p>
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
