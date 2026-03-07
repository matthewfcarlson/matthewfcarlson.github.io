import {
  select,
  scaleLinear,
  scaleBand,
  axisBottom,
  axisLeft,
  max,
  format,
} from "d3";

interface DataPoint {
  label: string;
  value: number;
}

const data: DataPoint[] = [
  { label: "Rust", value: 87 },
  { label: "TypeScript", value: 73 },
  { label: "Python", value: 68 },
  { label: "Go", value: 62 },
  { label: "C++", value: 48 },
  { label: "Java", value: 45 },
  { label: "C#", value: 40 },
  { label: "Zig", value: 32 },
];

const container = select("#chart");
const wrapper = container.append("div").attr("class", "chart-wrapper");

const margin = { top: 20, right: 20, bottom: 40, left: 50 };
const width = 600 - margin.left - margin.right;
const height = 360 - margin.top - margin.bottom;

const svg = wrapper
  .append("svg")
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const x = scaleBand<string>()
  .domain(data.map((d) => d.label))
  .range([0, width])
  .padding(0.2);

const y = scaleLinear()
  .domain([0, max(data, (d) => d.value)! * 1.1])
  .range([height, 0]);

// Axes
svg
  .append("g")
  .attr("transform", `translate(0,${height})`)
  .call(axisBottom(x))
  .selectAll("text")
  .attr("transform", "rotate(-25)")
  .style("text-anchor", "end");

svg.append("g").call(axisLeft(y).ticks(6));

// Y-axis label
svg
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left + 12)
  .attr("x", -height / 2)
  .attr("text-anchor", "middle")
  .attr("fill", "currentColor")
  .style("font-size", "12px")
  .text("Developer satisfaction %");

// Tooltip
const tooltip = wrapper
  .append("div")
  .style("position", "absolute")
  .style("background", "var(--theme)")
  .style("border", "1px solid var(--border)")
  .style("border-radius", "4px")
  .style("padding", "6px 10px")
  .style("font-size", "13px")
  .style("pointer-events", "none")
  .style("opacity", "0")
  .style("transition", "opacity 0.15s");

const pctFmt = format(".0f");

// Bars
svg
  .selectAll<SVGRectElement, DataPoint>(".bar")
  .data(data)
  .join("rect")
  .attr("class", "bar")
  .attr("x", (d) => x(d.label)!)
  .attr("width", x.bandwidth())
  .attr("y", height) // start from bottom for animation
  .attr("height", 0)
  .attr("rx", 3)
  .attr("fill", "var(--primary)")
  .style("cursor", "pointer")
  .on("mouseenter", function (_event, d) {
    select(this).attr("fill", "var(--secondary)");
    tooltip
      .style("opacity", "1")
      .html(`<strong>${d.label}</strong>: ${pctFmt(d.value)}%`);
  })
  .on("mousemove", function (event) {
    const [mx, my] = [event.offsetX, event.offsetY];
    tooltip.style("left", mx + 12 + "px").style("top", my - 28 + "px");
  })
  .on("mouseleave", function (_event, d) {
    const el = select(this);
    if (!el.classed("selected")) {
      el.attr("fill", "var(--primary)");
    }
    tooltip.style("opacity", "0");
  })
  .on("click", function () {
    const el = select(this);
    const wasSelected = el.classed("selected");
    // Deselect all
    svg.selectAll(".bar").classed("selected", false).attr("fill", "var(--primary)");
    if (!wasSelected) {
      el.classed("selected", true).attr("fill", "var(--secondary)");
    }
  })
  // Animate bars in
  .transition()
  .duration(600)
  .delay((_d, i) => i * 60)
  .attr("y", (d) => y(d.value))
  .attr("height", (d) => height - y(d.value));
