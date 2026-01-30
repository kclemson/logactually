import { useNavigate } from "react-router-dom";
import { Shield, Database, Bot, Code, Eye, UserCheck, X } from "lucide-react";

// ============================================
// EDITABLE CONTENT - Modify strings here
// ============================================
const PRIVACY_CONTENT = {
  header: {
    title: "Privacy & Security",
  },
  shortVersion: {
    title: "The Short Version",
    text: "Your data is yours. It's not sold, there are no ads, and no tracking pixels. This is a passion project built by one person, currently free to use.",
    highlights: ["Your data is yours"],
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
  aiProcessing: {
    title: "How AI Processing Works",
    text: "When you log food or exercise, your text is sent to an AI model to provide nutritional or exercise information. Only the text you enter is sent — no user identifiers, account info, or other context is included. The AI knows the request came from this app, but nothing more specific than that.",
    highlights: ["no user identifiers", "nothing more specific"],
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
    text: "As a solo project, the developer has database access for debugging and support purposes. However, there is no routine review or mining of individual user data — logs are only accessed when investigating specific technical issues or responding to support requests.",
    highlights: ["no routine review or mining"],
  },
  control: {
    title: "Your Data, Your Control",
    items: [
      { text: "Export your data anytime as CSV", link: "Settings → Export", highlights: ["Export"] },
      { text: "Delete your account permanently", link: "Settings → Account", highlights: ["Delete"] },
      { text: "Questions or concerns? Drop a note in the Help section", highlights: ["Help section"] },
    ],
  },
  footer: {
    lastUpdated: "Last updated: January 2026",
  },
};
// ============================================

function highlightText(text: string, highlights: string[]) {
  if (!highlights.length) return text;

  const pattern = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isHighlight = highlights.some((h) => h.toLowerCase() === part.toLowerCase());
    return isHighlight ? (
      <span key={i} className="text-foreground font-medium">
        {part}
      </span>
    ) : (
      part
    );
  });
}

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6 relative">
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

          {/* The Short Version */}
          <section className="rounded-lg border bg-muted/30 p-4">
            <h2 className="text-sm font-medium mb-2">{PRIVACY_CONTENT.shortVersion.title}</h2>
            <p className="text-sm text-muted-foreground">
              {highlightText(PRIVACY_CONTENT.shortVersion.text, PRIVACY_CONTENT.shortVersion.highlights)}
            </p>
          </section>

          {/* What Data Is Collected */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">{PRIVACY_CONTENT.collected.title}</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {PRIVACY_CONTENT.collected.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-foreground">•</span>
                  <span>
                    <span className="text-foreground font-medium">{item.label}</span> — {item.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* What Data Is Not Collected */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">
                {PRIVACY_CONTENT.notCollected.title}{" "}
                <em>{PRIVACY_CONTENT.notCollected.titleEmphasis}</em>{" "}
                {PRIVACY_CONTENT.notCollected.titleEnd}
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {PRIVACY_CONTENT.notCollected.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-foreground">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* How AI Processing Works */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">{PRIVACY_CONTENT.aiProcessing.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {highlightText(PRIVACY_CONTENT.aiProcessing.text, PRIVACY_CONTENT.aiProcessing.highlights)}
            </p>
          </section>

          {/* For the Technically Curious */}
          <section className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Code className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">{PRIVACY_CONTENT.technical.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{PRIVACY_CONTENT.technical.intro}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {PRIVACY_CONTENT.technical.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-foreground">•</span>
                  <span>
                    <span className="text-foreground font-medium">{item.label}</span> {item.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Developer Access */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">{PRIVACY_CONTENT.developerAccess.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {highlightText(PRIVACY_CONTENT.developerAccess.text, PRIVACY_CONTENT.developerAccess.highlights)}
            </p>
          </section>

          {/* Your Data, Your Control */}
          <section>
            <h2 className="text-sm font-medium mb-3">{PRIVACY_CONTENT.control.title}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {PRIVACY_CONTENT.control.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-foreground">•</span>
                  <span>
                    {highlightText(item.text, item.highlights)}
                    {item.link && <span className="text-muted-foreground"> ({item.link})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Footer */}
          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground italic">{PRIVACY_CONTENT.footer.lastUpdated}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
