(function () {
  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[_/\\.,:;!?()[\]{}"'`~@#$%^&*+=|<>-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildSnippet(text, query) {
    var source = String(text || "").replace(/\s+/g, " ").trim();
    if (!source) {
      return "";
    }

    var normalizedQuery = normalizeText(query);
    var terms = normalizedQuery.split(" ").filter(Boolean);
    var snippetLength = 120;
    var matchIndex = -1;
    var matchTerm = "";

    if (normalizedQuery) {
      matchIndex = source.toLowerCase().indexOf(normalizedQuery);
      matchTerm = query;
    }

    if (matchIndex === -1) {
      for (var i = 0; i < terms.length; i += 1) {
        var index = source.toLowerCase().indexOf(terms[i]);
        if (index !== -1) {
          matchIndex = index;
          matchTerm = terms[i];
          break;
        }
      }
    }

    if (matchIndex === -1) {
      var fallback = source.slice(0, snippetLength).trim();
      return escapeHtml(fallback) + (source.length > snippetLength ? "..." : "");
    }

    var start = Math.max(0, matchIndex - 40);
    var end = Math.min(source.length, matchIndex + Math.max(matchTerm.length, 20) + 40);
    var snippet = source.slice(start, end).trim();
    var escapedSnippet = escapeHtml(snippet);
    var highlightTerm = escapeRegExp(matchTerm || normalizedQuery);

    if (highlightTerm) {
      escapedSnippet = escapedSnippet.replace(new RegExp("(" + highlightTerm + ")", "ig"), "<mark>$1</mark>");
    }

    if (start > 0) {
      escapedSnippet = "..." + escapedSnippet;
    }
    if (end < source.length) {
      escapedSnippet += "...";
    }

    return escapedSnippet;
  }

  function getFields(item) {
    var categories = toArray(item.categories).join(" ");
    var tags = toArray(item.tags).join(" ");
    var excerpt = item.excerpt || "";
    var content = item.content || excerpt;

    return {
      title: item.title || "",
      categories: categories,
      tags: tags,
      excerpt: excerpt,
      content: content,
      combined: [item.title, categories, tags, excerpt, content].join(" ")
    };
  }

  function scoreItem(item, query) {
    var normalizedQuery = normalizeText(query);
    var terms = normalizedQuery.split(" ").filter(Boolean);
    if (!terms.length) {
      return null;
    }

    var fields = getFields(item);
    var normalizedFields = {
      title: normalizeText(fields.title),
      categories: normalizeText(fields.categories),
      tags: normalizeText(fields.tags),
      excerpt: normalizeText(fields.excerpt),
      content: normalizeText(fields.content),
      combined: normalizeText(fields.combined)
    };

    for (var i = 0; i < terms.length; i += 1) {
      if (normalizedFields.combined.indexOf(terms[i]) === -1) {
        return null;
      }
    }

    var score = 0;

    if (normalizedFields.title === normalizedQuery) {
      score += 300;
    } else if (normalizedFields.title.indexOf(normalizedQuery) !== -1) {
      score += 180;
    }

    if (normalizedFields.tags.indexOf(normalizedQuery) !== -1 || normalizedFields.categories.indexOf(normalizedQuery) !== -1) {
      score += 120;
    }

    if (normalizedFields.excerpt.indexOf(normalizedQuery) !== -1) {
      score += 70;
    }

    if (normalizedFields.content.indexOf(normalizedQuery) !== -1) {
      score += 50;
    }

    terms.forEach(function (term) {
      if (normalizedFields.title.indexOf(term) !== -1) {
        score += 40;
      }
      if (normalizedFields.tags.indexOf(term) !== -1) {
        score += 25;
      }
      if (normalizedFields.categories.indexOf(term) !== -1) {
        score += 20;
      }
      if (normalizedFields.excerpt.indexOf(term) !== -1) {
        score += 12;
      }
      if (normalizedFields.content.indexOf(term) !== -1) {
        score += 6;
      }
    });

    return {
      item: item,
      score: score,
      fields: fields
    };
  }

  function renderResults($results, matches, query) {
    $results.empty();

    if (!query) {
      return;
    }

    $results.append('<p class="results__found">' + matches.length + ' {{ site.data.ui-text[site.locale].results_found | default: "Result(s) found" }}</p>');

    if (!matches.length) {
      $results.append('<p class="archive__item-excerpt">검색 결과가 없습니다.</p>');
      return;
    }

    matches.forEach(function (match) {
      var item = match.item;
      var teaser = item.teaser
        ? '<div class="archive__item-teaser"><img src="' + escapeHtml(item.teaser) + '" alt=""></div>'
        : '';
      var snippetSource = match.fields.excerpt || match.fields.content;
      var snippet = buildSnippet(snippetSource, query);
      var searchItem =
        '<div class="list__item">' +
          '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">' +
            '<h2 class="archive__item-title" itemprop="headline">' +
              '<a href="' + escapeHtml(item.url) + '" rel="permalink">' + escapeHtml(item.title) + '</a>' +
            '</h2>' +
            teaser +
            '<p class="archive__item-excerpt" itemprop="description">' + snippet + '</p>' +
          '</article>' +
        '</div>';

      $results.append(searchItem);
    });
  }

  function findResults(query) {
    return store
      .map(function (item) {
        return scoreItem(item, query);
      })
      .filter(Boolean)
      .sort(function (left, right) {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return String(left.item.title || "").localeCompare(String(right.item.title || ""), "ko");
      });
  }

  function getResultContainer($input) {
    return $input.closest('.search-content__inner-wrap, .archive').find('.results').first();
  }

  function searchAndRender($input) {
    var query = $input.val().trim();
    var $results = getResultContainer($input);

    if (!$results.length) {
      return;
    }

    if (!query) {
      $results.empty();
      return;
    }

    renderResults($results, findResults(query), query);
  }

  $(document).ready(function () {
    $('input#search').on('input', function () {
      searchAndRender($(this));
    });
  });
})();
