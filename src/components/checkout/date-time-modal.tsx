"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parse,
  setMonth,
  setYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppButton } from "@/components/ui/app-button";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, PickDateTimeIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { getAvailableSlotApi } from "@/api/apiRoutes";
import { cn } from "@/lib/utils";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: format(new Date(2000, index, 1), "MMMM"),
}));

const YEAR_RANGE_SPAN = 12;

const TIME_INPUT_PATTERN = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i;

function normalizeTimeInput(value: string): string | null {
  const match = TIME_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, hour, minute, period] = match;
  return `${hour.padStart(2, "0")}:${minute} ${period.toUpperCase()}`;
}

interface AvailableSlot {
  time: string;
  is_available: number;
  /** Backend note attached to a slot — e.g. warns the job continues into the next day. */
  message?: string | null;
}

interface SlotOption {
  label: string;
  message: string | null;
}

/** Backend returns 24h "HH:mm:ss" (e.g. "09:00:00") — display in the same 12h format used everywhere else in this modal. */
function formatSlotLabel(time24: string): string {
  return format(parse(time24, "HH:mm:ss", new Date()), "hh:mm a");
}

export function DateTimeModal({
  open,
  onOpenChange,
  providerId,
  selectedDate,
  selectedTime,
  lockStatus,
  lockError,
  onConfirm,
  title,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  lockStatus: "idle" | "locking" | "locked" | "error";
  lockError: string | null;
  onConfirm: (date: Date, time: string, message: string | null) => Promise<boolean>;
  title?: string;
  confirmLabel?: string;
}) {
  const { t } = useTranslation();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? today);
  const [draftDate, setDraftDate] = useState<Date | null>(selectedDate);
  const [draftTime, setDraftTime] = useState<string | null>(selectedTime);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [timeText, setTimeText] = useState(selectedTime ?? "");
  const [availableSlots, setAvailableSlots] = useState<SlotOption[]>([]);
  const [slotsStatus, setSlotsStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open || !draftDate) return;
    setSlotsStatus("loading");
    setSlotsError(null);
    getAvailableSlotApi({ partner_id: providerId, date: format(draftDate, "yyyy-MM-dd") })
      .then((response) => {
        if (response?.error) throw new Error(response?.message);
        const rawSlots: AvailableSlot[] = response?.data?.all_slots ?? [];
        const slots = rawSlots
          .filter((slot) => slot.is_available === 1)
          .map((slot) => ({ label: formatSlotLabel(slot.time), message: slot.message ?? null }));
        setAvailableSlots(slots);
        setSlotsStatus("loaded");
      })
      .catch((error: unknown) => {
        setAvailableSlots([]);
        setSlotsStatus("error");
        setSlotsError(error instanceof Error && error.message ? error.message : null);
      });
  }, [open, draftDate, providerId]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth));
    const end = endOfWeek(endOfMonth(visibleMonth));
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const yearOptions = useMemo(
    () => Array.from({ length: YEAR_RANGE_SPAN }, (_, index) => today.getFullYear() + index),
    [today]
  );

  const handleUpdate = async () => {
    if (!draftDate || !draftTime) return;
    setConfirming(true);
    const success = await onConfirm(draftDate, draftTime, draftMessage);
    setConfirming(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraftDate(selectedDate);
          setDraftTime(selectedTime);
          setDraftMessage(null);
          setTimeText(selectedTime ?? "");
          setVisibleMonth(selectedDate ?? today);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex w-[1100px] max-w-[calc(100%-2rem)] flex-col items-center gap-0 rounded-xl bg-bg-primary p-0 ring-1 ring-border-default sm:max-w-[1100px]"
      >
        <div className="flex w-full items-center gap-6 rounded-t-xl border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-xl font-medium text-text-primary">
            {title ?? t("checkoutPage.dateTime.title")}
          </DialogTitle>
          <button
            type="button"
            aria-label={t("checkoutPage.dateTime.modal.closeAriaLabel")}
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center rounded-lg border border-button-secondary-outline-border bg-bg-secondary p-2 text-button-secondary-outline-text hover:opacity-90"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </div>

        <div className="flex w-full flex-col gap-6 p-6">
          <div className="flex h-[480px] w-full items-stretch gap-4">
            <div className="flex w-[474px] shrink-0 flex-col items-center rounded-lg border border-border-default bg-bg-primary">
              <div className="flex w-full items-center justify-between p-4">
                <button
                  type="button"
                  aria-label={t("checkoutPage.dateTime.modal.previousMonthAriaLabel")}
                  onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
                  className="rounded-sm p-1 text-button-link-primary-text hover:opacity-70"
                >
                  <ArrowLeftIcon className="size-5 rtl:rotate-180" />
                </button>
                <div className="flex items-center gap-3">
                  <Select
                    value={String(visibleMonth.getMonth())}
                    onValueChange={(value) => setVisibleMonth((month) => setMonth(month, Number(value)))}
                  >
                    <SelectTrigger className="h-auto gap-1 rounded-lg border-border-default bg-bg-secondary px-3 py-2 text-base text-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(visibleMonth.getFullYear())}
                    onValueChange={(value) => setVisibleMonth((month) => setYear(month, Number(value)))}
                  >
                    <SelectTrigger className="h-auto gap-1 rounded-lg border-border-default bg-bg-secondary px-3 py-2 text-base text-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  aria-label={t("checkoutPage.dateTime.modal.nextMonthAriaLabel")}
                  onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                  className="rounded-sm p-1 text-button-link-primary-text hover:opacity-70"
                >
                  <ArrowRightIcon className="size-5 rtl:rotate-180" />
                </button>
              </div>

              <div className="flex w-full flex-1 flex-col items-start">
                <div className="flex w-full justify-between border-y border-border-default bg-bg-secondary p-4">
                  {WEEKDAY_KEYS.map((key) => (
                    <span key={key} className="w-11 text-center text-base text-text-secondary">
                      {t(`checkoutPage.dateTime.modal.weekdayShort.${key}`)}
                    </span>
                  ))}
                </div>

                <div className="grid w-full flex-1 auto-rows-fr grid-cols-7 content-between px-4 py-3">
                  {days.map((day) => {
                    const disabled = isBefore(day, today) || !isSameMonth(day, visibleMonth);
                    const active = draftDate && isSameDay(day, draftDate);
                    return (
                      <div key={day.toISOString()} className="flex items-center justify-center">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (draftDate && isSameDay(day, draftDate)) return;
                            setDraftDate(day);
                            setDraftTime(null);
                            setDraftMessage(null);
                            setTimeText("");
                          }}
                          className={cn(
                            "flex size-11 items-center justify-center rounded-xl text-lg",
                            active
                              ? "bg-bg-brand text-text-inverse-light"
                              : "bg-bg-primary text-text-primary hover:bg-bg-secondary",
                            disabled && "pointer-events-none bg-transparent text-text-secondary hover:bg-transparent"
                          )}
                        >
                          {format(day, "d")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-px shrink-0 self-stretch bg-border-default" />

            <div className="flex flex-1 flex-col gap-6 overflow-hidden rounded-xl">
              {!draftDate ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <PickDateTimeIcon className="size-10 text-text-secondary" />
                  <span className="text-base text-text-secondary">
                    {t("checkoutPage.dateTime.modal.noDateSelected")}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex w-full flex-col gap-2">
                    <label htmlFor="checkout-preferred-time" className="text-base text-form-field-label">
                      {t("checkoutPage.dateTime.modal.timeLabel")}
                    </label>
                    <div
                      className={cn(
                        "flex w-full items-center gap-3 rounded-sm border px-4 py-2",
                        timeText && !normalizeTimeInput(timeText) ? "border-form-field-error-border" : "border-form-field-border"
                      )}
                    >
                      <input
                        id="checkout-preferred-time"
                        type="text"
                        value={timeText}
                        disabled={slotsStatus === "error"}
                        placeholder={t("checkoutPage.dateTime.modal.timePlaceholder")}
                        onChange={(event) => {
                          const value = event.target.value;
                          setTimeText(value);
                          setDraftTime(normalizeTimeInput(value));
                          setDraftMessage(null);
                        }}
                        className="w-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-form-field-placeholder disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        timeText && !normalizeTimeInput(timeText) ? "text-form-field-error" : "text-form-field-helper"
                      )}
                    >
                      {t("checkoutPage.dateTime.modal.timeHelper")}
                    </span>
                  </div>

                  <div className="grid flex-1 auto-rows-min grid-cols-3 content-start gap-x-3 gap-y-2 overflow-y-auto pr-1">
                    {slotsStatus === "loading" && (
                      <span className="col-span-3 text-sm text-text-secondary">
                        {t("checkoutPage.dateTime.modal.slotsLoading")}
                      </span>
                    )}
                    {slotsStatus === "loaded" && availableSlots.length === 0 && (
                      <span className="col-span-3 text-sm text-text-secondary">
                        {t("checkoutPage.dateTime.modal.slotsEmpty")}
                      </span>
                    )}
                    {slotsStatus === "error" && (
                      <span className="col-span-3 text-sm text-form-field-error">
                        {slotsError ?? t("checkoutPage.dateTime.modal.slotsError")}
                      </span>
                    )}
                    {availableSlots.map((slot) => {
                      const active = draftTime === slot.label;
                      return (
                        <button
                          key={slot.label}
                          type="button"
                          onClick={() => {
                            setDraftTime(slot.label);
                            setTimeText(slot.label);
                            setDraftMessage(slot.message);
                          }}
                          className={cn(
                            "flex h-12 shrink-0 items-center rounded-lg border p-3 text-base",
                            active
                              ? "border-border-brand bg-bg-brand-subtle text-text-brand"
                              : "border-border-default bg-bg-primary text-text-primary hover:bg-bg-secondary"
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>

                  {draftMessage && (
                    <div className="flex items-start gap-2 rounded-xl border border-alert-warning-border bg-alert-warning-bg p-3">
                      <Info className="mt-0.5 size-4 shrink-0 text-alert-warning-text" />
                      <span className="text-sm leading-snug text-alert-warning-text">{draftMessage}</span>
                    </div>
                  )}

                  {lockStatus === "error" && lockError && (
                    <span className="text-sm text-form-field-error">{lockError}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center gap-6 border-t border-border-default p-6">
          <AppButton
            variant="secondary"
            size="lg"
            className="flex-1"
            disabled={!draftDate || !draftTime || confirming || slotsStatus === "error"}
            onClick={handleUpdate}
          >
            {confirmLabel ?? t("checkoutPage.dateTime.modal.updateButton")}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
