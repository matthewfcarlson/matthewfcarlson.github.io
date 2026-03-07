---
title: "Interactive D3 Charts in Hugo"
publishDate: 2026-03-07T12:00:00-06:00
draft: true
tags:
  - web
  - typescript
  - d3
description: "A demo of embedding interactive D3.js charts directly in Hugo blog posts using TypeScript and esbuild."
showtoc: false
---

One thing I've wanted for a while is the ability to drop interactive visualizations into blog posts without setting up a separate build pipeline. Hugo has esbuild built in via `js.Build`, so we can compile TypeScript, resolve npm packages, tree-shake, and bundle — all from a simple shortcode.

## How it works

A `{{</* typescript */>}}` shortcode reads a `.ts` file from the post's page bundle, compiles it with Hugo's `js.Build`, and outputs a mount `<div>` plus a `<script>` tag. The TypeScript file lives right alongside `index.md`, keeping the post self-contained.

## Demo: Interactive Bar Chart

The chart below is rendered entirely by D3.js, compiled from TypeScript at build time. Hover over bars to see values, and click to highlight them.

{{< typescript src="chart.ts" >}}

The source for this chart is `chart.ts` in the same directory as this post. It imports from `d3` (tree-shaken to only include what's needed) and mounts into the `<div>` created by the shortcode.

## Usage

To add an interactive TypeScript component to any post:

1. Create a `.ts` file in your post's page bundle directory
2. Use the shortcode in your markdown:

```markdown
{{</* typescript src="chart.ts" */>}}
```

That's it. Hugo handles the rest — TypeScript compilation, npm resolution, tree-shaking, minification in production, and fingerprinting.
