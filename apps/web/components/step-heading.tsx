import { InfoHint } from "~/components/info-hint";

type StepHeadingProps = { stepNumber: number; title: string; hintText?: string };

export const StepHeading = ({ stepNumber, title, hintText }: StepHeadingProps) => (
  <div className="flex items-center gap-3">
    <span className="flex size-8 items-center justify-center rounded-full bg-brand font-heading text-base font-bold text-surface">
      {stepNumber}
    </span>
    <h2 className="font-heading text-xl font-bold">{title}</h2>
    {hintText && <InfoHint hintText={hintText} />}
  </div>
);
