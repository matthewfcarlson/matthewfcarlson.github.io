import {
  select,
  scaleLinear,
  axisBottom,
  axisLeft,
  line,
  curveMonotoneX,
  range,
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

// --- Constants ---

const TOP_N = 200;
const CONTAINER_ID = "bump-chart";

// --- Main ---

async function main() {
  const container = select(`#${CONTAINER_ID}`);
  container.classed("bump-chart-root", true);

  // Show loading state
  container.append("div").attr("class", "bump-loading").text("Loading name data…");

  let rawData: NamesData;
  try {
    const res = await fetch("names.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rawData = await res.json();
  } catch (err) {
    container.select(".bump-loading").text("Failed to load data. Please refresh.");
    return;
  }

  container.select(".bump-loading").remove();

  // Parse data
  const entries: NameEntry[] = rawData.names.map(([name, sex, ranks]) => ({
    name,
    sex: sex as "M" | "F",
    ranks,
  }));

  const { startYear, endYear } = rawData;
  const numYears = endYear - startYear + 1;

  // Build lookup maps
  const byKey = new Map<string, NameEntry>();
  for (const e of entries) byKey.set(`${e.name}|${e.sex}`, e);

  // --- State ---

  type SexFilter = "both" | "F" | "M";
  let sexFilter: SexFilter = "both";
  let visibleKeys = new Set<string>();
  let pinnedKeys = new Set<string>();
  let hoveredKey: string | null = null;
  let timeframeYears: number | null = null;

  function getViewStart(): number {
    return timeframeYears !== null ? Math.max(startYear, endYear - timeframeYears + 1) : startYear;
  }

  // Get top N names for a single year
  function getTopOfYear(year: number, sex: SexFilter, n: number): string[] {
    const yearIdx = year - startYear;
    const filtered = entries.filter((e) => {
      if (sex !== "both" && e.sex !== sex) return false;
      return e.ranks[yearIdx] > 0;
    });
    filtered.sort((a, b) => a.ranks[yearIdx] - b.ranks[yearIdx]);
    return filtered.slice(0, n).map((e) => `${e.name}|${e.sex}`);
  }

  // Get names by best rank in a decade, filtered to a rank range [minRank, maxRank]
  function getNamesByDecadeRank(
    decadeStart: number, sex: SexFilter, minRank: number, maxRank: number
  ): string[] {
    const startIdx = Math.max(0, decadeStart - startYear);
    const endIdx = Math.min(numYears - 1, decadeStart + 9 - startYear);
    const bestRanks = new Map<string, number>();
    for (const e of entries) {
      if (sex !== "both" && e.sex !== sex) continue;
      const key = `${e.name}|${e.sex}`;
      let best = TOP_N + 1;
      for (let i = startIdx; i <= endIdx; i++) {
        if (e.ranks[i] > 0 && e.ranks[i] < best) best = e.ranks[i];
      }
      if (best >= minRank && best <= maxRank) bestRanks.set(key, best);
    }
    return [...bestRanks.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => key);
  }

  interface Preset {
    label: string;
    value: string;
    group: string;
  }

  function buildPresets(): Preset[] {
    const presets: Preset[] = [];

    // Top of specific years
    const years = [endYear, 2000, 1990, 1980, 1970, 1960, 1950, 1920, 1880];
    for (const y of years) {
      presets.push({ label: `Top 10 of ${y}`, value: `year:${y}`, group: "By Year" });
    }

    // Decades — ranks 101–200 (the "long tail" of popular names)
    const decadeStart = Math.ceil(startYear / 10) * 10;
    const decadeEnd = Math.floor(endYear / 10) * 10;
    for (let d = decadeEnd; d >= decadeStart; d -= 10) {
      presets.push({
        label: `#101–200 of ${d}s`,
        value: `decade:${d}:101:200`,
        group: "Decade (#101–200)",
      });
    }
    return presets;
  }

  function applyPresetValue(value: string) {
    pinnedKeys.clear();
    visibleKeys.clear();
    let keys: string[];

    if (value.startsWith("year:")) {
      const year = parseInt(value.split(":")[1]);
      keys = sexFilter === "both"
        ? [...getTopOfYear(year, "F", 10), ...getTopOfYear(year, "M", 10)]
        : getTopOfYear(year, sexFilter, 20);
    } else if (value.startsWith("decade:")) {
      const parts = value.split(":");
      const decade = parseInt(parts[1]);
      const minRank = parseInt(parts[2]);
      const maxRank = parseInt(parts[3]);
      keys = sexFilter === "both"
        ? [
            ...getNamesByDecadeRank(decade, "F", minRank, maxRank),
            ...getNamesByDecadeRank(decade, "M", minRank, maxRank),
          ]
        : getNamesByDecadeRank(decade, sexFilter, minRank, maxRank);
    } else {
      return;
    }

    for (const k of keys) visibleKeys.add(k);
  }

  const defaultPresetValue = `year:${endYear}`;

  // Populate initial state (render() called at the end after DOM is ready)
  applyPresetValue(defaultPresetValue);

  // --- Layout ---

  const margin = { top: 10, right: 90, bottom: 35, left: 40 };
  const width = 860 - margin.left - margin.right;
  const height = 480 - margin.top - margin.bottom;

  // Controls
  const controls = container.append("div").attr("class", "bump-controls");

  // Search
  const searchWrap = controls.append("div").attr("class", "bump-search-wrap");
  const searchInput = searchWrap
    .append("input")
    .attr("type", "text")
    .attr("class", "bump-search")
    .attr("placeholder", "Search names…")
    .attr("autocomplete", "off");
  const autocomplete = searchWrap.append("div").attr("class", "bump-autocomplete");

  // Preset
  const presetSelect = controls
    .append("select")
    .attr("class", "bump-preset");

  const presets = buildPresets();
  let currentGroup = "";
  let optgroup: ReturnType<typeof presetSelect.append> | null = null;
  for (const p of presets) {
    if (p.group !== currentGroup) {
      currentGroup = p.group;
      optgroup = presetSelect.append("optgroup").attr("label", p.group);
    }
    optgroup!.append("option").attr("value", p.value).text(p.label);
  }

  presetSelect.on("change", function () {
    const value = (this as HTMLSelectElement).value;
    applyPresetValue(value);
    render();
  });

  // Clear button
  controls.append("button")
    .attr("class", "bump-filter-btn")
    .text("Clear")
    .on("click", () => {
      visibleKeys.clear();
      pinnedKeys.clear();
      render();
    });

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
      .attr("data-value", opt.value)
      .text(opt.label)
      .on("click", function () {
        sexFilter = opt.value;
        filterWrap.selectAll(".bump-filter-btn").classed("active", false);
        select(this).classed("active", true);
        // Re-apply current preset
        const value = (presetSelect.node() as HTMLSelectElement).value;
        applyPresetValue(value);
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

  // Info panel
  const infoPanel = container.append("div").attr("class", "bump-info-panel");

  // Scales
  const x = scaleLinear().domain([startYear, endYear]).range([0, width]);
  const y = scaleLinear().domain([1, TOP_N]).range([0, height]);

  // Axes
  const xAxisG = g
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "bump-axis");

  const yAxisG = g.append("g").attr("class", "bump-axis");

  const xAxis = axisBottom(x).tickFormat((d) => String(d)).ticks(Math.min(numYears, 15));
  xAxisG.call(xAxis);

  // Y axis ticks chosen dynamically in render()
  function updateYDomain(maxRank: number) {
    y.domain([1, maxRank]);
    const ticks = [1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
      .filter((t) => t <= maxRank);
    yAxisG.call(axisLeft(y).tickValues(ticks));
  }
  updateYDomain(TOP_N);

  // Line generator
  const lineGen = line<YearRank>()
    .defined((d) => d.rank > 0)
    .x((d) => x(d.year))
    .y((d) => y(d.rank))
    .curve(curveMonotoneX);

  // Groups for layering
  const linesG = g.append("g").attr("class", "bump-lines");
  const labelsG = g.append("g").attr("class", "bump-labels");

  // --- Color ---

  function nameColor(entry: NameEntry, lightMode = true): string {
    // Generate a deterministic hue offset from the name
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

  // Detect dark mode
  function isDark(): boolean {
    return document.body.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
  }

  // --- Highlight (no DOM rebuild) ---
  // Updates line/label/list opacities in-place so pill hover doesn't destroy the × button.
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

  // --- Search ---

  searchInput.on("input", function () {
    const query = (this as HTMLInputElement).value.trim().toLowerCase();
    if (query.length < 2) {
      autocomplete.style("display", "none");
      return;
    }

    const matches = entries
      .filter((e) => {
        if (sexFilter !== "both" && e.sex !== sexFilter) return false;
        return e.name.toLowerCase().startsWith(query);
      })
      .slice(0, 12);

    if (matches.length === 0) {
      autocomplete.style("display", "none");
      return;
    }

    autocomplete.style("display", "block").selectAll("*").remove();
    for (const m of matches) {
      const key = `${m.name}|${m.sex}`;
      autocomplete
        .append("div")
        .attr("class", "bump-ac-item")
        .text(`${m.name} (${m.sex})`)
        .on("mousedown", (e: Event) => {
          e.preventDefault();
          visibleKeys.add(key);
          (searchInput.node() as HTMLInputElement).value = "";
          autocomplete.style("display", "none");
          render();
        });
    }
  });

  searchInput.on("blur", () => {
    setTimeout(() => autocomplete.style("display", "none"), 150);
  });

  // --- Render ---

  function render() {
    const dark = isDark();
    const viewStart = getViewStart();
    x.domain([viewStart, endYear]);
    xAxisG.call(axisBottom(x).tickFormat((d) => String(d)).ticks(Math.min(endYear - viewStart + 1, 15)));
    const visibleEntries = entries.filter((e) => visibleKeys.has(`${e.name}|${e.sex}`));

    // Apply sex filter to visible
    const filtered = visibleEntries.filter(
      (e) => sexFilter === "both" || e.sex === sexFilter
    );

    // Build line data
    interface LineDatum {
      entry: NameEntry;
      key: string;
      points: YearRank[];
    }

    const lineData: LineDatum[] = filtered.map((e) => {
      const key = `${e.name}|${e.sex}`;
      const viewStartIdx = viewStart - startYear;
      const points: YearRank[] = range(viewStartIdx, numYears).map((i) => ({
        year: startYear + i,
        rank: e.ranks[i],
      }));
      return { entry: e, key, points };
    });

    // Update Y axis to fit visible data
    let visibleMax = TOP_N;
    for (const d of lineData) {
      for (const p of d.points) {
        if (p.rank > visibleMax) visibleMax = p.rank;
      }
    }
    updateYDomain(visibleMax);

    // --- Lines ---
    const lines = linesG
      .selectAll<SVGPathElement, LineDatum>(".bump-line")
      .data(lineData, (d: LineDatum) => d.key);

    lines.exit().remove();

    const linesEnter = lines.enter().append("path").attr("class", "bump-line");

    const linesMerged = linesEnter.merge(lines);

    linesMerged
      .attr("d", (d) => lineGen(d.points))
      .attr("stroke", (d) => nameColor(d.entry, !dark))
      .attr("stroke-width", (d) => {
        if (hoveredKey === d.key || pinnedKeys.has(d.key)) return 3;
        return 1.8;
      })
      .attr("fill", "none")
      .attr("opacity", (d) => {
        if (hoveredKey) {
          return hoveredKey === d.key || pinnedKeys.has(d.key) ? 1 : 0.08;
        }
        if (pinnedKeys.size > 0) {
          return pinnedKeys.has(d.key) ? 1 : 0.15;
        }
        return 0.7;
      })
      .style("cursor", "pointer")
      .on("mouseenter", function (_event, d) {
        hoveredKey = d.key;
        showInfo(d.entry);
        render();
      })
      .on("mouseleave", function () {
        hoveredKey = null;
        if (pinnedKeys.size === 0) infoPanel.text("");
        else {
          // Show first pinned
          const first = entries.find((e) => pinnedKeys.has(`${e.name}|${e.sex}`));
          if (first) showInfo(first);
        }
        render();
      })
      .on("click", function (_event, d) {
        if (pinnedKeys.has(d.key)) {
          pinnedKeys.delete(d.key);
        } else {
          pinnedKeys.add(d.key);
        }
        render();
      });

    // --- Labels (right edge) ---
    // Find positions for labels (last defined rank)
    const labelData = lineData
      .map((d) => {
        // Find last year where rank > 0
        let lastYear = -1;
        let lastRank = 0;
        for (let i = numYears - 1; i >= viewStart - startYear; i--) {
          if (d.entry.ranks[i] > 0) {
            lastYear = startYear + i;
            lastRank = d.entry.ranks[i];
            break;
          }
        }
        return { ...d, lastYear, lastRank };
      })
      .filter((d) => d.lastYear >= 0);

    // Simple collision avoidance: sort by Y position, push overlapping labels apart
    const labelHeight = 11;
    labelData.sort((a, b) => y(a.lastRank) - y(b.lastRank));
    const labelPositions: { key: string; yPos: number }[] = [];
    for (const d of labelData) {
      let yPos = y(d.lastRank);
      // Push down if overlapping previous
      for (const prev of labelPositions) {
        if (Math.abs(yPos - prev.yPos) < labelHeight) {
          yPos = prev.yPos + labelHeight;
        }
      }
      // Clamp to chart bounds
      yPos = Math.max(0, Math.min(height, yPos));
      labelPositions.push({ key: d.key, yPos });
    }

    const labelMap = new Map(labelPositions.map((l) => [l.key, l.yPos]));

    type LabelDatum = LineDatum & { lastYear: number; lastRank: number };

    const labels = labelsG
      .selectAll<SVGTextElement, LabelDatum>(".bump-label")
      .data(labelData, (d: LabelDatum) => d.key);

    labels.exit().remove();

    const labelsEnter = labels.enter().append("text").attr("class", "bump-label");

    labelsEnter
      .merge(labels)
      .attr("x", width + 6)
      .attr("y", (d) => (labelMap.get(d.key) ?? y(d.lastRank)) + 4)
      .text((d) => d.entry.name)
      .attr("fill", (d) => nameColor(d.entry, !dark))
      .attr("font-size", "10px")
      .attr("opacity", (d) => {
        if (hoveredKey) return hoveredKey === d.key || pinnedKeys.has(d.key) ? 1 : 0.15;
        if (pinnedKeys.size > 0) return pinnedKeys.has(d.key) ? 1 : 0.25;
        return 0.85;
      });

    // --- Pills ---
    const pillData = Array.from(visibleKeys)
      .map((k) => {
        const e = byKey.get(k);
        return e ? { key: k, entry: e } : null;
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .filter((d) => sexFilter === "both" || d.entry.sex === sexFilter);

    pillsContainer.selectAll("*").remove();
    for (const d of pillData) {
      const pill = pillsContainer
        .append("span")
        .attr("class", `name-pill ${d.entry.sex === "F" ? "female" : "male"}`)
        .on("mouseenter", () => {
          highlightKey(d.key);
          showInfo(d.entry);
        })
        .on("mouseleave", () => {
          highlightKey(null);
          if (pinnedKeys.size === 0) infoPanel.text("");
          else { const first = entries.find((e) => pinnedKeys.has(`${e.name}|${e.sex}`)); if (first) showInfo(first); }
        });

      pill.append("span").text(`${d.entry.name} (${d.entry.sex})`);
      pill
        .append("span")
        .attr("class", "remove")
        .text("×")
        .on("click", (e: Event) => {
          e.stopPropagation();
          visibleKeys.delete(d.key);
          pinnedKeys.delete(d.key);
          render();
        });
    }

    // --- Name list ---
    nameList.selectAll("*").remove();
    const sortedForList = [...lineData].sort((a, b) => {
      const ra = a.entry.ranks[numYears - 1] > 0 ? a.entry.ranks[numYears - 1] : 99999;
      const rb = b.entry.ranks[numYears - 1] > 0 ? b.entry.ranks[numYears - 1] : 99999;
      return ra - rb;
    });
    for (const d of sortedForList) {
      const rank = d.entry.ranks[numYears - 1];
      const item = nameList.append("div")
        .attr("class", `bump-list-item${hoveredKey === d.key ? " hovered" : ""}${pinnedKeys.has(d.key) ? " pinned" : ""}`)
        .attr("data-key", d.key)
        .style("border-left-color", nameColor(d.entry, !dark))
        .on("mouseenter", () => { highlightKey(d.key); showInfo(d.entry); })
        .on("mouseleave", () => {
          highlightKey(null);
          if (pinnedKeys.size === 0) infoPanel.text("");
          else { const first = entries.find((e) => pinnedKeys.has(`${e.name}|${e.sex}`)); if (first) showInfo(first); }
        })
        .on("click", () => {
          if (pinnedKeys.has(d.key)) pinnedKeys.delete(d.key);
          else pinnedKeys.add(d.key);
          render();
        });
      item.append("span").attr("class", "bump-list-rank").text(rank > 0 ? `#${rank}` : "–");
      item.append("span").attr("class", "bump-list-name").style("color", nameColor(d.entry, !dark)).text(d.entry.name);
      item.append("span").attr("class", "bump-list-sex").text(d.entry.sex);
    }
  }

  function showInfo(entry: NameEntry) {
    const viewStart = getViewStart();
    const viewStartIdx = viewStart - startYear;

    const presentRanks: number[] = [];
    let peakRank = 999999;
    let peakYears: number[] = [];
    let worstRank = 0;

    for (let i = viewStartIdx; i < numYears; i++) {
      const r = entry.ranks[i];
      if (r > 0) {
        presentRanks.push(r);
        if (r < peakRank) { peakRank = r; peakYears = [startYear + i]; }
        else if (r === peakRank) { peakYears.push(startYear + i); }
        if (r > worstRank) worstRank = r;
      }
    }

    const currentRank = entry.ranks[numYears - 1];
    const currentStr = currentRank > 0 ? `#${currentRank}` : "outside top";
    const avg = presentRanks.length
      ? presentRanks.reduce((a, b) => a + b, 0) / presentRanks.length : 0;
    const std = presentRanks.length > 1
      ? Math.sqrt(presentRanks.reduce((s, r) => s + (r - avg) ** 2, 0) / presentRanks.length) : 0;
    const peakStr = peakYears.length > 1
      ? `${peakYears[0]}–${peakYears[peakYears.length - 1]}`
      : String(peakYears[0] ?? "–");

    infoPanel.html(
      `<strong>${entry.name}</strong> <span class="bump-stat-sex">(${entry.sex === "F" ? "F" : "M"})</span>` +
      `<span class="bump-stats">` +
      `<span>Peak <b>#${peakRank}</b> <span class="bump-stat-sub">${peakStr}</span></span>` +
      `<span>Now <b>${currentStr}</b></span>` +
      `<span>Avg <b>#${avg.toFixed(0)}</b></span>` +
      `<span>Std dev <b>${std.toFixed(1)}</b></span>` +
      `<span>Worst <b>#${worstRank || "–"}</b></span>` +
      `<span>Present <b>${presentRanks.length}</b> yrs</span>` +
      `</span>`
    );
  }

  // Listen for theme changes
  const observer = new MutationObserver(() => render());
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Initial render
  render();
}

main();
