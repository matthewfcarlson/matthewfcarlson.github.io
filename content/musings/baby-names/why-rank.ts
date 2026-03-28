import {
  select,
  scaleLinear,
  axisBottom,
  axisLeft,
  line,
  curveMonotoneX,
  max,
} from "d3";

interface SupplementData {
  startYear: number;
  endYear: number;
  williamPct: number[];
  williamRank: number[];
}

const CONTAINER_ID = "why-rank";

async function main() {
  const container = select(`#${CONTAINER_ID}`);
  container.classed("bump-chart-root", true);

  container.append("div").attr("class", "bump-loading").text("Loading…");

  let data: SupplementData;
  try {
    const res = await fetch("names-supplement.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch {
    container.select(".bump-loading").text("Failed to load data. Please refresh.");
    return;
  }
  container.select(".bump-loading").remove();

  const { startYear, endYear, williamPct, williamRank } = data;
  const numYears = endYear - startYear + 1;
  const years = Array.from({ length: numYears }, (_, i) => startYear + i);

  function isDark() {
    return document.body.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
  }

  // --- Shared layout ---
  const margin = { top: 14, right: 16, bottom: 32, left: 48 };
  const chartW = 380 - margin.left - margin.right;
  const chartH = 220 - margin.top - margin.bottom;

  const wrap = container.append("div").attr("class", "why-rank-pair");

  // ── Chart 1: William as % of total male births ──────────────────────────
  const div1 = wrap.append("div").attr("class", "why-rank-chart");
  div1.append("div").attr("class", "why-rank-title")
    .text("William — % of all male births");

  const svg1 = div1.append("svg")
    .attr("viewBox", `0 0 ${chartW + margin.left + margin.right} ${chartH + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g1 = svg1.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x1 = scaleLinear().domain([startYear, endYear]).range([0, chartW]);
  const y1 = scaleLinear().domain([0, max(williamPct)! * 1.05]).range([chartH, 0]);

  g1.append("g").attr("transform", `translate(0,${chartH})`).attr("class", "bump-axis")
    .call(axisBottom(x1).ticks(6).tickFormat(d => String(d)));
  g1.append("g").attr("class", "bump-axis")
    .call(axisLeft(y1).ticks(5).tickFormat(d => `${(+d).toFixed(1)}%`));

  const lineGen1 = line<number>()
    .x((_, i) => x1(years[i]))
    .y(d => y1(d))
    .curve(curveMonotoneX);

  g1.append("path")
    .datum(williamPct)
    .attr("fill", "none")
    .attr("stroke", isDark() ? "hsl(210,70%,60%)" : "hsl(210,70%,45%)")
    .attr("stroke-width", 2)
    .attr("d", lineGen1);

  // annotation: "naming diversity means all %s shrink"
  g1.append("text")
    .attr("x", x1(1960))
    .attr("y", y1(williamPct[1960 - startYear]) - 8)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "var(--secondary)")
    .text("diversity pulls every % down");

  // ── Chart 2: William's rank ──────────────────────────────────────────────
  const div2 = wrap.append("div").attr("class", "why-rank-chart");
  div2.append("div").attr("class", "why-rank-title")
    .text("William — rank over time");

  const svg2 = div2.append("svg")
    .attr("viewBox", `0 0 ${chartW + margin.left + margin.right} ${chartH + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g2 = svg2.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const williamPoints = years
    .map((yr, i) => ({ yr, rank: williamRank[i] }))
    .filter(d => d.rank > 0);

  const maxRank = max(williamPoints, d => d.rank)!;
  const x2 = scaleLinear().domain([startYear, endYear]).range([0, chartW]);
  const y2 = scaleLinear().domain([1, maxRank]).range([0, chartH]);

  g2.append("g").attr("transform", `translate(0,${chartH})`).attr("class", "bump-axis")
    .call(axisBottom(x2).ticks(6).tickFormat(d => String(d)));
  g2.append("g").attr("class", "bump-axis")
    .call(axisLeft(y2).tickValues([1, 5, 10, 25, 50, maxRank]).tickFormat(d => `#${d}`));

  const lineGen2 = line<{ yr: number; rank: number }>()
    .x(d => x2(d.yr))
    .y(d => y2(d.rank))
    .curve(curveMonotoneX);

  g2.append("path")
    .datum(williamPoints)
    .attr("fill", "none")
    .attr("stroke", isDark() ? "hsl(210,70%,60%)" : "hsl(210,70%,45%)")
    .attr("stroke-width", 2)
    .attr("d", lineGen2);

  // annotation at peak
  const peakPoint = williamPoints.reduce((best, d) => d.rank < best.rank ? d : best);
  g2.append("text")
    .attr("x", x2(peakPoint.yr))
    .attr("y", y2(peakPoint.rank) + 14)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "var(--secondary)")
    .text(`peak #${peakPoint.rank} (${peakPoint.yr})`);

  // Re-render strokes on theme change
  const observer = new MutationObserver(() => {
    const dark = isDark();
    svg1.select("path").attr("stroke", dark ? "hsl(210,70%,60%)" : "hsl(210,70%,45%)");
    svg2.select("path").attr("stroke", dark ? "hsl(210,70%,60%)" : "hsl(210,70%,45%)");
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

main();
