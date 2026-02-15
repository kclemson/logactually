import { format, parseISO } from "date-fns";

interface FeedbackMessageBodyProps {
  message: string;
  createdAt: string;
  response: string | null;
  respondedAt: string | null;
}

export function FeedbackMessageBody({ message, createdAt, response, respondedAt }: FeedbackMessageBodyProps) {
  return (
    <>
      <div className="ml-3 pl-3 border-l-2 border-border">
        <span className="text-xs text-muted-foreground">
          You wrote ({format(parseISO(createdAt), "MMM d, HH:mm")}):
        </span>
        <p className="text-xs whitespace-pre-wrap mt-0.5">{message}</p>
      </div>

      {response && respondedAt && (
        <div className="ml-3 pl-3 border-l-2 border-primary/30">
          <span className="text-xs text-muted-foreground">
            Response ({format(parseISO(respondedAt), "MMM d HH:mm")}):
          </span>
          <p className="text-xs whitespace-pre-wrap text-muted-foreground mt-0.5">{response}</p>
        </div>
      )}
    </>
  );
}
