import type { HeatLevel } from "~/hooks/heat";
import type { NearestPlace } from "~/hooks/cooling-point";

export type Language = "en" | "hi";

type PlaceType = NearestPlace["type"];
type WaterConfidence = NearestPlace["waterConfidence"];

/** Every word the public app shows, in English and Hindi. Place names come from map data and stay as they are. */
export const publicCopy = {
  en: {
    languageToggle: "हिंदी",
    pickTitle: "Where are you?",
    pickLead: "Move the map until the pin sits on your spot. Or share your live location.",
    pinLabel: "Your spot",
    useThisSpot: "Show cooling points here",
    useLiveLocation: "Use my live location",
    locating: "Finding you…",
    outsideDelhi: "Chhaon covers Delhi for now. Move the pin inside Delhi.",
    near: (name: string) => `Near ${name}`,
    yourSpot: "Your spot",
    change: "Change",
    heatTitle: { high: "Extreme heat today", medium: "High heat today", low: "Low heat today" } satisfies Record<HeatLevel, string>,
    heatAdvice: {
      high: "Stay out of the sun from 12 to 4 pm. Drink water every 20 minutes.",
      medium: "Avoid hard work outdoors after noon. Carry water.",
      low: "Wear light clothes and a cap. Rest in the shade.",
    } satisfies Record<HeatLevel, string>,
    feelsLike: "Feels like",
    goNow: "The heat here is dangerous. Walk to a cooling point now.",
    nearestLabel: "Nearest cooling point",
    otherLabel: (rank: number) => `Cooling point ${rank} of 3`,
    away: (distance: string, minutes: number) => `${distance} on foot, about ${minutes} min`,
    awayNoRoute: (distance: string, direction: string) => `${distance} away, to the ${direction}`,
    directions: "Get directions",
    share: "Share",
    shareText: (name: string, url: string) => `Cooling point near me: ${name}. Walking directions: ${url} (shared from Chhaon)`,
    opensMaps: "Opens Google Maps from where you are",
    mapTitle: "Cooling points around you",
    you: "You",
    place: "Place",
    moreNearby: "More nearby",
    walk: (minutes: number) => `${minutes} min walk`,
    checking: "Finding cooling points near you…",
    nonePlaces: "No cooling point found near this spot. Try a spot closer to a main road.",
    help: "If someone feels unwell",
    emergency: "Emergency",
    heatHelpline: "Delhi disaster helpline",
    call: "Call",
    noPhone: "No smartphone? Call 1077 to hear the nearest cooling point.",
    reportNote: "Place closed or hours wrong? Tell us.",
    planLink: "Ward officer? Open the heat plan",
    dataNote: (date: string) => `Heat for ${date}: satellite surface heat plus that day's weather. Not air temperature.`,
    errorTitle: "We could not load this right now.",
    retry: "Try again",
  },
  hi: {
    languageToggle: "English",
    pickTitle: "आप कहाँ हैं?",
    pickLead: "नक्शा खिसकाएँ ताकि पिन आपकी जगह पर हो। या अपनी लाइव लोकेशन दें।",
    pinLabel: "आपकी जगह",
    useThisSpot: "यहाँ के कूलिंग पॉइंट दिखाएँ",
    useLiveLocation: "मेरी लाइव लोकेशन लें",
    locating: "आपको ढूँढ रहे हैं…",
    outsideDelhi: "अभी छाँव सिर्फ़ दिल्ली में है। पिन दिल्ली के अंदर रखें।",
    near: (name: string) => `${name} के पास`,
    yourSpot: "आपकी जगह",
    change: "बदलें",
    heatTitle: { high: "आज भीषण गर्मी है", medium: "आज बहुत गर्मी है", low: "आज गर्मी कम है" } satisfies Record<HeatLevel, string>,
    heatAdvice: {
      high: "दोपहर 12 से 4 बजे तक धूप से बचें। हर 20 मिनट में पानी पिएँ।",
      medium: "दोपहर बाद बाहर भारी काम न करें। पानी साथ रखें।",
      low: "हल्के कपड़े और टोपी पहनें। छाँव में आराम करें।",
    } satisfies Record<HeatLevel, string>,
    feelsLike: "महसूस",
    goNow: "यहाँ गर्मी ख़तरनाक है। अभी किसी कूलिंग पॉइंट पर जाएँ।",
    nearestLabel: "सबसे पास का कूलिंग पॉइंट",
    otherLabel: (rank: number) => `कूलिंग पॉइंट ${rank} / 3`,
    away: (distance: string, minutes: number) => `पैदल ${distance}, लगभग ${minutes} मिनट`,
    awayNoRoute: (distance: string) => `${distance} दूर`,
    directions: "रास्ता देखें",
    share: "शेयर करें",
    shareText: (name: string, url: string) => `मेरे पास का कूलिंग पॉइंट: ${name}। पैदल रास्ता: ${url} (छाँव से भेजा गया)`,
    opensMaps: "आपकी जगह से Google Maps खुलेगा",
    mapTitle: "आपके आसपास कूलिंग पॉइंट",
    you: "आप",
    place: "जगह",
    moreNearby: "और पास में",
    walk: (minutes: number) => `${minutes} मिनट पैदल`,
    checking: "आपके पास कूलिंग पॉइंट ढूँढ रहे हैं…",
    nonePlaces: "इस जगह के पास कोई कूलिंग पॉइंट नहीं मिला। मुख्य सड़क के पास की जगह चुनें।",
    help: "अगर किसी की तबीयत बिगड़े",
    emergency: "इमरजेंसी",
    heatHelpline: "दिल्ली आपदा हेल्पलाइन",
    call: "कॉल करें",
    noPhone: "स्मार्टफ़ोन नहीं है? सबसे पास का कूलिंग पॉइंट सुनने के लिए 1077 पर कॉल करें।",
    reportNote: "जगह बंद है या समय गलत है? हमें बताएँ।",
    planLink: "वार्ड अधिकारी? हीट प्लान खोलें",
    dataNote: (date: string) => `${date} की गर्मी: सैटेलाइट से ज़मीन की गर्मी और उस दिन का मौसम। यह हवा का तापमान नहीं है।`,
    errorTitle: "अभी यह लोड नहीं हो पाया।",
    retry: "फिर से कोशिश करें",
  },
} as const;

