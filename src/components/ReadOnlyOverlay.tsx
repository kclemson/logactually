import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

export function ReadOnlyOverlay() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { showOverlay, overlayMode, dismissOverlay } = useReadOnlyContext();

  const handleCreateAccount = async () => {
    dismissOverlay();
    await signOut({ clearQueryCache: () => queryClient.clear() });
    navigate('/auth');
  };

  const isWelcome = overlayMode === 'welcome';

  return (
    <Dialog open={showOverlay} onOpenChange={(open) => !open && dismissOverlay()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isWelcome ? 'Welcome to the Demo!' : 'Demo is Read-Only'}
          </DialogTitle>
          <DialogDescription>
            {isWelcome ? (
              <>
                You're exploring with sample data. Browse around and see how everything works.
                Changes won't be saved.
              </>
            ) : (
            <>
              This demo account is read-only — your changes won't be saved.
              Create a free account to track your own data.
            </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={dismissOverlay} className="w-full sm:w-auto">
            OK
          </Button>
          {!isWelcome && (
            <Button onClick={handleCreateAccount} className="w-full sm:w-auto">
              Create Free Account
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
