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
  X
} from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation
} from "react-router-dom";

const donationUrl =
  "https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-14931";

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
  "Mike Best"
];

const ministries = [
  {
    name: "Brothers Keepers",
    short: "BK",
    image: "/assets/brothers-keepers.png",
    alt: "Brothers Keepers iron sharpens iron emblem",
    quote: "Iron sharpens iron.",
    body: "A brotherhood committed to faith, accountability, strength, and service.",
    detail:
      "Brothers Keepers calls men to sharpen one another, grow in Christ, build strong character, and live as faithful examples in their homes and communities.",
    className: "ministry--bk"
  },
  {
    name: "Core Leadership",
    short: "BK Leadership",
    image: "/assets/core-leadership.png",
    alt: "Brothers Keepers Core Leadership emblem",
    quote: "The leadership branch of Brothers Keepers.",
    body: "Guiding the mission with integrity, unity, and a heart to serve.",
    detail:
      "Core Leadership is the same branch as Brothers Keepers, equipping its directors to lead with integrity and build a legacy that impacts generations.",
    className: "ministry--core"
  },
  {
    name: "Daughters of the Kingdom",
    short: "DOK",
    image: "/assets/dok.png",
    alt: "Daughters of the Kingdom crown and cross emblem",
    quote: "Founder / Director — Kim Cheathem",
    body: "Women walking boldly in faith, identity, purpose, and calling.",
    detail:
      "Daughters of the Kingdom creates space for women to know their God-given identity, encourage one another, and answer their calling with confidence.",
    className: "ministry--dok"
  }
];

const ways = [
  {
    icon: HandHeart,
    title: "Pray With Us",
    body: "Lift our mission, leaders, families, and community in prayer."
  },
  {
    icon: Handshake,
    title: "Partner With Us",
    body: "Stand with AWD as we serve people and break barriers together."
  },
  {
    icon: Users,
    title: "Serve With Us",
    body: "Use your time and talents to be the hands and feet of Christ."
  }
];

const pageMetadata = {
  "/": {
    title: "All Walls Down | Breaking Every Barrier",
    description:
      "All Walls Down brings the focus back to Christ and breaks every barrier that seeks to separate us."
  },
  "/About_us": {
    title: "About Us | All Walls Down",
    description:
      "Learn about the vision, mission, and founders of AWD — All Walls Down."
  },
  "/Ministries": {
    title: "Our Ministries | All Walls Down",
    description:
      "Meet Brothers Keepers, Brothers Keepers Core Leadership, and Daughters of the Kingdom."
  },
  "/Leadership": {
    title: "Leadership | All Walls Down",
    description:
      "Meet the Brothers Keepers Core Leadership Directors and Daughters of the Kingdom leadership."
  },
  "/Get_Involved": {
    title: "Get Involved | All Walls Down",
    description:
      "Pray, partner, serve, or give to help All Walls Down be the hands and feet of Christ."
  }
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = pageMetadata[pathname] ?? pageMetadata["/"];
    document.title = metadata.title;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", metadata.description);
  }, [pathname]);

  return null;
}

function DonateButton({ onClick, variant = "gold", children = "Donate" }) {
  return (
    <button className={`button button--${variant}`} type="button" onClick={onClick}>
      <Heart aria-hidden="true" size={18} strokeWidth={1.8} />
      <span>{children}</span>
    </button>
  );
}

