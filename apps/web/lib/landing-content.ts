import {
  Bell,
  Braces,
  CloudSun,
  Database,
  Flag,
  Globe,
  HeartPulse,
  History,
  Languages,
  Landmark,
  ListChecks,
  MapPinned,
  RefreshCw,
  Route,
  Satellite,
  ShieldCheck,
  Sparkles,
  Trees,
  Users,
  type LucideIcon,
} from "lucide-react";

type ContentItem = { Icon: LucideIcon; title: string; description: string };

export type JourneyStep = ContentItem & { href: string; callToAction: string };
export type RoadmapItem = ContentItem & { horizon: "Next" | "Later" };

export const headlineNumbers = [
  { value: "42,387", label: "heat cells, 250 m each" },
  { value: "8,770", label: "cooling points mapped" },
  { value: "5", label: "open data sources" },
  { value: "10 min", label: "walk used to measure access" },
];

export const journeySteps: JourneyStep[] = [
  {
    Icon: Satellite,
    title: "See where the heat is",
    description: "Open the heat map of Delhi. Red cells trap the most heat. Pick any day, also a past hot day.",
    href: "/ward",
    callToAction: "Open the heat map",
  },
  {
    Icon: MapPinned,
    title: "Find the nearest cool place",
    description: "Share your location. Get the 3 closest places with shade or water, and a walking route.",
    href: "/public",
    callToAction: "Find a place near me",
  },
  {
    Icon: ListChecks,
    title: "Plan which places to open",
    description: "Officers get a ranked list of 10 places. The list shows how many more people it reaches.",
    href: "/ward#plan",
    callToAction: "See the daily plan",
  },
];

export const capabilities: ContentItem[] = [
  {
    Icon: Satellite,
    title: "Satellite surface heat",
    description: "Landsat 8 and 9 thermal band, about 100 m. Read through Google Earth Engine.",
  },
  {
    Icon: Trees,
    title: "Trees, buildings and water",
    description: "Sentinel-2 images from AWS Open Data. We compute NDVI, NDBI and NDWI from them.",
  },
  {
    Icon: CloudSun,
    title: "Weather of the day",
    description: "Open-Meteo apparent temperature. It sets how severe the day is. The satellite sets where.",
  },
  {
    Icon: Users,
    title: "People per cell",
    description: "WorldPop population is added to each cell. We rank by people at risk, not by area.",
  },
  {
    Icon: Database,
    title: "8,770 cooling points",
    description: "Water points, parks, metro stations, hospitals, schools and places of worship from OpenStreetMap.",
  },
  {
    Icon: Route,
    title: "Walking routes",
    description: "Amazon Location Service gives path and time. A failed route falls back to distance and direction.",
  },
  {
    Icon: ListChecks,
    title: "Daily plan",
    description: "A greedy pick of 10 places within 800 m. Coverage before and after is shown.",
  },
  {
    Icon: History,
    title: "Replay any hot day",
    description: "One date parameter replays a past heat day. Demo the plan in any season.",
  },
  {
    Icon: Flag,
    title: "Community reports",
    description: "Users report a closed place or wrong hours. We store each report for review.",
  },
  {
    Icon: Braces,
    title: "Open, typed API",
    description: "OpenAPI docs and a typed tRPC client. Other apps can reuse the data.",
  },
];

export const scoreExplainer = {
  formula: "heat score = 60% satellite baseline + 40% weather of the day",
  levels: [
    { level: "high", range: "70 and above" },
    { level: "medium", range: "40 to 69" },
    { level: "low", range: "below 40" },
  ],
} as const;

export const awsServices = [
  { name: "Amazon EC2", role: "Runs the API container." },
  { name: "Amazon ECR", role: "Stores the container image." },
  { name: "Amazon RDS for PostgreSQL", role: "Holds cells, points, weather, plans and reports." },
  { name: "Amazon Location Service", role: "Calculates the walking route and time." },
  { name: "AWS IAM", role: "Instance role. No keys in the image." },
  { name: "AWS Open Data", role: "Hosts the Sentinel-2 images we read." },
];

export const roadmapItems: RoadmapItem[] = [
  {
    Icon: Globe,
    title: "All of Delhi NCR and other cities",
    description: "The study area is one bounding box in the config. Change it and rerun the baseline job.",
    horizon: "Next",
  },
  {
    Icon: RefreshCw,
    title: "Automatic satellite refresh",
    description: "A scheduled job reads each new Landsat pass. Raw scenes go to Amazon S3.",
    horizon: "Next",
  },
  {
    Icon: Landmark,
    title: "Official cooling zones",
    description: "Import the lists of city authorities. Mark these places as official.",
    horizon: "Next",
  },
  {
    Icon: ShieldCheck,
    title: "HTTPS and officer sign-in",
    description: "Amazon CloudFront for HTTPS. Amazon Cognito for ward officers.",
    horizon: "Next",
  },
  {
    Icon: Bell,
    title: "Heat alerts",
    description: "Send SMS or WhatsApp alerts to people in high-heat cells. Use Amazon SNS.",
    horizon: "Later",
  },
  {
    Icon: Sparkles,
    title: "Plain-language explainer",
    description: "Amazon Bedrock explains in simple words why each place was picked.",
    horizon: "Later",
  },
  {
    Icon: HeartPulse,
    title: "Vulnerability layers",
    description: "Add age, income and outdoor workers to the priority score. Today we use population only.",
    horizon: "Later",
  },
  {
    Icon: Languages,
    title: "More Indian languages",
    description: "The public app already speaks English and Hindi. Bengali, Punjabi and Urdu come next from the same copy file.",
    horizon: "Later",
  },
];
