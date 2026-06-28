import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  Eye,
  EyeOff,
  Fingerprint,
  FileUp,
  GripVertical,
  HandHeart,
  Handshake,
  Heart,
  Image,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  Mail,
  Menu,
  MessageSquareQuote,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Save,
  Send,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tags,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

const organizationName = "AWD — All Walls Down Organization";
const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
const donationUrl =
  "https://www.zeffy.com/en-US/donation-form/awdo-donate-to-change-lives";
const imageDimensions = {
  "/assets/awd-logo.webp": { width: 1190, height: 1322 },
  "/assets/brothers-keepers.webp": { width: 962, height: 956 },
  "/assets/core-leadership-transparent.webp": { width: 1166, height: 1349 },
  "/assets/dok-clean.png": { width: 626, height: 712 },
};

const leadershipStaffSeeds = [
  { name: "Monta (Ta') Cheathem", email: "monta.cheathem@allwallsdown.org", role: "Administrator" },
  { name: "Kim Cheathem", email: "kim.cheathem@allwallsdown.org", role: "Administrator" },
  { name: "Levell Cheathem", email: "levell.cheathem@allwallsdown.org" },
  { name: "Antoine Herron", email: "antoine.herron@allwallsdown.org" },
  { name: "Stephen MacKenzie", email: "stephen.mackenzie@allwallsdown.org" },
  { name: "Chris Smith", email: "chris.smith@allwallsdown.org" },
  { name: "Dr. Josh Snyder", email: "josh.snyder@allwallsdown.org" },
  { name: "Emilio Jesus Ortega", email: "emilio.ortega@allwallsdown.org" },
  { name: "Adrian Ahtone", email: "adrian.ahtone@allwallsdown.org" },
  { name: "Justin Hamlin", email: "justin.hamlin@allwallsdown.org" },
  { name: "Mon Lorenzo", email: "mon.lorenzo@allwallsdown.org" },
  { name: "Bobby Lowe", email: "bobby.lowe@allwallsdown.org" },
  { name: "Andrew Kirkland", email: "andrew.kirkland@allwallsdown.org" },
  { name: "Mike Best", email: "mike.best@allwallsdown.org" },
];

const pinnedLeadershipNames = ["Monta", "Kim"];

const ministries = [
  {
    name: "Brothers Keepers",
    short: "Brothers Keepers",
    image: "/assets/brothers-keepers.webp",
    alt: "Brothers Keepers iron sharpens iron emblem",
    quote: "Iron sharpens iron.",
    body: "A brotherhood committed to faith, accountability, strength, and service.",
    detail:
      "Brothers Keepers calls men to sharpen one another, grow in Christ, build strong character, and live as faithful examples in their homes and communities.",
    scripture: {
      reference: "Ecclesiastes 4:9-12",
      translation: "New Living Translation",
      verses: [
        "9 Two people are better off than one, for they can help each other succeed.",
        "10 If one person falls, the other can reach out and help. But someone who falls alone is in real trouble.",
        "11 Likewise, two people lying close together can keep each other warm. But how can one be warm alone?",
        "12 A person standing alone can be attacked and defeated, but two can stand back-to-back and conquer. Three are even better, for a triple-braided cord is not easily broken.",
      ],
    },
    className: "ministry--bk",
  },
  {
    name: "Daughters of the King",
    short: "Daughters of the King",
    image: "/assets/dok-clean.png",
    alt: "Daughters of the King crown and cross emblem",
    quote: "Founder / Director — Kim Cheathem",
    body: "Women walking boldly in faith, identity, purpose, and calling.",
    detail:
      "Daughters of the King creates space for women to know their God-given identity, encourage one another, and answer their calling with confidence.",
    className: "ministry--dok",
  },
];

const ways = [
  {
    icon: HandHeart,
    title: "Pray With Us",
    body: "Lift our mission, leaders, families, and community in prayer.",
  },
  {
    icon: Handshake,
    title: "Partner With Us",
    body: "Stand with AWD as we serve people and break barriers together.",
  },
  {
    icon: Users,
    title: "Serve With Us",
    body: "Use your time and talents to be the hands and feet of Christ.",
  },
];

const storageKeys = {
  testimonials: "awd:testimonials",
  prayerRequests: "awd:prayerRequests",
  contacts: "awd:contacts",
  contactCategories: "awd:contactCategories",
  crmSettings: "awd:crmSettings",
  users: "awd:staffUsers",
  session: "awd:staffSession",
  mfaPolicy: "awd:mfaPolicy",
  mailSettings: "awd:mailSettings",
  pages: "awd:managedPages",
  contentOverrides: "awd:contentOverrides",
};

const prayerStatuses = ["Pending Prayer", "We have Prayed"];
const testimonialStatuses = ["Pending Review", "Approved", "Needs Follow Up", "Declined"];
const contactStatuses = ["New", "In Conversation", "Followed Up", "Closed"];
const contactCategories = [
  "General Contact",
  "Volunteer",
  "Partnership",
  "Prayer",
  "Brothers Keepers",
  "Daughters of the King",
  "Giving",
  "Pastoral Follow Up",
];
const contactPriorities = ["Low", "Normal", "High", "Urgent"];
const defaultCrmSettings = {
  defaultStatus: "New",
  defaultPriority: "Normal",
  defaultOwner: "Ministry Staff",
  autoFollowUpDays: "7",
  requireCategory: true,
  requireNextFollowUp: false,
  notifyOnNewContact: true,
};

const csvImportSources = ["Google Contacts", "Outlook", "Auto Detect"];

const normalizeCsvHeader = (header) =>
  String(header || "")
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]+/g, "");

const parseCsvRows = (csvText) => {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
};

const getCsvValue = (record, possibleHeaders) => {
  const normalizedHeaders = possibleHeaders.map(normalizeCsvHeader);
  const match = normalizedHeaders.find((header) => record[header]);
  return match ? record[match].trim() : "";
};

const splitCsvList = (value) =>
  String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildContactFromCsvRecord = (record, defaults) => {
  const firstName = getCsvValue(record, [
    "First Name",
    "Given Name",
    "GivenName",
    "First",
  ]);
  const middleName = getCsvValue(record, ["Middle Name", "Additional Name"]);
  const lastName = getCsvValue(record, ["Last Name", "Family Name", "Surname", "Last"]);
  const displayName = getCsvValue(record, [
    "Name",
    "Display Name",
    "Full Name",
    "Subject",
  ]);
  const company = getCsvValue(record, ["Company", "Organization Name", "Organization"]);
  const name =
    displayName ||
    [firstName, middleName, lastName].filter(Boolean).join(" ") ||
    company ||
    "Imported Contact";
  const email = getCsvValue(record, [
    "E-mail Address",
    "E-mail 2 Address",
    "E-mail 3 Address",
    "Email",
    "Email Address",
    "Primary Email",
    "Home E-mail",
    "Work E-mail",
    "Other E-mail",
  ]);
  const phone = getCsvValue(record, [
    "Mobile Phone",
    "Mobile Phone 1",
    "Phone 1 - Value",
    "Home Phone",
    "Business Phone",
    "Work Phone",
    "Primary Phone",
    "Phone",
    "Other Phone",
  ]);
  const notes = getCsvValue(record, ["Notes", "Note", "Description", "Comments"]);
  const categoryValue = getCsvValue(record, [
    "Categories",
    "Category",
    "Group Membership",
    "Labels",
  ]);
  const importedTags = splitCsvList(categoryValue.replace(/\* myContacts/gi, ""));
  const category = importedTags[0] || "Imported Contact";
  const followUpDate = new Date();
  followUpDate.setDate(
    followUpDate.getDate() + Number(defaults.crmSettings.autoFollowUpDays || 0),
  );

  return {
    id: createId("contact"),
    name,
    email,
    phone,
    reason: category,
    category,
    tags: ["Imported", ...importedTags.filter((tag) => tag !== category)],
    priority: defaults.crmSettings.defaultPriority || "Normal",
    assignedTo:
      defaults.crmSettings.defaultOwner ||
      defaults.sessionName ||
      "Ministry Staff",
    nextFollowUp: defaults.crmSettings.autoFollowUpDays
      ? followUpDate.toISOString().slice(0, 10)
      : "",
    message: notes || `Imported from ${defaults.source} CSV.`,
    status: defaults.crmSettings.defaultStatus || "New",
    notes,
    submittedAt: new Date().toISOString(),
    importedFrom: defaults.source,
    emailHistory: [],
  };
};

const parseContactsCsv = (csvText, source, defaults) => {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { contacts: [], categories: [], skipped: 0 };
  }
  const headers = rows[0].map(normalizeCsvHeader);
  const contacts = [];
  let skipped = 0;

  rows.slice(1).forEach((row) => {
    const record = headers.reduce((current, header, index) => {
      current[header] = String(row[index] || "").trim();
      return current;
    }, {});
    const contact = buildContactFromCsvRecord(record, { ...defaults, source });
    if (!contact.email && !contact.phone && contact.name === "Imported Contact") {
      skipped += 1;
      return;
    }
    contacts.push(contact);
  });

  return {
    contacts,
    categories: [...new Set(contacts.map((contact) => contact.category).filter(Boolean))],
    skipped,
  };
};
const staffRoles = [
  "Ministry Staff",
  "Prayer Team",
  "Communications",
  "User Admin",
  "Administrator",
];
const seededAdministrator = {
  id: "staff-jeremiah-johnson-admin",
  name: "Jeremiah Johnson",
  email: "treliasocialceo@gmail.com",
  password: "ChangeMe123!",
  role: "Administrator",
  roles: ["Administrator"],
  isActive: true,
  mfaRequired: false,
  mfaEnabled: false,
  mfaMethods: {},
  mfaEnrollmentStatus: "Administrator Exempt",
  requirePasswordReset: true,
  lastMfaUpdatedAt: "",
  createdAt: "2026-06-26T00:00:00.000Z",
};
const defaultMfaPolicy = {
  requireMfaForStaff: true,
  exemptAdministrators: true,
  forceFirstLoginEnrollment: true,
  allowedMethods: {
    authenticator: true,
    googleAuthenticator: true,
    biometric: true,
    passwordManager: true,
  },
};
const mfaMethodOptions = [
  {
    id: "authenticator",
    label: "Authenticator App",
    body: "Use an MFA app such as Microsoft Authenticator, Authy, or a similar TOTP app.",
    icon: Smartphone,
  },
  {
    id: "googleAuthenticator",
    label: "Google Authenticator",
    body: "Register a Google Authenticator code generator for staff sign-in.",
    icon: KeyRound,
  },
  {
    id: "biometric",
    label: "Biometric Passkey",
    body: "Register Face ID, Touch ID, Windows Hello, or a device passkey.",
    icon: Fingerprint,
  },
  {
    id: "passwordManager",
    label: "Password Manager Passkey",
    body: "Use a passkey saved in 1Password, iCloud Keychain, Google Password Manager, or similar.",
    icon: Shield,
  },
];

const sampleTestimonials = [
  {
    id: "testimonial-hope",
    name: "Angela M.",
    email: "angela@example.com",
    city: "Lawton, OK",
    ministry: "All Walls Down",
    quote:
      "AWD reminded our family that faith is not just something we talk about. It is something we live out together.",
    submittedAt: "2026-06-01T12:00:00.000Z",
    reviewedAt: "2026-06-03T12:00:00.000Z",
    status: "Approved",
    displayOnSite: true,
    notes: "Approved sample testimonial for launch display.",
  },
  {
    id: "testimonial-brothers",
    name: "Marcus T.",
    email: "marcus@example.com",
    city: "Wichita Falls, TX",
    ministry: "Brothers Keepers",
    quote:
      "Brothers Keepers gave me a place to be sharpened, encouraged, and held accountable with real brotherhood.",
    submittedAt: "2026-06-04T12:00:00.000Z",
    reviewedAt: "2026-06-05T12:00:00.000Z",
    status: "Approved",
    displayOnSite: true,
    notes: "Approved sample testimonial for launch display.",
  },
  {
    id: "testimonial-dok",
    name: "Renee C.",
    email: "renee@example.com",
    city: "Oklahoma City, OK",
    ministry: "Daughters of the King",
    quote:
      "Daughters of the King helped me remember who God says I am and gave me courage to walk in purpose.",
    submittedAt: "2026-06-07T12:00:00.000Z",
    reviewedAt: "2026-06-08T12:00:00.000Z",
    status: "Approved",
    displayOnSite: true,
    notes: "Approved sample testimonial for launch display.",
  },
];

const sampleContacts = [
  {
    id: "contact-sarah-partner",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@example.com",
    phone: "(580) 555-0184",
    reason: "Partnership",
    category: "Partnership",
    tags: ["Small Group", "Outreach"],
    priority: "High",
    assignedTo: "Communications",
    nextFollowUp: "2026-06-18",
    message:
      "Our small group would like to partner with AWD for an outreach night next month.",
    status: "New",
    notes: "Interested in community outreach partnership.",
    submittedAt: "2026-06-10T14:30:00.000Z",
    emailHistory: [],
  },
  {
    id: "contact-david-volunteer",
    name: "David Reynolds",
    email: "david.reynolds@example.com",
    phone: "(405) 555-0129",
    reason: "Volunteer",
    category: "Volunteer",
    tags: ["Brothers Keepers", "Onboarding"],
    priority: "Normal",
    assignedTo: "Ministry Staff",
    nextFollowUp: "2026-06-20",
    message:
      "I would like to serve with Brothers Keepers and learn where help is needed.",
    status: "In Conversation",
    notes: "Follow up with ministry onboarding details.",
    submittedAt: "2026-06-12T16:45:00.000Z",
    emailHistory: [],
  },
];

const samplePrayerRequests = [
  {
    id: "prayer-family",
    name: "Elena Brooks",
    email: "elena@example.com",
    phone: "",
    request: "Please pray for healing and peace for our family this week.",
    isConfidential: false,
    status: "Pending Prayer",
    notes: "",
    submittedAt: "2026-06-11T10:00:00.000Z",
  },
  {
    id: "prayer-work",
    name: "Michael Carter",
    email: "",
    phone: "(580) 555-0133",
    request: "I need prayer for wisdom and strength through a difficult job transition.",
    isConfidential: true,
    status: "Pending Prayer",
    notes: "",
    submittedAt: "2026-06-13T09:20:00.000Z",
  },
];

const defaultMailSettings = {
  providerName: "Google Workspace",
  smtpHost: "smtp.gmail.com",
  smtpPort: "587",
  pop3Host: "pop.gmail.com",
  pop3Port: "995",
  username: "",
  password: "",
  fromName: "All Walls Down Organization",
  fromEmail: "",
  useTls: true,
};

const defaultManagedPages = [
  {
    id: "home",
    title: "Home",
    route: "/",
    navLabel: "Home",
    status: "Published",
    isActive: true,
    updatedAt: "2026-06-27T14:00:00.000Z",
    hero: {
      title: "Breaking Every Barrier!",
      body: "Faith-led ministry, community outreach, and service through All Walls Down Organization.",
      image: "/assets/hero-barrier.webp",
    },
    sections: [
      {
        id: "mission",
        label: "Mission Statement",
        type: "Text",
        visible: true,
        title: "Breaking barriers through faith and service.",
        body: "All Walls Down exists to help people encounter God’s love through unity, outreach, discipleship, and practical community care.",
      },
      {
        id: "ministries",
        label: "Ministry Cards",
        type: "Widget Group",
        visible: true,
        title: "Ministries built around real people.",
        body: "Brothers Keepers, Daughters of the King, prayer, outreach, and family support create clear places for people to belong and serve.",
      },
      {
        id: "testimonials",
        label: "Community Testimonials",
        type: "Testimonials",
        visible: true,
        title: "Stories from the AWD community.",
        body: "Approved testimonies can be featured here so visitors see what God is doing through the ministry.",
      },
      {
        id: "giving",
        label: "Giving Callout",
        type: "Callout",
        visible: true,
        title: "Partner with the mission.",
        body: "Invite supporters to give, volunteer, and pray as AWD continues serving families and breaking walls down.",
      },
    ],
  },
  {
    id: "about",
    title: "About Us",
    route: "/About_us",
    navLabel: "About",
    status: "Published",
    isActive: true,
    updatedAt: "2026-06-26T18:30:00.000Z",
    hero: {
      title: "Faith that moves through service.",
      body: "The story, mission, and founding heart behind All Walls Down Organization.",
      image: "/assets/awd-logo.webp",
    },
    sections: [
      {
        id: "story",
        label: "Organization Story",
        type: "Rich Text",
        visible: true,
        title: "The story behind All Walls Down.",
        body: "AWD was formed from a burden to see faith, accountability, and love become practical tools for healing people and strengthening families.",
      },
      {
        id: "founders",
        label: "Founder Profiles",
        type: "Image + Text",
        visible: true,
        title: "Founders and ministry leaders.",
        body: "Monta and Kim continue to guide the ministry with a heart for unity, restoration, and Christ-centered service.",
        image: "/assets/core-leadership-transparent.webp",
      },
      {
        id: "beliefs",
        label: "Mission Principles",
        type: "Panel",
        visible: true,
        title: "Faith, unity, and service.",
        body: "Every section of the ministry should point people toward discipleship, accountability, compassion, and lasting transformation.",
      },
    ],
  },
  {
    id: "ministries",
    title: "Ministries",
    route: "/Ministries",
    navLabel: "Ministries",
    status: "Published",
    isActive: true,
    updatedAt: "2026-06-25T21:10:00.000Z",
    hero: {
      title: "Ministries built for discipleship.",
      body: "Brothers Keepers and Daughters of the King invite people into faith, accountability, and purpose.",
      image: "/assets/brothers-keepers.webp",
    },
    sections: [
      {
        id: "bk",
        label: "Brothers Keepers",
        type: "Ministry Feature",
        visible: true,
        title: "Brothers Keepers",
        body: "Men walking together in faith, leadership, accountability, and brotherhood.",
        image: "/assets/brothers-keepers.webp",
      },
      {
        id: "dok",
        label: "Daughters of the King",
        type: "Ministry Feature",
        visible: true,
        title: "Daughters of the King",
        body: "Women growing in identity, purpose, encouragement, and discipleship.",
        image: "/assets/dok-clean.png",
      },
      {
        id: "support",
        label: "Support Ministry",
        type: "CTA",
        visible: true,
        title: "Support the work of ministry.",
        body: "Help build spaces where people can pray, serve, learn, and grow together.",
      },
    ],
  },
  {
    id: "leadership",
    title: "Leadership",
    route: "/Leadership",
    navLabel: "Leadership",
    status: "Published",
    isActive: true,
    updatedAt: "2026-06-27T00:00:00.000Z",
    hero: {
      title: "Leading with integrity and unity.",
      body: "Servant leaders committed to guiding AWD, Brothers Keepers, and Daughters of the King.",
      image: "/assets/core-leadership-transparent.webp",
    },
    sections: [
      {
        id: "bk-director",
        label: "Brothers Keepers Director",
        type: "Pinned Leader",
        visible: true,
        title: "Brothers Keepers leadership.",
        body: "Pinned ministry leaders remain visible while staff profile settings control the rest of the leadership roster.",
      },
      {
        id: "leadership-roster",
        label: "Core Leadership Roster",
        type: "Dynamic Staff List",
        visible: true,
        title: "Core leadership roster.",
        body: "This dynamic section pulls from staff accounts marked to appear on the Leadership page, while Monta and Kim always remain visible.",
      },
      {
        id: "dok-director",
        label: "DOK Director",
        type: "Pinned Leader",
        visible: true,
        title: "Daughters of the King leadership.",
        body: "Highlight the ministry lead and supporting team responsible for Daughters of the King.",
      },
    ],
  },
  {
    id: "get-involved",
    title: "Get Involved",
    route: "/Get_Involved",
    navLabel: "Get Involved",
    status: "Published",
    isActive: true,
    updatedAt: "2026-06-24T16:45:00.000Z",
    hero: {
      title: "Pray, serve, partner, and give.",
      body: "Join AWD as we serve people, strengthen families, and break barriers together.",
      image: "/assets/awd-logo.webp",
    },
    sections: [
      {
        id: "ways",
        label: "Ways to Engage",
        type: "Action Cards",
        visible: true,
        title: "Ways to get involved.",
        body: "Invite visitors to pray, serve, join a ministry, share a testimony, or support outreach.",
      },
      {
        id: "donation",
        label: "Donation Embed",
        type: "Giving Widget",
        visible: true,
        title: "Give to support AWD.",
        body: "Donations help fund outreach, ministry tools, family support, and community events.",
      },
      {
        id: "contact",
        label: "Contact Intake",
        type: "Form",
        visible: true,
        title: "Start the conversation.",
        body: "Let people contact the ministry team, request prayer, or ask how to connect.",
      },
    ],
  },
];

