import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChhaonLogo } from "~/components/chhaon-logo";
import { HeatRampStrip } from "~/components/heat-ramp-strip";
import { cn } from "~/lib/utils";
import { demoScopeNote } from "~/lib/demo";
import { heatLevelDetails } from "~/lib/heat-level-details";
import {
  awsServices,
  capabilities,
  headlineNumbers,
  journeySteps,
  roadmapItems,
  scoreExplainer,
} from "~/lib/landing-content";

type SectionProps = { eyebrow: string; title: string; intro?: string; children: React.ReactNode };

const cardClassName = "flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6";

const Section = ({ eyebrow, title, intro, children }: SectionProps) => (
  <section className="flex flex-col gap-6 border-t border-line pt-12">
    <div className="flex max-w-2xl flex-col gap-2">
      <span className="font-heading text-sm font-bold tracking-widest text-sun-deep uppercase">{eyebrow}</span>
      <h2 className="font-heading text-3xl leading-tight font-bold tracking-tight">{title}</h2>
      {intro && <p className="font-body text-lg text-ink-soft">{intro}</p>}
    </div>
    {children}
  </section>
);

export const LandingScreen = () => (
  <main className="mx-auto flex max-w-5xl flex-col gap-14 px-5 py-8 sm:py-12">
    <header className="flex flex-col gap-10">
      <ChhaonLogo />
      <div className="flex max-w-3xl flex-col gap-5">
        <span className="font-heading text-sm font-bold tracking-widest text-sun-deep uppercase">
          Heat and water access · Delhi
        </span>
        <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
          Know where the heat is. Find the nearest shade and water.
        </h1>
        <p className="font-body text-xl text-ink-soft">
          Chhaon joins satellite images, weather and population into one heat map of Delhi. Then it shows each person
          the closest cooling point and a walking route.
        </p>
        <HeatRampStrip className="max-w-md" />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/ward"
            className="group flex h-14 items-center gap-2 rounded-2xl bg-brand px-6 font-heading text-lg font-semibold text-surface"
          >
            See the heat map
            <ArrowRight size={20} className="transition group-hover:translate-x-1" />
          </Link>
          <Link
            href="/public"
            className="flex h-14 items-center rounded-2xl border border-brand px-6 font-heading text-lg font-semibold text-brand"
          >
            Find a cool place near me
          </Link>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {headlineNumbers.map(({ value, label }) => (
          <div key={label} className="flex flex-col gap-1 border-l-2 border-sun pl-4">
            <dt className="font-body text-sm text-ink-soft">{label}</dt>
            <dd className="font-heading text-3xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </header>

    <Section
      eyebrow="How to use it"
      title="Three steps from heat to action"
      intro="Most people start with the map. Then they look for a place close to them."
    >
      <ol className="grid gap-4 md:grid-cols-3">
        {journeySteps.map(({ Icon, title, description, href, callToAction }, stepIndex) => (
          <li key={title}>
            <Link href={href} className={cn(cardClassName, "group h-full ring-brand transition hover:-translate-y-0.5 hover:ring-2 focus-visible:ring-2")}>
              <div className="flex items-center justify-between">
                <span className="font-heading text-5xl leading-none font-bold text-sun">0{stepIndex + 1}</span>
                <Icon size={28} className="text-brand" />
              </div>
              <h3 className="font-heading text-xl font-bold">{title}</h3>
              <p className="font-body text-base text-ink-soft">{description}</p>
              <span className="mt-auto flex items-center gap-2 font-heading text-base font-semibold text-brand">
                {callToAction}
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Section>

    <Section
      eyebrow="What we built"
      title="From satellite pixels to a walking route"
      intro="Every part below runs today. Each part has one job."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map(({ Icon, title, description }) => (
          <li key={title} className={cardClassName}>
            <Icon size={24} className="text-brand" />
            <h3 className="font-heading text-lg font-bold">{title}</h3>
            <p className="font-body text-base text-ink-soft">{description}</p>
          </li>
        ))}
      </ul>
    </Section>

    <Section
      eyebrow="How it scores"
      title="One score for each 250 m cell"
      intro="The satellite shows where heat stays. The weather shows how bad the day is."
    >
      <div className="flex flex-col gap-4 rounded-2xl bg-brand-soft p-6">
        <p className="font-heading text-xl font-bold text-brand-deep">{scoreExplainer.formula}</p>
        <HeatRampStrip className="max-w-md" />
        <ul className="flex flex-wrap gap-3">
          {scoreExplainer.levels.map(({ level, range }) => (
            <li
              key={level}
              className={cn("rounded-full px-4 py-1.5 font-heading text-base font-semibold", heatLevelDetails[level].cardClass)}
            >
              {heatLevelDetails[level].label}: {range}
            </li>
          ))}
        </ul>
        <p className="font-body text-base text-ink-soft">
          All values are surface heat from the last clear satellite pass. They are not air temperature.
        </p>
      </div>
    </Section>

    <Section
      eyebrow="Built on AWS"
      title="Six AWS services in the live build"
      intro="The API runs on Amazon EC2 in ap-southeast-2. Landsat surface temperature comes from Google Earth Engine."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {awsServices.map(({ name, role }) => (
          <li key={name} className={cardClassName}>
            <h3 className="font-heading text-lg font-bold">{name}</h3>
            <p className="font-body text-base text-ink-soft">{role}</p>
          </li>
        ))}
      </ul>
    </Section>

    <Section
      eyebrow="Built to grow"
      title="Not built yet. Ready to build."
      intro="We had two days. These items are planned. The design already has a place for each one."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roadmapItems.map(({ Icon, title, description, horizon }) => (
          <li key={title} className="flex flex-col gap-3 rounded-2xl border border-dashed border-sun-deep/40 p-6">
            <div className="flex items-center justify-between">
              <Icon size={24} className="text-sun-deep" />
              <span className="rounded-full bg-sun-soft px-2.5 py-0.5 font-heading text-xs font-bold text-sun-deep uppercase">
                {horizon}
              </span>
            </div>
            <h3 className="font-heading text-lg font-bold">{title}</h3>
            <p className="font-body text-base text-ink-soft">{description}</p>
          </li>
        ))}
      </ul>
    </Section>

    <footer className="flex flex-col gap-2 border-t border-line pt-6 pb-4">
      <p className="font-body text-sm text-ink-faint">{demoScopeNote}</p>
      <p className="font-body text-sm text-ink-faint">
        Made for Environmental Hacks 2026, Heat and Water track, by Ishaan Gupta (design and frontend) and Paramveer
        (backend, data and AWS).
      </p>
    </footer>
  </main>
);
