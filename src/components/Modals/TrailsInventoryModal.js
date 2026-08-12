import React, { useContext, useMemo, useRef, useCallback, useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Collapse from "react-bootstrap/Collapse";
import ReactMapGL, { Source, NavigationControl, ScaleControl } from "react-map-gl";
import { LayerContext } from "../../App";
import massachusettsData from "../../data/massachusetts.json";
import MunicipalityMapLayer from "../Map/layers/MunicipalityMapLayer";
import CommunityTrailsProfileLayers from "../Map/layers/CommunityTrailsProfileLayers";
import TrailLegend from "../Map/TrailLegend";
import { mapcTrailLayers } from "../Map/constants/mapcTrailLayersConfig";
import {
  buildInventoryTableModel,
  compareInventoryRowValues,
  computeInventoryBounds,
  downloadInventoryCsv,
  formatInventoryField,
} from "../../utils/trailsInventoryUtils";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;

const INVENTORY_PAGE_SIZE = 25;

const getInventoryTrailTypeKey = (trail) =>
  (trail.layerName && String(trail.layerName).trim()) ||
  `Layer ${trail.layerId ?? "unknown"}`;

const columnHeader = (c) => {
  if (c === "_idx") return "#";
  if (c === "layerName") return "Trail type";
  if (c === "layerId") return "Layer ID";
  if (c === "length_ft") return "Length (ft)";
  return c.replace(/_/g, " ");
};

const formatCell = (col, val) => {
  if (col === "_idx") return val;
  if (col === "length_ft" && val != null && val !== "") {
    const n = Number(val);
    if (!Number.isNaN(n)) return `${n.toLocaleString()} ft`;
  }
  if (val == null || val === "") return "—";
  const dateFormatted = formatInventoryField(col, val, { variant: "table" });
  if (dateFormatted !== null) return dateFormatted;
  return String(val);
};

const TrailsInventoryModal = ({
  show,
  onHide,
  selectedMunicipality,
  municipalityTrails,
  onDownloadGeoJSON,
}) => {
  const { baseLayer } = useContext(LayerContext);
  const mapRef = useRef(null);
  const [selectedTypeKeys, setSelectedTypeKeys] = useState(() => new Set());
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [inventoryMapLegendOpen, setInventoryMapLegendOpen] = useState(false);

  const trailTypeOptions = useMemo(() => {
    if (!municipalityTrails?.length) return [];
    const map = new Map();
    municipalityTrails.forEach((t) => {
      const key = getInventoryTrailTypeKey(t);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }));
  }, [municipalityTrails]);

  useEffect(() => {
    if (!show || !municipalityTrails?.length) {
      return;
    }
    const all = new Set(municipalityTrails.map(getInventoryTrailTypeKey));
    setSelectedTypeKeys(all);
  }, [show, municipalityTrails]);

  const filteredTrails = useMemo(() => {
    if (!municipalityTrails?.length || selectedTypeKeys.size === 0) {
      return [];
    }
    return municipalityTrails.filter((t) =>
      selectedTypeKeys.has(getInventoryTrailTypeKey(t))
    );
  }, [municipalityTrails, selectedTypeKeys]);

  const totalCount = municipalityTrails?.length ?? 0;
  const filterSuffix =
    totalCount > 0 && filteredTrails.length < totalCount ? "_filtered" : "";
  const { rows, columns } = useMemo(
    () => buildInventoryTableModel(filteredTrails),
    [filteredTrails]
  );

  const sortedRows = useMemo(() => {
    if (!sortColumn || rows.length === 0) return rows;
    const mult = sortDirection === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) =>
        mult * compareInventoryRowValues(sortColumn, a[sortColumn], b[sortColumn])
    );
  }, [rows, sortColumn, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRows.length / INVENTORY_PAGE_SIZE)
  );

  useEffect(() => {
    setInventoryPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  useEffect(() => {
    setInventoryPage(1);
  }, [rows.length, sortColumn, sortDirection]);

  useEffect(() => {
    if (show) setInventoryPage(1);
  }, [show]);

  useEffect(() => {
    if (show) setInventoryMapLegendOpen(false);
  }, [show]);

  useEffect(() => {
    setPageInput(String(inventoryPage));
  }, [inventoryPage]);

  const applyPageFromInput = useCallback(() => {
    const raw = String(pageInput).trim();
    let n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      setPageInput(String(inventoryPage));
      return;
    }
    n = Math.min(Math.max(1, n), totalPages);
    setInventoryPage(n);
    setPageInput(String(n));
  }, [pageInput, inventoryPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (inventoryPage - 1) * INVENTORY_PAGE_SIZE;
    return sortedRows.slice(start, start + INVENTORY_PAGE_SIZE);
  }, [sortedRows, inventoryPage]);

  const pageRangeStart =
    sortedRows.length === 0 ? 0 : (inventoryPage - 1) * INVENTORY_PAGE_SIZE + 1;
  const pageRangeEnd = Math.min(
    inventoryPage * INVENTORY_PAGE_SIZE,
    sortedRows.length
  );

  const handleSortColumn = (col) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDirection("asc");
      return;
    }
    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
  };

  const renderSortIcon = (col) => {
    if (sortColumn !== col) {
      return (
        <i
          className="fas fa-sort trails-inventory-sort-icon"
          aria-hidden="true"
        />
      );
    }
    return (
      <i
        className={`fas fa-sort-${sortDirection === "asc" ? "up" : "down"} trails-inventory-sort-icon`}
        aria-hidden="true"
      />
    );
  };

  const mapAllLayersVisible = useMemo(() => {
    const v = {};
    mapcTrailLayers.forEach((l) => {
      v[l.id] = true;
    });
    return v;
  }, []);

  const fitMap = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    const b = computeInventoryBounds(selectedMunicipality, filteredTrails);
    map.resize();
    map.fitBounds(
      [
        [b[0], b[1]],
        [b[2], b[3]],
      ],
      { padding: 48, maxZoom: 14, duration: 0 }
    );
  }, [selectedMunicipality, filteredTrails]);

  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(fitMap, 200);
    return () => window.clearTimeout(id);
  }, [show, fitMap]);

  const toggleType = (label) => {
    setSelectedTypeKeys((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const selectAllTypes = () => {
    setSelectedTypeKeys(new Set(trailTypeOptions.map((o) => o.label)));
  };

  const clearAllTypes = () => {
    setSelectedTypeKeys(new Set());
  };

  const handleDownloadCsv = () => {
    if (!selectedMunicipality || !sortedRows.length) return;
    const muni = selectedMunicipality.name.trim().replace(/\s+/g, "_");
    const date = new Date().toISOString().split("T")[0];
    downloadInventoryCsv(
      `trails_inventory_${muni}_${date}${filterSuffix}.csv`,
      sortedRows,
      columns
    );
  };

  const handleDownloadGeoJSONClick = () => {
    if (!filteredTrails.length || !onDownloadGeoJSON) return;
    onDownloadGeoJSON(filteredTrails, filterSuffix);
  };

  const titleMuni = selectedMunicipality?.name
    ? selectedMunicipality.name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "";

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      fullscreen="lg-down"
      centered
      scrollable
      className="TrailsInventoryModal"
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title as="div" className="w-100 mb-0">
          {titleMuni ? (
            <>
              <div className="trails-inventory-muni-title">{titleMuni}</div>
              <div className="trails-inventory-subtitle">Trails inventory</div>
            </>
          ) : (
            <div className="trails-inventory-muni-title">Trails inventory</div>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <p className="small text-muted mb-3">
          Filter by trail type, then use the table and map. CSV and GeoJSON
          downloads include only the segments that match the filters below.
        </p>

        {trailTypeOptions.length > 0 && (
          <div className="mb-3 p-2 border rounded bg-white trails-inventory-filters">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <span className="small fw-semibold">Trail types</span>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 small"
                  onClick={selectAllTypes}
                >
                  Select all
                </Button>
                <span className="text-muted small">·</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 small text-muted"
                  onClick={clearAllTypes}
                >
                  Clear all
                </Button>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-x-4 gap-y-2 trails-inventory-type-checks">
              {trailTypeOptions.map(({ label, count }, idx) => (
                <Form.Check
                  key={label}
                  id={`trails-inv-type-${idx}`}
                  type="checkbox"
                  checked={selectedTypeKeys.has(label)}
                  onChange={() => toggleType(label)}
                  label={
                    <span className="small">
                      {label}{" "}
                      <span className="text-muted">({count})</span>
                    </span>
                  }
                />
              ))}
            </div>
          </div>
        )}

        <div className="row g-3 align-items-stretch">
          <div
            className="col-lg-6 d-flex flex-column trails-inventory-table-col"
            style={{ minHeight: 280 }}
          >
            <div className="small fw-semibold mb-1">
              Trails Inventory table
            </div>
            <div className="flex-grow-1 d-flex flex-column flex-shrink-1 min-h-0 trails-inventory-table-stack">
              {rows.length === 0 ? (
                <div className="p-3 text-muted small border rounded bg-white">
                  {totalCount === 0
                    ? "No trail segments loaded."
                    : "No segments match the selected trail types."}
                </div>
              ) : (
                <>
                  <div className="trails-inventory-table-panel flex-grow-1 bg-white border border-bottom-0 rounded-top">
                    <table className="table table-sm table-striped table-hover trails-inventory-table">
                      <thead className="table-light">
                        <tr>
                          {columns.map((c) => (
                            <th
                              key={c}
                              scope="col"
                              className={`small trails-inventory-sortable${
                                sortColumn === c ? " trails-inventory-sort-active" : ""
                              }`}
                              aria-sort={
                                sortColumn === c
                                  ? sortDirection === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : "none"
                              }
                              tabIndex={0}
                              onClick={() => handleSortColumn(c)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleSortColumn(c);
                                }
                              }}
                            >
                              {columnHeader(c)}
                              {renderSortIcon(c)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((row, i) => (
                          <tr
                            key={`${(inventoryPage - 1) * INVENTORY_PAGE_SIZE + i}-${row._idx}`}
                          >
                            {columns.map((c) => (
                              <td key={c}>{formatCell(c, row[c])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 px-2 py-1 border border-top-0 rounded-bottom bg-light trails-inventory-pagination">
                    <span className="text-muted trails-inventory-pagination-meta mb-0">
                      {pageRangeStart}–{pageRangeEnd} / {sortedRows.length} rows ·{" "}
                      {INVENTORY_PAGE_SIZE} rows/per page
                    </span>
                    <div className="d-flex align-items-center gap-1 flex-wrap justify-content-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline-secondary"
                        className="trails-inventory-page-btn"
                        disabled={inventoryPage <= 1}
                        title="First page"
                        aria-label="First page"
                        onClick={() => setInventoryPage(1)}
                      >
                        <i className="fas fa-angle-double-left" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline-secondary"
                        className="trails-inventory-page-btn"
                        disabled={inventoryPage <= 1}
                        title="Previous page"
                        aria-label="Previous page"
                        onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                      >
                        <i className="fas fa-angle-left" aria-hidden="true" />
                      </Button>
                      <div className="d-flex align-items-center gap-1 px-1">
                        <Form.Control
                          type="number"
                          min={1}
                          max={totalPages}
                          size="sm"
                          className="trails-inventory-page-input"
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          onBlur={applyPageFromInput}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyPageFromInput();
                              e.currentTarget.blur();
                            }
                          }}
                          aria-label="Current page number"
                        />
                        <span className="text-muted trails-inventory-pagination-of">
                          / {totalPages}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline-secondary"
                        className="trails-inventory-page-btn"
                        disabled={inventoryPage >= totalPages}
                        title="Next page"
                        aria-label="Next page"
                        onClick={() =>
                          setInventoryPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        <i className="fas fa-angle-right" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline-secondary"
                        className="trails-inventory-page-btn"
                        disabled={inventoryPage >= totalPages}
                        title="Last page"
                        aria-label="Last page"
                        onClick={() => setInventoryPage(totalPages)}
                      >
                        <i className="fas fa-angle-double-right" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="col-lg-6 d-flex flex-column">
            <div className="small fw-semibold mb-1">Trail map</div>
            <div
              className="border rounded overflow-hidden flex-grow-1 trails-inventory-map-wrap position-relative"
              style={{ minHeight: 280, height: 420 }}
            >
              {MAPBOX_TOKEN && baseLayer?.url ? (
                <>
                  <ReactMapGL
                    ref={mapRef}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle={baseLayer.url}
                    initialViewState={{
                      longitude: -71.0589,
                      latitude: 42.3601,
                      zoom: 8,
                    }}
                    scrollZoom={true}
                    style={{ width: "100%", height: "100%" }}
                    onLoad={fitMap}
                  >
                    <CommunityTrailsProfileLayers
                      showMunicipalityProfileMap={true}
                      intersectedTrails={filteredTrails}
                      hoveredTrail={null}
                      highlightedTrail={null}
                      visibleTrailTypes={mapAllLayersVisible}
                    />
                    <Source id="municipalities" type="geojson" data={massachusettsData}>
                      <MunicipalityMapLayer
                        showMunicipalityProfileMap={true}
                        selectedMunicipality={selectedMunicipality}
                      />
                    </Source>
                    <ScaleControl position="bottom-right" />
                    <NavigationControl className="map_navigation" position="bottom-right" />
                  </ReactMapGL>
                  {selectedMunicipality && (
                    <div
                      className={`trails-inventory-legend-floating${
                        inventoryMapLegendOpen ? " is-open" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="trails-inventory-legend-toggle"
                        aria-expanded={inventoryMapLegendOpen}
                        aria-controls="trails-inventory-legend-panel"
                        id="trails-inventory-legend-toggle"
                        onClick={() =>
                          setInventoryMapLegendOpen((open) => !open)
                        }
                      >
                        <span>Trail types</span>
                        <i
                          className={`fas fa-chevron-${
                            inventoryMapLegendOpen ? "up" : "down"
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                      <Collapse in={inventoryMapLegendOpen}>
                        <div id="trails-inventory-legend-panel">
                          <div className="trails-inventory-legend-collapse-inner">
                            <TrailLegend readOnly hideHeader />
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 text-muted small h-100 d-flex align-items-center">
                  Map preview unavailable (missing Mapbox token or basemap).
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex flex-wrap gap-2 justify-content-between align-items-center trails-inventory-modal-footer">
        <Button
          variant="outline-secondary"
          size="sm"
          className="trails-inventory-footer-btn"
          onClick={onHide}
        >
          Close
        </Button>
        <div className="d-flex flex-wrap align-items-center trails-inventory-download-actions">
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="trails-inventory-csv-download-tooltip">
                Download CSV for all segments that match your current trail type
                filters and sort order 
              </Tooltip>
            }
          >
            <span className="d-inline-block">
              <Button
                variant="success"
                size="sm"
                className="trails-inventory-footer-btn"
                onClick={handleDownloadCsv}
                disabled={!sortedRows.length}
              >
                <i className="fas fa-download me-1" aria-hidden="true" />
                Download CSV
              </Button>
            </span>
          </OverlayTrigger>
          {onDownloadGeoJSON && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="trails-inventory-geojson-download-tooltip">
                  Download GeoJSON for all segments that match your current trail
                  type filters
                </Tooltip>
              }
            >
              <span className="d-inline-block">
                <Button
                  variant="outline-success"
                  size="sm"
                  className="trails-inventory-footer-btn"
                  onClick={handleDownloadGeoJSONClick}
                  disabled={!filteredTrails.length}
                >
                  <i className="fas fa-download me-1" aria-hidden="true" />
                  Download GeoJSON
                </Button>
              </span>
            </OverlayTrigger>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default TrailsInventoryModal;