const widgetTemplates = [
  ["Hero", "Locked page opener with image, title, and body copy"],
  ["Text Block", "Editable heading, paragraph, and call-to-action"],
  ["Image Feature", "Side-by-side image and content module"],
  ["CTA Banner", "Giving, volunteer, or ministry action callout"],
  ["Staff Roster", "Dynamic staff-powered people list"],
  ["Form Widget", "Contact, prayer, testimonial, or custom intake form"],
];

const createId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function readStored(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("awd:data-change", { detail: { key } }));
}

const editableContentSelectors = [
  ".route-stage h1",
  ".route-stage h2",
  ".route-stage h3",
  ".route-stage p:not(.section-label)",
  ".route-stage blockquote",
  ".route-stage cite",
  ".route-stage strong",
].join(",");

function getEditableTextTargets(root = document) {
  return [...root.querySelectorAll(editableContentSelectors)].filter(
    (element) =>
      element.textContent.trim() &&
      !element.closest("button, a, form, .modal-backdrop, .testimonial-modal"),
  );
}

function getEditableImageTargets(root = document) {
  return [...root.querySelectorAll(".route-stage img")].filter(
    (element) => !element.closest(".hero, .page-hero, button, a, .modal-backdrop"),
  );
}

function getContentOverrideKey(route, type, index) {
  return `${route || "/"}::${type}::${index}`;
}

function saveContentOverrideValue(route, type, index, value) {
  const key = getContentOverrideKey(route, type, index);
  const overrides = readStored(storageKeys.contentOverrides, {});
  writeStored(storageKeys.contentOverrides, {
    ...overrides,
    [key]: {
      type,
      value,
      updatedAt: new Date().toISOString(),
    },
  });
}

function applyContentOverridesToDocument(root = document, route = window.location.pathname) {
  const overrides = readStored(storageKeys.contentOverrides, {});
  getEditableTextTargets(root).forEach((element, index) => {
    const override = overrides[getContentOverrideKey(route, "text", index)];
    if (override?.value && element.textContent !== override.value) {
      element.textContent = override.value;
    }
  });
  getEditableImageTargets(root).forEach((element, index) => {
    const override = overrides[getContentOverrideKey(route, "image", index)];
    if (override?.value && element.getAttribute("src") !== override.value) {
      element.setAttribute("src", override.value);
    }
  });
}

function hydrateManagedPages(pages = defaultManagedPages) {
  return pages.map((page) => {
    const defaultPage = defaultManagedPages.find((item) => item.id === page.id);
    const sourceSections = Array.isArray(page.sections) && page.sections.length
      ? page.sections
      : defaultPage?.sections || [];

    return {
      ...defaultPage,
      ...page,
      hero: {
        ...(defaultPage?.hero || {}),
        ...(page.hero || {}),
      },
      sections: sourceSections.map((section) => {
        const defaultSection =
          defaultPage?.sections.find((item) => item.id === section.id) || {};
        return {
          ...defaultSection,
          ...section,
          title:
            section.title ||
            defaultSection.title ||
            section.label ||
            defaultSection.label ||
            "Untitled section",
          body:
            section.body ||
            defaultSection.body ||
            "Select this section and update the content in the inspector.",
          image:
            typeof section.image === "string"
              ? section.image
              : defaultSection.image || "",
          visible: section.visible !== false,
        };
      }),
    };
  });
}

function getUserRoles(user) {
  if (!user) return [];
  return Array.isArray(user.roles) && user.roles.length
    ? user.roles
    : [user.role || "Ministry Staff"];
}

function userHasRole(user, role) {
  return getUserRoles(user).includes(role);
}

function isAdministrator(user) {
  return userHasRole(user, "Administrator");
}

function isUserAdministrator(user) {
  return isAdministrator(user) || userHasRole(user, "User Admin");
}

function shouldRequireUserMfa(user, policy = defaultMfaPolicy) {
  if (!policy.requireMfaForStaff) return false;
  if (policy.exemptAdministrators && isAdministrator(user)) return false;
  return user?.mfaRequired !== false;
}

function isPinnedLeadershipUser(user) {
  const normalizedName = String(user?.name || "").toLowerCase();
  return pinnedLeadershipNames.some((name) => normalizedName.includes(name.toLowerCase()));
}

function shouldShowOnLeadership(user) {
  return isPinnedLeadershipUser(user) || (user?.isActive !== false && user?.showOnLeadership);
}

function createSeededLeadershipUser(seed) {
  const roles = [seed.role || "Ministry Staff"];
  return {
    id: `staff-${seed.email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    name: seed.name,
    email: seed.email,
    password: "ChangeMe123!",
    role: roles[0],
    roles,
    isActive: true,
    showOnLeadership: true,
    mfaRequired: !roles.includes("Administrator"),
    mfaEnabled: false,
    mfaMethods: {},
    mfaEnrollmentStatus: roles.includes("Administrator") ? "Administrator Exempt" : "Required",
    requirePasswordReset: true,
    lastMfaUpdatedAt: "",
    createdAt: "2026-06-27T00:00:00.000Z",
  };
}

function ensurePortalSeedData() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(storageKeys.testimonials)) {
    writeStored(storageKeys.testimonials, sampleTestimonials);
  }
  if (!window.localStorage.getItem(storageKeys.prayerRequests)) {
    writeStored(storageKeys.prayerRequests, samplePrayerRequests);
  } else if (!readStored(storageKeys.prayerRequests, []).length) {
    writeStored(storageKeys.prayerRequests, samplePrayerRequests);
  }
  if (!window.localStorage.getItem(storageKeys.contacts)) {
    writeStored(storageKeys.contacts, sampleContacts);
  } else if (!readStored(storageKeys.contacts, []).length) {
    writeStored(storageKeys.contacts, sampleContacts);
  }
  if (!window.localStorage.getItem(storageKeys.contactCategories)) {
    writeStored(storageKeys.contactCategories, contactCategories);
  }
  if (!window.localStorage.getItem(storageKeys.crmSettings)) {
    writeStored(storageKeys.crmSettings, defaultCrmSettings);
  }
  if (!window.localStorage.getItem(storageKeys.mfaPolicy)) {
    writeStored(storageKeys.mfaPolicy, defaultMfaPolicy);
  }
  const storedUsers = readStored(storageKeys.users, []);
  const leadershipSeedNames = new Set(
    leadershipStaffSeeds.map((seed) => seed.name.toLowerCase()),
  );
  const migratedUsers = storedUsers.map((user) => {
    const roles = getUserRoles(user);
    const isSeededLeadershipUser =
      leadershipSeedNames.has(String(user.name || "").toLowerCase()) ||
      leadershipStaffSeeds.some(
        (seed) => seed.email.toLowerCase() === String(user.email || "").toLowerCase(),
      );
    return {
      ...user,
      roles,
      role: user.role || roles[0],
      isActive: user.isActive !== false,
      showOnLeadership:
        typeof user.showOnLeadership === "boolean"
          ? user.showOnLeadership
          : isSeededLeadershipUser,
      mfaRequired:
        typeof user.mfaRequired === "boolean"
          ? user.mfaRequired
          : !roles.includes("Administrator"),
      mfaEnrollmentStatus:
        user.mfaEnrollmentStatus ||
        (Object.values(user.mfaMethods || {}).some(Boolean)
          ? "Enrolled"
          : roles.includes("Administrator")
            ? "Administrator Exempt"
            : "Required"),
    };
  });
  if (
    !migratedUsers.some(
      (user) => user.email.toLowerCase() === seededAdministrator.email.toLowerCase(),
    )
  ) {
    migratedUsers.unshift(seededAdministrator);
  }
  leadershipStaffSeeds.forEach((seed) => {
    if (
      !migratedUsers.some(
        (user) => user.email.toLowerCase() === seed.email.toLowerCase(),
      )
    ) {
      migratedUsers.push(createSeededLeadershipUser(seed));
    }
  });
  if (
    storedUsers.length !== migratedUsers.length ||
    storedUsers.some(
      (user) => !user.roles || typeof user.showOnLeadership !== "boolean",
    )
  ) {
    writeStored(storageKeys.users, migratedUsers);
  } else if (!window.localStorage.getItem(storageKeys.users)) {
    writeStored(storageKeys.users, [seededAdministrator]);
  }
  if (!window.localStorage.getItem(storageKeys.mailSettings)) {
    writeStored(storageKeys.mailSettings, defaultMailSettings);
  }
  const storedPages = readStored(storageKeys.pages, []);
  const nextPages = hydrateManagedPages(storedPages.length ? storedPages : defaultManagedPages);
  if (
    !window.localStorage.getItem(storageKeys.pages) ||
    JSON.stringify(storedPages) !== JSON.stringify(nextPages)
  ) {
    writeStored(storageKeys.pages, nextPages);
  }
}

function useStoredCollection(key, fallback) {
  const [items, setItems] = useState(() => readStored(key, fallback));

  useEffect(() => {
    const handleDataChange = (event) => {
      if (!event.detail?.key || event.detail.key === key) {
        setItems(readStored(key, fallback));
      }
    };
    window.addEventListener("storage", handleDataChange);
    window.addEventListener("awd:data-change", handleDataChange);
    return () => {
      window.removeEventListener("storage", handleDataChange);
      window.removeEventListener("awd:data-change", handleDataChange);
    };
  }, [fallback, key]);

  const updateItems = (nextItems) => {
    const value = typeof nextItems === "function" ? nextItems(readStored(key, fallback)) : nextItems;
    writeStored(key, value);
    setItems(value);
  };

  return [items, updateItems];
}

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));

const emberParticles = Array.from({ length: 36 }, (_, index) => ({
  "--particle-x": `${8 + ((index * 19) % 86)}%`,
  "--particle-size": `${3 + (index % 4)}px`,
  "--particle-speed": `${4.6 + (index % 7) * 0.42}s`,
  "--particle-delay": `${-1 * ((index * 0.47) % 5.8).toFixed(2)}s`,
  "--particle-drift": `${index % 2 === 0 ? "" : "-"}${12 + (index % 5) * 7}px`,
}));

const royalParticles = Array.from({ length: 28 }, (_, index) => ({
  "--particle-x": `${7 + ((index * 23) % 88)}%`,
  "--particle-y": `${18 + ((index * 17) % 64)}%`,
  "--particle-size": `${2 + (index % 3)}px`,
  "--particle-speed": `${5.4 + (index % 6) * 0.5}s`,
  "--particle-delay": `${-1 * ((index * 0.61) % 6.4).toFixed(2)}s`,
}));

const heroParticles = Array.from({ length: 24 }, (_, index) => ({
  "--particle-x": `${42 + ((index * 11) % 58)}%`,
  "--particle-y": `${8 + ((index * 13) % 78)}%`,
  "--particle-size": `${2 + (index % 3)}px`,
  "--particle-speed": `${7 + (index % 5) * 0.7}s`,
  "--particle-delay": `${-1 * ((index * 0.53) % 7).toFixed(2)}s`,
}));

const pageMetadata = {
  "/": {
    title: "Christian Nonprofit Ministry | All Walls Down",
    description:
      "All Walls Down is a Christian nonprofit ministry advancing faith, unity, community outreach, men's ministry, and women's ministry.",
    keywords:
      "Christian nonprofit organization, faith based nonprofit, Christian community outreach, Christian ministry, donate to Christian nonprofit",
    image: "/assets/hero-barrier.webp",
  },
  "/About_us": {
    title: "About Our Christian Nonprofit | All Walls Down",
    description:
      "Meet All Walls Down, a Christian nonprofit organization founded by Monta and Kim Cheathem to break barriers through faith and service.",
    keywords:
      "Christian nonprofit organization, faith based community organization, Christian community service, All Walls Down founders",
    image: "/assets/awd-logo.webp",
  },
  "/Ministries": {
    title: "Christian Men's & Women's Ministries | AWD",
    description:
      "Explore Brothers Keepers Christian men's ministry and Daughters of the King Christian women's ministry.",
    keywords:
      "Christian men's ministry, Christian women's ministry, men's discipleship, women's discipleship, iron sharpens iron ministry",
    image: "/assets/brothers-keepers.webp",
  },
  "/Leadership": {
    title: "Christian Ministry Leadership | All Walls Down",
    description:
      "Meet the servant leaders guiding All Walls Down Organization, Brothers Keepers Core Leadership, and Daughters of the King.",
    keywords:
      "Christian ministry leadership, servant leadership ministry, Brothers Keepers leadership, Daughters of the King",
    image: "/assets/core-leadership-transparent.webp",
  },
  "/Get_Involved": {
    title: "Volunteer or Donate to a Christian Nonprofit | AWD",
    description:
      "Pray, volunteer, partner, or donate to All Walls Down and help a Christian nonprofit serve communities and break barriers.",
    keywords:
      "volunteer with Christian nonprofit, donate to Christian nonprofit, faith based volunteer opportunities, Christian community outreach",
    image: "/assets/awd-logo.webp",
  },
  "/staff_portal": {
    title: "Staff Portal | All Walls Down",
    description:
      "All Walls Down ministry management portal for prayer requests, testimonials, contacts, and communication workflows.",
    keywords:
      "ministry CRM, prayer request management, church contact management, nonprofit staff portal",
    image: "/assets/awd-logo.webp",
  },
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function MotionEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const selectors = [
      ".home-mission__grid > *",
      ".split-feature > *",
      ".about-story__grid > *",
      ".founders-section__grid > *",
      ".ministry",
      ".section-heading",
      ".director",
      ".roster > div",
      ".dok-director",
      ".ways article",
      ".involved-statement",
      ".giving-callout .shell > *",
      ".footer__grid > *",
    ].join(",");
    const elements = [...document.querySelectorAll(selectors)];

    elements.forEach((element, index) => {
      element.classList.add("reveal");
      element.style.setProperty("--reveal-order", String(index % 6));
    });

    if (reducedMotion) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return undefined;
    let frame = 0;
    const handlePointer = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          "--pointer-x",
          `${event.clientX}px`,
        );
        document.documentElement.style.setProperty(
          "--pointer-y",
          `${event.clientY}px`,
        );
      });
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return <div className="cursor-light" aria-hidden="true" />;
}

const isLanIpv4Host = (host) =>
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/.test(
    host,
  );

const getNetworkApiOrigin = () => {
  if (typeof window === "undefined") return "";
  const { hostname, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:8787";
  return `${protocol}//${hostname}:8787`;
};

function NetworkAddressRefresh() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.EventSource) return undefined;
    const apiOrigin = getNetworkApiOrigin();
    if (!apiOrigin) return undefined;

    const redirectIfNeeded = (status) => {
      const nextHost = status?.wifiAddress;
      const currentHost = window.location.hostname;
      if (
        !nextHost ||
        nextHost === currentHost ||
        currentHost === "localhost" ||
        currentHost === "127.0.0.1" ||
        !isLanIpv4Host(currentHost)
      ) {
        return;
      }
      const nextUrl = new URL(window.location.href);
      nextUrl.hostname = nextHost;
      window.location.replace(nextUrl.toString());
    };

    const source = new EventSource(`${apiOrigin}/api/network-events`);
    source.addEventListener("network-status", (event) => {
      try {
        redirectIfNeeded(JSON.parse(event.data));
      } catch {
        // Ignore malformed status events; the next valid event can refresh the page.
      }
    });
    source.onerror = () => {
      fetch(`${apiOrigin}/api/network-status`)
        .then((response) => (response.ok ? response.json() : null))
        .then(redirectIfNeeded)
        .catch(() => {});
    };

    return () => source.close();
  }, []);

  return null;
}

function SiteContentOverrides() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const isEditorPreview = new URLSearchParams(search).get("awdEdit") === "1";

    applyContentOverridesToDocument(document, pathname);
    if (isEditorPreview) {
      getEditableTextTargets(document).forEach((element, index) => {
        element.contentEditable = "true";
        element.spellcheck = true;
        element.dataset.awdEditText = String(index);
        element.classList.add("cms-frame-editable-text");
        element.addEventListener("focus", () => {
          element.classList.add("is-editing");
        });
        element.addEventListener("blur", () => {
          element.classList.remove("is-editing");
          saveContentOverrideValue(pathname, "text", index, element.textContent.trim());
        });
      });

      getEditableImageTargets(document).forEach((element, index) => {
        element.dataset.awdEditImage = String(index);
        element.tabIndex = 0;
        element.classList.add("cms-frame-editable-image");
        const openEditor = (event) => {
          event.preventDefault();
          event.stopPropagation();
          window.parent.postMessage(
            {
              type: "awd:image-edit",
              route: pathname,
              index,
              src: element.getAttribute("src") || "",
            },
            window.location.origin,
          );
        };
        element.addEventListener("click", openEditor);
        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") openEditor(event);
        });
      });
    }

    const handleDataChange = (event) => {
      if (!event.detail?.key || event.detail.key === storageKeys.contentOverrides) {
        applyContentOverridesToDocument(document, pathname);
      }
    };
    const handleMessage = (event) => {
      if (event.origin === window.location.origin && event.data?.type === "awd:apply-overrides") {
        applyContentOverridesToDocument(document, pathname);
      }
    };
    window.addEventListener("storage", handleDataChange);
    window.addEventListener("awd:data-change", handleDataChange);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("storage", handleDataChange);
      window.removeEventListener("awd:data-change", handleDataChange);
      window.removeEventListener("message", handleMessage);
    };
  }, [pathname, search]);

  return null;
}

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const [name, property] = selector.includes("property=")
      ? [null, selector.match(/property="([^"]+)"/)?.[1]]
      : [selector.match(/name="([^"]+)"/)?.[1], null];
    if (name) element.setAttribute("name", name);
    if (property) element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = pageMetadata[pathname] ?? pageMetadata["/"];
    const siteUrl = configuredSiteUrl || window.location.origin;
    const canonicalUrl = `${siteUrl}${pathname === "/" ? "/" : pathname}`;
    const imageUrl = new URL(metadata.image, siteUrl).href;
    document.title = metadata.title;
    setMeta('meta[name="description"]', "content", metadata.description);
    setMeta('meta[property="og:title"]', "content", metadata.title);
    setMeta('meta[property="og:description"]', "content", metadata.description);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[property="og:image"]', "content", imageUrl);
    setMeta('meta[name="twitter:title"]', "content", metadata.title);
    setMeta(
      'meta[name="twitter:description"]',
      "content",
      metadata.description,
    );
    setMeta('meta[name="twitter:image"]', "content", imageUrl);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          name: organizationName,
          alternateName: "All Walls Down",
          url: `${siteUrl}/`,
          logo: `${siteUrl}/assets/awd-logo.webp`,
          image: `${siteUrl}/assets/hero-barrier.webp`,
          slogan: "Breaking Every Barrier!",
          description: pageMetadata["/"].description,
          founder: [
            { "@type": "Person", name: "Monta Cheathem" },
            { "@type": "Person", name: "Kim Cheathem" },
          ],
        },
        {
          "@type": "WebPage",
          "@id": `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: metadata.title,
          description: metadata.description,
          isPartOf: { "@id": `${siteUrl}/#website` },
          about: { "@id": `${siteUrl}/#organization` },
          primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
        },
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: organizationName,
          publisher: { "@id": `${siteUrl}/#organization` },
        },
      ],
    };
    let script = document.head.querySelector('script[data-awd-schema="true"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.awdSchema = "true";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }, [pathname]);

  return null;
}

