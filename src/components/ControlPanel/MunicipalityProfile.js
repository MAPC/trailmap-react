import React, { useState, useEffect, useRef, useMemo } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import massachusettsData from "../../data/massachusetts.json";
import { useNavigate, useLocation } from "react-router-dom";
import TrailsInventoryModal from "../Modals/TrailsInventoryModal";
import { fetchOpenSpaceByTownId } from "../../utils/fetchOpenSpace";
import {
  COMMUNITY_PROFILE_LAYER_LENGTH_MI_KEYS,
  findMunicipalityTrailMetricsByTownId,
  fetchAllMunicipalityTrailMetrics,
} from "../../utils/trailMetricsDashboard";
import {
  mapcTrailLayers,
  getTrailStatus,
  mapcTrailFacilityPairs,
  TRAIL_STATUS,
} from "../Map/constants/mapcTrailLayersConfig";

const milesToFeet = (miles) => (Number(miles) || 0) * 5280;

const emptyTrailStats = () => ({
  totalTrails: 0,
  totalLength: 0,
  existingLength: 0,
  plannedLength: 0,
  proposedLength: 0,
  byType: {},
  density: 0,
  area: 0,
});

/** Build overview stats from the same trail-metrics API row the dashboard uses. */
const buildTrailStatsFromMetricsRow = (row) => {
  if (!row) return emptyTrailStats();

  const stats = emptyTrailStats();
  const existingLength = milesToFeet(row.existingMiles);
  const plannedLength = milesToFeet(row.plannedMiles);
  const proposedLength = milesToFeet(row.proposedMiles);

  stats.existingLength = existingLength;
  stats.plannedLength = plannedLength;
  stats.proposedLength = proposedLength;
  stats.totalLength = existingLength + plannedLength + proposedLength;
  stats.area = Number(row.areaSqMi) || 0;
  stats.density =
    row.density != null ? parseFloat(Number(row.density).toFixed(2)) : 0;

  mapcTrailLayers.forEach((layer) => {
    const key = COMMUNITY_PROFILE_LAYER_LENGTH_MI_KEYS[layer.id];
    const length = key ? milesToFeet(row[key]) : 0;
    stats.byType[layer.name] = {
      count: length > 0 ? 1 : 0,
      length,
      color: layer.color,
      status: layer.status,
      layerId: layer.id,
    };
  });

  return stats;
};

const Skeleton = ({ className = "", style = {} }) => (
  <span
    className={`MunicipalityProfile__skeleton${className ? ` ${className}` : ""}`}
    style={style}
    aria-hidden="true"
  />
);

