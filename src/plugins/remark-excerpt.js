function nodeText(node) {
  if (node.type === 'image') return '';
  if (node.value != null) return node.value;
  if (node.children) return node.children.map(nodeText).join('');
  return '';
}

export function remarkExcerpt() {
  return (tree, file) => {
    const parts = [];
    for (const node of tree.children) {
      if (parts.join(' ').length >= 120) break;
      if (node.type === 'paragraph' || node.type === 'heading') {
        const text = nodeText(node).replace(/\s+/g, ' ').trim();
        if (text.length > 1) parts.push(text);
      } else if (node.type === 'list') {
        for (const item of node.children) {
          const text = nodeText(item).replace(/\s+/g, ' ').trim();
          if (text.length > 1) { parts.push(text); break; }
        }
      }
    }
    const excerpt = parts.join(' ').slice(0, 120).trim();
    if (excerpt.length > 4) {
      file.data.astro.frontmatter.excerpt = excerpt;
    }
  };
}