function DonateButton({ onClick, variant = "gold", children = "Donate" }) {
  return (
    <button
      className={`button button--${variant}`}
      type="button"
      onClick={onClick}
    >
      <Heart aria-hidden="true" size={18} strokeWidth={1.8} />
      <span>{children}</span>
    </button>
  );
}

function Ornament({ compact = false }) {
  return (
    <div
      className={compact ? "ornament ornament--left" : "ornament"}
      aria-hidden="true"
    >
      <span />
      <Sparkles size={15} />
      <span />
    </div>
  );
}

function Header({ onDonate }) {
  const [open, setOpen] = useState(false);
  const [managedPages] = useStoredCollection(
    storageKeys.pages,
    hydrateManagedPages(defaultManagedPages),
  );
  const closeMenu = () => setOpen(false);
  const navItems = managedPages
    .filter((page) => page.isActive !== false && page.status === "Published")
    .map((page) => [page.route, page.navLabel || page.title]);

  return (
    <header className="site-header">
      <NavLink
        className="brand"
        to="/"
        aria-label="All Walls Down home"
        onClick={closeMenu}
      >
        <img
          src="/assets/awd-logo.webp"
          alt=""
          width="1190"
          height="1322"
          decoding="async"
          fetchpriority="high"
        />
        <span className="brand__text">
          <span className="brand__line">All Walls Down</span>
          <span className="brand__org">Organization</span>
        </span>
      </NavLink>
      <button
        className="menu-button"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        className={open ? "nav nav--open" : "nav"}
        aria-label="Main navigation"
      >
        {navItems.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => (isActive ? "nav__active" : undefined)}
            onClick={closeMenu}
          >
            {label}
          </NavLink>
        ))}
        <div className="nav-donate">
          <DonateButton
            onClick={() => {
              closeMenu();
              onDonate();
            }}
            variant="outline"
          />
        </div>
      </nav>
    </header>
  );
}

