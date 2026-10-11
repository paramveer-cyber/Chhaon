"use client";

import { CircleCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useReportCorrection } from "~/hooks/cooling-point";

const reportCopy = {
  en: {
    open: "Report a problem",
    options: { closed: "The place is closed", hours: "The opening hours are wrong" },
    typeLabel: "Type of problem",
    messageLabel: "Describe the problem",
    placeholder: "Tell us what you saw.",
    send: "Send report",
    sending: "Sending…",
    thanks: "Thank you. We will check your report.",
  },
  hi: {
    open: "समस्या बताएँ",
    options: { closed: "जगह बंद है", hours: "खुलने का समय गलत है" },
    typeLabel: "समस्या का प्रकार",
    messageLabel: "समस्या बताएँ",
    placeholder: "आपने क्या देखा, लिखें।",
    send: "रिपोर्ट भेजें",
    sending: "भेज रहे हैं…",
    thanks: "धन्यवाद। हम आपकी रिपोर्ट देखेंगे।",
  },
} as const;

const reportTypes = ["closed", "hours"] as const;

type ReportType = (typeof reportTypes)[number];

type ReportFormProps = { coolingPointId: number; language?: "en" | "hi" };

const fieldClassName = "rounded-xl bg-surface px-3 py-2 font-body text-base text-ink";

export const ReportForm = ({ coolingPointId, language = "en" }: ReportFormProps) => {
  const copy = reportCopy[language];
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
        {copy.thanks}
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
          {copy.open}
        </button>
      )}
      {isOpen && (
        <form onSubmit={submitReport} className="flex flex-col gap-2">
          <select
            value={reportType}
            onChange={(changeEvent) => setReportType(changeEvent.target.value as ReportType)}
            aria-label={copy.typeLabel}
            className={fieldClassName}
          >
            {reportTypes.map((value) => (
              <option key={value} value={value}>
                {copy.options[value]}
              </option>
            ))}
          </select>
          <textarea
            required
            maxLength={500}
            rows={2}
            value={messageText}
            onChange={(changeEvent) => setMessageText(changeEvent.target.value)}
            aria-label={copy.messageLabel}
            placeholder={copy.placeholder}
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
            {reportMutation.isPending ? copy.sending : copy.send}
          </button>
        </form>
      )}
    </div>
  );
};
