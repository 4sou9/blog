export function remarkExcerpt() {
  return (tree, file) => {
    for (const node of tree.children) {
      if (node.type === 'paragraph') {
        const text = node.children.map((n) => n.value ?? '').join('').trim().slice(0, 120);
        if (text.length > 4) {
          file.data.astro.frontmatter.excerpt = text;
          break;
        }
      } else if (node.type === 'list') {
        for (const item of node.children) {
          const text = (item.children ?? [])
            .flatMap((n) => n.children ?? [n])
            .map((n) => n.value ?? '')
            .join('').trim().slice(0, 120);
          if (text.length > 4) {
            file.data.astro.frontmatter.excerpt = text;
            return;
          }
        }
      }
    }
  };
}
