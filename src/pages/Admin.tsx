import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdminStats, useAdminUserStats } from "@/hooks/useAdminStats";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAdminFeedback, useRespondToFeedback } from "@/hooks/feedback";
import { useHasHover } from "@/hooks/use-has-hover";
import { format, parseISO, isToday } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PopulateDemoDataDialog } from "@/components/PopulateDemoDataDialog";
import { CollapsibleSection } from "@/components/CollapsibleSection";

const USER_NAMES: Record<number, string> = {
  1: "KC",
  2: "Jared",
  3: "Kristy",
  4: "Elisabetta",
  5: "Elisabetta2",
  6: "test",
  8: "test2",
  9: "Malcolm",
  10: "Jenny",
};

export default function Admin() {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showPopulateDialog, setShowPopulateDialog] = useState(false);

  // All hooks must be called before any conditional returns
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: stats, isLoading, error } = useAdminStats();
  const { data: userStats, isLoading: isUserStatsLoading } = useAdminUserStats();
  const { data: feedback } = useAdminFeedback();
  const respondToFeedback = useRespondToFeedback();
  const hasHover = useHasHover();

  // Render nothing while checking admin status - no spinner, no flash
  if (isAdminLoading) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-destructive">Error loading stats: {(error as Error).message}</div>;
  }

  const avgEntriesPerUser = stats && stats.total_users > 0 ? (stats.total_entries / stats.total_users).toFixed(1) : "0";

  const pct = (value: number) => (stats && stats.total_users > 0 ? Math.round((value / stats.total_users) * 100) : 0);

  const handleStartReply = (feedbackId: string, existingResponse: string | null) => {
    setReplyingToId(feedbackId);
    setReplyText(existingResponse ?? "");
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyText("");
  };

  const handleSendReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;

    try {
      await respondToFeedback.mutateAsync({ feedbackId, response: replyText.trim() });
      setReplyingToId(null);
      setReplyText("");
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  return (
    <div className="px-1 py-2 space-y-4">
      {/* Stats grid: 3 columns, 2 rows */}
      <div className="grid grid-cols-[auto_auto_auto] gap-x-1 gap-y-0.5 text-muted-foreground text-xs">
        {/* Row 1: Headers */}
        <p className="font-medium">Users: {stats?.total_users ?? 0}</p>
        <p className="font-medium">Logged Items: {stats?.total_entries ?? 0}</p>
        <p className="font-medium">Saved Meals: {stats?.total_saved_meals ?? 0}</p>

        {/* Row 2: Sub-stats */}
        <div className="space-y-0">
          <p>Demo logins: {stats?.demo_logins ?? 0}</p>
          <p>
            Active RL7: {stats?.active_last_7_days ?? 0} ({pct(stats?.active_last_7_days ?? 0)}%)
          </p>
          <p>
            Created RL7: {stats?.users_created_last_7_days ?? 0} ({pct(stats?.users_created_last_7_days ?? 0)}%)
          </p>
        </div>
        <div className="space-y-0">
          <p>Avg/user: {avgEntriesPerUser}</p>
          <p>Created RL7: {stats?.entries_created_last_7_days ?? 0}</p>
        </div>
        <div className="space-y-0">
          <p>Users w/SM: {stats?.users_with_saved_meals ?? 0}</p>
          <p>Avg SM/user: {stats?.avg_saved_meals_per_user ?? 0}</p>
          <p>SM used RL7: {stats?.saved_meals_used_last_7_days ?? 0}</p>
        </div>
      </div>

      {isUserStatsLoading ? (
        <div className="flex justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : userStats && userStats.length > 0 ? (
        <TooltipProvider delayDuration={200}>
        <table className="w-auto text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-0.5 pr-2 font-medium text-muted-foreground whitespace-nowrap">User</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Last</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">F2day</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">W2day</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">F</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">SF</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">W</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">SW</th>
              <th className="text-center py-0.5 font-medium text-muted-foreground">Logins</th>
            </tr>
          </thead>
          <tbody>
            {userStats.map((user) => (
              <tr key={user.user_id} className="border-b border-border/50">
                <td
                  className={`py-0.5 pr-2 whitespace-nowrap ${
                    user.entries_today > 0 ||
                    (user.weight_today ?? 0) > 0 ||
                    (user.last_active && isToday(parseISO(user.last_active)))
                      ? "text-green-500"
                      : ""
                  }`}
                >
                  {USER_NAMES[user.user_number] ?? `User #${user.user_number}`}
                </td>
                <td
                  className={`text-center py-0.5 pr-2 ${user.last_active && isToday(parseISO(user.last_active)) ? "text-green-500" : ""}`}
                >
                  {user.last_active ? format(parseISO(user.last_active), "MMM d") : "—"}
                </td>
                {hasHover && user.entries_today > 0 && user.food_today_details ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <td className="text-center py-0.5 pr-2 text-green-500 cursor-default">
                        {user.entries_today}
                      </td>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-lg text-xs space-y-1 bg-popover text-popover-foreground border whitespace-nowrap">
                      {user.food_today_details.map((entry, i) => (
                        <div key={i}>
                          {entry.items?.map((item, j) => (
                            <p key={j}>
                              {entry.raw_input ? (
                                <>
                                  <span className="italic text-muted-foreground">"{entry.raw_input}"</span> → {item}
                                </>
                              ) : (
                                <>• {item}</>
                              )}
                            </p>
                          ))}
                        </div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <td
                    className={`text-center py-0.5 pr-2 ${user.entries_today > 0 ? "text-green-500" : "text-muted-foreground/50"}`}
                  >
                    {user.entries_today}
                  </td>
                )}
                {hasHover && (user.weight_today ?? 0) > 0 && user.weight_today_details ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <td className="text-center py-0.5 pr-2 text-green-500 cursor-default">
                        {user.weight_today ?? 0}
                      </td>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-lg text-xs space-y-1 bg-popover text-popover-foreground border whitespace-nowrap">
                      {user.weight_today_details.map((entry, i) => (
                        <div key={i}>
                          {entry.raw_input ? (
                            <p><span className="italic text-muted-foreground">"{entry.raw_input}"</span> → {entry.description}</p>
                          ) : (
                            <p>• {entry.description}</p>
                          )}
                        </div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <td
                    className={`text-center py-0.5 pr-2 ${(user.weight_today ?? 0) > 0 ? "text-green-500" : "text-muted-foreground/50"}`}
                  >
                    {user.weight_today ?? 0}
                  </td>
                )}
                <td className={`text-center py-0.5 pr-2 ${user.total_entries === 0 ? "text-muted-foreground/50" : ""}`}>
                  {user.total_entries}
                </td>
                <td
                  className={`text-center py-0.5 pr-2 ${(user.saved_meals_count ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}
                >
                  {user.saved_meals_count ?? 0}
                </td>
                <td
                  className={`text-center py-0.5 pr-2 ${(user.total_weight_entries ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}
                >
                  {user.total_weight_entries ?? 0}
                </td>
                <td
                  className={`text-center py-0.5 pr-2 ${(user.saved_routines_count ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}
                >
                  {user.saved_routines_count ?? 0}
                </td>
                <td className={`text-center py-0.5 ${(user.login_count ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}>
                  {user.login_count ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </TooltipProvider>
      ) : (
        <p className="text-muted-foreground text-xs">No users found.</p>
      )}

      {/* Daily stats table */}
      {stats?.daily_stats && stats.daily_stats.length > 0 ? (
        <table className="w-auto text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-0.5 pr-2 font-medium text-muted-foreground">Date</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Food Logged</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Weight Logged</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Users</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Active Users</th>
              <th className="text-center py-0.5 font-medium text-muted-foreground">New Users</th>
            </tr>
          </thead>
          <tbody>
            {stats.daily_stats.slice(0, 7).map((row) => (
              <tr key={row.stat_date} className="border-b border-border/50">
                <td className="py-0.5 pr-2 whitespace-nowrap">{format(parseISO(row.stat_date), "MMM-dd")}</td>
                <td className={`text-center py-0.5 pr-2 ${row.entry_count === 0 ? "text-muted-foreground/50" : ""}`}>
                  {row.entry_count}
                </td>
                <td
                  className={`text-center py-0.5 pr-2 ${(row.weight_count ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}
                >
                  {row.weight_count ?? 0}
                </td>
                <td className="text-center py-0.5 pr-2">{row.total_users}</td>
                <td
                  className={`text-center py-0.5 pr-2 ${row.users_with_entries === 0 ? "text-muted-foreground/50" : ""}`}
                >
                  {row.users_with_entries}
                </td>
                <td className={`text-center py-0.5 ${row.users_created === 0 ? "text-muted-foreground/50" : ""}`}>
                  {row.users_created}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted-foreground text-xs">No data in the last 14 days.</p>
      )}

      {/* Feedback section */}
      {feedback && feedback.length > 0 && (
        <CollapsibleSection
          title={`Feedback (${feedback.length})`}
          icon={MessageSquare}
          defaultOpen={false}
          storageKey="admin-feedback"
          iconClassName="text-muted-foreground"
        >
          <div className="space-y-1">
            {feedback.map((f) => (
              <div key={f.id} className="text-xs border-b border-border/50 py-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {USER_NAMES[f.user_number] ?? `User #${f.user_number}`} • {format(parseISO(f.created_at), "MMM d")}
                  </span>
                  {replyingToId !== f.id && (
                    <button
                      className="text-[hsl(217_91%_60%)] underline hover:text-[hsl(217_91%_70%)]"
                      onClick={() => handleStartReply(f.id, f.response)}
                    >
                      {f.response ? "Edit Reply" : "Reply"}
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{f.message}</p>

                {/* Show existing response */}
                {f.response && replyingToId !== f.id && (
                  <div className="ml-2 pl-2 border-l-2 border-primary/30 text-muted-foreground">
                    <span className="text-[10px]">Response ({format(parseISO(f.responded_at!), "MMM d")})</span>
                    <p className="whitespace-pre-wrap">{f.response}</p>
                  </div>
                )}

                {/* Reply form */}
                {replyingToId === f.id ? (
                  <div className="space-y-1 pt-1">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a response..."
                      className="min-h-[60px] text-xs"
                      maxLength={1000}
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => handleSendReply(f.id)}
                        disabled={!replyText.trim() || respondToFeedback.isPending}
                      >
                        {respondToFeedback.isPending ? "Sending..." : "Send"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={handleCancelReply}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Populate Demo Data */}
      <div className="pt-2 border-t border-border">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowPopulateDialog(true)}>
          Populate Demo Data
        </Button>
      </div>

      <PopulateDemoDataDialog open={showPopulateDialog} onOpenChange={setShowPopulateDialog} />
    </div>
  );
}
