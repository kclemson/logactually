import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CollapsibleSection } from '@/components/CollapsibleSection';

export function AboutSection() {
  return (
    <CollapsibleSection title="About" icon={Info} defaultOpen={true} storageKey="settings-about" iconClassName="text-zinc-500 dark:text-zinc-400">
      <div className="space-y-2">
        <Link
          to="/privacy"
          className="block text-sm text-foreground hover:underline underline-offset-2 transition-colors"
        >
          Privacy & Security
        </Link>
        <Link
          to="/changelog"
          className="block text-sm text-foreground hover:underline underline-offset-2 transition-colors"
        >
          Changelog (last updated Feb-15)
        </Link>
      </div>
    </CollapsibleSection>
  );
}
