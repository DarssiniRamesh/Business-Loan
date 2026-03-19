import React, { useRef, useLayoutEffect } from 'react';
import PropTypes from "prop-types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faArrowRight, faFileUpload, faChartLine, faUserShield } from '@fortawesome/free-solid-svg-icons';
import './Home.css';

function useFadeInOnScroll(ref, delay = 0) {
  useLayoutEffect(() => {
    const node = ref.current;
    const w = globalThis?.window;
    if (!node || !w) return;

    let timeoutId = null;

    function onScroll() {
      const rect = node.getBoundingClientRect();
      if (rect.top < w.innerHeight - 50) {
        node.classList.add("fade-in--visible");
      }
    }

    timeoutId = w.setTimeout(() => {
      w.addEventListener("scroll", onScroll);
      onScroll();
    }, delay);

    return () => {
      if (timeoutId) w.clearTimeout(timeoutId);
      w.removeEventListener("scroll", onScroll);
    };
  }, [ref, delay]);
}

// PUBLIC_INTERFACE
export default function Home({ onGetStartedClick }) {
  const heroRef = useRef();
  const featuresRef = useRef();
  const aboutRef = useRef();

  useFadeInOnScroll(heroRef, 20);
  useFadeInOnScroll(featuresRef, 150);
  useFadeInOnScroll(aboutRef, 300);

  return (
    <main className="home">
      <section className="hero fade-in" ref={heroRef}>
        <div className="hero__content">
          <h1>Unlock Business Growth<br /><span className="accent">with Fast, Automated Loans</span></h1>
          <p className="hero__text">
            Pre-qualify in <span className="time-strong">3 minutes</span>.<br />
            Apply securely, get instant risk scoring, and upload docs with ease.<br />
            Trusted by small businesses, powered by cutting-edge automation.
          </p>
          <button className="hero__cta" onClick={onGetStartedClick}>
            Get Started
            <FontAwesomeIcon icon={faArrowRight} className="hero__ctaicon" />
          </button>
        </div>
      </section>
      <section id="features" className="features fade-in" ref={featuresRef}>
        <h2><FontAwesomeIcon icon={faChartLine} /> Portal Features</h2>
        <div className="features__list">
          <div className="featurecard">
            <FontAwesomeIcon icon={faLock} size="2x" className="featurecard__icon" />
            <span className="featurecard__title">Secure Authentication</span>
            <span className="featurecard__desc">MFA login & registration to keep your data safe.</span>
          </div>
          <div className="featurecard">
            <FontAwesomeIcon icon={faFileUpload} size="2x" className="featurecard__icon" />
            <span className="featurecard__title">Easy Document Uploads</span>
            <span className="featurecard__desc">Submit tax returns and statements in PDF/JPG/PNG.</span>
          </div>
          <div className="featurecard">
            <FontAwesomeIcon icon={faUserShield} size="2x" className="featurecard__icon" />
            <span className="featurecard__title">Real-Time Status</span>
            <span className="featurecard__desc">Track your application progress live, anytime.</span>
          </div>
        </div>
      </section>
      <section id="about" className="about fade-in" ref={aboutRef}>
        <h2>Why Choose BusinessLoan Portal?</h2>
        <p>
          We leverage enterprise-grade security, speed, and seamless guided application flows to help you secure the funds your business needs without hassle.
        </p>
        <ul>
          <li>Under 5 minutes to decision</li>
          <li>Accurate automated risk scoring</li>
          <li>80%+ completion rates, 90%+ accuracy</li>
        </ul>
      </section>
    </main>
  );
}

Home.propTypes = {
  onGetStartedClick: PropTypes.func.isRequired,
};
