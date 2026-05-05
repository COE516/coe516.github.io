---
layout: none
---

{%- assign searchable_posts = site.posts | where_exp:'doc','doc.search != false' -%}
{%- assign searchable_pages = site.pages | where_exp:'doc','doc.path contains "_pages/" and doc.search != false' -%}
{%- assign searchable_docs = searchable_posts | concat: searchable_pages -%}
var store = [
{%- for doc in searchable_docs -%}
  {%- if doc.header.teaser -%}
    {%- capture teaser -%}{{ doc.header.teaser }}{%- endcapture -%}
  {%- else -%}
    {%- assign teaser = site.teaser -%}
  {%- endif -%}
  {%- capture plain_content -%}
    {{ doc.content | newline_to_br |
      replace:"<br />", " " |
      replace:"</p>", " " |
      replace:"</h1>", " " |
      replace:"</h2>", " " |
      replace:"</h3>", " " |
      replace:"</h4>", " " |
      replace:"</h5>", " " |
      replace:"</h6>", " " |
      strip_html | strip_newlines | strip }}
  {%- endcapture -%}
  {%- capture plain_excerpt -%}
    {%- if doc.excerpt -%}
      {{ doc.excerpt | markdownify | strip_html | strip_newlines | strip }}
    {%- else -%}
      {{ plain_content | truncatewords: 50 }}
    {%- endif -%}
  {%- endcapture -%}
  {
    "title": {{ doc.title | default: doc.name | jsonify }},
    "excerpt": {{ plain_excerpt | strip | jsonify }},
    "content": {{ plain_content | strip | jsonify }},
    "categories": {{ doc.categories | jsonify }},
    "tags": {{ doc.tags | jsonify }},
    "url": {{ doc.url | relative_url | jsonify }},
    "teaser": {{ teaser | relative_url | jsonify }},
    "type": {{ doc.collection | default: "page" | jsonify }}
  }{%- unless forloop.last -%},{%- endunless -%}
{%- endfor -%}
];
