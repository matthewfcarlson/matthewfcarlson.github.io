import {
  select,
  scaleLinear,
  scaleLog,
  axisBottom,
  axisLeft,
  line,
  curveMonotoneX,
  range,
  mean,
  deviation,
} from "d3";

// --- Types ---

interface NameEntry {
  name: string;
  sex: "M" | "F";
  ranks: number[];
}

interface NamesData {
  startYear: number;
  endYear: number;
  names: [string, string, number[]][];
}

interface YearRank {
  year: number;
  rank: number;
}

interface ScoredName {
  entry: NameEntry;
  key: string;
  score: number;
  avgRank: number;
  stdDev: number;
  bestRank: number;
  worstRank: number;
  yearsPresent: number;
}

// --- Constants ---

const CONTAINER_ID = "steady-names";
const SHOW_COUNT = 25;
// Names must be present in at least this fraction of all years
const MIN_PRESENCE = 0.70;
// Band limits: name must never be better than BEST_CAP or worse than WORST_CAP
const BEST_CAP = 50;
const WORST_CAP = 2000;

// --- Main ---

async function main() {
  const container = select(`#${CONTAINER_ID}`);
  container.classed("bump-chart-root", true);

  container.append("div").attr("class", "bump-loading").text("Loading name data…");

  let rawData: NamesData;
  try {
    const res = await fetch("names.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rawData = await res.json();
  } catch {
    container.select(".bump-loading").text("Failed to load data. Please refresh.");
    return;
  }
  container.select(".bump-loading").remove();

  const entries: NameEntry[] = rawData.names.map(([name, sex, ranks]) => ({
    name,
    sex: sex as "M" | "F",
    ranks,
  }));

  const { startYear, endYear } = rawData;
  const numYears = endYear - startYear + 1;

  // --- Score names ---
  // Filter to names that stayed entirely within the 50–2000 rank band,
  // then score by std * 3 + avgRank (lower = steadier and more popular).

  let timeframeYears: number | null = null;

  function getViewStart(): number {
    return timeframeYears !== null ? Math.max(startYear, endYear - timeframeYears + 1) : startYear;
  }

  function computeScored(viewStart: number): ScoredName[] {
    const viewStartIdx = viewStart - startYear;
    const numViewYears = endYear - viewStart + 1;
    const result: ScoredName[] = [];
    for (const entry of entries) {
      const windowRanks = entry.ranks.slice(viewStartIdx);
      const presentRanks = windowRanks.filter((r) => r > 0);
      if (presentRanks.length < numViewYears * MIN_PRESENCE) continue;

      const bestRank = Math.min(...presentRanks);
      const worstRank = Math.max(...presentRanks);

      // Must stay within the band for the entire window
      if (bestRank <= BEST_CAP) continue;
      if (worstRank > WORST_CAP) continue;

      const avg = mean(presentRanks)!;
      const std = deviation(presentRanks) ?? 0;
      // std weighted 3× so instability can't be erased by a slightly better avg rank
      const score = std * 3 + avg;

      result.push({
        entry,
        key: `${entry.name}|${entry.sex}`,
        score,
        avgRank: avg,
        stdDev: std,
        bestRank,
        worstRank,
        yearsPresent: presentRanks.length,
      });
    }
    result.sort((a, b) => a.score - b.score);
    return result;
  }

  let scored = computeScored(startYear);

  // --- State ---

  type SexFilter = "both" | "F" | "M";
  let sexFilter: SexFilter = "both";
  let hoveredKey: string | null = null;
  let pinnedKeys = new Set<string>();
  let showCount = SHOW_COUNT;

  function getVisible(): ScoredName[] {
    return scored
      .filter((s) => sexFilter === "both" || s.entry.sex === sexFilter)
      .slice(0, showCount);
  }

  // --- Layout ---

  const margin = { top: 10, right: 90, bottom: 35, left: 55 };
  const width = 860 - margin.left - margin.right;
  const height = 480 - margin.top - margin.bottom;

  const controls = container.append("div").attr("class", "bump-controls");

  // Label
  const countLabel = controls.append("span")
    .style("font-size", "14px")
    .style("color", "var(--secondary)")
    .text(`Top ${showCount} steady mid-tier names`);

  // Sex filter
  const filterWrap = controls.append("div").attr("class", "bump-sex-filter");
  const filterOptions: { label: string; value: SexFilter }[] = [
    { label: "Both", value: "both" },
    { label: "F", value: "F" },
    { label: "M", value: "M" },
  ];
  for (const opt of filterOptions) {
    filterWrap
      .append("button")
      .attr("class", `bump-filter-btn${opt.value === sexFilter ? " active" : ""}`)
      .text(opt.label)
      .on("click", function () {
        sexFilter = opt.value;
        filterWrap.selectAll(".bump-filter-btn").classed("active", false);
        select(this).classed("active", true);
        render();
      });
  }

  // Count selector
  const countOptions: { label: string; value: number }[] = [
    { label: "25", value: 25 },
    { label: "50", value: 50 },
    { label: "100", value: 100 },
  ];
  const countWrap = controls.append("div").attr("class", "bump-sex-filter");
  for (const co of countOptions) {
    countWrap
      .append("button")
      .attr("class", `bump-filter-btn${co.value === showCount ? " active" : ""}`)
      .text(co.label)
      .on("click", function () {
        showCount = co.value;
        countWrap.selectAll(".bump-filter-btn").classed("active", false);
        select(this).classed("active", true);
        countLabel.text(`Top ${showCount} steady mid-tier names`);
        render();
      });
  }

  // Timeframe filter
  const timeframeOptions: { label: string; value: number | null }[] = [
    { label: "20y", value: 20 },
    { label: "50y", value: 50 },
    { label: "100y", value: 100 },
    { label: "150y", value: 150 },
    { label: "All", value: null },
  ];
  const timeframeWrap = controls.append("div").attr("class", "bump-sex-filter");
  for (const tf of timeframeOptions) {
    timeframeWrap
      .append("button")
      .attr("class", `bump-filter-btn${tf.value === timeframeYears ? " active" : ""}`)
      .text(tf.label)
      .on("click", function () {
        timeframeYears = tf.value;
        scored = computeScored(getViewStart());
        timeframeWrap.selectAll(".bump-filter-btn").classed("active", false);
        select(this).classed("active", true);
        render();
      });
  }

  // Pills
  const pillsContainer = container.append("div").attr("class", "bump-pills");

  // Chart + List
  const chartAndList = container.append("div").attr("class", "bump-chart-and-list");
  const wrapper = chartAndList.append("div").attr("class", "chart-wrapper");
  const svg = wrapper
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const nameList = chartAndList.append("div").attr("class", "bump-name-list");

  const infoPanel = container.append("div").attr("class", "bump-info-panel");

  // Scales — log y so the 50–200 zone isn't crushed against the top
  const x = scaleLinear().domain([startYear, endYear]).range([0, width]);
  const y = scaleLog().domain([BEST_CAP, WORST_CAP]).range([0, height]);

  const xAxisG = g.append("g").attr("transform", `translate(0,${height})`).attr("class", "bump-axis");
  const yAxisG = g.append("g").attr("class", "bump-axis");

  xAxisG.call(axisBottom(x).tickFormat((d) => String(d)).ticks(15));
  yAxisG.call(axisLeft(y).tickValues([50, 100, 200, 500, 1000, 2000]).tickFormat((d) => `#${d}`));

  const lineGen = line<YearRank>()
    .defined((d) => d.rank > 0)
    .x((d) => x(d.year))
    .y((d) => y(d.rank))
    .curve(curveMonotoneX);

  const linesG = g.append("g").attr("class", "bump-lines");
  const labelsG = g.append("g").attr("class", "bump-labels");

  // --- Color ---

  function nameColor(entry: NameEntry, lightMode = true): string {
    let hash = 0;
    for (let i = 0; i < entry.name.length; i++) {
      hash = ((hash << 5) - hash + entry.name.charCodeAt(i)) | 0;
    }
    const offset = Math.abs(hash % 40) - 20;
    const baseHue = entry.sex === "F" ? 340 : 210;
    const hue = baseHue + offset;
    const lightness = lightMode ? 45 : 60;
    return `hsl(${hue}, 70%, ${lightness}%)`;
  }

  function isDark(): boolean {
    return document.body.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
  }

  // --- Highlight (no DOM rebuild) ---

  function highlightKey(key: string | null) {
    hoveredKey = key;
    linesG.selectAll<SVGPathElement, { key: string }>(".bump-line")
      .attr("opacity", (d) => {
        if (hoveredKey) return hoveredKey === d.key || pinnedKeys.has(d.key) ? 1 : 0.08;
        if (pinnedKeys.size > 0) return pinnedKeys.has(d.key) ? 1 : 0.15;
        return 0.7;
      })
      .attr("stroke-width", (d) => hoveredKey === d.key || pinnedKeys.has(d.key) ? 3 : 1.8);
    labelsG.selectAll<SVGTextElement, { key: string }>(".bump-label")
      .attr("opacity", (d) => {
        if (hoveredKey) return hoveredKey === d.key || pinnedKeys.has(d.key) ? 1 : 0.15;
        if (pinnedKeys.size > 0) return pinnedKeys.has(d.key) ? 1 : 0.25;
        return 0.85;
      });
    nameList.selectAll<HTMLElement, unknown>(".bump-list-item")
      .classed("hovered", function () {
        return (this as HTMLElement).dataset.key === key;
      });
  }

  // --- Render ---

  function render() {
    const dark = isDark();
    const viewStart = getViewStart();
    const viewStartIdx = viewStart - startYear;
    x.domain([viewStart, endYear]);
    xAxisG.call(axisBottom(x).tickFormat((d) => String(d)).ticks(Math.min(endYear - viewStart + 1, 15)));
    const visible = getVisible();

    interface LineDatum {
      scored: ScoredName;
      key: string;
      points: YearRank[];
    }

    const lineData: LineDatum[] = visible.map((s) => ({
      scored: s,
      key: s.key,
      points: range(viewStartIdx, numYears).map((i) => ({
        year: startYear + i,
        rank: s.entry.ranks[i],
      })),
    }));

    // --- Lines ---
    const lines = linesG
      .selectAll<SVGPathElement, LineDatum>(".bump-line")
      .data(lineData, (d: LineDatum) => d.key);

    lines.exit().remove();
    lines.enter().append("path").attr("class", "bump-line")
      .merge(lines)
      .attr("d", (d) => lineGen(d.points))
      .attr("stroke", (d) => nameColor(d.scored.entry, !dark))
      .attr("stroke-width", (d) => hoveredKey === d.key || pinnedKeys.has(d.key) ? 3 : 1.8)
      .attr("fill", "none")
      .attr("opacity", (d) => {
        if (hoveredKey) return hoveredKey === d.key || pinnedKeys.has(d.key) ? 1 : 0.08;
        if (pinnedKeys.size > 0) return pinnedKeys.has(d.key) ? 1 : 0.15;
        return 0.7;
      })
      .style("cursor", "pointer")
      .on("mouseenter", function (_event, d) {
        hoveredKey = d.key;
        showInfo(d.scored);
        render();
      })
      .on("mouseleave", function () {
        hoveredKey = null;
        if (pinnedKeys.size === 0) infoPanel.text("");
        else { const first = visible.find((s) => pinnedKeys.has(s.key)); if (first) showInfo(first); }
        render();
      })
      .on("click", function (_event, d) {
        if (pinnedKeys.has(d.key)) pinnedKeys.delete(d.key);
        else pinnedKeys.add(d.key);
        render();
      });

    // --- Labels ---
    const labelHeight = 11;
    const labelData = lineData.map((d) => {
      let lastRank = 0;
      for (let i = numYears - 1; i >= viewStartIdx; i--) {
        if (d.scored.entry.ranks[i] > 0) { lastRank = d.scored.entry.ranks[i]; break; }
      }
      return { ...d, lastRank };
    }).filter((d) => d.lastRank > 0);

    labelData.sort((a, b) => y(a.lastRank) - y(b.lastRank));
    const labelPositions: { key: string; yPos: number }[] = [];
    for (const d of labelData) {
      let yPos = y(d.lastRank);
      for (const prev of labelPositions) {
        if (Math.abs(yPos - prev.yPos) < labelHeight) yPos = prev.yPos + labelHeight;
      }
      yPos = Math.max(0, Math.min(height, yPos));
      labelPositions.push({ key: d.key, yPos });
    }
    const labelMap = new Map(labelPositions.map((l) => [l.key, l.yPos]));

    type LabelDatum = (typeof labelData)[0];
    const labels = labelsG
      .selectAll<SVGTextElement, LabelDatum>(".bump-label")
      .data(labelData, (d: LabelDatum) => d.key);

    labels.exit().remove();
    labels.enter().append("text").attr("class", "bump-label")
      .merge(labels)
      .attr("x", width + 6)
      .attr("y", (d) => (labelMap.get(d.key) ?? y(d.lastRank)) + 4)
      .text((d) => d.scored.entry.name)
      .attr("fill", (d) => nameColor(d.scored.entry, !dark))
      .attr("font-size", "10px")
      .attr("opacity", (d) => {
        if (hoveredKey) return hoveredKey === d.key || pinnedKeys.has(d.key) ? 1 : 0.15;
        if (pinnedKeys.size > 0) return pinnedKeys.has(d.key) ? 1 : 0.25;
        return 0.85;
      });

    // --- Pills ---
    pillsContainer.selectAll("*").remove();
    for (const s of visible) {
      const pill = pillsContainer
        .append("span")
        .attr("class", `name-pill ${s.entry.sex === "F" ? "female" : "male"}`)
        .on("mouseenter", () => { highlightKey(s.key); showInfo(s); })
        .on("mouseleave", () => {
          highlightKey(null);
          if (pinnedKeys.size === 0) infoPanel.text("");
        });
      pill.append("span").text(`${s.entry.name} (${s.entry.sex})`);
    }

    // --- Name list ---
    nameList.selectAll("*").remove();
    visible.forEach((s, i) => {
      const item = nameList.append("div")
        .attr("class", `bump-list-item${hoveredKey === s.key ? " hovered" : ""}${pinnedKeys.has(s.key) ? " pinned" : ""}`)
        .style("border-left-color", nameColor(s.entry, !dark))
        .attr("data-key", s.key)
        .on("mouseenter", () => { highlightKey(s.key); showInfo(s); })
        .on("mouseleave", () => {
          highlightKey(null);
          if (pinnedKeys.size === 0) infoPanel.text("");
          else { const first = visible.find((v) => pinnedKeys.has(v.key)); if (first) showInfo(first); }
        })
        .on("click", () => {
          if (pinnedKeys.has(s.key)) pinnedKeys.delete(s.key);
          else pinnedKeys.add(s.key);
          render();
        });
      item.append("span").attr("class", "bump-list-rank").text(`${i + 1}.`);
      item.append("span").attr("class", "bump-list-name").style("color", nameColor(s.entry, !dark)).text(s.entry.name);
      item.append("span").attr("class", "bump-list-sex").text(s.entry.sex);
    });
  }

  function showInfo(s: ScoredName) {
    const { entry, avgRank, stdDev, bestRank, worstRank, yearsPresent } = s;
    const currentRank = entry.ranks[numYears - 1];
    const currentStr = currentRank > 0 ? `#${currentRank}` : "outside top";

    // Find year(s) of peak
    let peakYears: number[] = [];
    for (let i = 0; i < numYears; i++) {
      if (entry.ranks[i] === bestRank) peakYears.push(startYear + i);
    }
    const peakStr = peakYears.length > 1
      ? `${peakYears[0]}–${peakYears[peakYears.length - 1]}`
      : String(peakYears[0] ?? "–");

    infoPanel.html(
      `<strong>${entry.name}</strong> <span class="bump-stat-sex">(${entry.sex === "F" ? "F" : "M"})</span>` +
      `<span class="bump-stats">` +
      `<span>Peak <b>#${bestRank}</b> <span class="bump-stat-sub">${peakStr}</span></span>` +
      `<span>Now <b>${currentStr}</b></span>` +
      `<span>Avg <b>#${avgRank.toFixed(0)}</b></span>` +
      `<span>Std dev <b>${stdDev.toFixed(1)}</b></span>` +
      `<span>Range <b>${worstRank - bestRank}</b></span>` +
      `<span>Worst <b>#${worstRank}</b></span>` +
      `<span>Present <b>${yearsPresent}</b>/${numYears} yrs</span>` +
      `</span>`
    );
  }

  const observer = new MutationObserver(() => render());
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  render();
}

main();
