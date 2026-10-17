import { SearchX } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";

// Shared "no results" state for card listings (/services, /providers) —
// same markup, only the copy and reset handler differ per page.
export function ListingEmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-bg-secondary">
        <SearchX className="size-8 text-icon-secondary" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-medium text-text-primary">{title}</span>
        <span className="text-base text-text-secondary">{message}</span>
      </div>
      <AppButton
        variant="secondary-outline"
        onClick={onAction}
        className="rounded-lg border-border-default text-text-primary hover:bg-bg-secondary"
      >
        {actionLabel}
      </AppButton>
    </div>
  );
}
