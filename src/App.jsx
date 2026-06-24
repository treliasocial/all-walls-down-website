import { useEffect, useState } from "react";
import {
  ArrowRight,
  HandHeart,
  Handshake,
  Heart,
  Menu,
  ShieldCheck,
  Sparkles,
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
  "https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-14931";
const imageDimensions = {
  "/assets/awd-logo.webp": { width: 1190, height: 1322 },
  "/assets/brothers-keepers.webp": { width: 962, height: 956 },
  "/assets/core-leadership-transparent.webp": { width: 1166, height: 1349 },
  "/assets/dok-transparent.png": { width: 1408, height: 768 },
};

const leaders = [
  "Levell Cheathem",
  "Antoine Herron",
  "Stephen MacKenzie",
  "Chris Smith",
  "Dr. Josh Snyder",
  "Emilio Jesus Ortega",
  "Adrian Ahtone",
  "Justin Hamlin",
  "Mon Lorenzo",
  "Bobby Lowe",
  "Andrew Kirkland",
  "Mike Best",
];

const ministries = [
  {
    name: "Brothers Keepers",
    short: "BK",
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
    short: "DOK",
    image: "/assets/dok-transparent.png",
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
  const closeMenu = () => setOpen(false);
  const navItems = [
    ["/", "Home"],
    ["/About_us", "About"],
    ["/Ministries", "Ministries"],
    ["/Leadership", "Leadership"],
    ["/Get_Involved", "Get Involved"],
  ];

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
          fetchPriority="high"
        />
        <span>
          AWD <i /> All Walls Down Organization
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
            fetchPriority="high"
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

function HomePage({ onDonate }) {
  return (
    <>
      <section className="hero">
        <div className="hero__image" aria-hidden="true" />
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
              <NavLink to="/Ministries" key={ministry.name}>
                <img
                  src={ministry.image}
                  alt=""
                  width={imageDimensions[ministry.image]?.width}
                  height={imageDimensions[ministry.image]?.height}
                  loading="lazy"
                  decoding="async"
                />
                <span>{ministry.short}</span>
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
              <strong>Monta (Ta&apos;) Cheathem</strong>
            </div>
          </div>
          <div
            className="roster"
            aria-label="Brothers Keepers Core Leadership Directors"
          >
            {leaders.map((leader) => (
              <div key={leader}>{leader}</div>
            ))}
          </div>
          <div className="dok-director">
            <img
              src="/assets/dok-transparent.png"
              alt=""
              width="1408"
              height="768"
              loading="lazy"
              decoding="async"
            />
            <div>
              <span>Daughters of the King</span>
              <h3>Founder / Director</h3>
              <strong>Kim Cheathem</strong>
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

function Site() {
  const { pathname } = useLocation();
  const [donationOpen, setDonationOpen] = useState(false);
  const openDonation = () => setDonationOpen(true);
  const closeDonation = () => setDonationOpen(false);

  return (
    <>
      <ScrollToTop />
      <PageMetadata />
      <MotionEffects />
      <div className="scroll-progress" aria-hidden="true" />
      <Header onDonate={openDonation} />
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
      <Footer onDonate={openDonation} />
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
