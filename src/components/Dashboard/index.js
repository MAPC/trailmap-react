import React, { useEffect, useMemo, useState } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import {
  computeTrailMetricsInsights,
  DASHBOARD_SCOPES,
  fetchTrailMetricsDashboardData,
  filterRowsByScope,
  formatMiles,
  getTopMunicipalitiesByTrailType,
  MAPC_MUNI_COUNT,
  MASSACHUSETTS_MUNI_COUNT,
  TRAIL_STATUS_OPTIONS,
  TRAIL_TYPE_GROUPS,
} from "../../utils/trailMetricsDashboard";
import rpaContacts from "../../data/rpaContacts.json";

const Skeleton = ({ className = "", style = {} }) => (
  <span
    className={`Dashboard__skeleton${className ? ` ${className}` : ""}`}
    style={style}
    aria-hidden="true"
  />
);

const SummaryCardSkeleton = () => (
  <div className="Dashboard__card Dashboard__card--summary Dashboard__card--skeleton">
    <Skeleton style={{ width: "7.5rem", height: "0.72rem" }} />
    <Skeleton style={{ width: "5.5rem", height: "1.75rem", marginTop: "0.35rem" }} />
  </div>
);

const TypeBreakdownSkeleton = () => (
  <div className="Dashboard__card Dashboard__card--skeleton">
    <Skeleton style={{ width: "14rem", height: "1.15rem", marginBottom: "1rem" }} />
    <div className="Dashboard__typeList">
      {[0, 1, 2].map((index) => (
        <div key={index} className="Dashboard__typeRow">
          <div className="Dashboard__typeHeader">
            <Skeleton style={{ width: "8rem", height: "0.9rem" }} />
            <Skeleton style={{ width: "4.5rem", height: "0.9rem" }} />
          </div>
          <Skeleton className="Dashboard__skeletonBar" style={{ width: "100%", height: "14px" }} />
          <div className="Dashboard__typeMeta">
            <Skeleton style={{ width: "6.5rem", height: "0.8rem" }} />
            <Skeleton style={{ width: "6rem", height: "0.8rem" }} />
            <Skeleton style={{ width: "6.25rem", height: "0.8rem" }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RankedListSkeleton = ({ rows = 6 }) => (
  <div className="Dashboard__card Dashboard__card--skeleton">
    <Skeleton style={{ width: "12rem", height: "1.15rem", marginBottom: "0.85rem" }} />
    <ol className="Dashboard__rankedList">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="Dashboard__rankedItem">
          <Skeleton style={{ width: "1rem", height: "0.85rem" }} />
          <Skeleton style={{ width: `${55 + (index % 3) * 12}%`, height: "0.85rem" }} />
          <Skeleton style={{ width: "3.5rem", height: "0.85rem" }} />
        </li>
      ))}
    </ol>
  </div>
);

const METRICS_TABLE_SKELETON_ROW_COUNT = 8;
const METRICS_TABLE_SKELETON_COLUMN_COUNT = 9;

const MetricsTableSkeleton = () => (
  <div className="Dashboard__card Dashboard__card--table Dashboard__card--skeleton">
    <div className="Dashboard__tableHeader">
      <Skeleton style={{ width: "13rem", height: "1.15rem" }} />
      <Skeleton style={{ width: "14rem", height: "2.25rem", borderRadius: "8px" }} />
    </div>
    <div className="Dashboard__tableWrap">
      <table className="Dashboard__table">
        <thead>
          <tr>
            {Array.from({ length: METRICS_TABLE_SKELETON_COLUMN_COUNT }, (_, columnIndex) => (
              <th key={columnIndex}>
                <Skeleton style={{ width: `${4 + (columnIndex % 3)}rem`, height: "0.8rem" }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: METRICS_TABLE_SKELETON_ROW_COUNT }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: METRICS_TABLE_SKELETON_COLUMN_COUNT }, (_, columnIndex) => {
                const isMunicipalityColumn = columnIndex === 0;

                return (
                  <td key={columnIndex}>
                    <Skeleton
                      style={{
                        width: isMunicipalityColumn ? "7rem" : "3.25rem",
                        height: "0.8rem",
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="Dashboard__skeletonLayout" aria-busy="true" aria-live="polite">
    <section className="Dashboard__summaryGrid">
      <SummaryCardSkeleton />
      <SummaryCardSkeleton />
      <SummaryCardSkeleton />
      <SummaryCardSkeleton />
    </section>

    <section className="Dashboard__fullRow">
      <TypeBreakdownSkeleton />
    </section>

    <section className="Dashboard__grid Dashboard__grid--three">
      <RankedListSkeleton />
      <RankedListSkeleton />
      <RankedListSkeleton />
    </section>

    <section className="Dashboard__grid Dashboard__grid--two">
      <RankedListSkeleton rows={5} />
      <RankedListSkeleton rows={5} />
    </section>

    <MetricsTableSkeleton />
  </div>
);

const SummaryCard = ({ label, value, helpTooltip }) => (
  <div className="Dashboard__card Dashboard__card--summary">
    <span className="Dashboard__eyebrow">
      {label}
      {helpTooltip ? (
        <OverlayTrigger placement="right" overlay={helpTooltip}>
          <span
            className="Dashboard__summaryHelp"
            role="button"
            tabIndex={0}
            aria-label={`More information about ${label}`}
          >
            <i className="fas fa-question-circle" aria-hidden="true" />
          </span>
        </OverlayTrigger>
      ) : null}
    </span>
    <span className="Dashboard__metricValue">{value}</span>
  </div>
);

const buildTrackedMunicipalitiesTooltip = (missingMunicipalities) => (
  <Tooltip id="dashboard-tracked-municipalities-tooltip" className="Dashboard__summaryTooltip">
    <div className="Dashboard__summaryTooltipContent">
      <p className="Dashboard__summaryTooltipText">
        {missingMunicipalities.length}{" "}
        {missingMunicipalities.length === 1 ? "municipality" : "municipalities"} have no
        mapped trail data in our database yet:
      </p>
      <ul className="Dashboard__summaryTooltipList">
        {missingMunicipalities.map((municipality) => (
          <li key={municipality.muni_id}>{municipality.municipalityName}</li>
        ))}
      </ul>
    </div>
  </Tooltip>
);

const existingTrailsTooltip = (
  <Tooltip id="dashboard-existing-trails-tooltip" className="Dashboard__summaryTooltip Dashboard__summaryTooltip--compact">
    <p className="Dashboard__summaryTooltipText">
      Total existing trail mileage aggregated across shared-use paths, footways, and bike
      facilities.
    </p>
  </Tooltip>
);

const plannedTrailsTooltip = (
  <Tooltip id="dashboard-planned-trails-tooltip" className="Dashboard__summaryTooltip Dashboard__summaryTooltip--compact">
    <p className="Dashboard__summaryTooltipText">
      Total planned trail mileage aggregated across shared-use paths, footways, and bike
      lanes.
    </p>
  </Tooltip>
);

const proposedTrailsTooltip = (
  <Tooltip id="dashboard-proposed-trails-tooltip" className="Dashboard__summaryTooltip Dashboard__summaryTooltip--compact">
    <p className="Dashboard__summaryTooltipText">
      Total proposed trail mileage aggregated across shared-use paths, footways, and bike
      lanes.
    </p>
  </Tooltip>
);

const MunicipalityLink = ({ row }) => {
  if (!row.communityProfileUrl) {
    return row.municipalityName;
  }

  return (
    <a
      href={row.communityProfileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="Dashboard__muniLink"
    >
      {row.municipalityName}
    </a>
  );
};

const RankedList = ({ title, lead, items, valueKey, valueLabel, formatValue }) => (
  <div className="Dashboard__card">
    <h2 className="Dashboard__sectionTitle">{title}</h2>
    {lead && <p className="Dashboard__sectionLead">{lead}</p>}
    <ol className="Dashboard__rankedList">
      {items.map((item, index) => (
        <li key={`${title}-${item.muni_id}-${index}`} className="Dashboard__rankedItem">
          <span className="Dashboard__rank">{index + 1}</span>
          <span className="Dashboard__rankedName">
            <MunicipalityLink row={item} />
          </span>
          <span className="Dashboard__rankedValue">
            {formatValue(item[valueKey], item)}
            {valueLabel ? ` ${valueLabel}` : ""}
          </span>
        </li>
      ))}
    </ol>
  </div>
);

const MunicipalityTrailTypeLeaderboard = ({ municipalities }) => {
  const [facilityTypeKey, setFacilityTypeKey] = useState(TRAIL_TYPE_GROUPS[0].key);
  const [statusKey, setStatusKey] = useState(TRAIL_STATUS_OPTIONS[0].key);

  const items = useMemo(
    () => getTopMunicipalitiesByTrailType(municipalities, facilityTypeKey, statusKey),
    [facilityTypeKey, municipalities, statusKey]
  );

  const facilityGroup =
    TRAIL_TYPE_GROUPS.find((group) => group.key === facilityTypeKey) || TRAIL_TYPE_GROUPS[0];
  const statusOption =
    TRAIL_STATUS_OPTIONS.find((option) => option.key === statusKey) ||
    TRAIL_STATUS_OPTIONS[0];

  const rankingNotes = useMemo(() => {
    const notesByType = {
      sharedUsePaths:
        "Shared-use paths combine paved and unimproved shared-use path mileage.",
      footways:
        "Footways combine paved footway and natural surface footway mileage into one total.",
      bikeFacilities:
        "Bike facilities combine protected bike lanes and bike lanes.",
    };

    const compositionNote = notesByType[facilityGroup.key] || "";
    const statusKeys = {
      existing: facilityGroup.existingKeys || [],
      planned: facilityGroup.plannedKeys || [],
      proposed: facilityGroup.proposedKeys || [],
    }[statusKey] || [];

    if (statusKeys.length === 0) {
      return [
        compositionNote,
        `${facilityGroup.label} have no ${statusOption.label.toLowerCase()} mileage in the metrics table, so this ranking will be empty.`,
      ].filter(Boolean);
    }

    return [
      `Ranks the top 10 communities by ${statusOption.label.toLowerCase()} ${facilityGroup.label.toLowerCase()} mileage.`,
      compositionNote,
      "Values come from the same trail-metrics totals used in the municipality table below.",
    ].filter(Boolean);
  }, [facilityGroup, statusKey, statusOption.label]);

  const maxTrailTypeMiles = items[0]?.trailTypeMiles || 0;

  return (
    <div className="Dashboard__card">
      <h2 className="Dashboard__sectionTitle">
        Top communities by Trail type and Trail status
      </h2>
      <ul className="Dashboard__sectionList Dashboard__sectionList--compact">
        {rankingNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <div className="Dashboard__leaderboardFilters">
        <div className="Dashboard__filterGroup">
          <span className="Dashboard__filterLabel" id="leaderboard-trail-type-label">
            Trail type
          </span>
          <div
            className="Dashboard__scopeToggle Dashboard__scopeToggle--filter"
            role="tablist"
            aria-labelledby="leaderboard-trail-type-label"
          >
            {TRAIL_TYPE_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                role="tab"
                className={
                  facilityTypeKey === group.key
                    ? "Dashboard__scopeButton Dashboard__scopeButton--active"
                    : "Dashboard__scopeButton"
                }
                aria-selected={facilityTypeKey === group.key}
                onClick={() => setFacilityTypeKey(group.key)}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        <div className="Dashboard__filterGroup">
          <span className="Dashboard__filterLabel" id="leaderboard-trail-status-label">
            Trail status
          </span>
          <div
            className="Dashboard__scopeToggle Dashboard__scopeToggle--filter Dashboard__scopeToggle--filterCompact"
            role="tablist"
            aria-labelledby="leaderboard-trail-status-label"
          >
            {TRAIL_STATUS_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                className={
                  statusKey === option.key
                    ? "Dashboard__scopeButton Dashboard__scopeButton--active"
                    : "Dashboard__scopeButton"
                }
                aria-selected={statusKey === option.key}
                onClick={() => setStatusKey(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <ol className="Dashboard__rankedList Dashboard__rankedList--chart">
          {items.map((item, index) => {
            const barWidth =
              maxTrailTypeMiles > 0 ? (item.trailTypeMiles / maxTrailTypeMiles) * 100 : 0;

            return (
              <li
                key={`${facilityTypeKey}-${statusKey}-${item.muni_id}`}
                className="Dashboard__rankedItem Dashboard__rankedItem--chart"
              >
                <span className="Dashboard__rank">{index + 1}</span>
                <div className="Dashboard__rankedChartBody">
                  <span className="Dashboard__rankedName">
                    <MunicipalityLink row={item} />
                  </span>
                  <div
                    className="Dashboard__rankedBar"
                    role="img"
                    aria-label={`${item.municipalityName}: ${formatMiles(item.trailTypeMiles)} miles`}
                  >
                    <div
                      className="Dashboard__rankedBarFill"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                <span className="Dashboard__rankedValue">
                  {formatMiles(item.trailTypeMiles)} mi
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="Dashboard__emptyState">
          No municipalities with {statusOption.label.toLowerCase()}{" "}
          {facilityGroup.label.toLowerCase()} in this region.
        </p>
      )}
    </div>
  );
};

const TypeBreakdown = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="Dashboard__card">
      <h2 className="Dashboard__sectionTitle">Trail Network by Trail Type</h2>
      <div className="Dashboard__typeList">
        {items.map((item) => {
          const share = total > 0 ? (item.total / total) * 100 : 0;
          const existingShare = item.total > 0 ? (item.existing / item.total) * 100 : 0;
          const plannedShare = item.total > 0 ? (item.planned / item.total) * 100 : 0;
          const proposedShare = item.total > 0 ? (item.proposed / item.total) * 100 : 0;

          return (
            <div key={item.key} className="Dashboard__typeRow">
              <div className="Dashboard__typeHeader">
                <span className="Dashboard__typeLabel">{item.label}</span>
                <span className="Dashboard__typeValue">{formatMiles(item.total)} mi</span>
              </div>
              <div
                className="Dashboard__typeBar"
                role="img"
                aria-label={`${item.label}: ${formatMiles(item.existing)} existing miles, ${formatMiles(item.planned)} planned miles, and ${formatMiles(item.proposed)} proposed miles`}
              >
                <div
                  className="Dashboard__typeBarSegment Dashboard__typeBarSegment--existing"
                  style={{ width: `${share * (existingShare / 100)}%` }}
                  title={`Existing: ${formatMiles(item.existing)} mi`}
                />
                <div
                  className="Dashboard__typeBarSegment Dashboard__typeBarSegment--planned"
                  style={{ width: `${share * (plannedShare / 100)}%` }}
                  title={`Planned: ${formatMiles(item.planned)} mi`}
                />
                <div
                  className="Dashboard__typeBarSegment Dashboard__typeBarSegment--proposed"
                  style={{ width: `${share * (proposedShare / 100)}%` }}
                  title={`Proposed: ${formatMiles(item.proposed)} mi`}
                />
              </div>
              <div className="Dashboard__typeMeta" role="list">
                <span className="Dashboard__typeMetaItem" role="listitem">
                  <span
                    className="Dashboard__typeMetaSwatch Dashboard__typeMetaSwatch--existing"
                    aria-hidden="true"
                  />
                  {formatMiles(item.existing)} mi existing
                </span>
                <span className="Dashboard__typeMetaItem" role="listitem">
                  <span
                    className="Dashboard__typeMetaSwatch Dashboard__typeMetaSwatch--planned"
                    aria-hidden="true"
                  />
                  {formatMiles(item.planned)} mi planned
                </span>
                <span className="Dashboard__typeMetaItem" role="listitem">
                  <span
                    className="Dashboard__typeMetaSwatch Dashboard__typeMetaSwatch--proposed"
                    aria-hidden="true"
                  />
                  {formatMiles(item.proposed)} mi proposed
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SortableHeader = ({ label, columnKey, sortKey, sortDirection, onSort }) => {
  const isActive = sortKey === columnKey;

  return (
    <button
      type="button"
      className={`Dashboard__sortButton${isActive ? " Dashboard__sortButton--active" : ""}`}
      onClick={() => onSort(columnKey)}
      aria-sort={
        isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <span>{label}</span>
      <i
        className={
          isActive
            ? `fas fa-sort-${sortDirection === "asc" ? "up" : "down"} Dashboard__sortIcon`
            : "fas fa-sort Dashboard__sortIcon"
        }
        aria-hidden="true"
      />
    </button>
  );
};

const getTrailTypeExistingMiles = (row, groupKey) =>
  row.byType.find((group) => group.key === groupKey)?.existing ?? 0;

const MetricsTable = ({ rows }) => {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("existingMiles");
  const [sortDirection, setSortDirection] = useState("desc");

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows
      .filter((row) =>
        normalizedQuery
          ? row.municipalityName.toLowerCase().includes(normalizedQuery)
          : true
      )
      .sort((a, b) => {
        const isTrailTypeSort = TRAIL_TYPE_GROUPS.some((group) => group.key === sortKey);
        const left = isTrailTypeSort
          ? getTrailTypeExistingMiles(a, sortKey)
          : a[sortKey];
        const right = isTrailTypeSort
          ? getTrailTypeExistingMiles(b, sortKey)
          : b[sortKey];

        if (typeof left === "string") {
          return sortDirection === "asc"
            ? left.localeCompare(right)
            : right.localeCompare(left);
        }

        const leftValue = left ?? 0;
        const rightValue = right ?? 0;
        return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
      });
  }, [query, rows, sortDirection, sortKey]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "municipalityName" ? "asc" : "desc");
  };

  return (
    <div className="Dashboard__card Dashboard__card--table">
      <div className="Dashboard__tableHeader">
        <div className="Dashboard__tableIntro">
          <h2 className="Dashboard__sectionTitle">Trail Data Summary</h2>
          <p className="Dashboard__sectionLead">
            <span className="Dashboard__measurementNote">
              All measurements are reported in miles.
            </span>{" "}
            Click a municipality to open its community profile in a new tab.
          </p>
          <ul className="Dashboard__sectionList">
            <li>
              Existing, Planned, and Proposed Miles represent total trail mileage across all
              trail types.
            </li>
            <li>Total Miles combines existing, planned, and proposed trail mileage.</li>
            <li>
              Trail Density is calculated as existing trail miles divided by the
              municipality&apos;s land area (mi/mi²).
            </li>
            <li>
              The final three columns show existing mileage by facility type: shared-use paths,
              footways, and bike facilities.
            </li>
          </ul>
        </div>
        <input
          type="search"
          className="Dashboard__search"
          placeholder="Search municipality"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search municipalities"
        />
      </div>

      <div className="Dashboard__tableWrap">
        <table className="Dashboard__table">
          <thead>
            <tr>
              <th>
                <SortableHeader
                  label="Municipality"
                  columnKey="municipalityName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th>
                <SortableHeader
                  label="Existing"
                  columnKey="existingMiles"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th>
                <SortableHeader
                  label="Planned"
                  columnKey="plannedMiles"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th>
                <SortableHeader
                  label="Proposed"
                  columnKey="proposedMiles"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th>
                <SortableHeader
                  label="Total"
                  columnKey="totalMiles"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th>
                <SortableHeader
                  label="Density"
                  columnKey="density"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              {TRAIL_TYPE_GROUPS.map((group) => (
                <th key={group.key}>
                  <SortableHeader
                    label={group.existingLabel}
                    columnKey={group.key}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.muni_id}>
                <td>
                  <MunicipalityLink row={row} />
                </td>
                <td>{formatMiles(row.existingMiles)}</td>
                <td>{formatMiles(row.plannedMiles)}</td>
                <td>{formatMiles(row.proposedMiles)}</td>
                <td>{formatMiles(row.totalMiles)}</td>
                <td>{row.density != null ? formatMiles(row.density) : "—"}</td>
                {row.byType.map((group) => (
                  <td key={`${row.muni_id}-${group.key}`}>{formatMiles(group.existing)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RpaContactsTable = () => (
  <div className="Dashboard__card Dashboard__card--table Dashboard__card--contacts">
    <div className="Dashboard__tableHeader">
      <h2 className="Dashboard__sectionTitle">RPA Contacts</h2>
    </div>
    <div className="Dashboard__tableWrap Dashboard__tableWrap--contacts">
      <table className="Dashboard__table Dashboard__table--contacts">
        <thead>
          <tr>
            <th scope="col">RPA</th>
            <th scope="col">Contact Name</th>
            <th scope="col">Email</th>
          </tr>
        </thead>
        <tbody>
          {rpaContacts.map((contact) => (
            <tr key={contact.rpa}>
              <td>{contact.rpa}</td>
              <td>{contact.contactName}</td>
              <td>
                <a href={`mailto:${contact.email}`} className="Dashboard__contactEmail">
                  {contact.email}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SCOPE_OPTIONS = [
  {
    id: DASHBOARD_SCOPES.MAPC,
    label: `MAPC region (${MAPC_MUNI_COUNT})`,
    title: "MAPC region trail network dashboard",
  },
  {
    id: DASHBOARD_SCOPES.MASSACHUSETTS,
    label: `Massachusetts (${MASSACHUSETTS_MUNI_COUNT})`,
    title: "Massachusetts trail network dashboard",
  },
];

const Dashboard = () => {
  const [enrichedRows, setEnrichedRows] = useState([]);
  const [scope, setScope] = useState(DASHBOARD_SCOPES.MAPC);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeScope = SCOPE_OPTIONS.find((option) => option.id === scope) || SCOPE_OPTIONS[0];

  const insights = useMemo(() => {
    if (!enrichedRows.length) return null;
    return computeTrailMetricsInsights(filterRowsByScope(enrichedRows, scope), scope);
  }, [enrichedRows, scope]);

  const trackedMunicipalitiesTooltip = useMemo(() => {
    if (!insights?.municipalitiesWithoutTrailData?.length) return null;
    return buildTrackedMunicipalitiesTooltip(insights.municipalitiesWithoutTrailData);
  }, [insights]);

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchTrailMetricsDashboardData(scope);
        if (isMounted) {
          setEnrichedRows(data.enrichedRows);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError.message ||
              "Unable to load trail metrics. Please try again later."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, [scope]);

  return (
    <main className="Dashboard">
      <div className="Dashboard__content">
        <header className="Dashboard__header">
          <div className="Dashboard__headerTop">
            <div>
              <h1 className="Dashboard__title">{activeScope.title}</h1>
            </div>
            <div
              className="Dashboard__scopeToggle"
              role="tablist"
              aria-label="Dashboard geography"
            >
              {SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  className={
                    scope === option.id
                      ? "Dashboard__scopeButton Dashboard__scopeButton--active"
                      : "Dashboard__scopeButton"
                  }
                  aria-selected={scope === option.id}
                  onClick={() => setScope(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isLoading && !error && <DashboardSkeleton />}

        {error && (
          <div className="Dashboard__error" role="alert">
            {error}
          </div>
        )}

        {insights && !isLoading && (
          <>
            <section className="Dashboard__summaryGrid">
              <SummaryCard
                label="Municipalities tracked"
                value={insights.municipalityCount.toLocaleString("en-US")}
                helpTooltip={trackedMunicipalitiesTooltip}
              />
              <SummaryCard
                label="Existing trails"
                value={`${formatMiles(insights.statewideExisting)} mi`}
                helpTooltip={existingTrailsTooltip}
              />
              <SummaryCard
                label="Planned trails"
                value={`${formatMiles(insights.statewidePlanned)} mi`}
                helpTooltip={plannedTrailsTooltip}
              />
              <SummaryCard
                label="Proposed trails"
                value={`${formatMiles(insights.statewideProposed)} mi`}
                helpTooltip={proposedTrailsTooltip}
              />
            </section>

            <section className="Dashboard__fullRow">
              <TypeBreakdown items={insights.byTypeTotals} />
            </section>

            <section className="Dashboard__grid Dashboard__grid--three">
              <RankedList
                title="Top Communities by Existing Trail Miles"
                items={insights.topByExisting}
                valueKey="existingMiles"
                valueLabel="mi"
                formatValue={formatMiles}
              />
              <RankedList
                title="Top Communities by Planned Trail Miles"
                items={insights.topByPlanned}
                valueKey="plannedMiles"
                valueLabel="mi"
                formatValue={formatMiles}
              />
              <RankedList
                title="Top Communities by Proposed Trail Miles"
                items={insights.topByProposed}
                valueKey="proposedMiles"
                valueLabel="mi"
                formatValue={formatMiles}
              />
            </section>

            <section className="Dashboard__grid Dashboard__grid--two">
              <RankedList
                title="Top Communities for Trail Density"
                lead="Trail density = existing trail miles ÷ municipality land area (mi/mi²)"
                items={insights.topByDensity}
                valueKey="density"
                valueLabel="mi/mi²"
                formatValue={formatMiles}
              />
              <MunicipalityTrailTypeLeaderboard municipalities={insights.municipalities} />
            </section>

            <MetricsTable rows={insights.rows} />
          </>
        )}

        <section className="Dashboard__fullRow">
          <RpaContactsTable />
        </section>
      </div>
    </main>
  );
};

export default Dashboard;