function PageHero({ label, title, body, image, imageClass = "" }) {
  const dimensions = imageDimensions[image];

  return (
    <section className={`page-hero ${imageClass}`}>
      {image ? (
        <div className="page-hero__mark" aria-hidden="true">
          <img
            src={image}
            alt=""
            width={dimensions?.width}
            height={dimensions?.height}
            decoding="async"
            fetchpriority="high"
          />
        </div>
      ) : null}
      <div className="shell page-hero__content">
        <p className="section-label">{label}</p>
        <h1>{title}</h1>
        <Ornament />
        <p>{body}</p>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [testimonials, setTestimonials] = useStoredCollection(
    storageKeys.testimonials,
    sampleTestimonials,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    ministry: "All Walls Down",
    quote: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const displayTestimonials = testimonials.filter(
    (testimonial) =>
      testimonial.status === "Approved" && testimonial.displayOnSite,
  );

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitTestimonial = (event) => {
    event.preventDefault();
    const nextTestimonial = {
      id: createId("testimonial"),
      ...form,
      quote: form.quote.trim(),
      submittedAt: new Date().toISOString(),
      reviewedAt: "",
      status: "Pending Review",
      displayOnSite: false,
      notes: "",
    };
    setTestimonials((current) => [nextTestimonial, ...current]);
    setForm({
      name: "",
      email: "",
      city: "",
      ministry: "All Walls Down",
      quote: "",
    });
    setSubmitted(true);
    setModalOpen(false);
  };

  return (
    <section className="testimonials section" id="testimonials">
      <div className="shell testimonials__grid">
        <div className="testimonials__intro">
          <p className="section-label">Testimonials</p>
          <h2>Stories of faith, unity, and changed lives.</h2>
          <p>
            Approved stories from the AWD community appear here after review by
            the ministry team.
          </p>
          <button
            className="button button--gold"
            type="button"
            onClick={() => {
              setSubmitted(false);
              setModalOpen(true);
            }}
          >
            <MessageSquareQuote size={18} /> Submit a Testimonial
          </button>
          {submitted ? (
            <p className="form-confirmation">
              Thank you. Your testimony has been received for review.
            </p>
          ) : null}
        </div>
        <div className="testimonial-list" aria-label="Approved testimonials">
          {displayTestimonials.map((testimonial, index) => (
            <article
              key={testimonial.id}
              className={`testimonial-bubble testimonial-bubble--${(index % 3) + 1}`}
            >
              <span className="testimonial-bubble__icon">
                <MessageSquareQuote aria-hidden="true" />
              </span>
              <blockquote>“{testimonial.quote}”</blockquote>
              <div className="testimonial-bubble__person">
                <span aria-hidden="true">{testimonial.name.slice(0, 1)}</span>
                <div>
                  <strong>{testimonial.name}</strong>
                  <small>
                    {testimonial.ministry}
                    {testimonial.city ? ` / ${testimonial.city}` : ""}
                  </small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <TestimonialModal
        open={modalOpen}
        form={form}
        onChange={updateForm}
        onSubmit={submitTestimonial}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}

function TestimonialModal({ open, form, onChange, onSubmit, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="donation-modal testimonial-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="testimonial-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <MessageSquareQuote aria-hidden="true" />
            <span>Share your testimony</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close testimonial form">
            <X />
          </button>
        </header>
        <div className="donation-modal__intro">
          <h2 id="testimonial-title">Tell the story.</h2>
          <p>
            Share what God has done through All Walls Down. Testimonies are
            reviewed before appearing on the site.
          </p>
        </div>
        <form className="portal-form testimonial-modal__form" onSubmit={onSubmit}>
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              placeholder="Your name"
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            City
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              placeholder="City, State"
            />
          </label>
          <label>
            Ministry
            <select name="ministry" value={form.ministry} onChange={onChange}>
              <option>All Walls Down</option>
              <option>Brothers Keepers</option>
              <option>Daughters of the King</option>
            </select>
          </label>
          <label className="form-span">
            Testimony
            <textarea
              name="quote"
              value={form.quote}
              onChange={onChange}
              required
              rows="6"
              placeholder="Share what God has done..."
            />
          </label>
          <div className="testimonial-modal__actions form-span">
            <button className="button button--gold" type="submit">
              <Plus size={18} /> Submit for Review
            </button>
            <button className="button button--outline" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

function PrayerRequestForm() {
  const [, setPrayerRequests] = useStoredCollection(storageKeys.prayerRequests, []);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    request: "",
    isConfidential: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const updateForm = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitPrayerRequest = (event) => {
    event.preventDefault();
    setPrayerRequests((current) => [
      {
        id: createId("prayer"),
        ...form,
        submittedAt: new Date().toISOString(),
        status: "Pending Prayer",
        notes: "",
      },
      ...current,
    ]);
    setForm({
      name: "",
      email: "",
      phone: "",
      request: "",
      isConfidential: false,
    });
    setSubmitted(true);
  };

  return (
    <form className="portal-form public-form" onSubmit={submitPrayerRequest}>
      <p className="section-label">Prayer Request</p>
      <h3>Let us pray with you.</h3>
      <label>
        Name
        <input
          name="name"
          value={form.name}
          onChange={updateForm}
          required
          placeholder="Your name"
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={updateForm}
          placeholder="you@example.com"
        />
      </label>
      <label>
        Phone
        <input
          name="phone"
          value={form.phone}
          onChange={updateForm}
          placeholder="Optional"
        />
      </label>
      <label className="form-span">
        Request
        <textarea
          name="request"
          value={form.request}
          onChange={updateForm}
          required
          rows="6"
          placeholder="How can we pray?"
        />
      </label>
      <label className="checkbox-line form-span">
        <input
          name="isConfidential"
          type="checkbox"
          checked={form.isConfidential}
          onChange={updateForm}
        />
        Keep this request confidential to ministry staff.
      </label>
      <button className="button button--gold" type="submit">
        <HandHeart size={18} /> Submit Prayer Request
      </button>
      {submitted ? (
        <p className="form-confirmation">
          Your request has been received. Our team will pray with you.
        </p>
      ) : null}
    </form>
  );
}

function ContactForm() {
  const [, setContacts] = useStoredCollection(storageKeys.contacts, []);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "General Contact",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitContact = (event) => {
    event.preventDefault();
    setContacts((current) => [
      {
        id: createId("contact"),
        ...form,
        category: form.reason,
        submittedAt: new Date().toISOString(),
        status: "New",
        notes: "",
        emailHistory: [],
      },
      ...current,
    ]);
    setForm({
      name: "",
      email: "",
      phone: "",
      reason: "General Contact",
      message: "",
    });
    setSubmitted(true);
  };

  return (
    <form className="portal-form public-form" onSubmit={submitContact}>
      <p className="section-label">Contact AWD</p>
      <h3>Start a conversation.</h3>
      <label>
        Name
        <input
          name="name"
          value={form.name}
          onChange={updateForm}
          required
          placeholder="Your name"
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={updateForm}
          required
          placeholder="you@example.com"
        />
      </label>
      <label>
        Phone
        <input
          name="phone"
          value={form.phone}
          onChange={updateForm}
          placeholder="Optional"
        />
      </label>
      <label>
        Reason
        <select name="reason" value={form.reason} onChange={updateForm}>
          <option>General Contact</option>
          <option>Volunteer</option>
          <option>Partnership</option>
          <option>Brothers Keepers</option>
          <option>Daughters of the King</option>
          <option>Giving</option>
          <option>Pastoral Follow Up</option>
        </select>
      </label>
      <label className="form-span">
        Message
        <textarea
          name="message"
          value={form.message}
          onChange={updateForm}
          required
          rows="6"
          placeholder="Tell us how we can help..."
        />
      </label>
      <button className="button button--gold" type="submit">
        <Mail size={18} /> Send Contact Request
      </button>
      {submitted ? (
        <p className="form-confirmation">
          Your message has been received. AWD staff can review it in the portal.
        </p>
      ) : null}
    </form>
  );
}

function HomePage({ onDonate }) {
  return (
    <>
      <section className="hero">
        <div className="hero__image" aria-hidden="true" />
        <div className="hero__atmosphere" aria-hidden="true">
          {heroParticles.map((style, index) => (
            <span key={index} style={style} />
          ))}
        </div>
        <div className="hero__content shell">
          <h1>
            Breaking
            <br />
            Every Barrier.
          </h1>
          <Ornament />
          <p>
            Bringing the focus back to Christ and breaking every barrier that
            seeks to separate us.
          </p>
          <div className="hero__actions">
            <NavLink className="button button--outline" to="/About_us">
              Our Mission <ArrowRight size={18} />
            </NavLink>
            <DonateButton onClick={onDonate} />
          </div>
          <blockquote>
            <span>†</span>
            You are all one in Christ Jesus. <cite>— Galatians 3:28</cite>
          </blockquote>
        </div>
      </section>

      <section className="home-mission">
        <div className="shell home-mission__grid">
          <div>
            <p className="section-label">Our Mission</p>
            <h2>
              To be the hands and feet <em>for Christ!</em>
            </h2>
          </div>
          <p>
            We are called to love boldly, serve humbly, and create an atmosphere
            where people of every culture can experience God personally.
          </p>
          <div className="home-marks" aria-label="All Walls Down ministries">
            {ministries.map((ministry) => (
              <NavLink
                className={ministry.className}
                to="/Ministries"
                key={ministry.name}
              >
                <span className="home-mark__art" aria-hidden="true">
                  {ministry.className === "ministry--bk" ? (
                    <>
                      <span className="ember-field ember-field--home ember-field--back">
                        {emberParticles.slice(0, 18).map((style, emberIndex) => (
                          <i key={emberIndex} style={style} />
                        ))}
                      </span>
                      <span className="ember-field ember-field--home ember-field--front">
                        {emberParticles.slice(18).map((style, emberIndex) => (
                          <i key={emberIndex} style={style} />
                        ))}
                      </span>
                    </>
                  ) : null}
                  {ministry.className === "ministry--dok" ? (
                    <>
                      <span className="royal-field royal-field--home royal-field--back">
                        {royalParticles.slice(0, 14).map((style, particleIndex) => (
                          <i key={particleIndex} style={style} />
                        ))}
                      </span>
                      <span className="royal-field royal-field--home royal-field--front">
                        {royalParticles.slice(14).map((style, particleIndex) => (
                          <i key={particleIndex} style={style} />
                        ))}
                      </span>
                    </>
                  ) : null}
                <img
                  src={ministry.image}
                  alt=""
                  width={imageDimensions[ministry.image]?.width}
                  height={imageDimensions[ministry.image]?.height}
                  loading="lazy"
                  decoding="async"
                />
                </span>
                <span>{ministry.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      <section className="home-intro section">
        <div className="shell split-feature">
          <div className="split-feature__art">
            <img
              src="/assets/awd-logo.webp"
              alt=""
              width="1190"
              height="1322"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <p className="section-label">Who We Are</p>
            <h2>Faith is more than religion.</h2>
            <Ornament compact />
            <p>
              It is about a relationship between a person and God. AWD exists to
              bring Truth back to the heart of people and tear down everything
              that divides us.
            </p>
            <NavLink className="text-link" to="/About_us">
              Discover our story <ArrowRight size={17} />
            </NavLink>
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <GivingCallout onDonate={onDonate} />
    </>
  );
}

function AboutPage({ onDonate }) {
  return (
    <>
      <PageHero
        label="About AWD"
        title="Faith is more than religion."
        body="It is about a relationship between a person and God—and a Truth that belongs in the heart of the people."
        image="/assets/awd-logo.webp"
        imageClass="page-hero--about"
      />
      <section className="about-story section">
        <div className="shell about-story__grid">
          <div className="about-story__copy">
            <p className="section-label">Our Vision</p>
            <h2>Where every wall has to come down.</h2>
            <Ornament compact />
            <p>
              Our vision is to bring Truth to the place where it was always
              meant to be—in the heart of the people—and thus by doing so,
              breaking every barrier.
            </p>
            <p>
              We are creating a place and atmosphere where people of all
              cultures can experience God on a personal level, where all walls
              in a person&apos;s life have to come down.
            </p>
            <blockquote>
              “There is neither Jew nor Gentile, neither slave nor free, nor is
              there male and female, for you are all one in Christ Jesus.”
              <cite>Galatians 3:28</cite>
            </blockquote>
          </div>
          <aside className="mission-panel mission-panel--large">
            <p className="section-label">Our Mission</p>
            <h3>
              To be the hands and feet <em>for Christ!</em>
            </h3>
            <p>
              Bringing the focus back to Christ and breaking every barrier that
              seeks to separate us.
            </p>
            <DonateButton onClick={onDonate} />
          </aside>
        </div>
      </section>
      <section className="founders-section">
        <div className="shell founders-section__grid">
          <div className="founders-section__mark">
            <img
              src="/assets/awd-logo.webp"
              alt=""
              width="1190"
              height="1322"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <p className="section-label">Founders of All Walls Down Organization</p>
            <h2>Monta &amp; Kim Cheathem</h2>
            <p>
              Together, Monta and Kim lead AWD with a shared commitment to
              serving people, centering Christ, and building a community where
              division gives way to unity.
            </p>
            <p>
              Founded in a basic formula we like to call LAB that all people
              should feel Loved Accepted and that they Belong.
            </p>
          </div>
        </div>
      </section>
      <GivingCallout onDonate={onDonate} />
    </>
  );
}

function MinistriesPage({ onDonate }) {
  return (
    <>
      <PageHero
        label="Our Ministries"
        title="One organization, Many hands, One vision!"
        body="Many hands united in Christ and committed to breaking every barrier."
        image="/assets/brothers-keepers.webp"
        imageClass="page-hero--ministries"
      />
      <section className="ministries section">
        <div className="shell">
          <div className="ministry-list">
            {ministries.map((ministry, index) => (
              <article
                className={`ministry ${ministry.className}`}
                key={ministry.name}
              >
                <div className="ministry__number">0{index + 1}</div>
                <div className="ministry__art">
                  {ministry.className === "ministry--bk" ? (
                    <>
                      <div className="ember-field ember-field--back" aria-hidden="true">
                        {emberParticles.slice(0, 18).map((style, emberIndex) => (
                          <span key={emberIndex} style={style} />
                        ))}
                      </div>
                      <div className="ember-field ember-field--front" aria-hidden="true">
                        {emberParticles.slice(18).map((style, emberIndex) => (
                          <span key={emberIndex} style={style} />
                        ))}
                      </div>
                    </>
                  ) : null}
                  {ministry.className === "ministry--dok" ? (
                    <>
                      <div className="royal-field royal-field--back" aria-hidden="true">
                        {royalParticles.slice(0, 14).map((style, particleIndex) => (
                          <span key={particleIndex} style={style} />
                        ))}
                      </div>
                      <div className="royal-field royal-field--front" aria-hidden="true">
                        {royalParticles.slice(14).map((style, particleIndex) => (
                          <span key={particleIndex} style={style} />
                        ))}
                      </div>
                    </>
                  ) : null}
                  <img
                    src={ministry.image}
                    alt={ministry.alt}
                    width={imageDimensions[ministry.image]?.width}
                    height={imageDimensions[ministry.image]?.height}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="ministry__copy">
                  <span>{ministry.short}</span>
                  <h2>{ministry.name}</h2>
                  <blockquote>{ministry.quote}</blockquote>
                  <p>{ministry.body}</p>
                  <p>{ministry.detail}</p>
                  {ministry.scripture ? (
                    <blockquote className="ministry__scripture">
                      <strong>{ministry.scripture.reference}</strong>
                      <span>{ministry.scripture.translation}</span>
                      {ministry.scripture.verses.map((verse) => (
                        <p key={verse}>{verse}</p>
                      ))}
                    </blockquote>
                  ) : null}
                  <DonateButton onClick={onDonate} variant="outline">
                    Support This Ministry
                  </DonateButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <GivingCallout onDonate={onDonate} />
    </>
  );
}

function LeadershipPage({ onDonate }) {
  const [staffUsers] = useStoredCollection(storageKeys.users, []);
  const leadershipSource = staffUsers.length
    ? staffUsers
    : leadershipStaffSeeds.map(createSeededLeadershipUser);
  const leadershipUsers = leadershipSource.filter(shouldShowOnLeadership);
  const pinnedLeaders = leadershipUsers.filter(isPinnedLeadershipUser);
  const rosterLeaders = leadershipUsers.filter((user) => !isPinnedLeadershipUser(user));
  const montaLeader =
    pinnedLeaders.find((user) => String(user.name || "").toLowerCase().includes("monta")) ||
    createSeededLeadershipUser(leadershipStaffSeeds[0]);
  const kimLeader =
    pinnedLeaders.find((user) => String(user.name || "").toLowerCase().includes("kim")) ||
    createSeededLeadershipUser(leadershipStaffSeeds[1]);

  return (
    <>
      <PageHero
        label="Leadership"
        title="Leading with integrity and unity."
        body="Servant leaders committed to guiding AWD, Brothers Keepers, and Daughters of the King."
        image="/assets/core-leadership-transparent.webp"
        imageClass="page-hero--leadership"
      />
      <section className="leadership section">
        <div className="shell">
          <div className="section-heading section-heading--left">
            <p className="section-label">Brothers Keepers</p>
            <h2>Core Leadership Directors</h2>
          </div>
          <div className="director">
            <img
              src="/assets/brothers-keepers.webp"
              alt=""
              width="962"
              height="956"
              loading="lazy"
              decoding="async"
            />
            <div>
              <span>Founder / Director</span>
              <strong>{montaLeader.name}</strong>
            </div>
          </div>
          <div
            className="roster"
            aria-label="Brothers Keepers Core Leadership Directors"
          >
            {rosterLeaders.map((leader) => (
              <div key={leader.id || leader.email}>{leader.name}</div>
            ))}
          </div>
          <div className="dok-director">
            <img
              src="/assets/dok-clean.png"
              alt=""
              width="626"
              height="712"
              loading="lazy"
              decoding="async"
            />
            <div>
              <span>Daughters of the King</span>
              <h3>Founder / Director</h3>
              <strong>{kimLeader.name}</strong>
            </div>
            <DonateButton onClick={onDonate} variant="outline">
              Support DOK
            </DonateButton>
          </div>
        </div>
      </section>
      <GivingCallout onDonate={onDonate} />
    </>
  );
}

function GetInvolvedPage({ onDonate }) {
  return (
    <>
      <PageHero
        label="Get Involved"
        title="Be the hands and feet for Christ."
        body="There is a place for you in the work of breaking every barrier."
        image="/assets/awd-logo.webp"
        imageClass="page-hero--involved"
      />
      <section className="get-involved section">
        <div className="shell">
          <div className="section-heading">
            <p className="section-label">Join the Mission</p>
            <h2>Every act of faith can move a wall.</h2>
            <p>
              Pray, partner, serve, or give. Each path helps carry the hope of
              Christ into our community.
            </p>
          </div>
          <div className="ways ways--page">
            {ways.map(({ icon: Icon, title, body }) => (
              <article key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="way-note">Breaking Every Barrier</span>
              </article>
            ))}
            <article className="ways__donate">
              <Heart aria-hidden="true" />
              <h3>Give With Purpose</h3>
              <p>Your generosity helps carry this mission forward.</p>
              <DonateButton onClick={onDonate}>Donate Now</DonateButton>
            </article>
          </div>
          <div className="involved-statement">
            <img
              src="/assets/awd-logo.webp"
              alt=""
              width="1190"
              height="1322"
              loading="lazy"
              decoding="async"
            />
            <blockquote>
              “Our mission is simple: to be the hands and feet for Christ.”
              <cite>AWD — All Walls Down</cite>
            </blockquote>
          </div>
          <div className="public-intake-grid">
            <PrayerRequestForm />
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

function GivingCallout({ onDonate }) {
  return (
    <section className="giving-callout">
      <div className="shell">
        <HandHeart aria-hidden="true" />
        <div>
          <h2>Your support helps us continue breaking every barrier.</h2>
          <p>
            Together, we can reach more lives and bring hope to every heart.
          </p>
        </div>
        <DonateButton onClick={onDonate}>Donate Now</DonateButton>
      </div>
    </section>
  );
}

function Footer({ onDonate }) {
  return (
    <footer>
      <div className="shell footer__grid">
        <div className="footer__brand">
          <img
            src="/assets/awd-logo.webp"
            alt="All Walls Down"
            width="1190"
            height="1322"
            loading="lazy"
            decoding="async"
          />
          <strong>AWD — All Walls Down Organization</strong>
          <em>Breaking Every Barrier!</em>
        </div>
        <div>
          <span>Explore</span>
          <NavLink to="/About_us">About</NavLink>
          <NavLink to="/Ministries">Ministries</NavLink>
          <NavLink to="/Leadership">Leadership</NavLink>
          <NavLink to="/Get_Involved">Get Involved</NavLink>
        </div>
        <div>
          <span>Ministries</span>
          <NavLink to="/Ministries">Brothers Keepers</NavLink>
          <NavLink to="/Leadership">Core Leadership</NavLink>
          <NavLink to="/Ministries">Daughters of the King</NavLink>
          <button type="button" onClick={onDonate}>
            Donate
          </button>
        </div>
        <blockquote>
          “There is neither Jew nor Gentile, neither slave nor free, nor is
          there male and female, for you are all one in Christ Jesus.”
          <cite>Galatians 3:28</cite>
        </blockquote>
      </div>
      <div className="footer__bottom">
        <span>
          © {new Date().getFullYear()} AWD — All Walls Down Organization.
        </span>
        <span>Breaking Every Barrier!</span>
      </div>
    </footer>
  );
}

function DonationModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="donation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <ShieldCheck aria-hidden="true" />
            <span>Secure giving through Zeffy</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close donation form"
          >
            <X />
          </button>
        </header>
        <div className="donation-modal__intro">
          <h2 id="donation-title">Make an impact.</h2>
          <p>Your generosity helps us be the hands and feet of Christ.</p>
        </div>
        <iframe
          title="Donate to All Walls Down through Zeffy"
          src={donationUrl}
          allow="payment"
          loading="eager"
        />
        <a href={donationUrl} target="_blank" rel="noreferrer">
          Open the secure donation form in a new tab <ArrowRight size={15} />
        </a>
      </section>
    </div>
  );
}

function StaffAuth({ onLogin }) {
  const [users, setUsers] = useStoredCollection(storageKeys.users, []);
  const [mfaPolicy] = useStoredCollection(storageKeys.mfaPolicy, defaultMfaPolicy);
  const [mode, setMode] = useState(users.length ? "login" : "create");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Ministry Staff",
  });
  const [error, setError] = useState("");

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const createAccount = (event) => {
    event.preventDefault();
    if (users.some((user) => user.email.toLowerCase() === form.email.toLowerCase())) {
      setError("An account already exists for this email.");
      return;
    }
    const nextUser = {
      id: createId("staff"),
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      roles: [form.role],
      isActive: true,
      mfaRequired: form.role !== "Administrator",
      mfaEnabled: false,
      mfaMethods: {},
      mfaEnrollmentStatus: form.role === "Administrator" ? "Administrator Exempt" : "Required",
      lastMfaUpdatedAt: "",
      createdAt: new Date().toISOString(),
    };
    setUsers((current) => [nextUser, ...current]);
    onLogin(nextUser, {
      mfaSetupRequired: shouldRequireUserMfa(nextUser, mfaPolicy),
    });
  };

  const login = (event) => {
    event.preventDefault();
    const user = users.find(
      (currentUser) =>
        currentUser.email.toLowerCase() === form.email.toLowerCase() &&
        currentUser.password === form.password,
    );
    if (!user) {
      setError("The email or password did not match a staff account.");
      return;
    }
    if (user.isActive === false) {
      setError("This staff account is deactivated.");
      return;
    }
    const mfaRequired = shouldRequireUserMfa(user, mfaPolicy);
    const hasMfa = Object.values(user.mfaMethods || {}).some(Boolean);
    onLogin(user, {
      mfaSetupRequired: mfaPolicy.forceFirstLoginEnrollment && mfaRequired && !hasMfa,
    });
  };

  return (
    <section className="staff-auth">
      <div className="staff-auth__panel">
        <img src="/assets/awd-logo.webp" alt="" width="1190" height="1322" />
        <p className="section-label">Staff Portal</p>
        <h1>Ministry Management</h1>
        <p>
          Review prayer requests, moderate testimonials, manage contacts, and
          prepare ministry follow-up.
        </p>
        <div className="staff-auth__switch">
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "create" ? "is-active" : ""}
            onClick={() => {
              setMode("create");
              setError("");
            }}
          >
            Create Account
          </button>
        </div>
        <form
          className="portal-form"
          onSubmit={mode === "create" ? createAccount : login}
        >
          {mode === "create" ? (
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={updateForm}
                required
                placeholder="Staff name"
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateForm}
              required
              placeholder="staff@example.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateForm}
              required
              placeholder="Password"
            />
          </label>
          {mode === "create" ? (
            <label>
              Role
              <select name="role" value={form.role} onChange={updateForm}>
                {staffRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button button--gold" type="submit">
            <Lock size={18} />
            {mode === "create" ? "Create Account" : "Login"}
          </button>
          <p className="staff-auth__note">
            Browser demo storage is active. Production authentication should use
            a server-side identity provider.
          </p>
        </form>
      </div>
    </section>
  );
}

function MfaEnrollmentGate({ session, policy, onEnroll, onLogout }) {
  const allowedMethods = mfaMethodOptions.filter(
    ({ id }) => policy.allowedMethods?.[id] !== false,
  );
  const [selectedMethods, setSelectedMethods] = useState(
    allowedMethods.length ? [allowedMethods[0].id] : [],
  );
  const [error, setError] = useState("");

  const toggleMethod = (methodId, enabled) => {
    setSelectedMethods((current) =>
      enabled
        ? [...new Set([...current, methodId])]
        : current.filter((id) => id !== methodId),
    );
  };

  const completeEnrollment = () => {
    if (!selectedMethods.length) {
      setError("Select at least one MFA method before continuing.");
      return;
    }
    onEnroll(selectedMethods);
  };

  return (
    <section className="staff-auth">
      <div className="staff-auth__panel mfa-gate">
        <ShieldCheck aria-hidden="true" />
        <p className="section-label">MFA Required</p>
        <h1>Secure Your Account</h1>
        <p>
          {session.name || session.email}, your account requires multi-factor
          authentication before you can enter the staff portal.
        </p>
        <div className="mfa-methods">
          {allowedMethods.map(({ id, label, body, icon: Icon }) => (
            <label key={id} className="mfa-method">
              <input
                type="checkbox"
                checked={selectedMethods.includes(id)}
                onChange={(event) => toggleMethod(id, event.target.checked)}
              />
              <Icon />
              <span>
                <strong>{label}</strong>
                <small>{body}</small>
              </span>
            </label>
          ))}
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="account-actions">
          <button className="button button--gold" type="button" onClick={completeEnrollment}>
            <ShieldCheck size={18} /> Complete MFA Enrollment
          </button>
          <button className="button button--outline" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ children }) {
  return <span className="status-badge">{children}</span>;
}

function EmptyPortalState({ children }) {
  return <p className="portal-empty">{children}</p>;
}

function StaffPortalPage() {
  const [session, setSession] = useState(() =>
    readStored(storageKeys.session, null),
  );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState({
    overview: true,
    crm: true,
    prayer: false,
    testimonials: false,
    communications: false,
    pages: true,
    administration: false,
    system: false,
  });
  const [prayerRequests, setPrayerRequests] = useStoredCollection(
    storageKeys.prayerRequests,
    samplePrayerRequests,
  );
  const [testimonials, setTestimonials] = useStoredCollection(
    storageKeys.testimonials,
    sampleTestimonials,
  );
  const [contacts, setContacts] = useStoredCollection(
    storageKeys.contacts,
    sampleContacts,
  );
  const [staffUsers, setStaffUsers] = useStoredCollection(storageKeys.users, []);
  const [managedContactCategories, setManagedContactCategories] =
    useStoredCollection(storageKeys.contactCategories, contactCategories);
  const [crmSettings, setCrmSettings] = useStoredCollection(
    storageKeys.crmSettings,
    defaultCrmSettings,
  );
  const [mfaPolicy, setMfaPolicy] = useStoredCollection(
    storageKeys.mfaPolicy,
    defaultMfaPolicy,
  );
  const [mailSettings, setMailSettings] = useStoredCollection(
    storageKeys.mailSettings,
    defaultMailSettings,
  );
  const [managedPages, setManagedPages] = useStoredCollection(
    storageKeys.pages,
    hydrateManagedPages(defaultManagedPages),
  );
  const [composer, setComposer] = useState({
    contactId: "",
    subject: "",
    message: "",
  });
  const [mailNotice, setMailNotice] = useState("");
  const [selectedTestimonialId, setSelectedTestimonialId] = useState("");
  const [selectedTestimonialIds, setSelectedTestimonialIds] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedPrayerId, setSelectedPrayerId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState("Active");
  const [contactCategoryFilter, setContactCategoryFilter] = useState("All Categories");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [csvImportSource, setCsvImportSource] = useState("Auto Detect");
  const [csvImportNotice, setCsvImportNotice] = useState("");
  const [csvImportBusy, setCsvImportBusy] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedPageIds, setSelectedPageIds] = useState([]);
  const [pageEditorMode, setPageEditorMode] = useState("list");
  const [deleteImagePageId, setDeleteImagePageId] = useState("");
  const siteFrameRef = useRef(null);
  const [frameImageEditor, setFrameImageEditor] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    email: "",
    password: "ChangeMe123!",
    roles: ["Ministry Staff"],
    mfaRequired: true,
    showOnLeadership: false,
  });

  useEffect(() => {
    if (!selectedTestimonialId && testimonials.length) {
      setSelectedTestimonialId(testimonials[0].id);
    }
  }, [selectedTestimonialId, testimonials]);

  useEffect(() => {
    if (!selectedPageId && managedPages.length) {
      setSelectedPageId(managedPages[0].id);
    }
  }, [managedPages, selectedPageId]);

  useEffect(() => {
    const handleFrameMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "awd:image-edit") return;
      setFrameImageEditor({
        route: event.data.route,
        index: event.data.index,
        src: event.data.src || "",
        draft: event.data.src || "",
      });
    };
    window.addEventListener("message", handleFrameMessage);
    return () => window.removeEventListener("message", handleFrameMessage);
  }, []);

  const login = (user, options = {}) => {
    const roles = getUserRoles(user);
    const nextSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || roles[0],
      roles,
      mfaSetupRequired: Boolean(options.mfaSetupRequired),
      loggedInAt: new Date().toISOString(),
    };
    writeStored(storageKeys.session, nextSession);
    setSession(nextSession);
  };

  const isUserAdmin = isUserAdministrator(session);

  const currentStaffUser =
    staffUsers.find((user) => user.id === session?.id) ||
    staffUsers.find((user) => user.email === session?.email) ||
    session;

  const updateStaffUser = (id, patch) => {
    setStaffUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              ...patch,
              roles: patch.roles || user.roles || [user.role || "Ministry Staff"],
              role: patch.role || patch.roles?.[0] || user.role || "Ministry Staff",
              mfaEnrollmentStatus:
                patch.mfaEnrollmentStatus ||
                (patch.mfaRequired === false
                  ? "Not Required"
                  : user.mfaEnrollmentStatus || "Required"),
              updatedAt: new Date().toISOString(),
            }
          : user,
      ),
    );
    if (id === session?.id) {
      const nextRoles = patch.roles || session.roles || [session.role];
      const nextSession = {
        ...session,
        name: patch.name ?? session.name,
        email: patch.email ?? session.email,
        role: patch.role ?? nextRoles[0] ?? session.role,
        roles: nextRoles,
      };
      writeStored(storageKeys.session, nextSession);
      setSession(nextSession);
    }
  };

  const toggleMfaMethod = (id, methodId, enabled) => {
    const user = staffUsers.find((staffUser) => staffUser.id === id);
    updateStaffUser(id, {
      mfaMethods: {
        ...(user?.mfaMethods || {}),
        [methodId]: enabled,
      },
      mfaEnabled: enabled || Object.entries(user?.mfaMethods || {}).some(
        ([key, value]) => key !== methodId && value,
      ),
      mfaEnrollmentStatus: enabled ? "Enrolled" : "Required",
      lastMfaUpdatedAt: new Date().toISOString(),
    });
  };

  const completeMfaEnrollment = (methods) => {
    const methodMap = methods.reduce(
      (accumulator, methodId) => ({ ...accumulator, [methodId]: true }),
      {},
    );
    updateStaffUser(session.id, {
      mfaMethods: methodMap,
      mfaEnabled: true,
      mfaRequired: true,
      mfaEnrollmentStatus: "Enrolled",
      lastMfaUpdatedAt: new Date().toISOString(),
    });
    const nextSession = { ...session, mfaSetupRequired: false };
    writeStored(storageKeys.session, nextSession);
    setSession(nextSession);
  };

  const updateNewStaffForm = (patch) => {
    setNewStaffForm((current) => ({ ...current, ...patch }));
  };

  const toggleNewStaffRole = (role, enabled) => {
    setNewStaffForm((current) => {
      const roles = enabled
        ? [...new Set([...current.roles, role])]
        : current.roles.filter((currentRole) => currentRole !== role);
      return {
        ...current,
        roles: roles.length ? roles : ["Ministry Staff"],
        mfaRequired: roles.includes("Administrator") ? false : current.mfaRequired,
      };
    });
  };

  const createStaffAccount = (event) => {
    event.preventDefault();
    if (!isUserAdmin) return;
    if (
      staffUsers.some(
        (user) => user.email.toLowerCase() === newStaffForm.email.toLowerCase(),
      )
    ) {
      return;
    }
    const roles = newStaffForm.roles.length
      ? newStaffForm.roles
      : ["Ministry Staff"];
    const nextUser = {
      id: createId("staff"),
      name: newStaffForm.name,
      email: newStaffForm.email,
      password: newStaffForm.password,
      role: roles[0],
      roles,
      isActive: true,
      showOnLeadership: newStaffForm.showOnLeadership,
      mfaRequired: roles.includes("Administrator") ? false : newStaffForm.mfaRequired,
      mfaEnabled: false,
      mfaMethods: {},
      mfaEnrollmentStatus: roles.includes("Administrator")
        ? "Administrator Exempt"
        : "Required",
      requirePasswordReset: true,
      lastMfaUpdatedAt: "",
      createdAt: new Date().toISOString(),
    };
    setStaffUsers((current) => [nextUser, ...current]);
    setSelectedStaffId(nextUser.id);
    setNewStaffForm({
      name: "",
      email: "",
      password: "ChangeMe123!",
      roles: ["Ministry Staff"],
      mfaRequired: true,
      showOnLeadership: false,
    });
  };

  const toggleStaffRole = (user, role, enabled) => {
    if (!isUserAdmin) return;
    const roles = enabled
      ? [...new Set([...getUserRoles(user), role])]
      : getUserRoles(user).filter((currentRole) => currentRole !== role);
    const nextRoles = roles.length ? roles : ["Ministry Staff"];
    updateStaffUser(user.id, {
      roles: nextRoles,
      role: nextRoles[0],
      mfaRequired: nextRoles.includes("Administrator") ? false : user.mfaRequired !== false,
      mfaEnrollmentStatus: nextRoles.includes("Administrator")
        ? "Administrator Exempt"
        : user.mfaEnrollmentStatus || "Required",
    });
  };

  const updateMfaPolicy = (patch) => {
    setMfaPolicy((current) => ({ ...current, ...patch }));
  };

  const togglePolicyMethod = (methodId, enabled) => {
    setMfaPolicy((current) => ({
      ...current,
      allowedMethods: {
        ...(current.allowedMethods || {}),
        [methodId]: enabled,
      },
    }));
  };

  const selectedStaffUser =
    staffUsers.find((user) => user.id === selectedStaffId) || staffUsers[0];
  const selectedManagedPage =
    managedPages.find((page) => page.id === selectedPageId) || managedPages[0];
  const logout = () => {
    window.localStorage.removeItem(storageKeys.session);
    setSession(null);
  };

  const updatePrayer = (id, patch) => {
    setPrayerRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              ...patch,
              prayedAt:
                patch.status === "We have Prayed"
                  ? new Date().toISOString()
                  : request.prayedAt,
            }
          : request,
      ),
    );
  };

  const updateTestimonial = (id, patch) => {
    setTestimonials((current) =>
      current.map((testimonial) =>
        testimonial.id === id
          ? {
              ...testimonial,
              ...patch,
              reviewedAt:
                patch.status === "Approved"
                  ? new Date().toISOString()
                  : testimonial.reviewedAt,
            }
          : testimonial,
      ),
    );
  };

  const bulkApproveTestimonials = () => {
    if (!selectedTestimonialIds.length) return;
    setTestimonials((current) =>
      current.map((testimonial) =>
        selectedTestimonialIds.includes(testimonial.id)
          ? {
              ...testimonial,
              status: "Approved",
              displayOnSite: true,
              reviewedAt: new Date().toISOString(),
            }
          : testimonial,
      ),
    );
    setSelectedTestimonialIds([]);
  };

  const toggleTestimonialSelection = (id) => {
    setSelectedTestimonialIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  };

  const updateContact = (id, patch) => {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? { ...contact, ...patch, updatedAt: new Date().toISOString() }
          : contact,
      ),
    );
  };

  const createContactRecord = () => {
    const followUpDate = new Date();
    followUpDate.setDate(
      followUpDate.getDate() + Number(crmSettings.autoFollowUpDays || 0),
    );
    const nextContact = {
      id: createId("contact"),
      name: "New Contact",
      email: "",
      phone: "",
      reason: "General Contact",
      category: "General Contact",
      tags: [],
      priority: crmSettings.defaultPriority || "Normal",
      assignedTo: crmSettings.defaultOwner || session.name || "Ministry Staff",
      nextFollowUp: crmSettings.autoFollowUpDays
        ? followUpDate.toISOString().slice(0, 10)
        : "",
      message: "",
      status: crmSettings.defaultStatus || "New",
      notes: "",
      submittedAt: new Date().toISOString(),
      emailHistory: [],
    };
    setContacts((current) => [nextContact, ...current]);
    setSelectedContactId(nextContact.id);
    setContactStatusFilter("Active");
    setContactCategoryFilter("All Categories");
  };

  const toggleMenu = (id) => {
    setExpandedMenus((current) => ({ ...current, [id]: !current[id] }));
  };

  const addContactCategory = () => {
    const nextCategory = categoryDraft.trim();
    if (!nextCategory) return;
    setManagedContactCategories((current) =>
      current.some((category) => category.toLowerCase() === nextCategory.toLowerCase())
        ? current
        : [...current, nextCategory],
    );
    setContactCategoryFilter(nextCategory);
    setCategoryDraft("");
  };

  const removeContactCategory = (category) => {
    if (category === "General Contact") return;
    setManagedContactCategories((current) =>
      current.filter((currentCategory) => currentCategory !== category),
    );
    setContacts((current) =>
      current.map((contact) =>
        contact.category === category
          ? { ...contact, category: "General Contact", updatedAt: new Date().toISOString() }
          : contact,
      ),
    );
    if (contactCategoryFilter === category) setContactCategoryFilter("All Categories");
  };

  const importContactsCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvImportBusy(true);
    setCsvImportNotice("");

    try {
      const text = await file.text();
      const source =
        csvImportSource === "Auto Detect"
          ? file.name.toLowerCase().includes("outlook")
            ? "Outlook"
            : "Google Contacts"
          : csvImportSource;
      const parsed = parseContactsCsv(text, source, {
        crmSettings,
        sessionName: session.name || session.email,
      });
      const existingKeys = new Set(
        contacts.flatMap((contact) =>
          [contact.email, contact.phone]
            .filter(Boolean)
            .map((value) => value.trim().toLowerCase()),
        ),
      );
      const nextContacts = [];
      let duplicateCount = 0;

      parsed.contacts.forEach((contact) => {
        const keys = [contact.email, contact.phone]
          .filter(Boolean)
          .map((value) => value.trim().toLowerCase());
        const isDuplicate = keys.some((key) => existingKeys.has(key));
        if (isDuplicate) {
          duplicateCount += 1;
          return;
        }
        keys.forEach((key) => existingKeys.add(key));
        nextContacts.push(contact);
      });

      if (nextContacts.length) {
        setContacts((current) => [...nextContacts, ...current]);
        setManagedContactCategories((current) => [
          ...current,
          ...parsed.categories.filter(
            (category) =>
              !current.some(
                (currentCategory) =>
                  currentCategory.toLowerCase() === category.toLowerCase(),
              ),
          ),
        ]);
        setContactStatusFilter("Active");
        setContactCategoryFilter("All Categories");
        setSelectedContactId(nextContacts[0].id);
      }

      setCsvImportNotice(
        `Imported ${nextContacts.length} contacts from ${source}. Skipped ${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"} and ${parsed.skipped} blank row${parsed.skipped === 1 ? "" : "s"}.`,
      );
    } catch {
      setCsvImportNotice("Unable to read that CSV. Check the file export and try again.");
    } finally {
      setCsvImportBusy(false);
      event.target.value = "";
    }
  };

  const updateCrmSetting = (name, value) => {
    setCrmSettings((current) => ({ ...current, [name]: value }));
  };

  const updateMailSettings = (event) => {
    const { name, type, checked, value } = event.target;
    setMailSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateManagedPage = (id, patch) => {
    setManagedPages((current) =>
      current.map((page) =>
        page.id === id
          ? {
              ...page,
              ...patch,
              hero: patch.hero ? { ...page.hero, ...patch.hero } : page.hero,
              updatedAt: new Date().toISOString(),
            }
          : page,
      ),
    );
  };

  const applyFrameImageChange = (value) => {
    if (!frameImageEditor) return;
    saveContentOverrideValue(
      frameImageEditor.route,
      "image",
      frameImageEditor.index,
      value,
    );
    siteFrameRef.current?.contentWindow?.postMessage(
      { type: "awd:apply-overrides" },
      window.location.origin,
    );
    setFrameImageEditor(null);
  };

  const toggleManagedPageSelection = (id) => {
    setSelectedPageIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  };

  const bulkUpdateManagedPages = (patch) => {
    if (!selectedPageIds.length) return;
    setManagedPages((current) =>
      current.map((page) =>
        selectedPageIds.includes(page.id)
          ? { ...page, ...patch, updatedAt: new Date().toISOString() }
          : page,
      ),
    );
    setSelectedPageIds([]);
  };

  const openPageEditor = (pageId) => {
    setSelectedPageId(pageId);
    setPageEditorMode("editor");
  };

  const selectContactForEmail = (contact) => {
    setSelectedContactId(contact.id);
    setComposer({
      contactId: contact.id,
      subject: `Following up from All Walls Down`,
      message: `Hello ${contact.name},\n\nThank you for reaching out to All Walls Down Organization. We wanted to follow up with you personally.\n\nBlessings,\n${mailSettings.fromName}`,
    });
    setMailNotice("");
  };

  const queueEmail = async (event) => {
    event.preventDefault();
    const contact = contacts.find((item) => item.id === composer.contactId);
    if (!contact) {
      setMailNotice("Choose a contact before sending an email.");
      return;
    }
    if (!contact.email) {
      setMailNotice("This contact needs an email address before you can send a message.");
      return;
    }
    if (!mailSettings.smtpHost || !mailSettings.smtpPort) {
      setMailNotice("Add SMTP host and port in Mail Settings before sending.");
      return;
    }
    if (!mailSettings.username || !mailSettings.password) {
      setMailNotice("Add the SMTP username and app password in Mail Settings before sending.");
      return;
    }
    const emailRecord = {
      id: createId("email"),
      subject: composer.subject,
      message: composer.message,
      preparedAt: new Date().toISOString(),
      fromEmail: mailSettings.fromEmail,
      smtpHost: mailSettings.smtpHost,
      status: "Sending",
    };
    setMailNotice("Sending email...");

    try {
      const response = await fetch("http://localhost:8787/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-awd-staff-email": session.email || "",
        },
        body: JSON.stringify({
          contactId: contact.id,
          to: contact.email,
          subject: composer.subject,
          message: composer.message,
          smtp: mailSettings,
          staff: {
            id: session.id,
            name: session.name,
            email: session.email,
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.email?.errorMessage || result.error || "Email send failed");
      }
      const sentRecord = {
        ...emailRecord,
        ...(result.email || {}),
        status: "Sent",
        sentAt: result.email?.sentAt || new Date().toISOString(),
      };
      updateContact(contact.id, {
        status: "In Conversation",
        emailHistory: [sentRecord, ...(contact.emailHistory || [])],
      });
      setMailNotice(`Email sent to ${contact.email}.`);
    } catch (error) {
      const failedRecord = {
        ...emailRecord,
        status: "Failed",
        errorMessage: error.message,
      };
      updateContact(contact.id, {
        emailHistory: [failedRecord, ...(contact.emailHistory || [])],
      });
      setMailNotice(
        `Email was not sent: ${error.message}. Confirm the API server is running and SMTP credentials are correct.`,
      );
    }
  };

  if (!session) return <StaffAuth onLogin={login} />;

  if (session.mfaSetupRequired) {
    return (
      <MfaEnrollmentGate
        session={session}
        policy={mfaPolicy}
        onEnroll={completeMfaEnrollment}
        onLogout={logout}
      />
    );
  }

  const pendingPrayerCount = prayerRequests.filter(
    (request) => request.status === "Pending Prayer",
  ).length;
  const pendingTestimonials = testimonials.filter(
    (testimonial) => testimonial.status === "Pending Review",
  ).length;
  const newContacts = contacts.filter((contact) => contact.status === "New").length;
  const notContactedContacts = contacts.filter((contact) => contact.status === "New").length;
  const contactedContacts = contacts.filter((contact) =>
    ["In Conversation", "Followed Up"].includes(contact.status),
  ).length;
  const closedContacts = contacts.filter((contact) => contact.status === "Closed").length;
  const visibleTestimonials = testimonials.filter(
    (testimonial) => testimonial.status === "Approved" && testimonial.displayOnSite,
  ).length;
  const selectedTestimonial =
    testimonials.find((testimonial) => testimonial.id === selectedTestimonialId) ||
    testimonials[0];
  const contactQuery = contactSearch.trim().toLowerCase();
  const activeContacts = contacts
    .filter((contact) => {
      if (contactStatusFilter === "All Contacts") return true;
      if (contactStatusFilter === "Active") return contact.status !== "Closed";
      return contact.status === contactStatusFilter;
    })
    .filter((contact) =>
      contactCategoryFilter === "All Categories"
        ? true
        : (contact.category || contact.reason) === contactCategoryFilter,
    )
    .filter((contact) =>
      contactQuery
        ? [
            contact.name,
            contact.email,
            contact.phone,
            contact.reason,
            contact.category,
            contact.status,
            contact.assignedTo,
            ...(contact.tags || []),
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(contactQuery))
        : true,
    );
  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) || null;
  const selectedPrayer =
    prayerRequests.find((request) => request.id === selectedPrayerId) || null;
  const activeNavItem =
    [
      ["dashboard", "Dashboard"],
      ["crm-dashboard", "CRM Dashboard"],
      ["crm-new-contact", "New Contact"],
      ["crm-import", "Import Contacts"],
      ["crm-email-composer", "Email Composer"],
      ["crm-categories", "CRM Categories"],
      ["crm-settings", "CRM Settings"],
      ["prayer-dashboard", "Prayer Dashboard"],
      ["prayer-queue", "Prayer Queue"],
      ["prayer-settings", "Prayer Settings"],
      ["testimonial-dashboard", "Testimonial Dashboard"],
      ["testimonial-review", "Review Queue"],
      ["testimonial-displayed", "Displayed Testimonials"],
      ["testimonial-settings", "Testimonial Settings"],
      ["staff-dashboard", "Staff Dashboard"],
      ["staff-accounts", "Staff Accounts"],
      ["staff-mfa", "MFA Management"],
      ["page-pages", "Pages"],
      ["page-widgets", "Widgets"],
      ["page-designer", "Designer"],
      ["page-navigation", "Navigation"],
      ["staff-profile", "My Profile"],
      ["email-settings", "Mail Settings"],
      ["email-tools", "Email Tools"],
      ["database-schema", "Database Schema"],
    ].find(([id]) => id === activeTab)?.[1] || "Dashboard";
  const portalNavigation = [
    {
      id: "overview",
      label: "Overview",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          detail: "Ministry health, queues, and quick navigation",
        },
      ],
    },
    {
      id: "crm",
      label: "Ministry Operations",
      items: [
        {
          id: "crm-dashboard",
          label: "CRM Dashboard",
          detail: "Pipeline counts and contact list",
          count: newContacts,
        },
        { id: "crm-new-contact", label: "New Contact", detail: "Create and edit a new contact" },
        { id: "crm-import", label: "Import Contacts", detail: "Upload Google or Outlook CSV" },
        { id: "crm-email-composer", label: "Email Composer", detail: "Compose follow-up email" },
        { id: "crm-categories", label: "Categories", detail: "Add, remove, and manage categories" },
        { id: "crm-settings", label: "Settings", detail: "Configure CRM defaults and rules" },
      ],
    },
    {
      id: "prayer",
      label: "Prayer",
      items: [
        {
          id: "prayer-dashboard",
          label: "Prayer Dashboard",
          detail: "Prayer request summary",
          count: pendingPrayerCount,
        },
        {
          id: "prayer-queue",
          label: "Prayer Queue",
          detail: "Review requests and mark prayed",
          count: pendingPrayerCount,
        },
        { id: "prayer-settings", label: "Settings", detail: "Prayer workflow settings" },
      ],
    },
    {
      id: "testimonials",
      label: "Testimonials",
      items: [
        {
          id: "testimonial-dashboard",
          label: "Dashboard",
          detail: "Story moderation summary",
          count: pendingTestimonials,
        },
        {
          id: "testimonial-review",
          label: "Review Queue",
          detail: "Review, approve, and moderate stories",
          count: pendingTestimonials,
        },
        {
          id: "testimonial-displayed",
          label: "Displayed",
          detail: "Stories currently visible on the site",
          count: visibleTestimonials,
        },
        { id: "testimonial-settings", label: "Settings", detail: "Display and moderation rules" },
      ],
    },
    {
      id: "communications",
      label: "Communications",
      items: [
        {
          id: "email-settings",
          label: "Mail Settings",
          detail: "SMTP, POP3, sender identity, mail tools",
        },
        { id: "email-tools", label: "Email Tools", detail: "Composer and delivery utilities" },
      ],
    },
    {
      id: "pages",
      label: "Page Administration",
      items: [
        {
          id: "page-pages",
          label: "Pages",
          detail: "Publish, draft, reorder, and edit site pages",
          count: managedPages.filter((page) => page.status === "Published").length,
        },
        {
          id: "page-widgets",
          label: "Widgets",
          detail: "Reusable content blocks and section controls",
        },
        {
          id: "page-designer",
          label: "Designer",
          detail: "Drag and drop section builder",
        },
        {
          id: "page-navigation",
          label: "Navigation",
          detail: "Header menu labels and page visibility",
        },
      ],
    },
    {
      id: "administration",
      label: "Administration",
      items: [
        { id: "staff-profile", label: "My Profile", detail: "Update your profile and password" },
        { id: "staff-dashboard", label: "Staff Dashboard", detail: "Account and security overview" },
        {
          id: "staff-accounts",
          label: "Staff Accounts",
          detail: "Users, roles, MFA policy, access control",
          count: staffUsers.length,
        },
        { id: "staff-mfa", label: "MFA Management", detail: "MFA methods and policy controls" },
      ],
    },
    {
      id: "system",
      label: "System",
      items: [
        {
          id: "database-schema",
          label: "Database",
          detail: "Schema overview and production data model",
        },
      ],
    },
  ];

  return (
    <section className="staff-portal">
      <div className="shell staff-portal__shell">
        <div className={`portal-layout ${sidebarCollapsed ? "portal-layout--collapsed" : ""}`}>
          <aside className="portal-sidebar" aria-label="Management portal navigation">
            <div className="portal-sidebar__brand">
              <img src="/assets/awd-logo.webp" alt="" width="1190" height="1322" />
              <div>
                <strong>Management</strong>
                <span>{activeNavItem}</span>
              </div>
              <button
                className="portal-sidebar__toggle"
                type="button"
                aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </button>
            </div>
            <nav className="portal-sidebar__nav">
              {portalNavigation.map((group) => (
                <section key={group.label} className="portal-nav-group">
                  <button
                    className="portal-nav-parent"
                    type="button"
                    onClick={() => toggleMenu(group.id)}
                    aria-expanded={Boolean(expandedMenus[group.id])}
                  >
                    <span>{group.label}</span>
                    <ChevronDown aria-hidden="true" />
                  </button>
                  {expandedMenus[group.id] ? (
                    <div className="portal-subnav">
                      {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`portal-subnav__item ${activeTab === item.id ? "is-active" : ""}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (item.id === "page-pages") setPageEditorMode("list");
                      }}
                    >
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </span>
                      {typeof item.count === "number" ? <em>{item.count}</em> : null}
                    </button>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </nav>
          </aside>

          <div className="portal-viewer" aria-live="polite">
            <header className="staff-portal__header">
              <div>
                <p className="section-label">Staff Portal</p>
                <h1>Ministry Management</h1>
                <p>
                  Signed in as {session.name || session.email} / {getUserRoles(session).join(", ")}
                </p>
              </div>
              <button className="button button--outline" type="button" onClick={logout}>
                Logout
              </button>
            </header>

            {activeTab === "dashboard" ? (
              <div className="portal-panel portal-dashboard">
                <div className="portal-panel__heading">
                  <ShieldCheck />
                  <div>
                    <h2>Ministry Dashboard</h2>
                    <p>One command center for prayer, people, stories, communication, and staff access.</p>
                  </div>
                </div>
                <div className="portal-stats dashboard-stats">
                  <button type="button" onClick={() => setActiveTab("prayer-queue")}>
                    <HandHeart />
                    <strong>{pendingPrayerCount}</strong>
                    <span>Pending Prayer</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab("testimonial-review")}>
                    <MessageSquareQuote />
                    <strong>{pendingTestimonials}</strong>
                    <span>Testimonials to Review</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab("crm-dashboard")}>
                    <Inbox />
                    <strong>{newContacts}</strong>
                    <span>New Contacts</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab("testimonial-displayed")}>
                    <Eye />
                    <strong>{visibleTestimonials}</strong>
                    <span>Displayed Testimonials</span>
                  </button>
                </div>
                <div className="dashboard-grid">
                  <section className="dashboard-focus">
                    <div>
                      <p className="section-label">Priority Work</p>
                      <h3>Today&apos;s ministry queues</h3>
                    </div>
                    {[
                      ["Prayer requests awaiting review", pendingPrayerCount, "prayer-queue"],
                      ["New contact requests", newContacts, "crm-dashboard"],
                      ["Testimonials waiting approval", pendingTestimonials, "testimonial-review"],
                      ["Staff accounts in system", staffUsers.length, "staff-accounts"],
                    ].map(([label, value, target]) => (
                      <button key={label} type="button" onClick={() => setActiveTab(target)}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </button>
                    ))}
                  </section>
                  <section className="dashboard-focus">
                    <div>
                      <p className="section-label">Quick Actions</p>
                      <h3>Jump into the work</h3>
                    </div>
                    {[
                      ["Open CRM Contacts", "Manage contact records, categories, and follow-up.", "crm-dashboard"],
                      ["Review Prayer Queue", "Mark requests as pending prayer or prayed.", "prayer-queue"],
                      ["Moderate Testimonials", "Approve stories and display them on the site.", "testimonial-review"],
                      ["Manage Staff & MFA", "Create users, assign roles, and enforce MFA.", "staff-accounts"],
                      ["Configure Mail", "Update SMTP and sender settings.", "email-settings"],
                      ["View Database Design", "Inspect the production-ready schema.", "database-schema"],
                    ].map(([label, detail, target]) => (
                      <button key={label} type="button" onClick={() => setActiveTab(target)}>
                        <span>
                          <strong>{label}</strong>
                          <small>{detail}</small>
                        </span>
                        <ArrowRight size={18} />
                      </button>
                    ))}
                  </section>
                </div>
              </div>
            ) : null}

            {activeTab === "page-pages" ? (
              <div className="portal-panel cms-panel">
                {pageEditorMode === "list" ? (
                  <>
                    <div className="portal-panel__heading cms-heading">
                      <Layers />
                      <div>
                        <h2>Pages</h2>
                        <p>Manage site pages, publishing state, navigation visibility, and locked layouts.</p>
                      </div>
                    </div>
                    <div className="cms-toolbar">
                      <div>
                        <span>{selectedPageIds.length} selected</span>
                        <strong>{managedPages.filter((page) => page.isActive !== false).length} active pages</strong>
                      </div>
                      <div className="cms-toolbar__actions">
                        <button className="button button--outline" type="button" onClick={() => bulkUpdateManagedPages({ isActive: true, status: "Published" })}>
                          Activate
                        </button>
                        <button className="button button--outline" type="button" onClick={() => bulkUpdateManagedPages({ isActive: false })}>
                          Deactivate
                        </button>
                        <button className="button button--outline" type="button" onClick={() => bulkUpdateManagedPages({ status: "Draft", isActive: false })}>
                          Move to Draft
                        </button>
                        <button className="button button--outline" type="button" onClick={() => bulkUpdateManagedPages({ status: "Trash", isActive: false })}>
                          Trash
                        </button>
                      </div>
                    </div>
                    <div className="cms-page-list" role="table" aria-label="Site pages">
                      <div className="cms-page-list__head" role="row">
                        <span>Page</span>
                        <span>Route</span>
                        <span>Status</span>
                        <span>Navigation</span>
                        <span>Updated</span>
                      </div>
                      {managedPages.map((page) => (
                        <article
                          key={page.id}
                          className={`cms-page-row ${selectedPageId === page.id ? "is-active" : ""}`}
                          role="row"
                        >
                          <label className="cms-select">
                            <input
                              type="checkbox"
                              checked={selectedPageIds.includes(page.id)}
                              onChange={() => toggleManagedPageSelection(page.id)}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </label>
                          <button type="button" className="cms-page-row__main" onClick={() => openPageEditor(page.id)}>
                            <strong>{page.title}</strong>
                            <small>{page.sections.filter((section) => section.visible !== false).length} visible sections</small>
                          </button>
                          <span>{page.route}</span>
                          <StatusBadge>{page.status}</StatusBadge>
                          <label className="checkbox-line cms-inline-toggle">
                            <input
                              type="checkbox"
                              checked={page.isActive !== false && page.status === "Published"}
                              onChange={(event) =>
                                updateManagedPage(page.id, {
                                  isActive: event.target.checked,
                                  status: event.target.checked ? "Published" : "Draft",
                                })
                              }
                            />
                            Show in header
                          </label>
                          <span>{formatDate(page.updatedAt)}</span>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cms-editor-bar">
                      <button className="button button--outline" type="button" onClick={() => setPageEditorMode("list")}>
                        <ArrowLeft size={18} /> Back to Pages
                      </button>
                      <div>
                        <button className="button button--outline" type="button">
                          <Monitor size={17} /> Preview
                        </button>
                        <button
                          className="button button--outline"
                          type="button"
                          onClick={() => selectedManagedPage && updateManagedPage(selectedManagedPage.id, { status: "Draft", isActive: false })}
                        >
                          <Save size={17} /> Save Draft
                        </button>
                        <button
                          className="button button--gold"
                          type="button"
                          onClick={() => selectedManagedPage && updateManagedPage(selectedManagedPage.id, { status: "Published", isActive: true })}
                        >
                          <CheckCircle2 size={17} /> Publish
                        </button>
                      </div>
                    </div>
                    {selectedManagedPage ? (
                      <div className="cms-editor">
                        <iframe
                          ref={siteFrameRef}
                          key={selectedManagedPage.route}
                          className="cms-site-frame"
                          title={`${selectedManagedPage.title} live site preview`}
                          src={`${selectedManagedPage.route}?awdEdit=1`}
                        />
                        {frameImageEditor ? (
                          <div className="cms-image-popover" role="dialog" aria-label="Image options">
                            <div>
                              <Image size={17} />
                              <strong>Image options</strong>
                            </div>
                            <label>
                              Image path
                              <input
                                value={frameImageEditor.draft}
                                onChange={(event) =>
                                  setFrameImageEditor((current) => ({
                                    ...current,
                                    draft: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <div>
                              <button
                                className="button button--gold"
                                type="button"
                                onClick={() => applyFrameImageChange(frameImageEditor.draft)}
                              >
                                Replace Image
                              </button>
                              <button
                                className="button button--outline"
                                type="button"
                                onClick={() => applyFrameImageChange("")}
                              >
                                Delete
                              </button>
                              <button
                                className="button button--outline"
                                type="button"
                                onClick={() => setFrameImageEditor(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <EmptyPortalState>Select a page to edit.</EmptyPortalState>
                    )}
                  </>
                )}
              </div>
            ) : null}

            {activeTab === "page-widgets" ? (
              <div className="portal-panel cms-panel">
                <div className="portal-panel__heading cms-heading">
                  <Layers />
                  <div>
                    <h2>Widgets</h2>
                    <p>Reusable building blocks administrators can combine without touching the AWD theme.</p>
                  </div>
                </div>
                <div className="cms-widget-grid">
                  {widgetTemplates.map(([name, detail]) => (
                    <article key={name}>
                      <div><Layers /></div>
                      <strong>{name}</strong>
                      <p>{detail}</p>
                      <button className="button button--outline" type="button">Add to Designer</button>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "page-designer" ? (
              <div className="portal-panel cms-panel">
                <div className="portal-panel__heading cms-heading">
                  <Pencil />
                  <div>
                    <h2>Designer</h2>
                    <p>Drag widget sections into a page-safe layout area while protected theme regions stay locked.</p>
                  </div>
                </div>
                <div className="cms-designer">
                  <aside>
                    <p className="section-label">Widget Library</p>
                    {widgetTemplates.map(([name]) => (
                      <button key={name} type="button"><GripVertical size={15} /> {name}</button>
                    ))}
                  </aside>
                  <section>
                    <div className="cms-drop-zone cms-drop-zone--locked"><Lock size={16} /> Header and hero are locked</div>
                    <div className="cms-drop-zone"><GripVertical size={18} /> Drop a widget section here</div>
                    <div className="cms-drop-zone"><GripVertical size={18} /> Add another section</div>
                    <div className="cms-drop-zone cms-drop-zone--locked"><Lock size={16} /> Footer is locked</div>
                  </section>
                  <aside>
                    <p className="section-label">Design Guardrails</p>
                    <article><strong>Theme Safe</strong><span>Fonts, colors, spacing, and buttons stay consistent.</span></article>
                    <article><strong>Content Only</strong><span>Admins edit copy, media, ordering, and visibility.</span></article>
                    <article><strong>Responsive</strong><span>Sections inherit the production layout rules.</span></article>
                  </aside>
                </div>
              </div>
            ) : null}

            {activeTab === "page-navigation" ? (
              <div className="portal-panel cms-panel">
                <div className="portal-panel__heading cms-heading">
                  <Menu />
                  <div>
                    <h2>Navigation</h2>
                    <p>Control which published pages appear in the public site header.</p>
                  </div>
                </div>
                <div className="cms-navigation-list">
                  {managedPages.map((page, index) => (
                    <article key={page.id}>
                      <span>{index + 1}</span>
                      <input
                        value={page.navLabel}
                        onChange={(event) => updateManagedPage(page.id, { navLabel: event.target.value })}
                      />
                      <code>{page.route}</code>
                      <label className="checkbox-line">
                        <input
                          type="checkbox"
                          checked={page.isActive !== false && page.status === "Published"}
                          onChange={(event) =>
                            updateManagedPage(page.id, {
                              isActive: event.target.checked,
                              status: event.target.checked ? "Published" : "Draft",
                            })
                          }
                        />
                        Header link visible
                      </label>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

        {activeTab === "crm-dashboard" ? (
          <div className="portal-panel portal-dashboard">
            <div className="portal-panel__heading">
              <LayoutDashboard />
              <div>
                <h2>CRM Dashboard</h2>
                <p>Contact pipeline health, follow-up status, and active contact list.</p>
              </div>
            </div>
            <div className="portal-stats dashboard-stats">
              <button type="button" onClick={() => setContactStatusFilter("New")}>
                <Inbox />
                <strong>{newContacts}</strong>
                <span>New Contacts</span>
              </button>
              <button type="button" onClick={() => setContactStatusFilter("New")}>
                <Mail />
                <strong>{notContactedContacts}</strong>
                <span>Not Contacted</span>
              </button>
              <button type="button" onClick={() => setContactStatusFilter("In Conversation")}>
                <CheckCircle2 />
                <strong>{contactedContacts}</strong>
                <span>Contacted</span>
              </button>
              <button type="button" onClick={() => setContactStatusFilter("Closed")}>
                <Eye />
                <strong>{closedContacts}</strong>
                <span>Closed Contacts</span>
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "crm-new-contact" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <UserPlus />
              <div>
                <h2>New Contact</h2>
                <p>Create a contact record using the configured CRM defaults.</p>
              </div>
            </div>
            <button className="button button--gold" type="button" onClick={createContactRecord}>
              <Plus size={18} /> Create New Contact Record
            </button>
            {selectedContact ? (
              <section className="crm-profile crm-profile--standalone">
                <header>
                  <div>
                    <p className="section-label">New Contact Draft</p>
                    <h3>{selectedContact.name}</h3>
                    <p>{selectedContact.email || "No email added yet"}</p>
                  </div>
                  <StatusBadge>{selectedContact.status}</StatusBadge>
                </header>
                <div className="portal-form">
                  <label>
                    Name
                    <input
                      value={selectedContact.name}
                      onChange={(event) =>
                        updateContact(selectedContact.id, { name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={selectedContact.email}
                      onChange={(event) =>
                        updateContact(selectedContact.id, { email: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={selectedContact.phone || ""}
                      onChange={(event) =>
                        updateContact(selectedContact.id, { phone: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={selectedContact.category || selectedContact.reason}
                      onChange={(event) =>
                        updateContact(selectedContact.id, { category: event.target.value })
                      }
                    >
                      {managedContactCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-span">
                    Message
                    <textarea
                      value={selectedContact.message}
                      onChange={(event) =>
                        updateContact(selectedContact.id, { message: event.target.value })
                      }
                      rows="5"
                    />
                  </label>
                </div>
              </section>
            ) : (
              <EmptyPortalState>Create a contact to begin editing the record.</EmptyPortalState>
            )}
          </div>
        ) : null}

        {activeTab === "crm-import" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <FileUp />
              <div>
                <h2>Import Contacts</h2>
                <p>Bring in contact exports from Google Contacts or Outlook without replacing your CRM data.</p>
              </div>
            </div>
            <div className="crm-import-grid">
              <section className="crm-import-card">
                <p className="section-label">CSV Source</p>
                <h3>Upload a contact export</h3>
                <div className="portal-form">
                  <label>
                    Export Type
                    <select
                      value={csvImportSource}
                      onChange={(event) => setCsvImportSource(event.target.value)}
                    >
                      {csvImportSources.map((source) => (
                        <option key={source}>{source}</option>
                      ))}
                    </select>
                  </label>
                  <label className="crm-file-drop">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={importContactsCsv}
                      disabled={csvImportBusy}
                    />
                    <span>
                      <FileUp size={24} />
                      <strong>{csvImportBusy ? "Importing..." : "Choose CSV File"}</strong>
                      <small>Google Contacts CSV or Outlook CSV export</small>
                    </span>
                  </label>
                </div>
                {csvImportNotice ? <p className="form-confirmation">{csvImportNotice}</p> : null}
              </section>
              <section className="crm-import-card">
                <p className="section-label">Supported Fields</p>
                <h3>Google and Outlook ready</h3>
                <ul className="crm-import-list">
                  <li>Name, Display Name, First Name, Given Name, Last Name, Surname</li>
                  <li>Email, E-mail Address, Primary Email, Home E-mail, Work E-mail</li>
                  <li>Mobile Phone, Business Phone, Home Phone, Phone 1 - Value</li>
                  <li>Categories, Labels, Group Membership, Notes, Comments</li>
                </ul>
                <div className="database-cards database-cards--compact">
                  <article>
                    <strong>Duplicate Control</strong>
                    <span>Matches existing contacts by email or phone before importing.</span>
                  </article>
                  <article>
                    <strong>Category Sync</strong>
                    <span>New CSV categories are added to the CRM category manager.</span>
                  </article>
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {activeTab === "crm-email-composer" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <Mail />
              <div>
                <h2>CRM Email Composer</h2>
                <p>Select a contact, draft a follow-up, and prepare the message history.</p>
              </div>
            </div>
            <form className="portal-form" onSubmit={queueEmail}>
              <label>
                Contact
                <select
                  value={composer.contactId || selectedContactId}
                  onChange={(event) => {
                    const contact = contacts.find((item) => item.id === event.target.value);
                    if (contact) selectContactForEmail(contact);
                  }}
                >
                  <option value="">Choose a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} / {contact.email || "No email"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subject
                <input
                  value={composer.subject}
                  onChange={(event) =>
                    setComposer((current) => ({ ...current, subject: event.target.value }))
                  }
                  required
                  placeholder="Email subject"
                />
              </label>
              <label className="form-span">
                Message
                <textarea
                  value={composer.message}
                  onChange={(event) =>
                    setComposer((current) => ({ ...current, message: event.target.value }))
                  }
                  required
                  rows="10"
                  placeholder="Write the follow-up email..."
                />
              </label>
              <button className="button button--gold" type="submit">
                <Send size={18} /> Send Email
              </button>
              {mailNotice ? <p className="form-confirmation">{mailNotice}</p> : null}
            </form>
          </div>
        ) : null}

        {activeTab === "crm-categories" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <Tags />
              <div>
                <h2>CRM Categories</h2>
                <p>Add, remove, and organize the categories used to browse contacts.</p>
              </div>
            </div>
            <div className="crm-category-manager crm-category-manager--panel">
              <label>
                <span>New Category</span>
                <input
                  value={categoryDraft}
                  onChange={(event) => setCategoryDraft(event.target.value)}
                  placeholder="Example: Event Follow Up"
                />
              </label>
              <button className="button button--outline" type="button" onClick={addContactCategory}>
                <Plus size={17} /> Add Category
              </button>
            </div>
            <div className="category-list">
              {managedContactCategories.map((category) => (
                <article key={category}>
                  <div>
                    <strong>{category}</strong>
                    <span>
                      {contacts.filter((contact) => (contact.category || contact.reason) === category).length} contacts
                    </span>
                  </div>
                  <button
                    className="button button--outline"
                    type="button"
                    disabled={category === "General Contact"}
                    onClick={() => removeContactCategory(category)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "crm-settings" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <Shield />
              <div>
                <h2>CRM Settings</h2>
                <p>Configure contact defaults, intake rules, ownership, and notification behavior.</p>
              </div>
            </div>
            <div className="portal-form">
              <label>
                Default Status
                <select
                  value={crmSettings.defaultStatus}
                  onChange={(event) => updateCrmSetting("defaultStatus", event.target.value)}
                >
                  {contactStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Default Priority
                <select
                  value={crmSettings.defaultPriority}
                  onChange={(event) => updateCrmSetting("defaultPriority", event.target.value)}
                >
                  {contactPriorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <label>
                Default Owner
                <input
                  value={crmSettings.defaultOwner}
                  onChange={(event) => updateCrmSetting("defaultOwner", event.target.value)}
                />
              </label>
              <label>
                Auto Follow-Up Days
                <input
                  type="number"
                  min="0"
                  value={crmSettings.autoFollowUpDays}
                  onChange={(event) => updateCrmSetting("autoFollowUpDays", event.target.value)}
                />
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={Boolean(crmSettings.requireCategory)}
                  onChange={(event) => updateCrmSetting("requireCategory", event.target.checked)}
                />
                Require a category for every contact.
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={Boolean(crmSettings.requireNextFollowUp)}
                  onChange={(event) => updateCrmSetting("requireNextFollowUp", event.target.checked)}
                />
                Require next follow-up date before closing.
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={Boolean(crmSettings.notifyOnNewContact)}
                  onChange={(event) => updateCrmSetting("notifyOnNewContact", event.target.checked)}
                />
                Notify staff when a new contact arrives.
              </label>
            </div>
          </div>
        ) : null}

        {activeTab === "prayer-dashboard" ? (
          <div className="portal-panel portal-dashboard">
            <div className="portal-panel__heading">
              <HandHeart />
              <div>
                <h2>Prayer Dashboard</h2>
                <p>Prayer request intake, confidential requests, and completion status.</p>
              </div>
            </div>
            <div className="portal-stats dashboard-stats">
              <button type="button" onClick={() => setActiveTab("prayer-queue")}>
                <HandHeart />
                <strong>{pendingPrayerCount}</strong>
                <span>Pending Prayer</span>
              </button>
              <button type="button" onClick={() => setActiveTab("prayer-queue")}>
                <Shield />
                <strong>{prayerRequests.filter((request) => request.isConfidential).length}</strong>
                <span>Confidential</span>
              </button>
              <button type="button" onClick={() => setActiveTab("prayer-queue")}>
                <CheckCircle2 />
                <strong>{prayerRequests.filter((request) => request.status === "We have Prayed").length}</strong>
                <span>We Have Prayed</span>
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "prayer-settings" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <Shield />
              <div>
                <h2>Prayer Settings</h2>
                <p>Configure prayer queue behavior and ministry review expectations.</p>
              </div>
            </div>
            <div className="database-cards">
              <article><strong>Confidential Requests</strong><p>Confidential submissions stay visible only inside the staff portal queue.</p></article>
              <article><strong>Status Workflow</strong><p>Requests move from Pending Prayer to We have Prayed.</p></article>
              <article><strong>Ministry Notes</strong><p>Staff can add private notes for context and follow-up.</p></article>
            </div>
          </div>
        ) : null}

        {activeTab === "testimonial-dashboard" ? (
          <div className="portal-panel portal-dashboard">
            <div className="portal-panel__heading">
              <MessageSquareQuote />
              <div>
                <h2>Testimonial Dashboard</h2>
                <p>Moderation, approval, and public display status for submitted stories.</p>
              </div>
            </div>
            <div className="portal-stats dashboard-stats">
              <button type="button" onClick={() => setActiveTab("testimonial-review")}>
                <MessageSquareQuote />
                <strong>{pendingTestimonials}</strong>
                <span>Pending Review</span>
              </button>
              <button type="button" onClick={() => setActiveTab("testimonial-displayed")}>
                <Eye />
                <strong>{visibleTestimonials}</strong>
                <span>Displayed</span>
              </button>
              <button type="button" onClick={() => setActiveTab("testimonial-review")}>
                <CheckCircle2 />
                <strong>{testimonials.filter((testimonial) => testimonial.status === "Approved").length}</strong>
                <span>Approved</span>
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "testimonial-displayed" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <Eye />
              <div>
                <h2>Displayed Testimonials</h2>
                <p>Approved stories currently marked for public display.</p>
              </div>
            </div>
            <div className="testimonial-list testimonial-list--portal">
              {testimonials
                .filter((testimonial) => testimonial.status === "Approved" && testimonial.displayOnSite)
                .map((testimonial, index) => (
                  <article key={testimonial.id} className={`testimonial-bubble testimonial-bubble--${(index % 3) + 1}`}>
                    <blockquote>“{testimonial.quote}”</blockquote>
                    <div className="testimonial-bubble__person">
                      <span>{testimonial.name.slice(0, 1)}</span>
                      <div>
                        <strong>{testimonial.name}</strong>
                        <small>{testimonial.ministry}</small>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        ) : null}

        {activeTab === "testimonial-settings" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <Shield />
              <div>
                <h2>Testimonial Settings</h2>
                <p>Moderation rules for review, approval, and public display.</p>
              </div>
            </div>
            <div className="database-cards">
              <article><strong>Approval Required</strong><p>Testimonials must be approved before they can display publicly.</p></article>
              <article><strong>Display On Site</strong><p>Approved testimonials only show when Display On Site is checked.</p></article>
              <article><strong>Review Notes</strong><p>Staff can retain internal moderation notes per submission.</p></article>
            </div>
          </div>
        ) : null}

        {activeTab === "staff-dashboard" ? (
          <div className="portal-panel portal-dashboard">
            <div className="portal-panel__heading">
              <UserCog />
              <div>
                <h2>Staff Dashboard</h2>
                <p>Account health, role assignment, and MFA enrollment overview.</p>
              </div>
            </div>
            <div className="portal-stats dashboard-stats">
              <button type="button" onClick={() => setActiveTab("staff-accounts")}>
                <Users />
                <strong>{staffUsers.length}</strong>
                <span>Staff Accounts</span>
              </button>
              <button type="button" onClick={() => setActiveTab("staff-mfa")}>
                <ShieldCheck />
                <strong>{staffUsers.filter((user) => user.mfaEnabled).length}</strong>
                <span>MFA Enrolled</span>
              </button>
              <button type="button" onClick={() => setActiveTab("staff-accounts")}>
                <Lock />
                <strong>{staffUsers.filter((user) => user.isActive === false).length}</strong>
                <span>Inactive</span>
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "staff-profile" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <UserCog />
              <div>
                <h2>My Profile</h2>
                <p>Update your staff profile details and password without opening the full directory.</p>
              </div>
            </div>
            <section className="account-card account-card--wide">
              <header>
                <div>
                  <p className="section-label">Signed In Profile</p>
                  <h3>{currentStaffUser?.name || session.name || "Staff User"}</h3>
                  <p>{currentStaffUser?.email || session.email}</p>
                </div>
                <StatusBadge>{getUserRoles(currentStaffUser).join(" / ")}</StatusBadge>
              </header>
              <div className="portal-form">
                <label>
                  Name
                  <input
                    value={currentStaffUser?.name || ""}
                    onChange={(event) =>
                      currentStaffUser?.id &&
                      updateStaffUser(currentStaffUser.id, { name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={currentStaffUser?.email || ""}
                    onChange={(event) =>
                      currentStaffUser?.id &&
                      updateStaffUser(currentStaffUser.id, { email: event.target.value })
                    }
                  />
                </label>
                <label>
                  New Password
                  <input
                    type="password"
                    value={currentStaffUser?.password || ""}
                    onChange={(event) =>
                      currentStaffUser?.id &&
                      updateStaffUser(currentStaffUser.id, {
                        password: event.target.value,
                        requirePasswordReset: false,
                      })
                    }
                  />
                </label>
                <label>
                  Roles
                  <input value={getUserRoles(currentStaffUser).join(", ")} readOnly />
                </label>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "prayer-queue" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <ClipboardList />
              <div>
                <h2>Prayer Queue</h2>
                <p>Review submitted prayer requests from a queue and update the selected record.</p>
              </div>
            </div>
            {prayerRequests.length ? (
              <div className="management-grid">
                <div className="record-list" aria-label="Prayer request queue">
                  <div className="record-list__header record-list__header--prayer">
                    <span>ID</span>
                    <span>Name</span>
                    <span>Submitted</span>
                    <span>Contact</span>
                    <span>Status</span>
                  </div>
                  {prayerRequests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      className={`prayer-row ${selectedPrayer?.id === request.id ? "is-active" : ""}`}
                      onClick={() => setSelectedPrayerId(request.id)}
                    >
                      <span>#{request.id.replace("prayer-", "").slice(0, 6)}</span>
                      <strong>{request.name}</strong>
                      <time>{formatDate(request.submittedAt)}</time>
                      <em>{request.email || request.phone || "Confidential"}</em>
                      <StatusBadge>{request.status}</StatusBadge>
                    </button>
                  ))}
                </div>
                {selectedPrayer ? (
                  <article className="record-workspace">
                    <header>
                      <div>
                        <p className="section-label">Prayer Request</p>
                        <h3>{selectedPrayer.name}</h3>
                        <p>{selectedPrayer.email || selectedPrayer.phone || "No public contact"}</p>
                      </div>
                      <StatusBadge>{selectedPrayer.status}</StatusBadge>
                    </header>
                    <blockquote>“{selectedPrayer.request}”</blockquote>
                    <div className="portal-record__meta">
                      {selectedPrayer.email ? <span>{selectedPrayer.email}</span> : null}
                      {selectedPrayer.phone ? <span>{selectedPrayer.phone}</span> : null}
                      {selectedPrayer.isConfidential ? <span>Confidential</span> : null}
                      <span>{formatDate(selectedPrayer.submittedAt)}</span>
                    </div>
                    <div className="record-workspace__form">
                      <label>
                        Prayer Status
                        <select
                          value={selectedPrayer.status}
                          onChange={(event) =>
                            updatePrayer(selectedPrayer.id, { status: event.target.value })
                          }
                        >
                          {prayerStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <label className="form-span">
                        Ministry Notes
                        <textarea
                          value={selectedPrayer.notes || ""}
                          onChange={(event) =>
                            updatePrayer(selectedPrayer.id, { notes: event.target.value })
                          }
                          rows="6"
                        />
                      </label>
                    </div>
                  </article>
                ) : (
                  <EmptyPortalState>Select a prayer request to view details.</EmptyPortalState>
                )}
              </div>
            ) : (
              <EmptyPortalState>No prayer requests have been submitted yet.</EmptyPortalState>
            )}
          </div>
        ) : null}

        {activeTab === "testimonial-review" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <MessageSquareQuote />
              <div>
                <h2>Testimonial Review</h2>
                <p>Start from the review list, inspect the record, and approve in bulk.</p>
              </div>
            </div>
            <div className="portal-toolbar">
              <input placeholder="Name, email, or ministry" aria-label="Search testimonials" />
              <select aria-label="Bulk testimonial actions">
                <option>Bulk Actions</option>
                <option>Approve + Display</option>
              </select>
              <span>{selectedTestimonialIds.length} selected</span>
              <button
                className="button button--gold"
                type="button"
                disabled={!selectedTestimonialIds.length}
                onClick={bulkApproveTestimonials}
              >
                <CheckCircle2 size={18} /> Bulk Approve + Display
              </button>
            </div>
            <div className="management-grid">
              <div className="record-list" aria-label="Testimonial review list">
                <div className="record-list__header record-list__header--testimonials">
                  <span></span>
                  <span>Name</span>
                  <span>Ministry</span>
                  <span>Submitted</span>
                  <span>Status</span>
                </div>
                {testimonials.map((testimonial) => (
                  <article
                    key={testimonial.id}
                    className={`record-list__item ${
                      selectedTestimonial?.id === testimonial.id ? "is-active" : ""
                    }`}
                  >
                    <label className="record-list__check" aria-label={`Select ${testimonial.name}`}>
                      <input
                        type="checkbox"
                        checked={selectedTestimonialIds.includes(testimonial.id)}
                        onChange={() => toggleTestimonialSelection(testimonial.id)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedTestimonialId(testimonial.id)}
                    >
                      <strong>{testimonial.name}</strong>
                    </button>
                    <span>{testimonial.ministry}</span>
                    <small>{formatDate(testimonial.submittedAt)}</small>
                    <StatusBadge>{testimonial.status}</StatusBadge>
                  </article>
                ))}
              </div>
              {selectedTestimonial ? (
                <article className="record-workspace">
                  <header>
                    <div>
                      <p className="section-label">Testimonial Record</p>
                      <h3>{selectedTestimonial.name}</h3>
                      <p>{selectedTestimonial.email}</p>
                    </div>
                    <StatusBadge>{selectedTestimonial.status}</StatusBadge>
                  </header>
                  <blockquote>“{selectedTestimonial.quote}”</blockquote>
                  <div className="portal-record__meta">
                    <span>{selectedTestimonial.ministry}</span>
                    {selectedTestimonial.city ? <span>{selectedTestimonial.city}</span> : null}
                    <span>{formatDate(selectedTestimonial.submittedAt)}</span>
                  </div>
                  <div className="record-workspace__form">
                    <label>
                      Review Status
                      <select
                        value={selectedTestimonial.status}
                        onChange={(event) =>
                          updateTestimonial(selectedTestimonial.id, {
                            status: event.target.value,
                            displayOnSite:
                              event.target.value === "Approved"
                                ? selectedTestimonial.displayOnSite
                                : false,
                          })
                        }
                      >
                        {testimonialStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedTestimonial.displayOnSite)}
                        disabled={selectedTestimonial.status !== "Approved"}
                        onChange={(event) =>
                          updateTestimonial(selectedTestimonial.id, {
                            displayOnSite: event.target.checked,
                          })
                        }
                      />
                      Display On Site
                    </label>
                    <label className="form-span">
                      Review Notes
                      <textarea
                        value={selectedTestimonial.notes || ""}
                        onChange={(event) =>
                          updateTestimonial(selectedTestimonial.id, {
                            notes: event.target.value,
                          })
                        }
                        rows="5"
                      />
                    </label>
                  </div>
                </article>
              ) : (
                <EmptyPortalState>Select a testimonial to review.</EmptyPortalState>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "crm-dashboard" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <Inbox />
              <div>
                <h2>Ministry CRM</h2>
                <p>Work active contacts from a list view, manage details, and compose follow-up.</p>
              </div>
            </div>
            <div className="crm-shell">
              <aside className="crm-list">
                <div className="crm-list__header">
                  <div>
                    <strong>Active Contacts</strong>
                    <small>{activeContacts.length} records / {contactStatusFilter}</small>
                  </div>
                  <button
                    className="button button--outline"
                    type="button"
                    onClick={createContactRecord}
                  >
                    <Plus size={18} /> New Contact
                  </button>
                </div>
                <div className="crm-filters">
                  <input
                    value={contactSearch}
                    onChange={(event) => setContactSearch(event.target.value)}
                    placeholder="Name, Email, or Contact ID"
                    aria-label="Search contacts"
                  />
                  <select
                    aria-label="Contact status filter"
                    value={contactStatusFilter}
                    onChange={(event) => setContactStatusFilter(event.target.value)}
                  >
                    <option>Active</option>
                    <option>All Contacts</option>
                    {contactStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Contact category filter"
                    value={contactCategoryFilter}
                    onChange={(event) => setContactCategoryFilter(event.target.value)}
                  >
                    <option>All Categories</option>
                    {managedContactCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                  <button className="button button--outline" type="button">
                    Apply
                  </button>
                </div>
                <div className="crm-category-manager">
                  <label>
                    <span>New Category</span>
                    <input
                      value={categoryDraft}
                      onChange={(event) => setCategoryDraft(event.target.value)}
                      placeholder="Example: Event Follow Up"
                    />
                  </label>
                  <button className="button button--outline" type="button" onClick={addContactCategory}>
                    <Plus size={17} /> Add Category
                  </button>
                </div>
                <div className="crm-table-head">
                  <span>ID</span>
                  <span>Name</span>
                  <span>Category</span>
                  <span>Created At</span>
                  <span>Email</span>
                  <span>Next Follow Up</span>
                  <span>Priority</span>
                  <span>Status</span>
                </div>
                <div className="crm-list__items">
                  {activeContacts.length ? (
                    activeContacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        className={`crm-contact-row ${
                          selectedContact?.id === contact.id ? "is-active" : ""
                        }`}
                        onClick={() => setSelectedContactId(contact.id)}
                      >
                        <span>#{contact.id.replace("contact-", "").slice(0, 6)}</span>
                        <strong>{contact.name}</strong>
                        <small>{contact.category || contact.reason}</small>
                        <time>{formatDate(contact.submittedAt)}</time>
                        <em>{contact.email}</em>
                        <span>{contact.nextFollowUp || "Not scheduled"}</span>
                        <span>{contact.priority || "Normal"}</span>
                        <StatusBadge>{contact.status}</StatusBadge>
                      </button>
                    ))
                  ) : (
                    <EmptyPortalState>No active contacts match this view.</EmptyPortalState>
                  )}
                </div>
              </aside>

              {selectedContact ? (
                <div className="crm-workspace">
                  <section className="crm-profile">
                    <header>
                      <div>
                        <p className="section-label">Contact Management</p>
                        <h3>{selectedContact.name}</h3>
                        <p>{selectedContact.email}</p>
                      </div>
                      <StatusBadge>{selectedContact.status}</StatusBadge>
                    </header>
                    <div className="portal-form">
                      <label>
                        Name
                        <input
                          value={selectedContact.name}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { name: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          value={selectedContact.email}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { email: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Phone
                        <input
                          value={selectedContact.phone || ""}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { phone: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Category
                        <select
                          value={selectedContact.category || selectedContact.reason}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { category: event.target.value })
                          }
                        >
                          {managedContactCategories.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Contact Reason
                        <select
                          value={selectedContact.reason}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { reason: event.target.value })
                          }
                        >
                          <option>General Contact</option>
                          <option>Volunteer</option>
                          <option>Partnership</option>
                          <option>Brothers Keepers</option>
                          <option>Daughters of the King</option>
                          <option>Giving</option>
                        </select>
                      </label>
                      <label>
                        Status
                        <select
                          value={selectedContact.status}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { status: event.target.value })
                          }
                        >
                          {contactStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Priority
                        <select
                          value={selectedContact.priority || "Normal"}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { priority: event.target.value })
                          }
                        >
                          {contactPriorities.map((priority) => (
                            <option key={priority}>{priority}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Assigned To
                        <input
                          value={selectedContact.assignedTo || ""}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { assignedTo: event.target.value })
                          }
                          placeholder="Staff owner"
                        />
                      </label>
                      <label>
                        Next Follow Up
                        <input
                          type="date"
                          value={selectedContact.nextFollowUp || ""}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { nextFollowUp: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Submitted
                        <input value={formatDate(selectedContact.submittedAt)} readOnly />
                      </label>
                      <label className="form-span">
                        Tags
                        <input
                          value={(selectedContact.tags || []).join(", ")}
                          onChange={(event) =>
                            updateContact(selectedContact.id, {
                              tags: event.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Volunteer, Outreach, Follow Up"
                        />
                      </label>
                      <label className="form-span">
                        Original Message
                        <textarea
                          value={selectedContact.message}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { message: event.target.value })
                          }
                          rows="4"
                        />
                      </label>
                      <label className="form-span">
                        CRM Notes
                        <textarea
                          value={selectedContact.notes || ""}
                          onChange={(event) =>
                            updateContact(selectedContact.id, { notes: event.target.value })
                          }
                          rows="5"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="crm-compose">
                    <header>
                      <div>
                        <p className="section-label">Email Composer</p>
                        <h3>Follow up with {selectedContact.name}</h3>
                      </div>
                      <button
                        className="button button--outline"
                        type="button"
                        onClick={() => selectContactForEmail(selectedContact)}
                      >
                        <Mail size={18} /> Draft Template
                      </button>
                    </header>
                    <form className="portal-form" onSubmit={queueEmail}>
                      <label>
                        To
                        <input value={selectedContact.email} readOnly />
                      </label>
                      <label>
                        Subject
                        <input
                          value={composer.contactId === selectedContact.id ? composer.subject : ""}
                          onChange={(event) =>
                            setComposer((current) => ({
                              ...current,
                              contactId: selectedContact.id,
                              subject: event.target.value,
                            }))
                          }
                          required
                          placeholder="Email subject"
                        />
                      </label>
                      <label className="form-span">
                        Message
                        <textarea
                          value={composer.contactId === selectedContact.id ? composer.message : ""}
                          onChange={(event) =>
                            setComposer((current) => ({
                              ...current,
                              contactId: selectedContact.id,
                              message: event.target.value,
                            }))
                          }
                          required
                          rows="8"
                          placeholder="Write the follow-up email..."
                        />
                      </label>
                      <button className="button button--gold" type="submit">
                        <Send size={18} /> Send Email
                      </button>
                      {mailNotice ? <p className="form-confirmation">{mailNotice}</p> : null}
                    </form>
                    <div className="email-history">
                      <strong>Email History</strong>
                      {(selectedContact.emailHistory || []).length ? (
                        selectedContact.emailHistory.map((email) => (
                          <article key={email.id}>
                            <span>{email.status}</span>
                            <p>{email.subject}</p>
                            <small>{formatDate(email.preparedAt)}</small>
                          </article>
                        ))
                      ) : (
                        <p>No email history for this contact yet.</p>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="selection-empty">
                  <Inbox />
                  <h3>Select a contact record</h3>
                  <p>
                    Click a row in the active contacts list to open contact management,
                    notes, status updates, email composer, and history.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {["staff-accounts", "staff-mfa"].includes(activeTab) ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <UserCog />
              <div>
                <h2>Staff Account Management</h2>
                <p>Manage your account, MFA registration, and staff permissions.</p>
              </div>
            </div>
            <div className="account-suite">
              <section className="account-card">
                <header>
                  <div>
                    <p className="section-label">My Account</p>
                    <h3>{currentStaffUser?.name || session.name || "Staff User"}</h3>
                    <p>{currentStaffUser?.email || session.email}</p>
                  </div>
                  <StatusBadge>{getUserRoles(currentStaffUser).join(" / ")}</StatusBadge>
                </header>
                <div className="portal-form">
                  <label>
                    Name
                    <input
                      value={currentStaffUser?.name || ""}
                      onChange={(event) =>
                        currentStaffUser?.id &&
                        updateStaffUser(currentStaffUser.id, { name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={currentStaffUser?.email || ""}
                      onChange={(event) =>
                        currentStaffUser?.id &&
                        updateStaffUser(currentStaffUser.id, { email: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={currentStaffUser?.password || ""}
                      onChange={(event) =>
                        currentStaffUser?.id &&
                        updateStaffUser(currentStaffUser.id, { password: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Permission Roles
                    <input value={getUserRoles(currentStaffUser).join(", ")} readOnly />
                  </label>
                </div>
                <div className="mfa-section">
                  <div>
                    <p className="section-label">Multi-Factor Authentication</p>
                    <h4>MFA Methods</h4>
                    <p>
                      Register one or more MFA methods for staff sign-in. Production
                      enrollment should be completed through the backend identity provider.
                    </p>
                  </div>
                  <div className="mfa-methods">
                    {mfaMethodOptions.map(({ id, label, body, icon: Icon }) => (
                      <label key={id} className="mfa-method">
                        <input
                          type="checkbox"
                          checked={Boolean(currentStaffUser?.mfaMethods?.[id])}
                          onChange={(event) =>
                            currentStaffUser?.id &&
                            toggleMfaMethod(currentStaffUser.id, id, event.target.checked)
                          }
                        />
                        <Icon />
                        <span>
                          <strong>{label}</strong>
                          <small>{body}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              {isUserAdmin ? (
                <section className="account-card">
                  <header>
                    <div>
                      <p className="section-label">Create User</p>
                      <h3>New Staff Account</h3>
                      <p>Create staff accounts, assign multiple roles, and require MFA enrollment.</p>
                    </div>
                    <StatusBadge>Admin Only</StatusBadge>
                  </header>
                  <form className="portal-form" onSubmit={createStaffAccount}>
                    <label>
                      Name
                      <input
                        value={newStaffForm.name}
                        onChange={(event) => updateNewStaffForm({ name: event.target.value })}
                        required
                        placeholder="Staff member name"
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={newStaffForm.email}
                        onChange={(event) => updateNewStaffForm({ email: event.target.value })}
                        required
                        placeholder="staff@example.com"
                      />
                    </label>
                    <label>
                      Temporary Password
                      <input
                        value={newStaffForm.password}
                        onChange={(event) => updateNewStaffForm({ password: event.target.value })}
                        required
                      />
                    </label>
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={newStaffForm.mfaRequired}
                        disabled={newStaffForm.roles.includes("Administrator")}
                        onChange={(event) =>
                          updateNewStaffForm({ mfaRequired: event.target.checked })
                        }
                      />
                      Require MFA on first login
                    </label>
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={newStaffForm.showOnLeadership}
                        onChange={(event) =>
                          updateNewStaffForm({ showOnLeadership: event.target.checked })
                        }
                      />
                      Show on Leadership page
                    </label>
                    <div className="role-picker form-span">
                      {staffRoles.map((role) => (
                        <label key={role}>
                          <input
                            type="checkbox"
                            checked={newStaffForm.roles.includes(role)}
                            onChange={(event) => toggleNewStaffRole(role, event.target.checked)}
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                    <button className="button button--gold" type="submit">
                      <Plus size={18} /> Create Staff Account
                    </button>
                  </form>
                </section>
              ) : null}

              <section className="account-card account-card--wide">
                <header>
                  <div>
                    <p className="section-label">User Administration</p>
                    <h3>Staff Directory</h3>
                    <p>
                      {isUserAdmin
                        ? "Admins and User Admins can create users, deactivate accounts, and manage role assignments."
                        : "Only User Admins can change permissions."}
                    </p>
                  </div>
                  <StatusBadge>{isUserAdmin ? "Admin Access" : "Read Only"}</StatusBadge>
                </header>
                <div className="staff-table">
                  <div className="staff-table__head">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Roles</span>
                    <span>Leadership</span>
                    <span>MFA</span>
                    <span>Status</span>
                  </div>
                  {staffUsers.length ? (
                    staffUsers.map((user) => (
                      <article
                        key={user.id}
                        className={`staff-row ${
                          selectedStaffUser?.id === user.id ? "is-active" : ""
                        }`}
                        onClick={() => setSelectedStaffId(user.id)}
                      >
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                        <span>{getUserRoles(user).join(", ")}</span>
                        <span>{shouldShowOnLeadership(user) ? "Visible" : "Hidden"}</span>
                        <span>
                          {shouldRequireUserMfa(user, mfaPolicy)
                            ? user.mfaEnabled ||
                              Object.values(user.mfaMethods || {}).some(Boolean)
                              ? "Enrolled"
                              : "Required"
                            : "Not Required"}
                        </span>
                        <label className="checkbox-line">
                          <input
                            type="checkbox"
                            checked={user.isActive !== false}
                            disabled={!isUserAdmin}
                            onChange={(event) =>
                              updateStaffUser(user.id, { isActive: event.target.checked })
                            }
                          />
                          Active
                        </label>
                      </article>
                    ))
                  ) : (
                  <EmptyPortalState>No staff users have been created yet.</EmptyPortalState>
                  )}
                </div>
              </section>

              <section className="account-card">
                <header>
                  <div>
                    <p className="section-label">Selected User</p>
                    <h3>{selectedStaffUser?.name || "Select Staff"}</h3>
                    <p>{selectedStaffUser?.email || "Choose a staff row to manage."}</p>
                  </div>
                  {selectedStaffUser ? (
                    <StatusBadge>
                      {selectedStaffUser.isActive === false ? "Inactive" : "Active"}
                    </StatusBadge>
                  ) : null}
                </header>
                {selectedStaffUser ? (
                  <>
                    <div className="portal-form">
                      <label>
                        Name
                        <input
                          value={selectedStaffUser.name || ""}
                          disabled={!isUserAdmin}
                          onChange={(event) =>
                            updateStaffUser(selectedStaffUser.id, {
                              name: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          value={selectedStaffUser.email || ""}
                          disabled={!isUserAdmin}
                          onChange={(event) =>
                            updateStaffUser(selectedStaffUser.id, {
                              email: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Temporary Password
                        <input
                          value={selectedStaffUser.password || ""}
                          disabled={!isUserAdmin}
                          onChange={(event) =>
                            updateStaffUser(selectedStaffUser.id, {
                              password: event.target.value,
                              requirePasswordReset: true,
                            })
                          }
                        />
                      </label>
                      <label className="checkbox-line">
                        <input
                          type="checkbox"
                          checked={selectedStaffUser.isActive !== false}
                          disabled={!isUserAdmin || selectedStaffUser.id === session.id}
                          onChange={(event) =>
                            updateStaffUser(selectedStaffUser.id, {
                              isActive: event.target.checked,
                            })
                          }
                        />
                        Account Active
                      </label>
                      <label className="checkbox-line">
                        <input
                          type="checkbox"
                          checked={shouldShowOnLeadership(selectedStaffUser)}
                          disabled={!isUserAdmin || isPinnedLeadershipUser(selectedStaffUser)}
                          onChange={(event) =>
                            updateStaffUser(selectedStaffUser.id, {
                              showOnLeadership: event.target.checked,
                            })
                          }
                        />
                        Show on Leadership page
                      </label>
                    </div>
                    <div className="role-picker role-picker--stacked">
                      {staffRoles.map((role) => (
                        <label key={role}>
                          <input
                            type="checkbox"
                            checked={getUserRoles(selectedStaffUser).includes(role)}
                            disabled={!isUserAdmin}
                            onChange={(event) =>
                              toggleStaffRole(selectedStaffUser, role, event.target.checked)
                            }
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mfa-admin-panel">
                      <div>
                        <p className="section-label">MFA Enforcement</p>
                        <h4>{selectedStaffUser.mfaEnrollmentStatus || "Required"}</h4>
                      </div>
                      <label className="checkbox-line">
                        <input
                          type="checkbox"
                          checked={shouldRequireUserMfa(selectedStaffUser, mfaPolicy)}
                          disabled={
                            !isUserAdmin ||
                            (mfaPolicy.exemptAdministrators && isAdministrator(selectedStaffUser))
                          }
                          onChange={(event) =>
                            updateStaffUser(selectedStaffUser.id, {
                              mfaRequired: event.target.checked,
                              mfaEnrollmentStatus: event.target.checked
                                ? "Required"
                                : "Not Required",
                            })
                          }
                        />
                        Require MFA for this user
                      </label>
                      <button
                        className="button button--outline"
                        type="button"
                        disabled={!isUserAdmin}
                        onClick={() =>
                          updateStaffUser(selectedStaffUser.id, {
                            mfaEnabled: false,
                            mfaMethods: {},
                            mfaEnrollmentStatus: shouldRequireUserMfa(
                              selectedStaffUser,
                              mfaPolicy,
                            )
                              ? "Required"
                              : "Not Required",
                            lastMfaUpdatedAt: new Date().toISOString(),
                          })
                        }
                      >
                        Reset MFA Enrollment
                      </button>
                    </div>
                  </>
                ) : (
                  <EmptyPortalState>Select a staff user to manage.</EmptyPortalState>
                )}
              </section>

              <section className="account-card">
                <header>
                  <div>
                    <p className="section-label">MFA Management</p>
                    <h3>MFA Policy Suite</h3>
                    <p>Control whether staff must enroll MFA and which methods are allowed.</p>
                  </div>
                  <StatusBadge>
                    {mfaPolicy.requireMfaForStaff ? "Required" : "Optional"}
                  </StatusBadge>
                </header>
                <div className="mfa-admin-panel">
                  <label className="checkbox-line">
                    <input
                      type="checkbox"
                      checked={mfaPolicy.requireMfaForStaff}
                      disabled={!isUserAdmin}
                      onChange={(event) =>
                        updateMfaPolicy({ requireMfaForStaff: event.target.checked })
                      }
                    />
                    Require MFA for staff users
                  </label>
                  <label className="checkbox-line">
                    <input
                      type="checkbox"
                      checked={mfaPolicy.forceFirstLoginEnrollment}
                      disabled={!isUserAdmin}
                      onChange={(event) =>
                        updateMfaPolicy({ forceFirstLoginEnrollment: event.target.checked })
                      }
                    />
                    Force MFA setup on first login
                  </label>
                  <label className="checkbox-line">
                    <input
                      type="checkbox"
                      checked={mfaPolicy.exemptAdministrators}
                      disabled={!isUserAdmin}
                      onChange={(event) =>
                        updateMfaPolicy({ exemptAdministrators: event.target.checked })
                      }
                    />
                    Exempt Administrators for now
                  </label>
                </div>
                <div className="mfa-methods">
                  {mfaMethodOptions.map(({ id, label, body, icon: Icon }) => (
                    <label key={id} className="mfa-method">
                      <input
                        type="checkbox"
                        checked={mfaPolicy.allowedMethods?.[id] !== false}
                        disabled={!isUserAdmin}
                        onChange={(event) => togglePolicyMethod(id, event.target.checked)}
                      />
                      <Icon />
                      <span>
                        <strong>{label}</strong>
                        <small>{body}</small>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="staff-auth__note">
                  All non-admin accounts are required to enroll MFA before entering
                  the portal. Administrators are exempt while the client signs off on
                  the final identity policy.
                </p>
              </section>
            </div>
          </div>
        ) : null}

        {["email-settings", "email-tools"].includes(activeTab) ? (
          <div className="portal-panel portal-email-grid">
            <form className="portal-form" onSubmit={(event) => event.preventDefault()}>
              <div className="portal-panel__heading">
                <Mail />
                <div>
                  <h2>Mail Server Settings</h2>
                  <p>Store SMTP/POP3 configuration for a secure backend sender.</p>
                </div>
              </div>
              <label>
                Provider Name
                <input
                  name="providerName"
                  value={mailSettings.providerName}
                  onChange={updateMailSettings}
                />
              </label>
              <label>
                SMTP Host
                <input
                  name="smtpHost"
                  value={mailSettings.smtpHost}
                  onChange={updateMailSettings}
                />
              </label>
              <label>
                SMTP Port
                <input
                  name="smtpPort"
                  value={mailSettings.smtpPort}
                  onChange={updateMailSettings}
                />
              </label>
              <label>
                POP3 Host
                <input
                  name="pop3Host"
                  value={mailSettings.pop3Host}
                  onChange={updateMailSettings}
                />
              </label>
              <label>
                POP3 Port
                <input
                  name="pop3Port"
                  value={mailSettings.pop3Port}
                  onChange={updateMailSettings}
                />
              </label>
              <label>
                Username
                <input
                  name="username"
                  value={mailSettings.username}
                  onChange={updateMailSettings}
                  placeholder="mailbox@example.com"
                />
              </label>
              <label>
                SMTP App Password
                <input
                  name="password"
                  type="password"
                  value={mailSettings.password || ""}
                  onChange={updateMailSettings}
                  placeholder="Google app password or SMTP password"
                />
              </label>
              <label>
                From Name
                <input
                  name="fromName"
                  value={mailSettings.fromName}
                  onChange={updateMailSettings}
                />
              </label>
              <label>
                From Email
                <input
                  name="fromEmail"
                  type="email"
                  value={mailSettings.fromEmail}
                  onChange={updateMailSettings}
                  placeholder="ministry@example.com"
                />
              </label>
              <label className="checkbox-line form-span">
                <input
                  name="useTls"
                  type="checkbox"
                  checked={Boolean(mailSettings.useTls)}
                  onChange={updateMailSettings}
                />
                Use TLS
              </label>
              <p className="staff-auth__note form-span">
                Messages are sent through the local AWD email API using these SMTP settings.
                For Google Workspace, use an app password or approved SMTP credential.
              </p>
            </form>
            <aside className="selection-empty">
              <Send />
              <h3>Email lives inside each contact.</h3>
              <p>
                Open CRM Contacts, select a record, then compose and track email
                follow-up from that contact workspace.
              </p>
            </aside>
          </div>
        ) : null}

        {activeTab === "database-schema" ? (
          <div className="portal-panel">
            <div className="portal-panel__heading">
              <Database />
              <div>
                <h2>Database Design</h2>
                <p>
                  This prototype stores records in browser storage. The matching
                  production schema is included in the repository.
                </p>
              </div>
            </div>
            <div className="database-cards">
              {[
                ["staff_users", "Portal accounts, role, and identity metadata"],
                ["prayer_requests", "Submitted prayer requests and prayer status"],
                ["testimonials", "Submitted stories, review status, and display flag"],
                ["contacts", "CRM contact requests and follow-up status"],
                ["email_settings", "SMTP/POP3 configuration metadata"],
                ["email_messages", "Prepared or sent messages for contacts"],
              ].map(([table, body]) => (
                <article key={table}>
                  <strong>{table}</strong>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <p className="staff-auth__note">
              See `database/ministry_management_schema.sql` for the backend
              database structure.
            </p>
          </div>
        ) : null}
        {deleteImagePageId ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="donation-modal testimonial-modal cms-confirm-modal">
              <header>
                <div><Trash2 size={18} /> Confirm Image Removal</div>
                <button type="button" aria-label="Close" onClick={() => setDeleteImagePageId("")}>
                  <X />
                </button>
              </header>
              <div className="donation-modal__intro">
                <h2>Remove this image?</h2>
                <p>This will clear the image path for the selected page hero. The page layout stays protected.</p>
              </div>
              <div className="testimonial-modal__actions cms-confirm-actions">
                <button
                  className="button button--gold"
                  type="button"
                  onClick={() => {
                    updateManagedPage(deleteImagePageId, { hero: { image: "" } });
                    setDeleteImagePageId("");
                  }}
                >
                  Delete Image
                </button>
                <button className="button button--outline" type="button" onClick={() => setDeleteImagePageId("")}>
                  Cancel
                </button>
              </div>
            </section>
          </div>
        ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Site() {
  const { pathname } = useLocation();
  const [donationOpen, setDonationOpen] = useState(false);
  const openDonation = () => setDonationOpen(true);
  const closeDonation = () => setDonationOpen(false);
  const isStaffPortalRoute = pathname === "/staff_portal" || pathname === "/staff-portal";

  useEffect(() => {
    ensurePortalSeedData();
  }, []);

  return (
    <>
      <ScrollToTop />
      <PageMetadata />
      <MotionEffects />
      <NetworkAddressRefresh />
      <SiteContentOverrides />
      <div className="scroll-progress" aria-hidden="true" />
      {isStaffPortalRoute ? null : <Header onDonate={openDonation} />}
      <main className="route-stage" key={pathname}>
        <Routes>
          <Route path="/" element={<HomePage onDonate={openDonation} />} />
          <Route
            path="/About_us"
            element={<AboutPage onDonate={openDonation} />}
          />
          <Route
            path="/Ministries"
            element={<MinistriesPage onDonate={openDonation} />}
          />
          <Route
            path="/Leadership"
            element={<LeadershipPage onDonate={openDonation} />}
          />
          <Route
            path="/Get_Involved"
            element={<GetInvolvedPage onDonate={openDonation} />}
          />
          <Route path="/staff_portal" element={<StaffPortalPage />} />
          <Route path="/staff-portal" element={<Navigate to="/staff_portal" replace />} />
          <Route path="/about" element={<Navigate to="/About_us" replace />} />
          <Route
            path="/ministries"
            element={<Navigate to="/Ministries" replace />}
          />
          <Route
            path="/leadership"
            element={<Navigate to="/Leadership" replace />}
          />
          <Route
            path="/get-involved"
            element={<Navigate to="/Get_Involved" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {isStaffPortalRoute ? null : <Footer onDonate={openDonation} />}
      <DonationModal open={donationOpen} onClose={closeDonation} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Site />
    </BrowserRouter>
  );
}
