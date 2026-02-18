import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdminStats, useAdminUserStats } from "@/hooks/useAdminStats";
import { useLoginCount } from "@/hooks/useLoginCount";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAdminFeedback, useRespondToFeedback, useResolveFeedback } from "@/hooks/feedback";
import { useHasHover } from "@/hooks/use-has-hover";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO, isToday } from "date-fns";
import { MessageSquare, FileSearch, ChevronDown } from "lucide-react";
import { truncate } from "@/lib/feedback-utils";
import { FeedbackMessageBody } from "@/components/FeedbackMessageBody";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PopulateDemoDataDialog } from "@/components/PopulateDemoDataDialog";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { AppleHealthExplorer } from "@/components/AppleHealthExplorer";



export default function Admin() {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyMode, setReplyMode] = useState<'edit' | 'new'>('new');
  const [showPopulateDialog, setShowPopulateDialog] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [expandedFeedbackIds, setExpandedFeedbackIds] = useState<Set<string>>(new Set());

  // All hooks must be called before any conditional returns
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: stats, isLoading, error } = useAdminStats();
  const { data: userStats, isLoading: isUserStatsLoading } = useAdminUserStats();
  const { data: feedback } = useAdminFeedback();
  const respondToFeedback = useRespondToFeedback();
  const resolveFeedback = useResolveFeedback();
  const hasHover = useHasHover();
  const isMobile = useIsMobile();

  const activeUserStats = userStats?.filter(user => {
    if (!user.last_active) return false;
    const lastActive = parseISO(user.last_active);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return lastActive >= twoWeeksAgo;
  });

  const openFeedback = feedback?.filter(f => !f.resolved_at) ?? [];
  const resolvedFeedback = (feedback?.filter(f => !!f.resolved_at) ?? [])
    .sort((a, b) => {
      const latest = (f: typeof a) =>
        Math.max(
          new Date(f.resolved_at!).getTime(),
          f.responded_at ? new Date(f.responded_at).getTime() : 0,
          new Date(f.created_at).getTime(),
        );
      return latest(b) - latest(a);
    });

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

  const handleStartReply = (feedbackId: string, existingResponse: string | null, mode: 'edit' | 'new') => {
    setReplyingToId(feedbackId);
    setReplyMode(mode);
    setReplyText(mode === 'edit' ? (existingResponse ?? "") : "");
    setExpandedFeedbackIds(prev => new Set(prev).add(feedbackId));
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyText("");
    setReplyMode('new');
  };

  const toggleFeedbackExpand = (id: string) => {
    const next = new Set(expandedFeedbackIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedFeedbackIds(next);
  };

  const handleResolve = async (feedbackId: string, resolve: boolean, reason?: string) => {
    const scrollY = window.scrollY;
    await resolveFeedback.mutateAsync({ feedbackId, resolve, reason });
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  const handleSendReply = async (feedbackId: string, existingResponse: string | null) => {
    if (!replyText.trim()) return;

    let finalResponse: string;
    if (replyMode === 'new' && existingResponse) {
      finalResponse = `${existingResponse}\n---\nFollow-up on ${format(new Date(), "MMM d h:mm a")}:\n${replyText.trim()}`;
    } else {
      finalResponse = replyText.trim();
    }

    try {
      await respondToFeedback.mutateAsync({ feedbackId, response: finalResponse });
      setReplyingToId(null);
      setReplyText("");
      setReplyMode('new');
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
      ) : activeUserStats && activeUserStats.length > 0 ? (
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
                <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">F2d</th>
                <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">W2d</th>
                <th className="text-center py-0.5 pr-1 font-medium text-muted-foreground">F</th>
                <th className="text-center py-0.5 pr-1 font-medium text-muted-foreground">SF</th>
                <th className="text-center py-0.5 pr-1 font-medium text-muted-foreground">W</th>
                <th className="text-center py-0.5 pr-1 font-medium text-muted-foreground">SW</th>
                <th className="text-center py-0.5 pr-1 font-medium text-muted-foreground">C</th>
                <th className="text-center py-0.5 pr-1 font-medium text-muted-foreground">Cs</th>
              </tr>
            </thead>
            <tbody>
              {activeUserStats.map((user) => (
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
                    {`User #${user.user_number}`}
                  </td>
                  <td
                    className={`text-center py-0.5 pr-2 whitespace-nowrap ${user.last_active && isToday(parseISO(user.last_active)) ? "text-green-500" : ""}`}
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
                    className={`text-center py-0.5 pr-1 ${user.total_entries === 0 ? "text-blue-400/50" : "text-blue-500"}`}
                  >
                    {user.total_entries}
                  </td>
                  <Tooltip
                    open={hasHover ? undefined : activeTooltip === `${user.user_id}-meals`}
                    onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? `${user.user_id}-meals` : null)}
                  >
                    <TooltipTrigger asChild>
                      <td
                        className={`text-center py-0.5 pr-1 ${(user.saved_meals_count ?? 0) === 0 ? "text-blue-400/50" : "text-blue-500"} ${(user.saved_meals_count ?? 0) > 0 && user.saved_meal_names ? "cursor-default" : ""}`}
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
                    className={`text-center py-0.5 pr-1 ${(user.total_weight_entries ?? 0) === 0 ? "text-purple-400/50" : "text-purple-500"}`}
                  >
                    {user.total_weight_entries ?? 0}
                  </td>
                  <Tooltip
                    open={hasHover ? undefined : activeTooltip === `${user.user_id}-routines`}
                    onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? `${user.user_id}-routines` : null)}
                  >
                    <TooltipTrigger asChild>
                      <td
                        className={`text-center py-0.5 pr-1 ${(user.saved_routines_count ?? 0) === 0 ? "text-purple-400/50" : "text-purple-500"}`}
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
                    className={`text-center py-0.5 pr-1 ${user.custom_logs_enabled ? "text-teal-500" : "text-muted-foreground/50"}`}
                  >
                    {user.custom_logs_enabled ? "✓" : "—"}
                  </td>
                  <td
                    className={`text-center py-0.5 pr-1 ${(user.custom_log_entries_count ?? 0) === 0 ? "text-teal-400/50" : "text-teal-500"}`}
                  >
                    {user.custom_log_entries_count ?? 0}
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

      {/* Feedback section - open items */}
      {openFeedback.length > 0 && (
        <CollapsibleSection
          title={`Feedback (${openFeedback.length})`}
          icon={MessageSquare}
          defaultOpen={false}
          storageKey="admin-feedback"
          iconClassName="text-muted-foreground"
        >
          <div className="space-y-0">
            {openFeedback.map((f) => {
              const isExpanded = expandedFeedbackIds.has(f.id);
              return (
                <div key={f.id} className="border-b border-border/50 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleFeedbackExpand(f.id)}
                    className="w-full text-left py-2 flex flex-col gap-0.5"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="text-muted-foreground font-mono">#{f.feedback_id}</span>
                      <span className="text-muted-foreground">{format(parseISO(f.created_at), "MMM d")}</span>
                      <span className="text-muted-foreground">User #{f.user_number}</span>
                      {!f.response && (
                        <span className="text-foreground">Active</span>
                      )}
                      {f.response && (
                        <span className="text-[hsl(217_91%_60%)]">• Response</span>
                      )}
                      <ChevronDown className={cn(
                        "h-3 w-3 ml-auto md:ml-0 md:order-last text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                      {replyingToId !== f.id && (
                        <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
                          {f.response ? (
                            <>
                              <button
                                className="text-[hsl(217_91%_60%)] underline"
                                onClick={(e) => { e.stopPropagation(); handleStartReply(f.id, f.response, 'edit'); }}
                              >
                                Edit Reply
                              </button>
                              <button
                                className="text-[hsl(217_91%_60%)] underline"
                                onClick={(e) => { e.stopPropagation(); handleStartReply(f.id, f.response, 'new'); }}
                              >
                                New Reply
                              </button>
                            </>
                          ) : (
                            <button
                              className="text-[hsl(217_91%_60%)] underline"
                              onClick={(e) => { e.stopPropagation(); handleStartReply(f.id, f.response, 'edit'); }}
                            >
                              Reply
                            </button>
                          )}
                          <button
                            className="text-green-600 dark:text-green-400 underline"
                            onClick={(e) => { e.stopPropagation(); handleResolve(f.id, true); }}
                          >
                            Resolve
                          </button>
                          <button
                            className="text-green-600 dark:text-green-400 underline"
                            onClick={(e) => { e.stopPropagation(); handleResolve(f.id, true, 'fixed'); }}
                          >
                            Resolve Fixed
                          </button>
                        </div>
                      )}
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground truncate">{truncate(f.message)}</p>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pb-3 space-y-2">
                      <FeedbackMessageBody
                        message={f.message}
                        createdAt={f.created_at}
                        response={replyingToId === f.id && replyMode === 'edit' ? null : f.response}
                        respondedAt={f.responded_at}
                      />

                      {replyingToId === f.id && (
                        <div className="space-y-1 pt-1">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={replyMode === 'edit' ? "Edit your response..." : "Add a new reply..."}
                            className="min-h-[60px] text-xs"
                            maxLength={5000}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => handleSendReply(f.id, f.response)}
                              disabled={!replyText.trim() || respondToFeedback.isPending}
                            >
                              {respondToFeedback.isPending ? "Sending..." : "Send"}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={handleCancelReply}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Resolved feedback section */}
      {resolvedFeedback.length > 0 && (
        <CollapsibleSection
          title={`Resolved (${resolvedFeedback.length})`}
          icon={MessageSquare}
          defaultOpen={false}
          storageKey="admin-feedback-resolved"
          iconClassName="text-muted-foreground"
        >
          <div className="space-y-0">
            {resolvedFeedback.map((f) => {
              const isExpanded = expandedFeedbackIds.has(f.id);
              return (
                <div key={f.id} className="border-b border-border/50 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleFeedbackExpand(f.id)}
                    className="w-full text-left py-2 flex flex-col gap-0.5"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="text-muted-foreground font-mono">#{f.feedback_id}</span>
                      <span className="text-muted-foreground">{format(parseISO(f.created_at), "MMM d")}</span>
                      <span className="text-muted-foreground">User #{f.user_number}</span>
                      {f.resolved_reason === 'fixed' ? (
                        <span className="text-green-600 dark:text-green-400">✓ Fixed</span>
                      ) : (
                        <span className="text-[hsl(217_91%_60%)]">✓ Resolved</span>
                      )}
                      {f.response && (
                        <span className="text-[hsl(217_91%_60%)]">• Response</span>
                      )}
                      <ChevronDown className={cn(
                        "h-3 w-3 ml-auto md:ml-0 md:order-last text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                      <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
                        <button
                          className="text-orange-500 underline"
                          onClick={(e) => { e.stopPropagation(); handleResolve(f.id, false); }}
                        >
                          Unresolve
                        </button>
                      </div>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground truncate">{truncate(f.message)}</p>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pb-3 space-y-2">
                      <FeedbackMessageBody
                        message={f.message}
                        createdAt={f.created_at}
                        response={f.response}
                        respondedAt={f.responded_at}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Health Export Explorer */}
      <CollapsibleSection
        title="Health Export Explorer"
        icon={FileSearch}
        defaultOpen={false}
        storageKey="admin-health-explorer"
        iconClassName="text-muted-foreground"
      >
        <AppleHealthExplorer />
      </CollapsibleSection>

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
