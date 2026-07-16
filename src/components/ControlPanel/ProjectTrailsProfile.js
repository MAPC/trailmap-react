import React, { useContext, useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import {
  MAJOR_TRAILS,
  getDisplayName,
  getTrailColor,
  isMajorTrail,
} from "./regionalTrailConfig";
import { LayerContext } from "../../App";
import { downloadTrailGeoJSON } from "../../utils/regionalTrailMetrics";
import { fetchOpenSpaceByTownId } from "../../utils/fetchOpenSpace";
import { sortLengthByTypeItems } from "../Map/constants/trailFacilityTypeLabels";

const VIEW_DETAILS_TOOLTIP = "Click to view details";

const LENGTH_BY_TYPE_GROUPS = [
  { key: "existing", label: "Existing", accentClass: "--existing" },
  {
    key: "planned",
    label: "Planned/Envisioned/Design",
    accentClass: "--planned",
  },
  { key: "gap", label: "Gap", accentClass: "--gap" },
];

const STATUS_BY_SEGMENT = [
  {
    label: "Existing",
    color: "#2774bd",
    milesKey: "existingLengthMiles",
  },
  {
    label: "Under Construction / In Design",
    color: "#6a1b9a",
    milesKey: "underConstructionLengthMiles",
  },
  {
    label: "Envisioned / Planned",
    color: "#c5c9cc",
    milesKey: "envisionedLengthMiles",
  },
  {
    label: "Gap - Facility Type TBD",
    color: "#FF0000",
    milesKey: "gapLengthMiles",
  },
];

const getTrailFeatures = (name, isMajor, majorTrailsData, allTrailsData) => {
  const source = isMajor ? majorTrailsData : allTrailsData;
  const features = source?.features;
  if (!features) return [];

  const trimmed = name.trim();
  const nameKey = isMajor ? "grouped_reg_name" : "reg_name";
  return features.filter((f) => f.properties?.[nameKey]?.includes(trimmed));
};

const isTrailSelected = (name, isMajor, selectedMajorTrails, selectedRegNames) =>
  isMajor
    ? selectedMajorTrails.includes(name)
    : selectedRegNames.has(name);

const isTrailDataLoading = (
  name,
  isMajor,
  selectedMajorTrails,
  selectedRegNames,
  majorTrailsData,
  allTrailsData
) => {
  if (!isTrailSelected(name, isMajor, selectedMajorTrails, selectedRegNames)) {
    return false;
  }
  const source = isMajor ? majorTrailsData : allTrailsData;
  if (!source) return true;
  return getTrailFeatures(name, isMajor, majorTrailsData, allTrailsData).length === 0;
};

const Skeleton = ({ className = "", style = {} }) => (
  <span
    className={`ProjectTrailsProfile__skeleton${className ? ` ${className}` : ""}`}
    style={style}
    aria-hidden="true"
  />
);

const ProjectTrailsProfile = ({
  regNames = [],
  selectedRegNames = new Set(),
  onToggleRegName,
  selectedMajorTrails = [],
  onToggleMajorTrail,
  allTrailMetrics = {},
  detailTrail = null,
  onOpenDetail,
  onCloseDetail,
  onClearAll,
  onZoomToProject,
  allTrailsData = null,
  majorTrailsData = null,
}) => {
  const { showProjectOpenSpace, setShowProjectOpenSpace } = useContext(LayerContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [listTab, setListTab] = useState("major");
  const [detailTab, setDetailTab] = useState("overview");
  const [openSpaceSiteNames, setOpenSpaceSiteNames] = useState([]);
  const [isLoadingOpenSpace, setIsLoadingOpenSpace] = useState(false);
  const [openSpaceError, setOpenSpaceError] = useState(null);

  const detailTownIds = useMemo(() => {
    if (!detailTrail) return "";
    const metrics = allTrailMetrics[detailTrail.name] || {};
    const ids = metrics.municipalityIds || [];
    return ids.length ? ids.join(",") : "";
  }, [detailTrail, allTrailMetrics]);

  useEffect(() => {
    if (!detailTownIds) {
      setOpenSpaceSiteNames([]);
      setIsLoadingOpenSpace(false);
      setOpenSpaceError(null);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingOpenSpace(true);
    setOpenSpaceError(null);

    fetchOpenSpaceByTownId(detailTownIds)
      .then(({ siteNames }) => {
        if (!cancelled) {
          setOpenSpaceSiteNames(siteNames);
        }
      })
      .catch((err) => {
        console.error("Error fetching open space for regional trail:", err);
        if (!cancelled) {
          setOpenSpaceSiteNames([]);
          setOpenSpaceError("Could not load open space data.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingOpenSpace(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detailTownIds]);

  useEffect(() => {
    setShowProjectOpenSpace(false);
    window.dispatchEvent(
      new CustomEvent("toggleProjectOpenSpace", { detail: { show: false } })
    );
  }, [detailTrail?.name, setShowProjectOpenSpace]);

  const dispatchLayerToggle = (eventName, show) => {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(eventName, { detail: { show } }));
    }, 10);
  };

  const handleToggleProjectOpenSpace = (checked) => {
    setShowProjectOpenSpace(checked);
    dispatchLayerToggle("toggleProjectOpenSpace", checked);
  };

  const selectedNames = useMemo(() => {
    const names = [...selectedMajorTrails, ...Array.from(selectedRegNames)];
    return names;
  }, [selectedMajorTrails, selectedRegNames]);

  const filterBySearch = (names, isMajor) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return names;
    return names.filter((name) => {
      const display = getDisplayName(name, isMajor).toLowerCase();
      return display.includes(q) || name.toLowerCase().includes(q);
    });
  };

  const filteredMajor = filterBySearch(MAJOR_TRAILS, true);
  const filteredOther = filterBySearch(
    regNames.filter((name) => !isMajorTrail(name)),
    false
  );
  const isOtherTrailsListLoading = listTab === "other" && regNames.length === 0;

  const trailIsLoading = (name, isMajor) =>
    isTrailDataLoading(
      name,
      isMajor,
      selectedMajorTrails,
      selectedRegNames,
      majorTrailsData,
      allTrailsData
    );

  const renderTrailCardSkeleton = (key) => (
    <div key={key} className="ProjectTrailsProfile__card ProjectTrailsProfile__card--skeleton">
      <Skeleton className="ProjectTrailsProfile__skeletonAccent" />
      <div className="ProjectTrailsProfile__cardBody">
        <Skeleton
          className="ProjectTrailsProfile__skeletonCheck"
          style={{ width: "0.9rem", height: "0.9rem", borderRadius: "3px" }}
        />
        <div className="ProjectTrailsProfile__cardContent">
          <Skeleton
            className="ProjectTrailsProfile__skeletonLine"
            style={{ width: "72%", height: "0.82rem" }}
          />
        </div>
      </div>
      <div className="ProjectTrailsProfile__cardDetail">
        <Skeleton style={{ width: "0.45rem", height: "0.65rem" }} />
      </div>
    </div>
  );

  const renderMetricSkeleton = () => (
    <Skeleton
      className="ProjectTrailsProfile__skeletonMetric"
      style={{ width: "2.5rem", height: "1.2rem", margin: "0 auto" }}
    />
  );

  const renderTrailCard = (name, isMajor, index) => {
    const isSelected = isMajor
      ? selectedMajorTrails.includes(name)
      : selectedRegNames.has(name);
    const color = getTrailColor(name, isMajor, index);
    const displayName = getDisplayName(name, isMajor);

    const handleToggle = (e) => {
      e.stopPropagation();
      if (isSelected) {
        if (isMajor) {
          onToggleMajorTrail?.(name);
        } else {
          onToggleRegName?.(name);
        }
        if (isActiveDetailTrail(name, isMajor)) {
          const remaining = selectedNames.filter((trailName) => trailName !== name);
          if (remaining.length > 0) {
            const nextName = remaining[remaining.length - 1];
            handleOpenTrailDetail(nextName, isMajorTrail(nextName));
          } else {
            onCloseDetail?.();
          }
        }
      } else {
        if (isMajor) {
          onToggleMajorTrail?.(name);
        } else {
          onToggleRegName?.(name);
        }
        handleOpenTrailDetail(name, isMajor);
      }
    };

    const handleOpenDetail = (e) => {
      e.stopPropagation();
      if (!isSelected) {
        if (isMajor) {
          onToggleMajorTrail?.(name);
        } else {
          onToggleRegName?.(name);
        }
      }
      handleOpenTrailDetail(name, isMajor);
    };

    return (
      <div
        key={`${isMajor ? "major" : "other"}-${name}`}
        className={`ProjectTrailsProfile__card${
          isSelected ? " ProjectTrailsProfile__card--selected" : ""
        }`}
      >
        <div
          className="ProjectTrailsProfile__cardAccent"
          style={{ backgroundColor: color }}
        />
        <div className="ProjectTrailsProfile__cardBody">
          <div className="ProjectTrailsProfile__cardCheck">
            <Form.Check
              type="checkbox"
              checked={isSelected}
              onChange={handleToggle}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${displayName}`}
            />
          </div>
          <div
            className="ProjectTrailsProfile__cardContent"
            role="button"
            tabIndex={0}
            title={VIEW_DETAILS_TOOLTIP}
            onClick={handleOpenDetail}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenDetail(e);
              }
            }}
          >
            <p className="ProjectTrailsProfile__cardName">{displayName}</p>
          </div>
        </div>
        <div
          className="ProjectTrailsProfile__cardDetail"
          role="button"
          tabIndex={0}
          title={VIEW_DETAILS_TOOLTIP}
          aria-label={`View details for ${displayName}`}
          onClick={handleOpenDetail}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenDetail(e);
            }
          }}
        >
          <i className="fas fa-chevron-right ProjectTrailsProfile__cardChevron" />
        </div>
      </div>
    );
  };

  const handleOpenTrailDetail = (name, isMajor) => {
    setDetailTab("overview");
    onOpenDetail?.({ name, isMajor });
  };

  const isActiveDetailTrail = (name, isMajor) =>
    detailTrail?.name === name && detailTrail?.isMajor === isMajor;

  const renderSelectionCard = () => {
    if (selectedNames.length === 0) return null;

    return (
      <div className="ProjectTrailsProfile__selectionCard">
        <div className="ProjectTrailsProfile__selectionHeader">
          <span className="ProjectTrailsProfile__selectionTitle">
            <i className="fas fa-crosshairs" aria-hidden="true" />
            {selectedNames.length} trail{selectedNames.length !== 1 ? "s" : ""}{" "}
            on map
          </span>
          <button
            type="button"
            className="ProjectTrailsProfile__clearAll"
            onClick={onClearAll}
          >
            Clear all
          </button>
        </div>

        <div className="ProjectTrailsProfile__selectionPills">
          {selectedNames.map((name, idx) => {
            const isMajor = isMajorTrail(name);
            const color = getTrailColor(name, isMajor, idx);
            const displayName = getDisplayName(name, isMajor);
            const isActive = isActiveDetailTrail(name, isMajor);
            return (
              <div
                key={name}
                className={`ProjectTrailsProfile__selectionPill${
                  isActive ? " ProjectTrailsProfile__selectionPill--active" : ""
                }`}
              >
                <button
                  type="button"
                  className="ProjectTrailsProfile__selectionPillMain"
                  title={VIEW_DETAILS_TOOLTIP}
                  aria-label={`View details for ${displayName}`}
                  onClick={() => handleOpenTrailDetail(name, isMajor)}
                >
                  <span
                    className="ProjectTrailsProfile__selectionPillDot"
                    style={{ backgroundColor: color }}
                  />
                  <span className="ProjectTrailsProfile__selectionPillName">
                    {displayName}
                  </span>
                  {trailIsLoading(name, isMajor) ? (
                    <Skeleton
                      style={{ width: "2.5rem", height: "0.68rem", flexShrink: 0 }}
                    />
                  ) : (
                    <span
                      className="ProjectTrailsProfile__selectionPillMiles"
                    >
                      {allTrailMetrics[name]?.totalLengthMiles ?? "—"} mi
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="ProjectTrailsProfile__selectionPillRemove"
                  aria-label={`Remove ${displayName}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const wasActive = isActiveDetailTrail(name, isMajor);
                    if (isMajor) onToggleMajorTrail?.(name);
                    else onToggleRegName?.(name);
                    if (wasActive) {
                      const remaining = selectedNames.filter(
                        (trailName) => trailName !== name
                      );
                      if (remaining.length > 0) {
                        const nextName = remaining[remaining.length - 1];
                        handleOpenTrailDetail(nextName, isMajorTrail(nextName));
                      } else {
                        onCloseDetail?.();
                      }
                    }
                  }}
                >
                  <i className="fas fa-times" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <>
      <span className="ProjectTrailsProfile__eyebrow">Regional Trails Profile</span>
      <h2 className="ProjectTrailsProfile__heading">Named trail networks</h2>

      <div className="ProjectTrailsProfile__search">
        <i className="fas fa-search" aria-hidden="true" />
        <input
          type="text"
          className="ProjectTrailsProfile__searchInput"
          placeholder="Search trails by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="ProjectTrailsProfile__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={listTab === "major"}
          className={`ProjectTrailsProfile__tab${
            listTab === "major" ? " ProjectTrailsProfile__tab--active" : ""
          }`}
          onClick={() => setListTab("major")}
        >
          Major trails
          <span className="ProjectTrailsProfile__tabBadge">
            {MAJOR_TRAILS.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={listTab === "other"}
          className={`ProjectTrailsProfile__tab${
            listTab === "other" ? " ProjectTrailsProfile__tab--active" : ""
          }`}
          onClick={() => setListTab("other")}
        >
          Other trails
          <span className="ProjectTrailsProfile__tabBadge">
            {regNames.length || "…"}
          </span>
        </button>
      </div>

      {listTab === "other" && (
        <p className="ProjectTrailsProfile__tabHint">
          Smaller named trails and projects across the region. Toggle multiple to
          compare.
        </p>
      )}

      {renderSelectionCard()}

      <div className="ProjectTrailsProfile__list">
        {listTab === "major" ? (
          filteredMajor.length > 0 ? (
            filteredMajor.map((name, idx) => renderTrailCard(name, true, idx))
          ) : (
            <p className="ProjectTrailsProfile__empty">No trails match your search.</p>
          )
        ) : isOtherTrailsListLoading ? (
          Array.from({ length: 6 }, (_, idx) =>
            renderTrailCardSkeleton(`other-skeleton-${idx}`)
          )
        ) : filteredOther.length > 0 ? (
          filteredOther.map((name, idx) => renderTrailCard(name, false, idx))
        ) : (
          <p className="ProjectTrailsProfile__empty">No trails match your search.</p>
        )}
      </div>
    </>
  );

  const renderDetailView = () => {
    const { name, isMajor } = detailTrail;
    
    const metrics = allTrailMetrics[name] || {};
    const displayName = getDisplayName(name, isMajor);
    const color = getTrailColor(name, isMajor);
    const communities = metrics.municipalities || [];
    const statusSegmentMiles = STATUS_BY_SEGMENT.map((item) => ({
      ...item,
      miles: Number(metrics[item.milesKey]) || 0,
    }));
    const statusSegmentTotal = statusSegmentMiles.reduce(
      (sum, item) => sum + item.miles,
      0
    );
    const statusSegmentShares = statusSegmentMiles.map((item) => ({
      ...item,
      share:
        statusSegmentTotal > 0 ? (item.miles / statusSegmentTotal) * 100 : 0,
    }));

    const isDetailLoading = trailIsLoading(name, isMajor);
    const trailFeatures = getTrailFeatures(
      name,
      isMajor,
      majorTrailsData,
      allTrailsData
    );
    const communitySummary =
      communities.length <= 3
        ? communities.join(", ")
        : `${communities.slice(0, 3).join(", ")} and ${communities.length - 3} more`;

    const lengthByType = metrics.lengthByType || [];
    const lengthByTypeGroups = LENGTH_BY_TYPE_GROUPS.map((group) => ({
      ...group,
      items: sortLengthByTypeItems(
        lengthByType.filter((item) => item.category === group.key),
        group.key
      ),
    })).filter((group) => group.items.length > 0);

    return (
      <>
        <button
          type="button"
          className="ProjectTrailsProfile__back"
          onClick={() => {
            setDetailTab("overview");
            onCloseDetail?.();
          }}
        >
          <i className="fas fa-arrow-left" aria-hidden="true" />
          All regional trails
        </button>

        {selectedNames.length > 1 && renderSelectionCard()}

        <div className="ProjectTrailsProfile__detailHeader">
          <div className="ProjectTrailsProfile__detailTitleRow">
            <div
              className="ProjectTrailsProfile__detailAccent"
              style={{ backgroundColor: color }}
            />
            <h2 className="ProjectTrailsProfile__detailTitle">{displayName}</h2>
          </div>
        </div>

        <div className="ProjectTrailsProfile__metrics">
          <div className="ProjectTrailsProfile__metric">
            {isDetailLoading ? (
              renderMetricSkeleton()
            ) : (
              <div className="ProjectTrailsProfile__metricValue">
                {metrics.totalLengthMiles ?? "—"}
              </div>
            )}
            <div className="ProjectTrailsProfile__metricLabel">Miles</div>
          </div>
          <div className="ProjectTrailsProfile__metric">
            {isDetailLoading ? (
              renderMetricSkeleton()
            ) : (
              <div className="ProjectTrailsProfile__metricValue">
                {communities.length}
              </div>
            )}
            <div className="ProjectTrailsProfile__metricLabel">Communities</div>
          </div>
          <div className="ProjectTrailsProfile__metric">
            {isDetailLoading ? (
              renderMetricSkeleton()
            ) : (
              <div className="ProjectTrailsProfile__metricValue">
                {metrics.percentageComplete ?? 0}%
              </div>
            )}
            <div className="ProjectTrailsProfile__metricLabel">Complete</div>
          </div>
        </div>

        <div className="ProjectTrailsProfile__tabs ProjectTrailsProfile__detailTabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={detailTab === "overview"}
            className={`ProjectTrailsProfile__tab${
              detailTab === "overview" ? " ProjectTrailsProfile__tab--active" : ""
            }`}
            onClick={() => setDetailTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={detailTab === "segments"}
            className={`ProjectTrailsProfile__tab${
              detailTab === "segments" ? " ProjectTrailsProfile__tab--active" : ""
            }`}
            onClick={() => setDetailTab("segments")}
          >
            Segments
            {lengthByType.length > 0 && (
              <span className="ProjectTrailsProfile__tabBadge">
                {lengthByType.length}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={detailTab === "communities"}
            className={`ProjectTrailsProfile__tab${
              detailTab === "communities" ? " ProjectTrailsProfile__tab--active" : ""
            }`}
            onClick={() => setDetailTab("communities")}
          >
            Communities
            {communities.length > 0 && (
              <span className="ProjectTrailsProfile__tabBadge">
                {communities.length}
              </span>
            )}
          </button>
        </div>

        <div className="ProjectTrailsProfile__tabPanel">
          {detailTab === "overview" && (
            <>
              {isDetailLoading ? (
                <div className="ProjectTrailsProfile__overviewSkeleton">
                  <Skeleton
                    className="ProjectTrailsProfile__skeletonBlock"
                    style={{ width: "100%", height: "2.6rem", marginBottom: "0.75rem" }}
                  />
                  <div className="ProjectTrailsProfile__quickStats">
                    <Skeleton
                      style={{ width: "5.5rem", height: "1.6rem", borderRadius: "999px" }}
                    />
                    <Skeleton
                      style={{ width: "4.5rem", height: "1.6rem", borderRadius: "999px" }}
                    />
                  </div>
                  <div className="ProjectTrailsProfile__sectionCard">
                    <Skeleton
                      style={{ width: "45%", height: "0.85rem", marginBottom: "0.65rem" }}
                    />
                    <Skeleton
                      style={{ width: "100%", height: "0.45rem", marginBottom: "0.65rem", borderRadius: "999px" }}
                    />
                    <Skeleton
                      style={{ width: "100%", height: "0.72rem", marginBottom: "0.4rem" }}
                    />
                    <Skeleton
                      style={{ width: "100%", height: "0.72rem", marginBottom: "0.4rem" }}
                    />
                    <Skeleton
                      style={{ width: "100%", height: "0.72rem", marginBottom: "0.4rem" }}
                    />
                    <Skeleton style={{ width: "100%", height: "0.72rem" }} />
                  </div>
                </div>
              ) : (
                <>
                  <p className="ProjectTrailsProfile__summaryText">
                    A {metrics.totalLengthMiles ?? "—"}-mile regional trail passing
                    through {communitySummary || "the region"}.
                  </p>

                  <div className="ProjectTrailsProfile__quickStats">
                    <span className="ProjectTrailsProfile__quickStat">
                      <i className="fas fa-map-marker-alt" aria-hidden="true" />
                      {trailFeatures.length} segments
                    </span>
                    <span className="ProjectTrailsProfile__quickStat">
                      <i className="fas fa-share-alt" aria-hidden="true" />
                      {metrics.gaps?.length ?? 0} gaps
                    </span>
                  </div>

                  <div className="ProjectTrailsProfile__sectionCard">
                    <h3 className="ProjectTrailsProfile__sectionTitle">
                      Status by Trail Segments
                    </h3>
                    <div className="ProjectTrailsProfile__segmentBar">
                      {statusSegmentTotal > 0 ? (
                        statusSegmentShares.map((item) => (
                          <div
                            key={item.milesKey}
                            className="ProjectTrailsProfile__segmentBarPart"
                            style={{
                              width: `${item.share}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        ))
                      ) : (
                        <div
                          className="ProjectTrailsProfile__segmentBarPart"
                          style={{ width: "100%", backgroundColor: "#eef1f3" }}
                        />
                      )}
                    </div>
                    <div className="ProjectTrailsProfile__segmentLegend">
                      {STATUS_BY_SEGMENT.map((item) => (
                        <div
                          key={item.milesKey}
                          className="ProjectTrailsProfile__segmentLegendItem"
                        >
                          <span className="ProjectTrailsProfile__segmentLegendLeft">
                            <span
                              className="ProjectTrailsProfile__segmentSwatch"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                          </span>
                          <strong>{metrics[item.milesKey] ?? "0.0"} mi</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {detailTab === "segments" && (
            <div className="ProjectTrailsProfile__segmentsPanel">
              {isDetailLoading ? (
                <div className="ProjectTrailsProfile__sectionCard">
                  <Skeleton
                    style={{ width: "50%", height: "0.85rem", marginBottom: "0.85rem" }}
                  />
                  {Array.from({ length: 3 }, (_, idx) => (
                    <div key={`seg-sk-${idx}`} className="ProjectTrailsProfile__lengthByTypeGroup">
                      <Skeleton
                        style={{ width: "35%", height: "0.72rem", marginBottom: "0.45rem" }}
                      />
                      {Array.from({ length: 2 }, (_, rowIdx) => (
                        <Skeleton
                          key={`seg-sk-${idx}-${rowIdx}`}
                          style={{
                            width: "100%",
                            height: "0.68rem",
                            marginBottom: "0.35rem",
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : lengthByTypeGroups.length > 0 ? (
                <div className="ProjectTrailsProfile__sectionCard">
                  <h3 className="ProjectTrailsProfile__sectionTitle">
                    Length by Type
                  </h3>
                  {lengthByTypeGroups.map((group) => (
                    <div
                      key={group.key}
                      className="ProjectTrailsProfile__lengthByTypeGroup"
                    >
                      <h4
                        className={`ProjectTrailsProfile__lengthByTypeCategory ProjectTrailsProfile__lengthByTypeCategory${group.accentClass}`}
                      >
                        {group.label}
                      </h4>
                      <div className="ProjectTrailsProfile__lengthByTypeList">
                        {group.items.map((item, idx) => (
                          <div
                            key={`${group.key}-${item.type}-${idx}`}
                            className="ProjectTrailsProfile__lengthByTypeItem"
                          >
                            <span className="ProjectTrailsProfile__lengthByTypeName">
                              {item.type}
                            </span>
                            <strong>{item.miles} mi</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ProjectTrailsProfile__empty">
                  No segment data available.
                </p>
              )}
            </div>
          )}

          {detailTab === "communities" && (
            <div className="ProjectTrailsProfile__sectionCard">
              {isDetailLoading ? (
                <>
                  <Skeleton
                    style={{ width: "60%", height: "0.85rem", marginBottom: "0.65rem" }}
                  />
                  <div className="ProjectTrailsProfile__communityTags">
                    {Array.from({ length: 5 }, (_, idx) => (
                      <Skeleton
                        key={`comm-sk-${idx}`}
                        style={{
                          width: `${4.5 + (idx % 3)}rem`,
                          height: "1.4rem",
                          borderRadius: "999px",
                        }}
                      />
                    ))}
                  </div>
                  <Skeleton
                    style={{ width: "100%", height: "2.5rem", marginTop: "0.65rem", borderRadius: "8px" }}
                  />
                  <div className="ProjectTrailsProfile__openSpaceCard">
                    <div
                      className="ProjectTrailsProfile__openSpaceTitleSkeleton"
                      aria-hidden="true"
                    >
                      <Skeleton
                        style={{ width: "92%", height: "0.85rem", marginBottom: "0.4rem" }}
                      />
                      <Skeleton style={{ width: "68%", height: "0.85rem" }} />
                    </div>
                    <div className="ProjectTrailsProfile__openSpaceSwitchRow">
                      <Skeleton
                        style={{ width: "6.5rem", height: "1.4rem", borderRadius: "999px" }}
                      />
                    </div>
                    <ul className="ProjectTrailsProfile__openSpaceList">
                      {Array.from({ length: 4 }, (_, idx) => (
                        <li key={`os-sk-${idx}`}>
                          <Skeleton
                            style={{
                              width: `${70 + (idx % 3) * 8}%`,
                              height: "0.72rem",
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="ProjectTrailsProfile__sectionTitle">
                    Passes through {communities.length} communit
                    {communities.length === 1 ? "y" : "ies"}
                  </h3>
                  <div className="ProjectTrailsProfile__communityTags">
                    {communities.map((c) => (
                      <span key={c} className="ProjectTrailsProfile__communityTag">
                        {c}
                      </span>
                    ))}
                  </div>
                  {communities.length > 0 && (
                    <div className="ProjectTrailsProfile__communityFooter">
                      Towns of {communitySummary}
                    </div>
                  )}

                  <div className="ProjectTrailsProfile__openSpaceCard">
                    {isLoadingOpenSpace ? (
                      <>
                        <div
                          className="ProjectTrailsProfile__openSpaceTitleSkeleton"
                          aria-busy="true"
                          aria-label="Loading protected and recreational open space"
                        >
                          <Skeleton
                            style={{
                              width: "92%",
                              height: "0.85rem",
                              marginBottom: "0.4rem",
                            }}
                          />
                          <Skeleton style={{ width: "68%", height: "0.85rem" }} />
                        </div>
                        <div className="ProjectTrailsProfile__openSpaceSwitchRow">
                          <Skeleton
                            style={{
                              width: "6.5rem",
                              height: "1.4rem",
                              borderRadius: "999px",
                            }}
                          />
                        </div>
                        <ul className="ProjectTrailsProfile__openSpaceList">
                          {Array.from({ length: 4 }, (_, idx) => (
                            <li key={`os-load-sk-${idx}`}>
                              <Skeleton
                                style={{
                                  width: `${70 + (idx % 3) * 8}%`,
                                  height: "0.72rem",
                                }}
                              />
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <>
                        <h3 className="ProjectTrailsProfile__sectionTitle">
                          {openSpaceError ? (
                            "Protected and recreational open space"
                          ) : (
                            <>
                              {openSpaceSiteNames.length} protected and
                              recreational open space{" "}
                              {openSpaceSiteNames.length === 1
                                ? "site"
                                : "sites"}{" "}
                              across {communities.length} communit
                              {communities.length === 1 ? "y" : "ies"}
                            </>
                          )}
                        </h3>

                        <div className="ProjectTrailsProfile__openSpaceSwitchRow">
                          <Form.Check
                            type="switch"
                            id="project-open-space-map-switch"
                            className="ProjectTrailsProfile__openSpaceSwitch"
                            checked={!!showProjectOpenSpace}
                            onChange={(e) =>
                              handleToggleProjectOpenSpace(e.target.checked)
                            }
                            disabled={
                              !!openSpaceError ||
                              openSpaceSiteNames.length === 0 ||
                              !detailTownIds
                            }
                            aria-label="Show protected and recreational open space on map"
                            label="Show on map"
                          />
                        </div>

                        {openSpaceError && (
                          <div className="ProjectTrailsProfile__openSpaceStatus ProjectTrailsProfile__openSpaceStatus--error">
                            {openSpaceError}
                          </div>
                        )}

                        {!openSpaceError && openSpaceSiteNames.length > 0 && (
                          <ul className="ProjectTrailsProfile__openSpaceList">
                            {openSpaceSiteNames.map((siteName) => (
                              <li key={siteName}>{siteName}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="ProjectTrailsProfile__footer">
          <Button
            variant="primary"
            size="sm"
            className="ProjectTrailsProfile__footerPrimary"
            onClick={() => onZoomToProject?.(name)}
          >
            <i className="fas fa-map me-1" aria-hidden="true" />
            View full route on map
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            className="ProjectTrailsProfile__footerDownload"
            onClick={() =>
              downloadTrailGeoJSON({
                regName: name,
                isMajor,
                allTrailsData,
                majorTrailsData,
              })
            }
          >
            <i className="fas fa-download me-1" aria-hidden="true" />
            Download trails
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="ProjectTrailsProfile">
      {detailTrail ? renderDetailView() : renderListView()}
    </div>
  );
};

export default ProjectTrailsProfile;
