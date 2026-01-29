import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function DemoBanner() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleCreateAccount = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-3 py-2">
      <div className="mx-auto max-w-lg flex items-center justify-between gap-2">
        <span className="text-sm text-amber-800 dark:text-amber-200">
          You're viewing a demo
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCreateAccount}
          className="h-7 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/50"
        >
          Create Account
        </Button>
      </div>
    </div>
  );
}
