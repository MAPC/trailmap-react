import React from "react";

const containerStyle = {
  width: "100%",
  maxWidth: 320,
  boxSizing: "border-box",
  color: "#2774bd",
  fontSize: 12,
  lineHeight: 1.45,
  whiteSpace: "normal",
  wordWrap: "break-word",
  overflowWrap: "anywhere",
};

const listStyle = {
  margin: "0 0 10px",
  paddingLeft: 18,
  listStylePosition: "outside",
};

const getAttr = (p, ...keys) => {
  for (const key of keys) {
    const value = p[key];
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "string" && value.toLowerCase() === "null") continue;
    return value;
  }
  return null;
};

const formatNumber = (value) => {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return null;
  return Math.round(n).toLocaleString();
};

const formatCurrency = (value) => {
  const formatted = formatNumber(value);
  return formatted == null ? null : `$${formatted}`;
};

const formatPercent = (value) => {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return null;
  return `${Math.round(n)}%`;
};

const Bold = ({ children }) => <strong>{children}</strong>;

const EnvironmentalJusticePopupContent = ({ properties }) => {
  const p = properties || {};

  const municipality = getAttr(p, "MUNICIPALITY", "Municipality");
  const ej = getAttr(p, "EJ", "Ej");
  const ejCritDesc = getAttr(p, "EJ_CRIT_DESC", "EJ Criteria Description", "EJ_Crit_Desc");
  const pctMinority = getAttr(p, "PCT_MINORITY", "Percent Minority");
  const bgMhhi = getAttr(p, "BG_MHHI", "Block Group Median 2020 Household Income");
  const bgMhhiPctMa = getAttr(
    p,
    "BG_MHHI_PCT_MAHHI",
    "Block Group 2020 MHHI as Pct. 2020 HH Income"
  );
  const limEngHhPct = getAttr(
    p,
    "LIMENGHHPCT",
    "Percent of Limited English Households"
  );
  const muniMhhi = getAttr(p, "MUNI_MHHI", "Municipality MHHI");
  const muniMhhiPctMa = getAttr(p, "MUNIMHHI_PCT_MAHHI", "Municipality MHHI as Pct of MAHHI");
  const totalPop = getAttr(p, "TOTAL_POP", "Total Poputation", "Total Population");
  const totalHh = getAttr(p, "TOTALHH", "Total Number of Households");

  const place = municipality || "this municipality";
  const isEj = String(ej || "").toLowerCase() === "yes";
  const criteria = ejCritDesc || "N/A";

  const minorityPct = formatPercent(pctMinority);
  const income = formatCurrency(bgMhhi);
  const incomePctMa = formatPercent(bgMhhiPctMa);
  const languageIsolationPct = formatPercent(limEngHhPct);
  const muniIncome = formatCurrency(muniMhhi);
  const muniIncomePctMa = formatPercent(muniMhhiPctMa);
  const population = formatNumber(totalPop);
  const households = formatNumber(totalHh);

  const hasData =
    municipality ||
    ejCritDesc ||
    pctMinority != null ||
    bgMhhi != null ||
    totalPop != null;

  if (!hasData) {
    return (
      <div style={containerStyle}>
        <div>No data available</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 10 }}>
        {isEj ? (
          <>
            This block group in <Bold>{place}</Bold> is an EJ population with the criteria:{" "}
            <Bold>{criteria}</Bold>
          </>
        ) : (
          <>
            This block group in <Bold>{place}</Bold> is not designated as an EJ population.
          </>
        )}
      </div>

      <div style={{ marginBottom: 4 }}>EJ characteristics of this block group:</div>
      <ul style={listStyle}>
        {minorityPct != null && (
          <li style={{ marginBottom: 4 }}>
            Minority population: <Bold>{minorityPct}</Bold>
          </li>
        )}
        {income != null && (
          <li style={{ marginBottom: 4 }}>
            Median household income: <Bold>{income}</Bold>
            {incomePctMa != null && (
              <div style={{ marginTop: 2, paddingLeft: 4 }}>
                This is <Bold>{incomePctMa}</Bold> of the MA MHHI
              </div>
            )}
          </li>
        )}
        {languageIsolationPct != null && (
          <li style={{ marginBottom: 4 }}>
            Households with language isolation: <Bold>{languageIsolationPct}</Bold>
          </li>
        )}
      </ul>

      {muniIncome != null && muniIncomePctMa != null && (
        <div style={{ marginBottom: 10 }}>
          This municipality has a median household income of <Bold>{muniIncome}</Bold> which is{" "}
          <Bold>{muniIncomePctMa}</Bold> of the MA MHHI.
        </div>
      )}

      {population != null && households != null && (
        <div>
          In 2020 this block group had a population of <Bold>{population}</Bold> in{" "}
          <Bold>{households} households</Bold>.
        </div>
      )}
    </div>
  );
};

export default EnvironmentalJusticePopupContent;
