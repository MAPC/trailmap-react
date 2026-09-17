import React, { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import {
  buildCommunityProfileEmbedCode,
  getCommunityProfileEmbedPath,
} from "../../utils/trailMetricsDashboard";

const DEFAULT_WIDTH = "100%";
const DEFAULT_HEIGHT = "640";

const copyText = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return true;
  }
};

const EmbedCommunityProfileModal = ({
  show,
  onHide,
  municipalitySlug,
  municipalityName,
}) => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedPath = municipalitySlug
    ? getCommunityProfileEmbedPath(municipalitySlug)
    : "";
  const embedUrl = embedPath ? `${origin}${embedPath}` : "";

  const embedCode = useMemo(
    () =>
      municipalitySlug
        ? buildCommunityProfileEmbedCode({
            origin,
            slug: municipalitySlug,
            municipalityName,
            width: width.trim() || DEFAULT_WIDTH,
            height: height.trim() || DEFAULT_HEIGHT,
          })
        : "",
    [origin, municipalitySlug, municipalityName, width, height]
  );

  const handleCopy = async () => {
    if (!embedCode) return;
    await copyText(embedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="EmbedCommunityProfileModal"
      dialogClassName="EmbedCommunityProfileModal__dialog"
    >
      <Modal.Header closeButton>
        <Modal.Title>Embed this community profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          Paste this HTML on your website to show the {municipalityName || "community"}{" "}
          trail map, legend, and trail network table. The embed links back to the
          full Trailmap community profile.
        </p>
        <div className="row g-2 mb-3">
          <div className="col-6">
            <Form.Label htmlFor="embed-width" className="small fw-semibold mb-1">
              Width
            </Form.Label>
            <Form.Control
              id="embed-width"
              size="sm"
              value={width}
              onChange={(event) => {
                setCopied(false);
                setWidth(event.target.value);
              }}
            />
          </div>
          <div className="col-6">
            <Form.Label htmlFor="embed-height" className="small fw-semibold mb-1">
              Height
            </Form.Label>
            <Form.Control
              id="embed-height"
              size="sm"
              value={height}
              onChange={(event) => {
                setCopied(false);
                setHeight(event.target.value);
              }}
            />
          </div>
        </div>
        <Form.Label htmlFor="embed-code" className="small fw-semibold mb-1">
          Embed code
        </Form.Label>
        <Form.Control
          id="embed-code"
          as="textarea"
          rows={5}
          readOnly
          value={embedCode}
          onFocus={(event) => event.target.select()}
          className="font-monospace small"
        />
        {embedUrl && (
          <p className="small text-muted mt-2 mb-0">
            Preview:{" "}
            <a href={embedUrl} target="_blank" rel="noopener noreferrer">
              Open embed in a new tab
            </a>
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" size="sm" onClick={handleCopy} disabled={!embedCode}>
          {copied ? "Copied" : "Copy embed code"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmbedCommunityProfileModal;