const MunicipalityProfile = ({ 
  isLoadingTrails = false,
  selectedMunicipality, 
  onMunicipalitySelect,
  municipalityTrails,
  onTrailClick,
  showCommuterRail,
  onToggleCommuterRail,
  showStationLabels,
  onToggleStationLabels,
  showBlueBikeStations,
  onToggleBlueBikeStations,
  showBlueBikeStationLabels,
  onToggleBlueBikeStationLabels,
  showSubwayStations,
  onToggleSubwayStations,
  showSubwayStationLabels,
  onToggleSubwayStationLabels,
  showEnvironmentalJustice,
  onToggleEnvironmentalJustice,
  showOpenSpace,
  onToggleOpenSpace,
  showMuniOpenSpace,
  onToggleMuniOpenSpace,
  showTransitLandStops,
  onToggleTransitLandStops,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [municipalities, setMunicipalities] = useState([]);
  const [trailStats, setTrailStats] = useState(null);
  const [selectedTrailIndex, setSelectedTrailIndex] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showTrailsInventoryModal, setShowTrailsInventoryModal] = useState(false);
  const [downloadOption, setDownloadOption] = useState('both'); // 'existing', 'planned', or 'both'
  const [communitySearch, setCommunitySearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [openSpaceTotalAcres, setOpenSpaceTotalAcres] = useState(0);
  const [isLoadingOpenSpace, setIsLoadingOpenSpace] = useState(false);
  const [openSpaceError, setOpenSpaceError] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [densityRankVersion, setDensityRankVersion] = useState(0);
  const densityRankCacheRef = useRef(new Map());

  // Reset component states when switching back to trail filters
  useEffect(() => {
    const handleResetMunicipalityProfile = () => {
      setTrailStats(null);
      setSelectedTrailIndex(null);
      setShowCompletionModal(false);
      setShowShareMenu(false);
      setShowTrailsInventoryModal(false);
      setOpenSpaceTotalAcres(0);
      setIsLoadingOpenSpace(false);
      setOpenSpaceError(null);
      setIsLoadingMetrics(false);
    };
    
    window.addEventListener('resetMunicipalityProfile', handleResetMunicipalityProfile);
    
    return () => {
      window.removeEventListener('resetMunicipalityProfile', handleResetMunicipalityProfile);
    };
  }, []);

  // Extract municipality list from GeoJSON
  useEffect(() => {
    if (massachusettsData && massachusettsData.features) {
      const muniList = massachusettsData.features
        .map(feature => {
          const townName = feature.properties.town || feature.properties.NAME;
          return townName ? {
            name: townName.toLowerCase(),
            properties: feature.properties,
            geometry: feature.geometry
          } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setMunicipalities(muniList);

      // Check URL parameters for shared municipality
      const urlParams = new URLSearchParams(window.location.search);
      const sharedMuni = urlParams.get('muni');
      const sharedView = urlParams.get('view');
      const showCompletion = urlParams.get('showCompletion');
      
      // Check if we're on communityTrailsProfile path or have view=municipality parameter
      const isCommunityTrailsProfile = location.pathname === '/communityTrailsProfile';
      
      if ((sharedView === 'municipality' || isCommunityTrailsProfile) && sharedMuni && muniList.length > 0) {
        const foundMuni = muniList.find(m => m.name === sharedMuni.toLowerCase());
        if (foundMuni && onMunicipalitySelect) {
          // Small delay to ensure everything is loaded
          setTimeout(() => {
            onMunicipalitySelect(foundMuni);
            
            // If showCompletion parameter is present, open the completion modal
            if (showCompletion === 'true') {
              setTimeout(() => {
                setShowCompletionModal(true);
              }, 1000); // Additional delay to ensure municipality is selected and stats are calculated
              
              // Remove showCompletion from URL after processing
              setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                params.delete('showCompletion');
                const newUrl = params.toString() 
                  ? `${location.pathname}?${params.toString()}`
                  : location.pathname;
                navigate(newUrl, { replace: true });
              }, 1500); // Remove after modal opens
            }
            
            // Update URL to include municipality parameter (but keep it in URL, don't clear)
            if (isCommunityTrailsProfile && !sharedMuni) {
              // If we're on the path but don't have muni param, add it
              navigate(`/communityTrailsProfile?muni=${encodeURIComponent(foundMuni.name)}`, { replace: true });
            }
          }, 500);
        }
      }
    }
  }, []);

  // Reset municipality profile states when a new municipality is selected
  // Track previous municipality to detect actual changes
  const prevMunicipalityRef = useRef(null);
  
  useEffect(() => {
    if (selectedMunicipality) {
      // Only reset if the municipality actually changed (not just re-rendered)
      const municipalityChanged = prevMunicipalityRef.current !== null && 
                                  prevMunicipalityRef.current?.name !== selectedMunicipality.name;
      
      if (municipalityChanged) {
        // Reset all municipality profile states when a new municipality is selected
        setTrailStats(null);
        setSelectedTrailIndex(null);
        setShowCompletionModal(false);
        setShowShareMenu(false);
        setShowTrailsInventoryModal(false);
        setOpenSpaceTotalAcres(0);

        // Close Overview "Show on map" for open space by default
        if (onToggleMuniOpenSpace) onToggleMuniOpenSpace(false);
        window.dispatchEvent(
          new CustomEvent("toggleMuniOpenSpace", { detail: { show: false } })
        );
        
        // Reset buffer analysis when selecting a new municipality
        window.dispatchEvent(new CustomEvent('resetBufferAnalysis'));
        
      }
      
      // Update the ref to current municipality
      prevMunicipalityRef.current = selectedMunicipality;
    } else if (prevMunicipalityRef.current !== null) {
      setTrailStats(null);
      setSelectedTrailIndex(null);
      setShowCompletionModal(false);
      setShowShareMenu(false);
      setShowTrailsInventoryModal(false);
      setOpenSpaceTotalAcres(0);
      if (onToggleMuniOpenSpace) onToggleMuniOpenSpace(false);
      window.dispatchEvent(
        new CustomEvent("toggleMuniOpenSpace", { detail: { show: false } })
      );
      window.dispatchEvent(new CustomEvent('resetBufferAnalysis'));
      prevMunicipalityRef.current = null;
    }
  }, [selectedMunicipality, onToggleMuniOpenSpace]);

  // Fetch open space GIS_ACRES total when a municipality is selected
  useEffect(() => {
    const townId = selectedMunicipality?.properties?.town_id;
    if (townId == null) {
      setOpenSpaceTotalAcres(0);
      setIsLoadingOpenSpace(false);
      setOpenSpaceError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingOpenSpace(true);
    setOpenSpaceError(null);

    fetchOpenSpaceByTownId(townId)
      .then(({ totalGisAcres }) => {
        if (!cancelled) {
          setOpenSpaceTotalAcres(Number(totalGisAcres) || 0);
        }
      })
      .catch((err) => {
        console.error("Error fetching open space for municipality:", err);
        if (!cancelled) {
          setOpenSpaceTotalAcres(0);
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
  }, [selectedMunicipality?.properties?.town_id]);

  // Overview metrics come from the same trail-metrics API as the dashboard.
  // Map trail geometries still come from FeatureServer intersection separately.
  useEffect(() => {
    const townId = selectedMunicipality?.properties?.town_id;
    if (!selectedMunicipality || townId == null) {
      setTrailStats(null);
      setIsLoadingMetrics(false);
      return;
    }

    let cancelled = false;
    setIsLoadingMetrics(true);
    setTrailStats(null);

    findMunicipalityTrailMetricsByTownId(townId)
      .then((row) => {
        if (cancelled) return;
        setTrailStats(buildTrailStatsFromMetricsRow(row));
      })
      .catch((error) => {
        console.error("Error loading municipality trail metrics:", error);
        if (!cancelled) {
          setTrailStats(emptyTrailStats());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMetrics(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMunicipality?.properties?.town_id, selectedMunicipality?.name]);

  // Seed density rankings from the full statewide metrics table once.
  useEffect(() => {
    let cancelled = false;

    fetchAllMunicipalityTrailMetrics()
      .then((rows) => {
        if (cancelled) return;
        rows.forEach((row) => {
          const slug = String(row.municipalityName || "")
            .trim()
            .toLowerCase();
          if (slug && row.density != null) {
            densityRankCacheRef.current.set(slug, row.density);
          }
        });
        setDensityRankVersion((version) => version + 1);
      })
      .catch(() => {
        // Ranking is optional; overview metrics still load per municipality.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const capitalizeWords = (str) => {
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const selectMunicipality = (muni) => {
    if (muni) {
      onMunicipalitySelect(muni);
      setCommunitySearch(capitalizeWords(muni.name));
      setPickerOpen(false);
      if (location.pathname === '/communityTrailsProfile') {
        navigate(`/communityTrailsProfile?muni=${encodeURIComponent(muni.name)}`, { replace: true });
      }
    } else {
      onMunicipalitySelect(null);
      setCommunitySearch("");
      setPickerOpen(false);
      if (location.pathname === '/communityTrailsProfile') {
        navigate('/communityTrailsProfile', { replace: true });
      }
    }
  };

  useEffect(() => {
    if (selectedMunicipality) {
      setCommunitySearch(capitalizeWords(selectedMunicipality.name));
    } else if (!pickerOpen) {
      setCommunitySearch("");
    }
  }, [selectedMunicipality, pickerOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerOpen(false);
        if (selectedMunicipality) {
          setCommunitySearch(capitalizeWords(selectedMunicipality.name));
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedMunicipality]);

  const filteredMunicipalities = municipalities.filter((muni) => {
    const query = communitySearch.trim().toLowerCase();
    if (!query) return true;
    return (
      muni.name.includes(query) ||
      capitalizeWords(muni.name).toLowerCase().includes(query)
    );
  });

  const pickerRef = useRef(null);

  useEffect(() => {
    if (selectedMunicipality?.name && trailStats?.density != null) {
      densityRankCacheRef.current.set(
        selectedMunicipality.name,
        trailStats.density
      );
    }
  }, [selectedMunicipality?.name, trailStats?.density]);

  useEffect(() => {
    if (selectedMunicipality) {
      setActiveTab("overview");
    }
  }, [selectedMunicipality?.name]);

  const getMuniPopulation = (properties) => {
    if (!properties) return null;
    const pop =
      properties.pop2020 ?? properties.pop2010 ?? properties.pop2000 ?? null;
    return pop != null ? Number(pop).toLocaleString("en-US") : null;
  };

  const regionRank = useMemo(() => {
    if (!selectedMunicipality?.name || trailStats?.density == null) {
      return null;
    }
    const sorted = Array.from(densityRankCacheRef.current.entries()).sort(
      ([, a], [, b]) => b - a
    );
    const idx = sorted.findIndex(([name]) => name === selectedMunicipality.name);
    return idx >= 0 ? idx + 1 : null;
  }, [selectedMunicipality?.name, trailStats?.density, densityRankVersion]);

 

  const renderCommunityPicker = (compact = false) => (
    <div
      className={`MunicipalityProfile__picker${
        compact ? " MunicipalityProfile__picker--compact" : ""
      }${pickerOpen ? " MunicipalityProfile__picker--open" : ""}`}
      ref={pickerRef}
    >
      <i className="fas fa-search MunicipalityProfile__picker-icon" aria-hidden="true" />
      <input
        type="text"
        className="MunicipalityProfile__picker-input"
        placeholder="Select a community..."
        value={communitySearch}
        aria-expanded={pickerOpen}
        aria-controls="municipality-picker-list"
        aria-autocomplete="list"
        onChange={(e) => {
          setCommunitySearch(e.target.value);
          setPickerOpen(true);
        }}
        onFocus={() => setPickerOpen(true)}
      />
      <button
        type="button"
        className="MunicipalityProfile__picker-chevron"
        aria-label="Toggle community list"
        onClick={() => setPickerOpen((open) => !open)}
      >
        <i className={`fas fa-chevron-${pickerOpen ? "up" : "down"}`} aria-hidden="true" />
      </button>
      {pickerOpen && (
        <ul
          id="municipality-picker-list"
          className="MunicipalityProfile__picker-list"
          role="listbox"
        >
          {filteredMunicipalities.length > 0 ? (
            filteredMunicipalities.map((muni) => (
              <li key={muni.name}>
                <button
                  type="button"
                  className="MunicipalityProfile__picker-option"
                  role="option"
                  aria-selected={selectedMunicipality?.name === muni.name}
                  onClick={() => selectMunicipality(muni)}
                >
                  {capitalizeWords(muni.name)}
                </button>
              </li>
            ))
          ) : (
            <li className="MunicipalityProfile__picker-empty">No communities found</li>
          )}
        </ul>
      )}
    </div>
  );

  const activeMapLayerCount = [
    showCommuterRail,
    showOpenSpace,
    showEnvironmentalJustice,
  ].filter(Boolean).length;

  const densityTooltip = (
    <Tooltip id="density-overview-tooltip" className="MunicipalityProfile__tooltip">
      Trail Density = Existing Trails Length (miles) / Municipality Area (sq miles)
    </Tooltip>
  );

  const renderOverviewSkeleton = () => (
    <div className="MunicipalityProfile__summaryCard MunicipalityProfile__summaryCard--skeleton">
      <div className="MunicipalityProfile__trailOverview">
        <div className="MunicipalityProfile__trailOverviewSection">
          <Skeleton
            style={{ width: "5.5rem", height: "0.62rem", marginBottom: "0.45rem" }}
          />
          <Skeleton
            style={{ width: "4.5rem", height: "1.35rem", marginBottom: "0.35rem" }}
          />
          <Skeleton
            style={{ width: "6rem", height: "0.62rem", marginBottom: "0.75rem" }}
          />
          <Skeleton
            className="MunicipalityProfile__skeletonBar"
            style={{ width: "100%", height: "0.55rem", marginBottom: "0.75rem" }}
          />
          <div className="MunicipalityProfile__trailBreakdown">
            <div className="MunicipalityProfile__trailBreakdownItem">
              <Skeleton
                style={{ width: "0.55rem", height: "0.55rem", borderRadius: "2px" }}
              />
              <div className="MunicipalityProfile__trailBreakdownCopy">
                <Skeleton style={{ width: "3.5rem", height: "0.62rem" }} />
                <Skeleton
                  style={{ width: "2.75rem", height: "0.72rem", marginTop: "0.2rem" }}
                />
              </div>
            </div>
            <div className="MunicipalityProfile__trailBreakdownItem">
              <Skeleton
                style={{ width: "0.55rem", height: "0.55rem", borderRadius: "2px" }}
              />
              <div className="MunicipalityProfile__trailBreakdownCopy">
                <Skeleton style={{ width: "3.25rem", height: "0.62rem" }} />
                <Skeleton
                  style={{ width: "2.75rem", height: "0.72rem", marginTop: "0.2rem" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="MunicipalityProfile__trailOverviewDivider" aria-hidden="true" />

        <div className="MunicipalityProfile__trailOverviewSection MunicipalityProfile__trailOverviewSection--density">
          <Skeleton
            style={{ width: "4.5rem", height: "0.62rem", marginBottom: "0.45rem" }}
          />
          <Skeleton
            style={{ width: "3.75rem", height: "1.35rem", marginBottom: "0.35rem" }}
          />
          <Skeleton style={{ width: "8.5rem", height: "0.62rem" }} />
        </div>
      </div>

      <Skeleton
        className="MunicipalityProfile__skeletonButton"
        style={{ width: "100%", height: "2rem", marginTop: "0.85rem" }}
      />
    </div>
  );

  const renderOverviewActionsSkeleton = () => (
    <div className="MunicipalityProfile__actionsSkeleton">
      <Skeleton className="MunicipalityProfile__skeletonButton" style={{ width: "100%", height: "2rem" }} />
      {location.pathname === "/communityTrailsProfile" && (
        <Skeleton className="MunicipalityProfile__skeletonButton" style={{ width: "100%", height: "2rem" }} />
      )}
      <Skeleton style={{ width: "7rem", height: "0.72rem", marginTop: "0.15rem" }} />
      <Skeleton className="MunicipalityProfile__skeletonButton" style={{ width: "100%", height: "2rem" }} />
      <Skeleton className="MunicipalityProfile__skeletonButton" style={{ width: "100%", height: "2.25rem" }} />
    </div>
  );

  const renderOverviewTrailStats = (stats) => {
    const existingLength = Number(stats.existingLength) || 0;
    const plannedLength = Number(stats.plannedLength) || 0;
    const proposedLength = Number(stats.proposedLength) || 0;
    const totalLength = existingLength + plannedLength + proposedLength;
    const existingShare =
      totalLength > 0 ? (existingLength / totalLength) * 100 : 0;
    const plannedShare =
      totalLength > 0 ? (plannedLength / totalLength) * 100 : 0;
    const proposedShare =
      totalLength > 0 ? (proposedLength / totalLength) * 100 : 0;

    return (
      <div className="MunicipalityProfile__summaryCard">
        <div className="MunicipalityProfile__trailOverview">
          <div className="MunicipalityProfile__trailOverviewSection">
            <div className="MunicipalityProfile__trailOverviewHeading">
              <span className="MunicipalityProfile__trailOverviewEyebrow">
                Total trail length
              </span>
              <span className="MunicipalityProfile__trailOverviewTotal">
                {formatLength(stats.totalLength)} mi
              </span>
              <span className="MunicipalityProfile__trailOverviewHint">
                existing + planned + proposed
              </span>
            </div>

            <div
              className="MunicipalityProfile__trailBar"
              role="img"
              aria-label={`Existing trails ${formatLength(existingLength)} miles, planned trails ${formatLength(plannedLength)} miles, proposed trails ${formatLength(proposedLength)} miles`}
            >
              {totalLength > 0 ? (
                <>
                  <div
                    className="MunicipalityProfile__trailBarSegment MunicipalityProfile__trailBarSegment--existing"
                    style={{ width: `${existingShare}%` }}
                  />
                  <div
                    className="MunicipalityProfile__trailBarSegment MunicipalityProfile__trailBarSegment--planned"
                    style={{ width: `${plannedShare}%` }}
                  />
                  <div
                    className="MunicipalityProfile__trailBarSegment MunicipalityProfile__trailBarSegment--proposed"
                    style={{ width: `${proposedShare}%` }}
                  />
                </>
              ) : (
                <div className="MunicipalityProfile__trailBarSegment MunicipalityProfile__trailBarSegment--empty" />
              )}
            </div>

            <div className="MunicipalityProfile__trailBreakdown MunicipalityProfile__trailBreakdown--three">
              <div className="MunicipalityProfile__trailBreakdownItem">
                <span
                  className="MunicipalityProfile__trailBreakdownSwatch MunicipalityProfile__trailBreakdownSwatch--existing"
                  aria-hidden="true"
                />
                <div className="MunicipalityProfile__trailBreakdownCopy">
                  <span className="MunicipalityProfile__trailBreakdownLabel">Existing</span>
                  <span className="MunicipalityProfile__trailBreakdownValue">
                    {formatLength(existingLength)} mi
                  </span>
                </div>
              </div>
              <div className="MunicipalityProfile__trailBreakdownItem">
                <span
                  className="MunicipalityProfile__trailBreakdownSwatch MunicipalityProfile__trailBreakdownSwatch--planned"
                  aria-hidden="true"
                />
                <div className="MunicipalityProfile__trailBreakdownCopy">
                  <span className="MunicipalityProfile__trailBreakdownLabel">Planned</span>
                  <span className="MunicipalityProfile__trailBreakdownValue">
                    {formatLength(plannedLength)} mi
                  </span>
                </div>
              </div>
              <div className="MunicipalityProfile__trailBreakdownItem">
                <span
                  className="MunicipalityProfile__trailBreakdownSwatch MunicipalityProfile__trailBreakdownSwatch--proposed"
                  aria-hidden="true"
                />
                <div className="MunicipalityProfile__trailBreakdownCopy">
                  <span className="MunicipalityProfile__trailBreakdownLabel">Proposed</span>
                  <span className="MunicipalityProfile__trailBreakdownValue">
                    {formatLength(proposedLength)} mi
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="MunicipalityProfile__trailOverviewDivider" aria-hidden="true" />

          <div className="MunicipalityProfile__trailOverviewSection MunicipalityProfile__trailOverviewSection--density">
            <div className="MunicipalityProfile__trailDensityHeader">
              <span className="MunicipalityProfile__trailOverviewEyebrow">
                Trail density
              </span>
              <OverlayTrigger placement="top" overlay={densityTooltip}>
                <span
                  className="MunicipalityProfile__summaryInfo"
                  role="button"
                  tabIndex={0}
                >
                  <i className="fas fa-question-circle" aria-hidden="true" />
                </span>
              </OverlayTrigger>
            </div>
            <span className="MunicipalityProfile__trailDensityValue">
              {stats.density} mi/mi²
            </span>
            <span className="MunicipalityProfile__trailOverviewHint">
              existing trails per sq mile
            </span>
          </div>
        </div>

        <Button
          variant="outline-primary"
          size="sm"
          className="w-100 MunicipalityProfile__summaryButton"
          onClick={() => setShowCompletionModal(true)}
        >
          View Trail Network Details
        </Button>
      </div>
    );
  };

  const renderOpenSpaceOverview = () => {
    const handleToggle = (checked) => {
      if (onToggleMuniOpenSpace) onToggleMuniOpenSpace(checked);
      dispatchLayerToggle("toggleMuniOpenSpace", checked);
    };

    return (
      <div className="MunicipalityProfile__openSpaceCard">
        <div className="MunicipalityProfile__openSpaceHeader">
          <span className="MunicipalityProfile__trailOverviewEyebrow">
            Protected and recreational open space acres within{" "}
            {selectedMunicipality
              ? capitalizeWords(selectedMunicipality.name)
              : "this municipality"}
          </span>
          <div className="MunicipalityProfile__openSpaceCount">
            {isLoadingOpenSpace
              ? "…"
              : openSpaceError
                ? "—"
                : openSpaceTotalAcres.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
          </div>
        </div>

        <div className="MunicipalityProfile__openSpaceSwitchRow">
          <Form.Check
            type="switch"
            id="overview-muni-open-space-map-switch"
            className="MunicipalityProfile__openSpaceSwitch"
            checked={!!showMuniOpenSpace}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={
              isLoadingOpenSpace ||
              !!openSpaceError ||
              openSpaceTotalAcres <= 0
            }
            aria-label="Show municipality protected and recreational open space on map"
            label="Show on map"
          />
        </div>

        {isLoadingOpenSpace && (
          <div className="MunicipalityProfile__openSpaceStatus">
            Loading open space…
          </div>
        )}

        {!isLoadingOpenSpace && openSpaceError && (
          <div className="MunicipalityProfile__openSpaceStatus MunicipalityProfile__openSpaceStatus--error">
            {openSpaceError}
          </div>
        )}

        {!isLoadingOpenSpace && !openSpaceError && openSpaceTotalAcres <= 0 && (
          <div className="MunicipalityProfile__openSpaceStatus">
            No protected and recreational open space found.
          </div>
        )}
      </div>
    );
  };

  const dispatchLayerToggle = (eventName, show) => {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(eventName, { detail: { show } }));
    }, 10);
  };

  const renderMapLayerRow = (id, label, checked, onToggle, nested = false) => (
    <div
      key={id}
      className={`MunicipalityProfile__mapLayerRow${
        nested ? " MunicipalityProfile__mapLayerRow--nested" : ""
      }`}
    >
      <span className="MunicipalityProfile__mapLayerLabel">{label}</span>
      <Form.Check
        type="switch"
        id={`map-layer-${id}`}
        className="MunicipalityProfile__mapLayerSwitch"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={label}
      />
    </div>
  );

  const renderMapLayersTab = () => (
    <div className="MunicipalityProfile__mapLayers">
      <div className="MunicipalityProfile__mapLayersCard">
        <div className="MunicipalityProfile__mapLayersCardHeader">
          <h3 className="MunicipalityProfile__mapLayersCardTitle">
            Map context layers
          </h3>
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="map-context-layers-tooltip" className="MunicipalityProfile__tooltip">
                Context layers help you understand trails in relation to transit,
                open space, and environmental justice areas.
              </Tooltip>
            }
          >
            <button
              type="button"
              className="MunicipalityProfile__mapLayersInfo"
              aria-label="About map context layers"
            >
              <i className="fas fa-info-circle" aria-hidden="true" />
            </button>
          </OverlayTrigger>
        </div>

        <div className="MunicipalityProfile__mapLayersList">
          {renderMapLayerRow(
            "commuter-rail",
            "Commuter rail & stations",
            showCommuterRail,
            (checked) => {
              if (onToggleCommuterRail) onToggleCommuterRail(checked);
              if (!checked && onToggleStationLabels) onToggleStationLabels(false);
              dispatchLayerToggle("toggleCommuterRail", checked);
              if (!checked) {
                window.dispatchEvent(
                  new CustomEvent("toggleStationLabels", { detail: { show: false } })
                );
              }
            }
          )}

          {showCommuterRail &&
            renderMapLayerRow(
              "station-labels",
              "Show label",
              !!showStationLabels,
              (checked) => {
                if (onToggleStationLabels) onToggleStationLabels(checked);
                window.dispatchEvent(
                  new CustomEvent("toggleStationLabels", {
                    detail: { show: checked },
                  })
                );
              },
              true
            )}

          {renderMapLayerRow(
            "open-space",
            "Protected and recreational open space",
            showOpenSpace,
            (checked) => {
              if (onToggleOpenSpace) onToggleOpenSpace(checked);
              dispatchLayerToggle("toggleOpenSpace", checked);
            }
          )}

          {renderMapLayerRow(
            "environmental-justice",
            "Environmental justice areas",
            showEnvironmentalJustice,
            (checked) => {
              if (onToggleEnvironmentalJustice) {
                onToggleEnvironmentalJustice(checked);
              }
              dispatchLayerToggle("toggleEnvironmentalJustice", checked);
            }
          )}

          {renderMapLayerRow(
            "blue-bike",
            "Blue bike stations",
            showBlueBikeStations,
            (checked) => {
              if (onToggleBlueBikeStations) onToggleBlueBikeStations(checked);
              if (!checked && onToggleBlueBikeStationLabels) {
                onToggleBlueBikeStationLabels(false);
              }
              dispatchLayerToggle("toggleBlueBikeStations", checked);
              if (!checked) {
                window.dispatchEvent(
                  new CustomEvent("toggleBlueBikeStationLabels", {
                    detail: { show: false },
                  })
                );
              }
            }
          )}

          {showBlueBikeStations &&
            renderMapLayerRow(
              "blue-bike-station-labels",
              "Show label",
              !!showBlueBikeStationLabels,
              (checked) => {
                if (onToggleBlueBikeStationLabels) {
                  onToggleBlueBikeStationLabels(checked);
                }
                window.dispatchEvent(
                  new CustomEvent("toggleBlueBikeStationLabels", {
                    detail: { show: checked },
                  })
                );
              },
              true
            )}

          {renderMapLayerRow(
            "subway",
            "T-stops",
            showSubwayStations,
            (checked) => {
              if (onToggleSubwayStations) onToggleSubwayStations(checked);
              if (!checked && onToggleSubwayStationLabels) {
                onToggleSubwayStationLabels(false);
              }
              dispatchLayerToggle("toggleSubwayStations", checked);
              if (!checked) {
                window.dispatchEvent(
                  new CustomEvent("toggleSubwayStationLabels", {
                    detail: { show: false },
                  })
                );
              }
            }
          )}

          {showSubwayStations &&
            renderMapLayerRow(
              "subway-station-labels",
              "Show label",
              !!showSubwayStationLabels,
              (checked) => {
                if (onToggleSubwayStationLabels) {
                  onToggleSubwayStationLabels(checked);
                }
                window.dispatchEvent(
                  new CustomEvent("toggleSubwayStationLabels", {
                    detail: { show: checked },
                  })
                );
              },
              true
            )}

          {renderMapLayerRow(
            "transit-stops",
            "Transit stops",
            showTransitLandStops,
            (checked) => {
              if (onToggleTransitLandStops) onToggleTransitLandStops(checked);
              dispatchLayerToggle("toggleTransitLandStops", checked);
            }
          )}

        </div>
      </div>
    </div>
  );

  const formatLength = (feet) => {
    // Convert feet to miles and format with 2 decimal places
    const numFeet = Number(feet) || 0;
    const miles = numFeet / 5280; // 1 mile = 5280 feet
    return parseFloat(miles.toFixed(2)).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const getTrailTypeStatusRows = (stats) => {
    if (!stats?.byType) return [];

    return mapcTrailFacilityPairs
      .map(({ existingId, otherIds, label }) => {
        const layerIds = [existingId, ...otherIds];
        const lengths = {
          [TRAIL_STATUS.EXISTING]: 0,
          [TRAIL_STATUS.PLANNED]: 0,
          [TRAIL_STATUS.PROPOSED]: 0,
        };
        let color = "#888";

        layerIds.forEach((layerId) => {
          const layer = mapcTrailLayers.find((l) => l.id === layerId);
          if (!layer) return;

          const length = stats.byType[layer.name]?.length || 0;
          lengths[layer.status] += length;
          if (layer.status === TRAIL_STATUS.EXISTING || color === "#888") {
            color = layer.color;
          }
        });

        const total =
          lengths[TRAIL_STATUS.EXISTING] +
          lengths[TRAIL_STATUS.PLANNED] +
          lengths[TRAIL_STATUS.PROPOSED];

        return {
          label,
          color,
          total,
          existing: lengths[TRAIL_STATUS.EXISTING],
          planned: lengths[TRAIL_STATUS.PLANNED],
          proposed: lengths[TRAIL_STATUS.PROPOSED],
          rate: total > 0 ? (lengths[TRAIL_STATUS.EXISTING] / total) * 100 : 0,
        };
      })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  };

  const trailTypeStatusRows = getTrailTypeStatusRows(trailStats);

  const runTrailGeoJSONDownloads = (trails, option = 'both', filenameSuffix = '') => {
    if (!selectedMunicipality || !trails || trails.length === 0) {
      return;
    }

    const existingOnly = trails.filter(
      (trail) => getTrailStatus(trail) === TRAIL_STATUS.EXISTING
    );
    const plannedOnly = trails.filter(
      (trail) => getTrailStatus(trail) === TRAIL_STATUS.PLANNED
    );
    const proposedOnly = trails.filter(
      (trail) => getTrailStatus(trail) === TRAIL_STATUS.PROPOSED
    );
    // "planned" download option historically meant all non-existing; keep both planned + proposed
    const nonExisting = [...plannedOnly, ...proposedOnly];

    const existingGeoJSON = {
      type: "FeatureCollection",
      features: existingOnly.map(trail => trail.feature || {
        type: "Feature",
        geometry: trail.geometry,
        properties: trail.attributes || {}
      })
    };

    const plannedGeoJSON = {
      type: "FeatureCollection",
      features: nonExisting.map(trail => trail.feature || {
        type: "Feature",
        geometry: trail.geometry,
        properties: trail.attributes || {}
      })
    };

    const muniName = capitalizeWords(selectedMunicipality.name).replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    const suffix = filenameSuffix || '';

    let downloadedCount = 0;

    if (option === 'existing' || option === 'both') {
      if (existingGeoJSON.features.length > 0) {
        const existingBlob = new Blob([JSON.stringify(existingGeoJSON, null, 2)], { type: 'application/json' });
        const existingUrl = URL.createObjectURL(existingBlob);
        const existingLink = document.createElement('a');
        existingLink.href = existingUrl;
        existingLink.download = `${muniName}_existing_trails_${timestamp}${suffix}.geojson`;
        document.body.appendChild(existingLink);
        existingLink.click();
        document.body.removeChild(existingLink);
        URL.revokeObjectURL(existingUrl);
        downloadedCount++;
      }
    }

    if (option === 'planned' || option === 'both') {
      if (plannedGeoJSON.features.length > 0) {
        const plannedBlob = new Blob([JSON.stringify(plannedGeoJSON, null, 2)], { type: 'application/json' });
        const plannedUrl = URL.createObjectURL(plannedBlob);
        const plannedLink = document.createElement('a');
        plannedLink.href = plannedUrl;
        plannedLink.download = `${muniName}_planned_trails_${timestamp}${suffix}.geojson`;
        document.body.appendChild(plannedLink);
        plannedLink.click();
        document.body.removeChild(plannedLink);
        URL.revokeObjectURL(plannedUrl);
        downloadedCount++;
      }
    }

    if (downloadedCount > 0) {
      const toast = document.createElement('div');
      const message = option === 'both'
        ? 'Trail data downloaded successfully!'
        : option === 'existing'
        ? 'Existing trails downloaded successfully!'
        : 'Planned/Proposed trails downloaded successfully!';

      toast.innerHTML = `
        <div style="
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          z-index: 999999 !important;
          background-color: #28a745;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        ">
          <i class="fas fa-check-circle"></i>
          ${message}
        </div>
      `;

      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    }
  };

  const handleDownloadTrailsData = (option = downloadOption) => {
    runTrailGeoJSONDownloads(municipalityTrails, option, '');
  };

  const handleShareProfile = async () => {
    const baseUrl = window.location.origin + window.location.pathname;
    // Get current URL parameters
    const currentParams = new URLSearchParams(window.location.search);
    
    // Ensure muni parameter is set if municipality is selected
    if (selectedMunicipality?.name) {
      currentParams.set('muni', selectedMunicipality.name);
    }
    
    // Add showCompletion=true to the share URL so the modal opens when shared
    currentParams.set('showCompletion', 'true');
    
    // Build share URL with showCompletion parameter
    const shareUrl = `${baseUrl}?${currentParams.toString()}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      
      // Create toast element and append to body
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          z-index: 999999 !important;
          background-color: #28a745;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        ">
          <i class="fas fa-check-circle"></i>
          Link copied to clipboard!
        </div>
      `;
      
      document.body.appendChild(toast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
      
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // Show toast for fallback too
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          z-index: 999999 !important;
          background-color: #28a745;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        ">
          <i class="fas fa-check-circle"></i>
          Link copied to clipboard!
        </div>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    }
  };

  const isOverviewLoading =
    isLoadingMetrics || (selectedMunicipality && trailStats === null);

  return (
    <div
      className={`MunicipalityProfile${
        selectedMunicipality ? " MunicipalityProfile--hasSelection" : ""
      }`}
    >
      <div className="MunicipalityProfile__topBar MunicipalityProfile__topBar--stacked">
        <span className="MunicipalityProfile__eyebrow">Community Profile</span>
        {renderCommunityPicker(false)}
      </div>

      {!selectedMunicipality ? (
        <div className="MunicipalityProfile__empty">
          <h2 className="MunicipalityProfile__heading">Explore a municipality</h2>
          <div className="MunicipalityProfile__empty-icon" aria-hidden="true">
            <i className="fas fa-users" />
          </div>
          <p className="MunicipalityProfile__empty-text">
            Pick a community to see its trail miles, completion, density, and regional context.
          </p>
        </div>
      ) : (
        <div className="MunicipalityProfile__selected">
          <div className="MunicipalityProfile__header">
            <div className="MunicipalityProfile__titleRow">
              <h2 className="MunicipalityProfile__muniName">
                {capitalizeWords(selectedMunicipality.name)}
              </h2>
            </div>
          </div>

          <div className="MunicipalityProfile__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overview"}
              className={`MunicipalityProfile__tab${
                activeTab === "overview" ? " MunicipalityProfile__tab--active" : ""
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "mapLayers"}
              className={`MunicipalityProfile__tab${
                activeTab === "mapLayers" ? " MunicipalityProfile__tab--active" : ""
              }`}
              onClick={() => setActiveTab("mapLayers")}
            >
              Map layers
              {activeMapLayerCount > 0 && (
                <span className="MunicipalityProfile__tabBadge">
                  {activeMapLayerCount}
                </span>
              )}
            </button>
          </div>

          <div className="MunicipalityProfile__tabPanel">
            {activeTab === "overview" && (
              <div className="MunicipalityProfile__content">
                {isOverviewLoading ? (
                  <>
                    {renderOverviewSkeleton()}
                    {renderOverviewActionsSkeleton()}
                  </>
                ) : (
                  <>
                    {trailStats && renderOverviewTrailStats(trailStats)}
                    {renderOpenSpaceOverview()}

                    {isLoadingTrails ? (
                      <div className="alert alert-info small p-2 mb-2">
                        Loading trail geometries for the map…
                      </div>
                    ) : municipalityTrails && municipalityTrails.length > 0 ? (
                      <>
                        <div className="mb-2">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent("openBufferAnalysis"));
                            }}
                          >
                            Buffer Analysis Tool
                          </Button>
                        </div>
                        {location.pathname === "/communityTrailsProfile" && (
                          <div className="mb-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="w-100"
                              onClick={() => setShowTrailsInventoryModal(true)}
                            >
                              Trails inventory (table & map)
                            </Button>
                          </div>
                        )}
                        <div className="mb-2">
                          <Form.Label className="small fw-semibold d-block mb-2">
                            Download Trail Data
                          </Form.Label>
                          <Form.Select
                            size="sm"
                            value={downloadOption}
                            onChange={(e) => setDownloadOption(e.target.value)}
                            className="mb-2"
                          >
                            <option value="both">Both (Existing + Planned/Proposed)</option>
                            <option value="existing">Existing Trails Only</option>
                            <option value="planned">Planned/Proposed Trails Only</option>
                          </Form.Select>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="w-100"
                            onClick={() => handleDownloadTrailsData(downloadOption)}
                          >
                            <i className="fas fa-download me-1"></i>
                            Download{" "}
                            {downloadOption === "both"
                              ? "Trail Data"
                              : downloadOption === "existing"
                                ? "Existing Trails"
                                : "Planned/Proposed Trails"}{" "}
                            (GeoJSON)
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="alert alert-info small p-2 mb-2">
                        No trail geometries found to display or download for this municipality.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "mapLayers" && renderMapLayersTab()}
          </div>
        </div>
      )}

      {/* Completion Rates Modal */}
      <Modal 
        show={showCompletionModal} 
        onHide={() => setShowCompletionModal(false)}
        size="xl"
        centered
        scrollable
        className="CompletionRatesModal"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="w-100">
              <div>
                <span>Trail Network Details</span>
                {selectedMunicipality && (
                  <div className="text-muted fs-6 fw-normal mt-1">
                    {capitalizeWords(selectedMunicipality.name)}
                  </div>
                )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="CompletionRatesModal__body">
          {trailStats && (
            <div className="CompletionRatesModal__summary">
              <div className="CompletionRatesModal__summaryItem">
                <span className="CompletionRatesModal__summaryLabel">Total length</span>
                <span className="CompletionRatesModal__summaryValue">
                  {formatLength(trailStats.totalLength)} mi
                </span>
                <span className="CompletionRatesModal__summaryHint">
                  existing + planned + proposed
                </span>
              </div>
              <div className="CompletionRatesModal__summaryItem">
                <span className="CompletionRatesModal__summaryLabel">
                  Trail density
                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip id="density-modal-tooltip" className="MunicipalityProfile__tooltip">
                        Trail Density = Existing Trails Length (miles) / Municipality Area (sq miles)
                      </Tooltip>
                    }
                  >
                    <span
                      className="CompletionRatesModal__help"
                      role="button"
                      tabIndex={0}
                      aria-label="About trail density"
                    >
                      <i className="fas fa-question-circle" aria-hidden="true" />
                    </span>
                  </OverlayTrigger>
                </span>
                <span className="CompletionRatesModal__summaryValue">
                  {trailStats.density} mi/mi²
                </span>
                <span className="CompletionRatesModal__summaryHint">
                  existing trails per sq mile
                </span>
              </div>
            </div>
          )}

          {trailStats && trailTypeStatusRows.length > 0 && (
            <div className="CompletionRatesModal__section">
              <div className="CompletionRatesModal__sectionHeader">
                <h6 className="CompletionRatesModal__sectionTitle">
                  Trail types by status
                </h6>
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id="completion-rate-help-tooltip" className="MunicipalityProfile__tooltip">
                      For each trail type, Existing, Planned, and Proposed miles
                      are shown separately. Completion rate is existing miles ÷ total
                      miles (existing + planned + proposed).
                    </Tooltip>
                  }
                >
                  <span
                    className="CompletionRatesModal__help"
                    role="button"
                    tabIndex={0}
                    aria-label="About completion rate"
                  >
                    <i className="fas fa-question-circle" aria-hidden="true" />
                  </span>
                </OverlayTrigger>
              </div>

              <div className="CompletionRatesModal__tableWrap">
                <table className="CompletionRatesModal__table">
                  <thead>
                    <tr>
                      <th scope="col">Trail type</th>
                      <th scope="col" className="CompletionRatesModal__num">
                        Existing
                      </th>
                      <th scope="col" className="CompletionRatesModal__num">
                        Planned
                      </th>
                      <th scope="col" className="CompletionRatesModal__num">
                        Proposed
                      </th>
                      <th scope="col" className="CompletionRatesModal__num">
                        Total
                      </th>
                      <th scope="col" className="CompletionRatesModal__num">
                        Completion rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trailTypeStatusRows.map((row) => {
                      const rateTone =
                        row.rate >= 75
                          ? "high"
                          : row.rate >= 50
                            ? "mid"
                            : "low";
                      return (
                        <tr key={row.label}>
                          <td>
                            <span
                              className="CompletionRatesModal__swatch"
                              style={{ backgroundColor: row.color }}
                              aria-hidden="true"
                            />
                            {row.label}
                          </td>
                          <td className="CompletionRatesModal__num">
                            {formatLength(row.existing)}
                          </td>
                          <td className="CompletionRatesModal__num">
                            {formatLength(row.planned)}
                          </td>
                          <td className="CompletionRatesModal__num">
                            {formatLength(row.proposed)}
                          </td>
                          <td className="CompletionRatesModal__num CompletionRatesModal__num--strong">
                            {formatLength(row.total)}
                          </td>
                          <td
                            className={`CompletionRatesModal__num CompletionRatesModal__rate CompletionRatesModal__rate--${rateTone}`}
                          >
                            {row.rate.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="CompletionRatesModal__unitsNote">Lengths in miles</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="CompletionRatesModal__footer">
          <small className="text-muted">
            {`${trailTypeStatusRows.length} trail type${
              trailTypeStatusRows.length === 1 ? "" : "s"
            }`}
          </small>
          <Button variant="secondary" size="sm" onClick={() => setShowCompletionModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {location.pathname === '/communityTrailsProfile' && (
        <TrailsInventoryModal
          show={showTrailsInventoryModal}
          onHide={() => setShowTrailsInventoryModal(false)}
          selectedMunicipality={selectedMunicipality}
          municipalityTrails={municipalityTrails}
          onDownloadGeoJSON={(trails, filenameSuffix) =>
            runTrailGeoJSONDownloads(trails, 'both', filenameSuffix)
          }
        />
      )}

    </div>
  );
};

export default MunicipalityProfile;

