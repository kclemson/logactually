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
      <span className="text-xs text-muted-foreground">
        Feedback created ({format(parseISO(createdAt), "MMM d, HH:mm")}):
      </span>
      <div className="ml-3 pl-3 border-l-2 border-border">
        <p className="text-xs whitespace-pre-wrap mt-0.5">{message}</p>
      </div>

      {response && respondedAt && (
        <>
          <span className="text-xs text-muted-foreground mt-2 block">
            Response ({format(parseISO(respondedAt), "MMM d HH:mm")}):
          </span>
          <div className="ml-3 pl-3 border-l-2 border-primary/30">
            <p className="text-xs whitespace-pre-wrap mt-0.5">{response}</p>
          </div>
        </>
      )}
    </>
  );
}
