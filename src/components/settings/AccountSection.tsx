import { useState } from 'react';
import { User } from 'lucide-react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { DEMO_EMAIL } from '@/lib/demo-mode';
import type { User as AuthUser } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';

interface AccountSectionProps {
  user: AuthUser | null;
  signOut: (opts?: { clearQueryCache?: () => void }) => Promise<void>;
  isReadOnly: boolean;
  queryClient: QueryClient;
}

export function AccountSection({ user, signOut, isReadOnly, queryClient }: AccountSectionProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const isDemoUser = user?.email === DEMO_EMAIL;

  return (
    <>
      <CollapsibleSection title="Account" icon={User} storageKey="settings-account" iconClassName="text-zinc-500 dark:text-zinc-400">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          {(!isReadOnly || !isDemoUser) && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Security</p>
              <div className="flex gap-2">
                {!isDemoUser && (
                  <button
                    onClick={() => setDeleteAccountOpen(true)}
                    className="rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    Delete Account
                  </button>
                )}
                {!isReadOnly && (
                  <button
                    onClick={() => setChangePasswordOpen(true)}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    Change Password
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Session</p>
            <button
              onClick={async () => {
                setIsSigningOut(true);
                await signOut({ clearQueryCache: () => queryClient.clear() });
              }}
              disabled={isSigningOut}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {changePasswordOpen && (
        <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          userEmail={user?.email || ""}
        />
      )}
      {deleteAccountOpen && <DeleteAccountDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />}
    </>
  );
}
