import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmPopover } from "@/components/DeleteConfirmPopover";
import type { PinnedChat } from "@/hooks/usePinnedChats";

interface PinnedChatsViewProps {
  pinnedChats: PinnedChat[];
  onUnpin: (id: string) => void;
  onBack: () => void;
}

export function PinnedChatsView({ pinnedChats, onUnpin, onBack }: PinnedChatsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-7 px-2 text-xs">
          ← Back
        </Button>
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Pin className="h-4 w-4" />
          Pinned chats
        </span>
      </div>
    </div>
  );

  if (pinnedChats.length === 0) {
    return (
      <div className="space-y-3">
        {header}
        <p className="text-xs text-muted-foreground text-center py-8">
          No pinned chats yet. Pin an AI response to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {header}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {pinnedChats.map((chat) => {
          const isExpanded = expandedId === chat.id;
          return (
            <div key={chat.id} className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(chat.created_at), "MMM d h:mm a")}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted border border-border font-medium">
                      {chat.mode === "food" ? "Food" : "Exercise"}
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-snug">{chat.question}</p>
                </div>
                <DeleteConfirmPopover
                  id={chat.id}
                  label="Unpin chat"
                  description="This will remove the pinned chat."
                  onDelete={() => onUnpin(chat.id)}
                  openPopoverId={openPopoverId}
                  setOpenPopoverId={setOpenPopoverId}
                />
              </div>

              <button
                onClick={() => setExpandedId(isExpanded ? null : chat.id)}
                className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {isExpanded ? "Hide answer" : "Show answer"}
              </button>

              {isExpanded && (
                <div
                  className="text-xs text-foreground whitespace-pre-wrap leading-snug p-2 mt-1.5 rounded bg-background max-h-[40vh] overflow-y-auto [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      const escaped = chat.answer
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
                      return escaped.replace(/((?:^|\n)(?:[*\-] .+(?:\n|$))+)/g, (block) => {
                        const items = block
                          .trim()
                          .split("\n")
                          .map((line) => line.replace(/^[*\-] /, "").trim())
                          .filter(Boolean)
                          .map((item) => `<li>${item}</li>`)
                          .join("");
                        return `\n<ul class="list-disc ml-4 my-1">${items}</ul>\n`;
                      });
                    })(),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
