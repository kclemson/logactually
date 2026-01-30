import { useNavigate } from "react-router-dom";
import { Shield, Database, Bot, Code, Eye, UserCheck, X } from "lucide-react";
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
    text: "Your data is yours. It's not sold, there are no ads, and no tracking pixels. This is a passion project built by one person (hi! it's me!), currently free to use. I originally built this for myself and find it genuinely useful — thought others might too.",
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
    items: [
      "No third-party analytics",
      "No tracking cookies or pixels",
      "No selling or sharing data with anyone",
    ],
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
      { label: "Passwords", description: "are hashed using bcrypt — never stored in plaintext" },
      { label: "Data isolation", description: "is enforced through Row-Level Security (RLS) policies — authenticated users can only access their own data" },
      { label: "Sessions", description: "use JWT tokens with secure, time-limited expiry" },
      { label: "All traffic", description: "is encrypted via HTTPS/TLS" },
      { label: "Infrastructure", description: "runs on SOC2 Type II compliant hosting" },
    ],
  },
  developerAccess: {
    title: "Developer Access",
    text: "Technically, I have the ability to see what's logged in the database — but the only reason I'd ever look is to investigate and fix a bug. Even then, I use my own data first (I use this app daily). Honestly, I have zero interest in your food diary. It's yours.",
  },
  footer: {
    lastUpdated: "Last updated: January 15, 2026",
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
            <p className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.shortVersion.text}
            </p>
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
                  <span>{item.label} — {item.description}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* What Data Is Not Collected */}
          <CollapsibleSection
            title={`${PRIVACY_CONTENT.notCollected.title} ${PRIVACY_CONTENT.notCollected.titleEmphasis} ${PRIVACY_CONTENT.notCollected.titleEnd}`}
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
          <CollapsibleSection
            title={PRIVACY_CONTENT.control.title}
            icon={Shield}
            storageKey="privacy-control"
          >
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
          <CollapsibleSection
            title={PRIVACY_CONTENT.aiProcessing.title}
            icon={Bot}
            storageKey="privacy-ai"
          >
            <p className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.aiProcessing.text}
            </p>
          </CollapsibleSection>

          {/* For the Technically Curious */}
          <CollapsibleSection
            title={PRIVACY_CONTENT.technical.title}
            icon={Code}
            storageKey="privacy-technical"
          >
            <p className="text-sm text-muted-foreground mb-2">{PRIVACY_CONTENT.technical.intro}</p>
            <ul className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.technical.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span>•</span>
                  <span>{item.label} {item.description}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Developer Access */}
          <CollapsibleSection
            title={PRIVACY_CONTENT.developerAccess.title}
            icon={UserCheck}
            storageKey="privacy-developer"
          >
            <p className="text-sm text-muted-foreground">
              {PRIVACY_CONTENT.developerAccess.text}
            </p>
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