function Ornament({ compact = false }) {
  return (
    <div className={compact ? "ornament ornament--left" : "ornament"} aria-hidden="true">
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
    ["/Get_Involved", "Get Involved"]
  ];

  return (
    <header className="site-header">
      <NavLink className="brand" to="/" aria-label="All Walls Down home" onClick={closeMenu}>
        <img src="/assets/awd-logo.png" alt="" />
        <span>AWD <i /> All Walls Down</span>
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
      <nav className={open ? "nav nav--open" : "nav"} aria-label="Main navigation">
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
  return (
    <section className={`page-hero ${imageClass}`}>
      {image ? (
        <div className="page-hero__mark" aria-hidden="true">
          <img src={image} alt="" />
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
          <h1>Breaking<br />Every Barrier.</h1>
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
            <h2>To be the hands and feet <em>for Christ!</em></h2>
          </div>
          <p>
            We are called to love boldly, serve humbly, and create an atmosphere
            where people of every culture can experience God personally.
          </p>
          <div className="home-marks" aria-label="All Walls Down ministries">
            {ministries.map((ministry) => (
              <NavLink to="/Ministries" key={ministry.name}>
                <img src={ministry.image} alt="" />
                <span>{ministry.short}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      <section className="home-intro section">
        <div className="shell split-feature">
          <div className="split-feature__art">
            <img src="/assets/awd-logo.png" alt="" />
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
        image="/assets/awd-logo.png"
        imageClass="page-hero--about"
      />
      <section className="about-story section">
        <div className="shell about-story__grid">
          <div className="about-story__copy">
            <p className="section-label">Our Vision</p>
            <h2>Where every wall has to come down.</h2>
            <Ornament compact />
            <p>
              Our vision is to bring Truth to the place where it was always meant
              to be—in the heart of the people—and thus by doing so, breaking
              every barrier.
            </p>
            <p>
              We are creating a place and atmosphere where people of all
              cultures can experience God on a personal level, where all walls in
              a person&apos;s life have to come down.
            </p>
            <blockquote>
              “There is neither Jew nor Gentile, neither slave nor free, nor is
              there male and female, for you are all one in Christ Jesus.”
              <cite>Galatians 3:28</cite>
            </blockquote>
          </div>
          <aside className="mission-panel mission-panel--large">
            <p className="section-label">Our Mission</p>
            <h3>To be the hands and feet <em>for Christ!</em></h3>
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
            <img src="/assets/awd-logo.png" alt="" />
          </div>
          <div>
            <p className="section-label">Founders of All Walls Down</p>
            <h2>Monta &amp; Kim Cheathem</h2>
            <p>
              Together, Monta and Kim lead AWD with a shared commitment to
              serving people, centering Christ, and building a community where
              division gives way to unity.
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
        title="Three ministries. One mission."
        body="Distinct communities, united in Christ and committed to breaking every barrier."
        image="/assets/brothers-keepers.png"
        imageClass="page-hero--ministries"
      />
      <section className="ministries section">
        <div className="shell">
          <div className="ministry-list">
            {ministries.map((ministry, index) => (
              <article className={`ministry ${ministry.className}`} key={ministry.name}>
                <div className="ministry__number">0{index + 1}</div>
                <div className="ministry__art">
                  <img src={ministry.image} alt={ministry.alt} />
                </div>
                <div className="ministry__copy">
                  <span>{ministry.short}</span>
                  <h2>{ministry.name}</h2>
                  <blockquote>{ministry.quote}</blockquote>
                  <p>{ministry.body}</p>
                  <p>{ministry.detail}</p>
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
        body="Servant leaders committed to guiding AWD, Brothers Keepers, and Daughters of the Kingdom."
        image="/assets/core-leadership.png"
        imageClass="page-hero--leadership"
      />
      <section className="leadership section">
        <div className="shell">
          <div className="section-heading section-heading--left">
            <p className="section-label">Brothers Keepers</p>
            <h2>Core Leadership Directors</h2>
          </div>
          <div className="director">
            <img src="/assets/brothers-keepers.png" alt="" />
            <div>
              <span>Founder / Director</span>
              <strong>Monta (Ta&apos;) Cheathem</strong>
            </div>
          </div>
          <div className="roster" aria-label="Brothers Keepers Core Leadership Directors">
            {leaders.map((leader) => <div key={leader}>{leader}</div>)}
          </div>
          <div className="dok-director">
            <img src="/assets/dok.png" alt="" />
            <div>
              <span>Daughters of the Kingdom</span>
              <h3>Founder / Director</h3>
              <strong>Kim Cheathem</strong>
            </div>
            <DonateButton onClick={onDonate} variant="outline">Support DOK</DonateButton>
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
        image="/assets/awd-logo.png"
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
            <img src="/assets/awd-logo.png" alt="" />
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
          <p>Together, we can reach more lives and bring hope to every heart.</p>
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
          <img src="/assets/awd-logo.png" alt="All Walls Down" />
          <strong>AWD — All Walls Down</strong>
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
          <NavLink to="/Ministries">Daughters of the Kingdom</NavLink>
          <button type="button" onClick={onDonate}>Donate</button>
        </div>
        <blockquote>
          “There is neither Jew nor Gentile, neither slave nor free, nor is
          there male and female, for you are all one in Christ Jesus.”
          <cite>Galatians 3:28</cite>
        </blockquote>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} AWD — All Walls Down.</span>
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
          <button type="button" onClick={onClose} aria-label="Close donation form">
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
  const [donationOpen, setDonationOpen] = useState(false);
  const openDonation = () => setDonationOpen(true);
  const closeDonation = () => setDonationOpen(false);

  return (
    <>
      <ScrollToTop />
      <PageMetadata />
      <Header onDonate={openDonation} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage onDonate={openDonation} />} />
          <Route path="/About_us" element={<AboutPage onDonate={openDonation} />} />
          <Route path="/Ministries" element={<MinistriesPage onDonate={openDonation} />} />
          <Route path="/Leadership" element={<LeadershipPage onDonate={openDonation} />} />
          <Route path="/Get_Involved" element={<GetInvolvedPage onDonate={openDonation} />} />
          <Route path="/about" element={<Navigate to="/About_us" replace />} />
          <Route path="/ministries" element={<Navigate to="/Ministries" replace />} />
          <Route path="/leadership" element={<Navigate to="/Leadership" replace />} />
          <Route path="/get-involved" element={<Navigate to="/Get_Involved" replace />} />
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
