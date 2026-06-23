import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  HandHeart,
  Handshake,
  Heart,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from "lucide-react";

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
    className: "ministry--bk"
  },
  {
    name: "Core Leadership",
    short: "BK Leadership",
    image: "/assets/core-leadership.png",
    alt: "Brothers Keepers Core Leadership emblem",
    quote: "The leadership branch of Brothers Keepers.",
    body: "Guiding the mission with integrity, unity, and a heart to serve.",
    className: "ministry--core"
  },
  {
    name: "Daughters of the Kingdom",
    short: "DOK",
    image: "/assets/dok.png",
    alt: "Daughters of the Kingdom crown and cross emblem",
    quote: "Founder / Director — Kim Cheathem",
    body: "Women walking boldly in faith, identity, purpose, and calling.",
    className: "ministry--dok"
  }
];

function DonateButton({ onClick, variant = "gold", children = "Donate" }) {
  return (
    <button className={`button button--${variant}`} type="button" onClick={onClick}>
      <Heart aria-hidden="true" size={18} strokeWidth={1.8} />
      <span>{children}</span>
    </button>
  );
}

function Header({ onDonate }) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="All Walls Down home" onClick={closeMenu}>
        <img src="/assets/awd-logo.png" alt="" />
        <span>AWD <i /> All Walls Down</span>
      </a>
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
        <a href="#home" onClick={closeMenu}>Home</a>
        <a href="#about" onClick={closeMenu}>About</a>
        <a href="#ministries" onClick={closeMenu}>Ministries</a>
        <a href="#leadership" onClick={closeMenu}>Leadership</a>
        <a href="#get-involved" onClick={closeMenu}>Get Involved</a>
        <div className="nav-donate">
          <DonateButton onClick={() => { closeMenu(); onDonate(); }} variant="outline" />
        </div>
      </nav>
    </header>
  );
}

function Hero({ onDonate }) {
  return (
    <section className="hero" id="home">
      <div className="hero__image" aria-hidden="true" />
      <div className="hero__content shell">
        <h1>Breaking<br />Every Barrier.</h1>
        <div className="ornament"><span /><Sparkles size={16} /><span /></div>
        <p>
          Bringing the focus back to Christ and breaking every barrier that seeks
          to separate us.
        </p>
        <div className="hero__actions">
          <a className="button button--outline" href="#about">
            Our Mission <ArrowRight size={18} />
          </a>
          <DonateButton onClick={onDonate} />
        </div>
        <blockquote>
          <span>†</span>
          You are all one in Christ Jesus. <cite>— Galatians 3:28</cite>
        </blockquote>
      </div>
      <a className="scroll-cue" href="#about" aria-label="Scroll to our story">
        <ChevronDown />
      </a>
    </section>
  );
}

function About({ onDonate }) {
  return (
    <section className="about section" id="about">
      <div className="shell about__grid">
        <div className="section-mark" aria-hidden="true">
          <img src="/assets/awd-logo.png" alt="" />
        </div>
        <div className="about__copy">
          <p className="section-label">About AWD</p>
          <h2>Faith is more than religion.</h2>
          <div className="ornament ornament--left"><span /><Sparkles size={15} /><span /></div>
          <p>
            It&apos;s about a relationship between a person and God. Our vision is
            to bring Truth to the place where it was always meant to be—in the
            heart of the people—and thus by doing so, breaking every barrier.
          </p>
          <p>
            We are creating a place and atmosphere where people of all cultures
            can experience God on a personal level, where all walls in a
            person&apos;s life have to come down.
          </p>
          <p className="scripture">
            “There is neither Jew nor Gentile, neither slave nor free, nor is
            there male and female, for you are all one in Christ Jesus.”
            <strong> Galatians 3:28</strong>
          </p>
          <DonateButton onClick={onDonate} />
        </div>
        <aside className="mission-panel">
          <p className="section-label">Our Mission</p>
          <h3>To be the hands and feet <em>for Christ!</em></h3>
          <div className="founders">
            <span>Founders of All Walls Down</span>
            <strong>Monta &amp; Kim Cheathem</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Ministries({ onDonate }) {
  return (
    <section className="ministries section" id="ministries">
      <div className="shell">
        <div className="section-heading">
          <p className="section-label">Our Ministries</p>
          <h2>Three ministries. One mission.</h2>
          <p>
            Distinct communities, united in Christ and committed to breaking
            every barrier.
          </p>
        </div>
        <div className="ministry-list">
          {ministries.map((ministry, index) => (
            <article className={`ministry ${ministry.className}`} key={ministry.name}>
              <div className="ministry__number">0{index + 1}</div>
              <div className="ministry__art">
                <img src={ministry.image} alt={ministry.alt} />
              </div>
              <div className="ministry__copy">
                <span>{ministry.short}</span>
                <h3>{ministry.name}</h3>
                <blockquote>{ministry.quote}</blockquote>
                <p>{ministry.body}</p>
                <DonateButton onClick={onDonate} variant="outline">Support This Ministry</DonateButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Leadership({ onDonate }) {
  return (
    <section className="leadership section" id="leadership">
      <div className="shell">
        <div className="section-heading section-heading--left">
          <p className="section-label">Leadership</p>
          <h2>Brothers Keepers Core Leadership</h2>
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
  );
}

function GetInvolved({ onDonate }) {
  const ways = [
    {
      icon: HandHeart,
      title: "Pray With Us",
      body: "Lift our mission, leaders, and community in prayer."
    },
    {
      icon: Handshake,
      title: "Partner With Us",
      body: "Stand with AWD as we serve and break barriers together."
    },
    {
      icon: Users,
      title: "Serve With Us",
      body: "Use your time and talents to be the hands and feet of Christ."
    }
  ];

  return (
    <section className="get-involved section" id="get-involved">
      <div className="shell">
        <div className="section-heading">
          <p className="section-label">Get Involved</p>
          <h2>Be the hands and feet for Christ.</h2>
          <p>There is a place for you in the work of breaking every barrier.</p>
        </div>
        <div className="ways">
          {ways.map(({ icon: Icon, title, body }) => (
            <article key={title}>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
          <article className="ways__donate">
            <Heart aria-hidden="true" />
            <h3>Give With Purpose</h3>
            <p>Your generosity helps carry this mission forward.</p>
            <DonateButton onClick={onDonate}>Donate Now</DonateButton>
          </article>
        </div>
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
          <a href="#about">About</a>
          <a href="#ministries">Ministries</a>
          <a href="#leadership">Leadership</a>
          <a href="#get-involved">Get Involved</a>
        </div>
        <div>
          <span>Ministries</span>
          <a href="#ministries">Brothers Keepers</a>
          <a href="#ministries">Core Leadership</a>
          <a href="#ministries">Daughters of the Kingdom</a>
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
        <a href="https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-14931" target="_blank" rel="noreferrer">
          Open the secure donation form in a new tab <ArrowRight size={15} />
        </a>
      </section>
    </div>
  );
}

export default function App() {
  const [donationOpen, setDonationOpen] = useState(false);
  const openDonation = () => setDonationOpen(true);
  const closeDonation = () => setDonationOpen(false);

  return (
    <>
      <Header onDonate={openDonation} />
      <main>
        <Hero onDonate={openDonation} />
        <About onDonate={openDonation} />
        <Ministries onDonate={openDonation} />
        <Leadership onDonate={openDonation} />
        <GetInvolved onDonate={openDonation} />
      </main>
      <Footer onDonate={openDonation} />
      <DonationModal open={donationOpen} onClose={closeDonation} />
    </>
  );
}
