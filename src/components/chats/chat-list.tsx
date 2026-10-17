"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockProvidersIcon, VerifiedBadgeIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";
import { chatBookingStatusKey } from "@/lib/chats/chat-types";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import type { ChatListItem, ChatListFilter } from "@/lib/chats/use-chat-list";
import { getBookingStatusLabel, getBookingStatusTextClass } from "@/lib/helpers";

interface ChatListProps {
  tab: ChatListFilter;
  onTabChange: (tab: ChatListFilter) => void;
  conversations: ChatListItem[];
  selectedChatId: string | null;
  onSelectChat: (conversation: ChatListItem) => void;
  isLoading: boolean;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  tabTotals: Record<ChatListFilter, number>;
  allowPreBookingChat: boolean;
  allowPostBookingChat: boolean;
  onOpenBlockedProviders: () => void;
}

export function ChatList({
  tab,
  onTabChange,
  conversations,
  selectedChatId,
  onSelectChat,
  isLoading,
  onScroll,
  tabTotals,
  allowPreBookingChat,
  allowPostBookingChat,
  onOpenBlockedProviders,
}: ChatListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full min-h-0 flex-col items-start self-stretch overflow-hidden lg:w-96 lg:shrink-0 lg:rounded-tl-xl lg:rounded-bl-xl lg:border-r lg:border-border-default">
      <div className="flex w-full shrink-0 flex-col items-start">
        <div className="flex h-14 w-full items-center gap-2 bg-bg-primary px-4 py-2 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)] lg:h-20 lg:gap-6 lg:border-b lg:border-border-default lg:px-6 lg:py-4 lg:shadow-none">
          <div className="flex flex-1 flex-col items-start justify-center">
            <span className="text-base font-medium text-text-primary lg:hidden">{t("chats.mobileTitle")}</span>
            <span className="hidden text-xl font-medium text-text-primary lg:inline">{t("chats.listTitle")}</span>
          </div>
          <button
            type="button"
            onClick={onOpenBlockedProviders}
            className="flex items-center justify-center gap-2 rounded-3xl bg-bg-primary p-2 lg:rounded-lg lg:border lg:border-border-default lg:bg-bg-secondary"
            aria-label={t("chats.blockedProviders")}
          >
            <BlockProvidersIcon className="size-6 text-button-secondary-outline-text" />
          </button>
        </div>
      </div>

      {/* Mobile: underline-style tabs. */}
      <div className="flex w-full items-center gap-4 bg-bg-primary px-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.02)] lg:hidden">
        <button
          type="button"
          disabled={!allowPreBookingChat}
          onClick={() => allowPreBookingChat && onTabChange("pre_booking")}
          title={!allowPreBookingChat ? t("chats.preBookingChatDisabled") : undefined}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-3",
            tab === "pre_booking" ? "rounded-tl-lg rounded-tr-lg pt-2" : "py-2",
            !allowPreBookingChat && "cursor-not-allowed opacity-60"
          )}
        >
          <span className={cn("text-sm", tab === "pre_booking" ? "font-semibold text-text-brand" : "font-normal text-text-primary")}>
            {t("chats.enquiries")}
            {tabTotals.pre_booking > 0 && ` (${tabTotals.pre_booking})`}
          </span>
          {tab === "pre_booking" && <span className="h-1 w-full rounded-tl-lg rounded-tr-lg bg-bg-brand" />}
        </button>
        <button
          type="button"
          disabled={!allowPostBookingChat}
          onClick={() => allowPostBookingChat && onTabChange("booking")}
          title={!allowPostBookingChat ? t("chats.postBookingChatDisabled") : undefined}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-3",
            tab === "booking" ? "rounded-tl-lg rounded-tr-lg pt-2" : "py-2",
            !allowPostBookingChat && "cursor-not-allowed opacity-60"
          )}
        >
          <span className={cn("text-sm", tab === "booking" ? "font-semibold text-text-brand" : "font-normal text-text-primary")}>
            {t("chats.bookings")}
            {tabTotals.booking > 0 && ` (${tabTotals.booking})`}
          </span>
          {tab === "booking" && <span className="h-1 w-full rounded-tl-lg rounded-tr-lg bg-bg-brand" />}
        </button>
      </div>

      {/* Desktop: pill-style tabs, unchanged. */}
      <div className="hidden w-full items-center gap-4 bg-bg-primary p-6 lg:flex">
        <button
          type="button"
          disabled={!allowPreBookingChat}
          onClick={() => allowPreBookingChat && onTabChange("pre_booking")}
          title={!allowPreBookingChat ? t("chats.preBookingChatDisabled") : undefined}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-base",
            !allowPreBookingChat
              ? "cursor-not-allowed border border-border-default bg-bg-primary text-text-secondary opacity-60"
              : tab === "pre_booking"
                ? "bg-bg-inverse text-text-inverse-dark"
                : "border border-border-default bg-bg-primary text-text-primary"
          )}
        >
          {t("chats.enquiries")}
          {tabTotals.pre_booking > 0 && ` (${tabTotals.pre_booking})`}
        </button>
        <button
          type="button"
          disabled={!allowPostBookingChat}
          onClick={() => allowPostBookingChat && onTabChange("booking")}
          title={!allowPostBookingChat ? t("chats.postBookingChatDisabled") : undefined}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-base",
            !allowPostBookingChat
              ? "cursor-not-allowed border border-border-default bg-bg-primary text-text-secondary opacity-60"
              : tab === "booking"
                ? "bg-bg-inverse text-text-inverse-dark"
                : "border border-border-default bg-bg-primary text-text-primary"
          )}
        >
          {t("chats.bookings")}
          {tabTotals.booking > 0 && ` (${tabTotals.booking})`}
        </button>
      </div>

      <div
        onScroll={onScroll}
        className="thin-scrollbar-brand flex w-full min-h-0 flex-1 flex-col items-start gap-3 overflow-y-auto p-3"
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex w-full items-center gap-3 rounded-lg border border-border-default p-4">
              <Skeleton className="size-12 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="flex w-full flex-col items-center gap-2 py-16 text-center">
            <span className="text-sm text-text-secondary">{t("chats.emptyList")}</span>
          </div>
        ) : (
          conversations.map((conversation) => {
            const active = conversation.uniqueId === selectedChatId;
            const name = conversation.translated_partner_name || conversation.partner_name;
            const statusKey = chatBookingStatusKey(conversation.order_status);
            const unread = Number(conversation.un_read_chats ?? 0);
            const timestamp = conversation.updated_at
              ? formatDistanceToNowStrict(new Date(conversation.updated_at), { addSuffix: true })
              : null;

            const avatarRow = (
              <div className="flex w-full items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-full lg:size-12 lg:rounded-lg">
                  <AppImage src={conversation.image} alt={name} fill className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className="flex w-full min-w-0 items-center gap-1 text-sm font-semibold text-text-primary lg:text-base lg:font-normal">
                    <span className="truncate">{name}</span>
                    {conversation.is_provider_verified === 1 && (
                      <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                    )}
                  </span>
                  {conversation.booking_id ? (
                    <span className="w-full truncate text-xs text-text-secondary lg:hidden">
                      {conversation.last_message || t("chats.preBookingEnquiry")}
                    </span>
                  ) : (
                    <span className="w-full truncate text-xs text-text-secondary lg:text-sm">
                      {conversation.last_message || t("chats.preBookingEnquiry")}
                    </span>
                  )}
                  {conversation.booking_id && statusKey && (
                    <div className="hidden items-center gap-2 lg:flex">
                      <span className="line-clamp-1 text-sm text-text-primary">ID:{conversation.booking_id}</span>
                      <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-60" />
                      <span className={cn("line-clamp-1 text-sm", getBookingStatusTextClass(statusKey))}>
                        {getBookingStatusLabel(statusKey)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {timestamp && (
                    <span
                      className={cn(
                        "text-xs text-text-secondary",
                        conversation.booking_id && unread > 0 && "text-text-brand lg:text-text-secondary"
                      )}
                    >
                      {timestamp}
                    </span>
                  )}
                  {unread > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-bg-brand px-1.5 text-[10px] text-text-inverse-light lg:size-6 lg:rounded-3xl lg:text-xs">
                      {String(unread).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <button
                key={conversation.uniqueId}
                type="button"
                onClick={() => onSelectChat(conversation)}
                className={cn(
                  "flex w-full flex-col items-start gap-3 rounded-xl bg-card-bg p-3 text-start lg:rounded-lg lg:p-4",
                  active ? "lg:border lg:border-border-brand lg:bg-bg-brand-subtle" : "lg:border lg:border-border-default lg:bg-bg-primary"
                )}
              >
                {conversation.booking_id && statusKey && (
                  <>
                    <div className="flex w-full items-center justify-between lg:hidden">
                      <span className="rounded-sm bg-bg-secondary px-2 py-1 text-xs text-text-primary">
                        #{conversation.booking_id}
                      </span>
                      <BookingStatusBadge statusKey={statusKey} fallbackLabel={conversation.order_status ?? ""} />
                    </div>
                    <div className="h-0 w-full border-t border-dashed border-border-default lg:hidden" />
                  </>
                )}
                {avatarRow}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
