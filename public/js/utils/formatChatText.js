function escapeChatHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function formatInlineMarkdown(value) {
  return value
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
}

function formatChatText(text) {
  const safeText = escapeChatHtml(text);
  const lines = safeText.split(/\r?\n/);
  let html = "";
  let inList = false;

  lines.forEach((line) => {
    const listItem = line.match(/^\s*(\d+)[.)]\s+(.+)$/);

    if (listItem) {
      if (!inList) {
        html += '<ol class="list-decimal pl-5 space-y-1 my-1">';
        inList = true;
      }
      html += `<li>${formatInlineMarkdown(listItem[2])}</li>`;
      return;
    }

    if (inList) {
      html += "</ol>";
      inList = false;
    }

    if (line.trim()) {
      html += `${formatInlineMarkdown(line)}<br>`;
    } else {
      html += "<br>";
    }
  });

  if (inList) html += "</ol>";
  return html.replace(/(<br>){2,}$/g, "<br>");
}