export const placeTypeHindi: Record<PlaceType, string> = {
  drinking_water: "पीने के पानी की जगह",
  park: "पार्क",
  metro_station: "मेट्रो स्टेशन",
  hospital: "अस्पताल",
  school: "स्कूल",
  place_of_worship: "पूजा स्थल",
  cooling_zone: "सरकारी कूलिंग ज़ोन",
};

export const waterConfidenceHindi: Record<WaterConfidence, string> = {
  listed: "पानी उपलब्ध",
  likely: "पानी शायद",
  unlikely: "पानी शायद नहीं",
};

export const hoursHindi = { unconfirmed: "समय पक्का नहीं", confirmed: "समय पक्का" } as const;

export const compassHindi: Record<string, string> = {
  north: "उत्तर",
  "north-east": "उत्तर-पूर्व",
  east: "पूर्व",
  "south-east": "दक्षिण-पूर्व",
  south: "दक्षिण",
  "south-west": "दक्षिण-पश्चिम",
  west: "पश्चिम",
  "north-west": "उत्तर-पश्चिम",
};

export const formatDistanceHi = (metres: number) =>
  metres < 1000 ? `${Math.round(metres / 10) * 10} मी.` : `${(metres / 1000).toFixed(1)} किमी`;

const dayNames = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  hi: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
};
const monthNames = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
};

/** "Monday 25 May" / "सोमवार, 25 मई". Same text on the server and in the browser, whatever their locale. */
export const formatDay = (isoDate: string, language: Language = "en") => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = dayNames[language][date.getUTCDay()];
  const month = monthNames[language][date.getUTCMonth()];
  return language === "hi" ? `${day}, ${date.getUTCDate()} ${month}` : `${day} ${date.getUTCDate()} ${month}`;
};
