import { useEffect, useState } from "react";
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
  useNavigate,
} from "react-router-dom";
import AdminLoginModal from "./public/AdminLoginModal";
import PortalApp from "./portal/PortalApp";
import { apiRequest } from "./shared/api";

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
const defaultCrmSettings = {
  defaultStatus: "New",
  defaultPriority: "Normal",
  defaultOwner: "Ministry Staff",
  autoFollowUpDays: "7",
  requireCategory: true,
  requireNextFollowUp: false,
  notifyOnNewContact: true,
};

const sampleTestimonials = [
  {
    id: "testimonial-unity",
    name: "AWD Community Member",
    email: "",
    city: "Lawton, OK",
    ministry: "All Walls Down",
    quote: "AWD helped our family experience faith, unity, and practical love in a difficult season.",
    status: "Approved",
    displayOnSite: true,
    submittedAt: "2026-06-10T00:00:00.000Z",
    reviewedAt: "2026-06-11T00:00:00.000Z",
    notes: "",
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
    role: roles[0],
    roles,
    isActive: true,
    showOnLeadership: true,
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

  const submitTestimonial = async (event) => {
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
    await apiRequest("/api/public/testimonial", { method: "POST", body: nextTestimonial });
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

  const submitPrayerRequest = async (event) => {
    event.preventDefault();
    await apiRequest("/api/public/prayer", { method: "POST", body: form });
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

  const submitContact = async (event) => {
    event.preventDefault();
    await apiRequest("/api/public/contact", { method: "POST", body: form });
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
  const leadershipSource = leadershipStaffSeeds.map(createSeededLeadershipUser);
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

function Footer({ onDonate, onAdminLogin }) {
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
          <button type="button" onClick={onAdminLogin}>
            Admin Login
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

function Site() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [donationOpen, setDonationOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const openDonation = () => setDonationOpen(true);
  const closeDonation = () => setDonationOpen(false);
  const openAdminLogin = () => setAdminLoginOpen(true);
  const closeAdminLogin = () => setAdminLoginOpen(false);
  const isStaffPortalRoute = pathname === "/staff_portal" || pathname === "/staff-portal";
  const isPortalRoute = pathname === "/portal" || pathname.startsWith("/portal/");

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
      {isStaffPortalRoute || isPortalRoute ? null : <Header onDonate={openDonation} />}
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
          <Route path="/portal/*" element={<PortalApp />} />
          <Route path="/staff_portal" element={<Navigate to="/portal" replace />} />
          <Route path="/staff-portal" element={<Navigate to="/portal" replace />} />
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
      {isStaffPortalRoute || isPortalRoute ? null : <Footer onDonate={openDonation} onAdminLogin={openAdminLogin} />}
      <DonationModal open={donationOpen} onClose={closeDonation} />
      <AdminLoginModal
        open={adminLoginOpen}
        onClose={closeAdminLogin}
        onAuthenticated={() => {
          closeAdminLogin();
          navigate("/portal");
        }}
      />
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
