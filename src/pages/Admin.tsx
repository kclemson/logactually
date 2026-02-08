import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdminStats, useAdminUserStats } from "@/hooks/useAdminStats";
import { useLoginCount } from "@/hooks/useLoginCount";
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
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // All hooks must be called before any conditional returns
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: stats, isLoading, error } = useAdminStats();
  const { data: userStats, isLoading: isUserStatsLoading } = useAdminUserStats();
  const { data: feedback } = useAdminFeedback();
  const respondToFeedback = useRespondToFeedback();
  const hasHover = useHasHover();

  const { data: demoLoginsTotal } = useLoginCount("demo", null);
  const { data: demoLogins24h } = useLoginCount("demo", 24);
  const { data: demoLogins7d } = useLoginCount("demo", 168);

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
      {/* Stats grid: 3 columns */}
      <div className="grid grid-cols-[auto_auto_auto] gap-x-4 text-muted-foreground text-xs">
        {/* First column */}
        <div className="space-y-0">
          <p>Users: {stats?.total_users ?? 0}</p>
          <p>Logged Items: {stats?.total_entries ?? 0}</p>
        </div>

        {/* Second column */}
        <div className="space-y-0">
          <p>Demo logins: {demoLoginsTotal ?? 0}</p>
          <p>Last 24h: <span className={(demoLogins24h ?? 0) > 0 ? "text-green-500" : ""}>{demoLogins24h ?? 0}</span></p>
          <p>Last 7d: {demoLogins7d ?? 0}</p>
        </div>

        {/* Third column */}
        <div className="space-y-0">
          <p>Saved Meals: {stats?.total_saved_meals ?? 0}</p>
          <p>Saved Routines: {stats?.total_saved_routines ?? 0}</p>
        </div>
      </div>

      {isUserStatsLoading ? (
        <div className="flex justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : userStats && userStats.length > 0 ? (
        <TooltipProvider delayDuration={200}>
          {/* Dismiss backdrop for touch tooltips */}
          {!hasHover && activeTooltip && (
            <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />
          )}
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
                <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Logins</th>
                <th className="text-center py-0.5 font-medium text-muted-foreground">L2day</th>
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
                  <Tooltip
                    open={hasHover ? undefined : activeTooltip === `${user.user_id}-food`}
                    onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? `${user.user_id}-food` : null)}
                  >
                    <TooltipTrigger asChild>
                      <td
                        className={`text-center py-0.5 pr-2 ${user.entries_today > 0 ? "text-green-500" : "text-muted-foreground/50"} ${user.entries_today > 0 && user.food_today_details ? "cursor-default" : ""}`}
                        onClick={!hasHover && user.entries_today > 0 && user.food_today_details ? () => setActiveTooltip(activeTooltip === `${user.user_id}-food` ? null : `${user.user_id}-food`) : undefined}
                      >
                        {user.entries_today}
                      </td>
                    </TooltipTrigger>
                    {user.entries_today > 0 && user.food_today_details && (
                      <TooltipContent className="max-w-lg text-xs space-y-1 bg-popover text-popover-foreground border whitespace-nowrap">
                        {user.food_today_details.map((entry, i) => (
                          <div key={i}>
                            {entry.raw_input ? (
                              entry.items?.length === 1 ? (
                                <p>
                                  <span className="italic text-muted-foreground">"{entry.raw_input}"</span> →{" "}
                                  {entry.items[0]}
                                </p>
                              ) : (
                                <>
                                  <p className="italic text-muted-foreground">"{entry.raw_input}"</p>
                                  {entry.items?.map((item, j) => (
                                    <p key={j} className="pl-2">
                                      → {item}
                                    </p>
                                  ))}
                                </>
                              )
                            ) : entry.saved_meal_name ? (
                              <>
                                <p className="text-muted-foreground">[{entry.saved_meal_name}]</p>
                                {entry.items?.map((item, j) => (
                                  <p key={j} className="pl-2">
                                    • {item}
                                  </p>
                                ))}
                              </>
                            ) : (
                              entry.items?.map((item, j) => <p key={j}>• {item}</p>)
                            )}
                          </div>
                        ))}
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <Tooltip
                    open={hasHover ? undefined : activeTooltip === `${user.user_id}-weight`}
                    onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? `${user.user_id}-weight` : null)}
                  >
                    <TooltipTrigger asChild>
                      <td
                        className={`text-center py-0.5 pr-2 ${(user.weight_today ?? 0) > 0 ? "text-green-500" : "text-muted-foreground/50"} ${(user.weight_today ?? 0) > 0 && user.weight_today_details ? "cursor-default" : ""}`}
                        onClick={!hasHover && (user.weight_today ?? 0) > 0 && user.weight_today_details ? () => setActiveTooltip(activeTooltip === `${user.user_id}-weight` ? null : `${user.user_id}-weight`) : undefined}
                      >
                        {user.weight_today ?? 0}
                      </td>
                    </TooltipTrigger>
                    {(user.weight_today ?? 0) > 0 && user.weight_today_details && (
                      <TooltipContent className="max-w-lg text-xs space-y-1 bg-popover text-popover-foreground border whitespace-nowrap">
                        {user.weight_today_details.map((entry, i) => (
                          <div key={i}>
                            {entry.raw_input && entry.raw_input !== "From saved routine" ? (
                              <p>
                                <span className="italic text-muted-foreground">"{entry.raw_input}"</span> →{" "}
                                {entry.description}
                              </p>
                            ) : entry.saved_routine_name ? (
                              <p>
                                <span className="text-muted-foreground">[{entry.saved_routine_name}]</span>{" "}
                                {entry.description}
                              </p>
                            ) : (
                              <p>• {entry.description}</p>
                            )}
                          </div>
                        ))}
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <td
                    className={`text-center py-0.5 pr-2 ${user.total_entries === 0 ? "text-blue-400/50" : "text-blue-500"}`}
                  >
                    {user.total_entries}
                  </td>
                  <Tooltip
                    open={hasHover ? undefined : activeTooltip === `${user.user_id}-meals`}
                    onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? `${user.user_id}-meals` : null)}
                  >
                    <TooltipTrigger asChild>
                      <td
                        className={`text-center py-0.5 pr-2 ${(user.saved_meals_count ?? 0) === 0 ? "text-blue-400/50" : "text-blue-500"} ${(user.saved_meals_count ?? 0) > 0 && user.saved_meal_names ? "cursor-default" : ""}`}
                        onClick={!hasHover && (user.saved_meals_count ?? 0) > 0 && user.saved_meal_names ? () => setActiveTooltip(activeTooltip === `${user.user_id}-meals` ? null : `${user.user_id}-meals`) : undefined}
                      >
                        {user.saved_meals_count ?? 0}
                      </td>
                    </TooltipTrigger>
                    {(user.saved_meals_count ?? 0) > 0 && user.saved_meal_names && (
                      <TooltipContent className="max-w-lg text-xs space-y-0.5 bg-popover text-popover-foreground border">
                        {user.saved_meal_names.map((name, i) => (
                          <p key={i}>• {name}</p>
                        ))}
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <td
                    className={`text-center py-0.5 pr-2 ${(user.total_weight_entries ?? 0) === 0 ? "text-purple-400/50" : "text-purple-500"}`}
                  >
                    {user.total_weight_entries ?? 0}
                  </td>
                  <Tooltip
                    open={hasHover ? undefined : activeTooltip === `${user.user_id}-routines`}
                    onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? `${user.user_id}-routines` : null)}
                  >
                    <TooltipTrigger asChild>
                      <td
                        className={`text-center py-0.5 pr-2 ${(user.saved_routines_count ?? 0) === 0 ? "text-purple-400/50" : "text-purple-500"}`}
                        onClick={!hasHover && (user.saved_routines_count ?? 0) > 0 && user.saved_routine_names ? () => setActiveTooltip(activeTooltip === `${user.user_id}-routines` ? null : `${user.user_id}-routines`) : undefined}
                      >
                        {user.saved_routines_count ?? 0}
                      </td>
                    </TooltipTrigger>
                    {(user.saved_routines_count ?? 0) > 0 && user.saved_routine_names && (
                      <TooltipContent className="max-w-lg text-xs space-y-0.5 bg-popover text-popover-foreground border">
                        {user.saved_routine_names.map((name, i) => (
                          <p key={i}>• {name}</p>
                        ))}
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <td
                    className={`text-center py-0.5 pr-2 ${(user.login_count ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}
                  >
                    {user.login_count ?? 0}
                  </td>
                  <td
                    className={`text-center py-0.5 ${(user.logins_today ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}
                  >
                    {user.logins_today ?? 0}
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
                <td className={`text-center py-0.5 pr-2 ${row.entry_count === 0 ? "text-blue-400/50" : "text-blue-500"}`}>
                  {row.entry_count}
                </td>
                <td
                  className={`text-center py-0.5 pr-2 ${(row.weight_count ?? 0) === 0 ? "text-purple-400/50" : "text-purple-500"}`}
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
