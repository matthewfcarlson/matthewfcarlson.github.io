---
title: "{{ replace .Name "-" " " | title }}"
#date: {{ .Date }}
#publishDate: TBD
draft: true
inprogress: true
cover:
    image: "cover.jpg"
tags:
#  - woodworking
#  - webdev
---

## Todo Graph

{{<mermaid>}}
flowchart TD
  %% what's done %%
  classDef done fill:#9f6,stroke:#333,stroke-width:2px;
  %% items %%
  subgraph Items
    %% s_example("Example"):::done
    %% a_weights["Add weights to bottom"]
  end
  %% sequence %%
    %% s_example-->a_weights
{{</mermaid>}}