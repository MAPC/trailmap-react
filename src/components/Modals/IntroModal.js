import React, { useContext, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { ModalContext } from "../../App";
import { usePrimaryNavigation } from "../../hooks/usePrimaryNavigation";

const INTRO_DISMISSED_KEY = "trailmap-intro-dismissed";

export const isIntroModalDismissed = () =>
  typeof window !== "undefined" && localStorage.getItem(INTRO_DISMISSED_KEY) === "true";

const INTRO_CARDS = [
  {
    id: "map",
    title: "Regional Trail Map",
    description: "Jump straight to the full interactive map and toggle every trail type yourself.",
    iconClass: "bi-map-fill",
    accent: "map",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "Explore regional trail metrics and insights across Metro Boston.",
    iconClass: "bi-grid-fill",
    accent: "dashboard",
  },
  {
    id: "community",
    title: "Community Profile",
    description:
      "Dive into one municipality — trail miles, build-out, and how it compares across the region.",
    iconClass: "bi-people-fill",
    accent: "community",
  },
  {
    id: "regional",
    title: "Trails Profiles",
    description:
      "Follow named trail networks like the Mass Central Rail Trail across community lines.",
    iconClass: "bi-signpost-split-fill",
    accent: "regional",
  },
];

const IntroModal = () => {
  const { showIntroModal, toggleIntroModal, toggleContributeModal } = useContext(ModalContext);
  const {
    enterCommunityProfile,
    enterRegionalProfile,
    enterTrailsOverviewWithAllLayers,
    goToDashboard,
  } = usePrimaryNavigation();

  const [dontShowAgain, setDontShowAgain] = useState(false);

  const closeIntro = () => {
    if (dontShowAgain) {
      localStorage.setItem(INTRO_DISMISSED_KEY, "true");
    }
    toggleIntroModal(false);
  };

  const handleCardSelect = (cardId) => {
    if (cardId === "community") {
      enterCommunityProfile();
      closeIntro();
    } else if (cardId === "regional") {
      enterRegionalProfile();
      closeIntro();
    } else if (cardId === "dashboard") {
      enterDashboard();
    } else {
      enterFullMap();
    }
  };

  const enterDashboard = () => {
    goToDashboard();
    closeIntro();
  };

  const enterFullMap = () => {
    enterTrailsOverviewWithAllLayers();
    closeIntro();
  };

  return (
    <Modal
      className="IntroModal"
      dialogClassName="IntroModal__dialog mx-auto"
      show={showIntroModal}
      onHide={closeIntro}
      centered
      backdrop="static"
    >
      <div className="IntroModal__inner">
        <button
          type="button"
          className="IntroModal__close"
          aria-label="Close welcome dialog"
          onClick={closeIntro}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>

        <span className="IntroModal__eyebrow">Welcome to Trailmap</span>
        <h2 className="IntroModal__title">Where would you like to start?</h2>
        <p className="IntroModal__lead">
          Metro Boston&apos;s regional walking &amp; cycling map. Pick a path below — you can switch
          anytime from the top navigation.
        </p>

        <div className="IntroModal__cards">
          {INTRO_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`IntroModal__card IntroModal__card--${card.accent}`}
              onClick={() => handleCardSelect(card.id)}
            >
              <div className={`IntroModal__icon-wrap IntroModal__icon-wrap--${card.accent}`}>
                <i className={`bi ${card.iconClass}`} aria-hidden="true" />
              </div>
              <h3 className="IntroModal__card-title">{card.title}</h3>
              <p className="IntroModal__card-text">{card.description}</p>
              <span className={`IntroModal__card-action IntroModal__card-action--${card.accent}`}>
                Start <i className="bi bi-chevron-right" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>

        <div className="IntroModal__footer">
          <Form.Check
            type="checkbox"
            id="intro-dont-show-again"
            className="IntroModal__checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            label="Don't show this again"
          />
          <p className="IntroModal__contribute">
            Have better data? Trailmap improves with the community —{" "}
            <a
              href="#contribute"
              onClick={(e) => {
                e.preventDefault();
                closeIntro();
                toggleContributeModal(true);
              }}
            >
              contribute trail info
            </a>
            .
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default IntroModal;
