import { InfoHint } from "~/components/info-hint";

type StatTileProps = { label: string; value: React.ReactNode; hintText?: string };

export const StatTile = ({ label, value, hintText }: StatTileProps) => (
  <div className="flex items-baseline gap-2.5">
    <span className="flex items-center gap-1 font-body text-base text-ink-soft">
      {label}
      {hintText && <InfoHint hintText={hintText} />}
    </span>
    <span className="font-heading text-3xl leading-none font-bold tabular-nums">{value}</span>
  </div>
);
