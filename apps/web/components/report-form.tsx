"use client";

import { CircleCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useReportCorrection } from "~/hooks/cooling-point";

const reportTypeOptions = [
  { value: "closed", label: "The place is closed" },
  { value: "hours", label: "The opening hours are wrong" },
] as const;

type ReportType = (typeof reportTypeOptions)[number]["value"];

type ReportFormProps = { coolingPointId: number };

const fieldClassName = "rounded-xl bg-surface px-3 py-2 font-body text-base text-ink";

export const ReportForm = ({ coolingPointId }: ReportFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("closed");
  const [messageText, setMessageText] = useState("");
  const reportMutation = useReportCorrection();

  const submitReport = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    reportMutation.mutate({ reportType, coolingPointId, message: messageText });
  };

  if (reportMutation.isSuccess) {
    return (
      <p role="status" className="flex items-center gap-2 font-body text-base text-brand-deep">
        <CircleCheck size={20} className="animate-pop" />
        Thank you. We will check your report.
      </p>
    );
  }

  return (
    <div onClick={(clickEvent) => clickEvent.stopPropagation()}>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="font-body text-sm font-semibold text-ink-soft underline"
        >
          Report a problem
        </button>
      )}
      {isOpen && (
        <form onSubmit={submitReport} className="flex flex-col gap-2">
          <select
            value={reportType}
            onChange={(changeEvent) => setReportType(changeEvent.target.value as ReportType)}
            aria-label="Type of problem"
            className={fieldClassName}
          >
            {reportTypeOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            required
            maxLength={500}
            rows={2}
            value={messageText}
            onChange={(changeEvent) => setMessageText(changeEvent.target.value)}
            aria-label="Describe the problem"
            placeholder="Tell us what you saw."
            className={fieldClassName}
          />
          {reportMutation.error && (
            <p role="alert" className="font-body text-sm text-heat-high-deep">
              {reportMutation.error.message}
            </p>
          )}
          <button
            type="submit"
            disabled={reportMutation.isPending}
            className="h-11 rounded-xl bg-brand-deep font-heading text-base font-semibold text-surface disabled:opacity-60"
          >
            {reportMutation.isPending ? "Sending…" : "Send report"}
          </button>
        </form>
      )}
    </div>
  );
};
