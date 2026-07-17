import React, { useState, useEffect, useRef, useMemo } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import * as turf from '@turf/turf';
import massachusettsData from "../../data/massachusetts.json";
import { useNavigate, useLocation } from "react-router-dom";
import TrailsInventoryModal from "../Modals/TrailsInventoryModal";
import {
  geojsonTrailLayers,
  getTrailStatus,
  trailFacilityTypePairs,
  TRAIL_STATUS,
} from "../Map/constants/geojsonTrailLayers";

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
  showSubwayStations,
  onToggleSubwayStations,
  showEnvironmentalJustice,
  onToggleEnvironmentalJustice,
  showOpenSpace,
  onToggleOpenSpace,
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
  const densityRankCacheRef = useRef(new Map());

  // Reset component states when switching back to trail filters
  useEffect(() => {
    const handleResetMunicipalityProfile = () => {
      setTrailStats(null);
      setSelectedTrailIndex(null);
      setShowCompletionModal(false);
      setShowShareMenu(false);
      setShowTrailsInventoryModal(false);
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
      window.dispatchEvent(new CustomEvent('resetBufferAnalysis'));
      prevMunicipalityRef.current = null;
    }
  }, [selectedMunicipality]);

  // Calculate trail statistics when municipality or trails change
  useEffect(() => {
    if (selectedMunicipality && municipalityTrails) {
      calculateTrailStats();
    }
  }, [selectedMunicipality, municipalityTrails]);


  const calculateTrailStats = () => {
    if (!municipalityTrails || municipalityTrails.length === 0) {
      setTrailStats({
        totalTrails: 0,
        totalLength: 0,
        existingLength: 0,
        plannedLength: 0,
        proposedLength: 0,
        byType: {},
        completionRates: {},
        density: 0,
        area: 0
      });
      return;
    }

    const stats = {
      totalTrails: municipalityTrails.length,
      totalLength: 0,
      existingLength: 0,
      plannedLength: 0,
      proposedLength: 0,
      byType: {},
      completionRates: {},
      density: 0,
      area: 0
    };

    // Calculate municipality area and trail density
    if (selectedMunicipality && selectedMunicipality.geometry) {
      try {
        let area = 0;
        
        // Handle both Polygon and MultiPolygon geometries
        if (selectedMunicipality.geometry.type === 'Polygon') {
          const muniPolygon = turf.polygon(selectedMunicipality.geometry.coordinates);
          area = turf.area(muniPolygon) * 10.764; // Convert from sq meters to sq feet
        } else if (selectedMunicipality.geometry.type === 'MultiPolygon') {
          const muniMultiPolygon = turf.multiPolygon(selectedMunicipality.geometry.coordinates);
          area = turf.area(muniMultiPolygon) * 10.764; // Convert from sq meters to sq feet
        }
        
        stats.area = area;
      } catch (error) {
        console.error('Error calculating municipality area:', error);
      }
    }

    // Initialize counts for all MapServer trail layers
    geojsonTrailLayers.forEach((layer) => {
      stats.byType[layer.name] = {
        count: 0,
        length: 0,
        color: layer.color,
        status: layer.status,
        layerId: layer.id,
      };
    });

    let existingTrailsLength = 0;
    let plannedTrailsLength = 0;
    let proposedTrailsLength = 0;

    municipalityTrails.forEach((trail) => {
      const layerName = trail.layerName || "Unknown";
      const status = getTrailStatus(trail) || TRAIL_STATUS.EXISTING;

      const rawLengthFeet =
        trail.attributes?.["Facility Length in Feet"] ??
        trail.attributes?.length_ft;
      const lengthValue =
        rawLengthFeet !== undefined &&
        rawLengthFeet !== null &&
        rawLengthFeet !== "Null" &&
        rawLengthFeet !== " "
          ? rawLengthFeet
          : trail.attributes?.Shape_Length || 0;

      const lengthInFeet = Number(lengthValue) || 0;

      if (stats.byType[layerName]) {
        stats.byType[layerName].count += 1;
        stats.byType[layerName].length += lengthInFeet;
      } else {
        stats.byType[layerName] = {
          count: 1,
          length: lengthInFeet,
          color: trail.color || "#888",
          status,
          layerId: trail.layerId,
        };
      }

      stats.totalLength += lengthInFeet;

      if (status === TRAIL_STATUS.EXISTING) {
        existingTrailsLength += lengthInFeet;
      } else if (status === TRAIL_STATUS.PLANNED) {
        plannedTrailsLength += lengthInFeet;
      } else {
        proposedTrailsLength += lengthInFeet;
      }
    });

    stats.existingLength = existingTrailsLength;
    stats.plannedLength = plannedTrailsLength;
    stats.proposedLength = proposedTrailsLength;

    // Trail density uses existing only (includes Paved/Natural Surface Footways)
    if (stats.area > 0) {
      const areaInSqMiles = stats.area / 27878400;
      const existingTrailsLengthInMiles = existingTrailsLength / 5280;
      stats.density =
        areaInSqMiles > 0
          ? parseFloat((existingTrailsLengthInMiles / areaInSqMiles).toFixed(2))
          : 0;
    }

    // Completion rates: existing / (existing + planned + proposed) per facility type
    trailFacilityTypePairs.forEach(({ existingId, otherIds, label }) => {
      const existingLayer = geojsonTrailLayers.find((l) => l.id === existingId);
      const existingLength = existingLayer
        ? stats.byType[existingLayer.name]?.length || 0
        : 0;

      let otherLength = 0;
      otherIds.forEach((id) => {
        const otherLayer = geojsonTrailLayers.find((l) => l.id === id);
        if (otherLayer) {
          otherLength += stats.byType[otherLayer.name]?.length || 0;
        }
      });

      const total = existingLength + otherLength;
      if (total > 0) {
        stats.completionRates[label] = {
          existing: existingLength,
          planned: otherLength,
          total,
          rate: (existingLength / total) * 100,
        };
      }
    });

    setTrailStats(stats);
  };

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

  const getMuniAreaSqMi = (properties) => {
    if (!properties?.sum_square) return null;
    return parseFloat(Number(properties.sum_square).toFixed(1));
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
  }, [selectedMunicipality?.name, trailStats?.density]);

 

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
    <Tooltip
      id="density-overview-tooltip"
      style={{
        backgroundColor: "rgba(59, 131, 199, 0.75)",
        color: "white",
        borderRadius: "5px",
      }}
    >
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
          View Trail Details & Completion Rates
        </Button>
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
              <Tooltip id="map-context-layers-tooltip">
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
              dispatchLayerToggle("toggleCommuterRail", checked);
            }
          )}

          {showCommuterRail &&
            renderMapLayerRow(
              "station-labels",
              "Station labels",
              showStationLabels,
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
            "Protected open space",
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
              dispatchLayerToggle("toggleBlueBikeStations", checked);
            }
          )}

          {renderMapLayerRow(
            "subway",
            "T-stops",
            showSubwayStations,
            (checked) => {
              if (onToggleSubwayStations) onToggleSubwayStations(checked);
              dispatchLayerToggle("toggleSubwayStations", checked);
            }
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

    return trailFacilityTypePairs
      .map(({ existingId, otherIds, label }) => {
        const layerIds = [existingId, ...otherIds];
        const lengths = {
          [TRAIL_STATUS.EXISTING]: 0,
          [TRAIL_STATUS.PLANNED]: 0,
          [TRAIL_STATUS.PROPOSED]: 0,
        };
        let color = "#888";

        layerIds.forEach((layerId) => {
          const layer = geojsonTrailLayers.find((l) => l.id === layerId);
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
        };
      })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  };

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
    isLoadingTrails || (selectedMunicipality && trailStats === null);

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

                    {municipalityTrails && municipalityTrails.length > 0 && (
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
                    )}

                    {(!municipalityTrails || municipalityTrails.length === 0) && (
                      <div className="alert alert-info small p-2 mb-2">
                        No trails found in this municipality.
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
        style={{ maxWidth: '90vw' }}
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="w-100">
              <div>
                <span>Trail Network Completion Rates</span>
                {selectedMunicipality && (
                  <div className="text-muted fs-6 fw-normal mt-1">
                    {capitalizeWords(selectedMunicipality.name)}
                  </div>
                )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedMunicipality && (
            <div className="alert alert-info mb-4">
              <div className="d-flex align-items-start">
                <div className="small">
                  <strong>Completion Rate</strong> shows the percentage of existing trails compared to the total network (existing + planned + proposed).
                  Higher percentages indicate more trail infrastructure is already built.
                </div>
              </div>
            </div>
          )}

          {/* Trail Density Information */}
          {trailStats && (
            <div className="alert alert-light mb-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="text-center">
                    <div className="text-muted small">Total Length (existing + planned + proposed)</div>
                    <div className="fw-bold fs-5">{formatLength(trailStats.totalLength)} mi</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-center">
                    <div className="text-muted small d-flex align-items-center justify-content-center">
                      Trail Density (existing only)
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip id="density-modal-tooltip" style={{ backgroundColor: 'rgba(59, 131, 199, 0.75)', color: 'white', borderRadius: '5px' }}>
                            Trail Density = Existing Trails Length (miles) / Municipality Area (sq miles)
                          </Tooltip>
                        }
                      >
                        <span 
                          className="ms-1" 
                          style={{ cursor: 'help', fontSize: '0.85em', color: '#0070cd', display: 'inline-block' }}
                          role="button"
                          tabIndex={0}
                        >
                          <i className="fas fa-question-circle"></i>
                        </span>
                      </OverlayTrigger>
                    </div>
                    <div className="fw-bold fs-5">{trailStats.density} mi/mi²</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Trail Types Section */}
          {trailStats && Object.keys(trailStats.byType).length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center">
                All Trail Types in {selectedMunicipality && capitalizeWords(selectedMunicipality.name)}
              </h6>
              <div className="row g-3">
                {getTrailTypeStatusRows(trailStats).map((row) => (
                  <div key={row.label} className="col-12 col-md-6">
                    <div className="card border shadow-sm h-100">
                      <div className="card-body p-3">
                        <div className="d-flex align-items-start">
                          <div
                            style={{
                              width: "4px",
                              backgroundColor: row.color,
                              marginRight: "12px",
                              borderRadius: "2px",
                              minHeight: "48px",
                              alignSelf: "stretch",
                            }}
                          />
                          <div className="flex-grow-1">
                            <h6
                              className="mb-2 fw-semibold"
                              style={{ fontSize: "0.9rem", lineHeight: 1.3 }}
                            >
                              {row.label}
                            </h6>
                            <div className="text-muted small" style={{ fontSize: "0.7rem" }}>
                              TOTAL LENGTH
                            </div>
                            <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                              {formatLength(row.total)} mi
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Completion Rates Section */}
          {trailStats && trailStats.completionRates && Object.keys(trailStats.completionRates).length > 0 && (
            <>
              <h6 className="fw-bold mb-3 d-flex align-items-center">
                Trail Network Completion Rates
              </h6>
              <div className="row g-2">
              {Object.entries(trailStats.completionRates)
                .sort(([, a], [, b]) => b.rate - a.rate)
                .map(([type, data], index) => (
                  <div 
                    key={type} 
                    className="col-12 mb-2"
                  >
                    <div className="completion-rate-card card shadow-sm border-0">
                      <div className="card-body p-2">
                        <div className="d-flex align-items-center justify-content-between">
                          {/* Left side: Type name and progress */}
                          <div className="flex-grow-1 pe-3" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center mb-2">
                              <h6 className="mb-0 fw-semibold text-truncate" style={{ fontSize: '0.85rem' }}>
                                {type.replace(/^Existing\s+/, "")}
                              </h6>
                            </div>
                            <div className="progress mb-2" style={{ height: '8px', borderRadius: '4px' }}>
                              <div 
                                className={`progress-bar ${
                                  data.rate >= 75 ? 'bg-success' : 
                                  data.rate >= 50 ? 'bg-warning' : 
                                  'bg-danger'
                                }`}
                                role="progressbar" 
                                style={{ 
                                  width: `${data.rate}%`,
                                  transition: 'width 0.6s ease'
                                }}
                                aria-valuenow={data.rate} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <div className="d-flex align-items-center small" style={{ fontSize: '0.75rem' }}>
                              <span className="text-success me-3">
                                <strong>Existing:</strong> {formatLength(data.existing)} mi
                              </span>
                              <span className="text-warning me-3">
                                <strong>Planned/Proposed:</strong> {formatLength(data.planned)} mi
                              </span>
                              <span className="text-muted">
                                <strong>Total:</strong> {formatLength(data.total)} mi
                              </span>
                            </div>
                          </div>
                          
                          {/* Right side: Percentage */}
                          <div className="text-end" style={{ minWidth: '80px' }}>
                            <div className="fw-bold" style={{ 
                              fontSize: '1.5rem',
                              lineHeight: '1',
                              color: data.rate >= 75 ? '#198754' : data.rate >= 50 ? '#fd7e14' : '#dc3545'
                            }}>
                              {data.rate.toFixed(1)}%
                            </div>
                            <div className="small text-muted" style={{ fontSize: '0.65rem' }}>
                              Complete
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <div className="w-100 d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2 align-items-center">
              <small className="text-muted d-flex align-items-center">
                {trailStats && (
                  <>
                    {Object.keys(trailStats.byType).filter(key => trailStats.byType[key].count > 0).length} trail type(s)
                    {trailStats.completionRates && Object.keys(trailStats.completionRates).length > 0 && 
                      ` • ${Object.keys(trailStats.completionRates).length} with completion data`
                    }
                  </>
                )}
              </small>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowCompletionModal(false)}>
              Close
            </Button>
          </div>
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

