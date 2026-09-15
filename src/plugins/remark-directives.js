import { visit } from 'unist-util-visit';

// remark-directive のノードを静的 HTML 化する。
//   :::info / :::warn / :::danger / :::tip（= :::success） → Alert
//   :::collapse[タイトル]{desc="..."} → <details> 折りたたみ
//   :::tabs / :::tab[ラベル]          → タブ
//   :::changelog / :::release{...}    → 変更履歴タイムライン
//   :::banners                        → バナーを原寸で敷き詰める枠
//   :badge[NEW]{type="info"}          → インラインバッジ
//
// 参照: C:\Users\kirito\site の Discord 開発者ドキュメント風コンポーネント。

// Alert と :badge の種別は同じ語彙で書けるようにしておく（片方でしか通らないと
// 書き手が覚え分けることになるため）。success は tip の別名。
// accent / new は装飾目的でバッジにしか無い。
const ALERT_TYPES = new Map([
  ['info', 'info'],
  ['warn', 'warn'],
  ['danger', 'danger'],
  ['tip', 'tip'],
  ['success', 'tip'],
]);
const KNOWN_DIRECTIVES = new Set([...ALERT_TYPES.keys(), 'collapse', 'details', 'tabs', 'tab', 'changelog', 'release', 'banners']);
const BADGE_TYPES = new Set([...ALERT_TYPES.keys(), 'default', 'accent', 'new']);

// data.directiveLabel が付いた最初の子（[...] で書いたラベル）を取り出す
function takeLabel(node) {
  const idx = node.children.findIndex((c) => c.data && c.data.directiveLabel);
  if (idx === -1) return null;
  const [label] = node.children.splice(idx, 1);
  return label.children;
}

function span(className, children) {
  return {
    type: 'paragraph',
    data: { hName: 'span', hProperties: { className } },
    children,
  };
}

function textSpan(className, value) {
  return span(className, [{ type: 'text', value }]);
}

export default function remarkDirectives() {
  return (tree) => {
    // タブの id は aria-controls / aria-labelledby で相互参照するため、
    // 1ページに複数の :::tabs があっても衝突しないよう連番を振る
    let tabsSeq = 0;
    visit(tree, (node) => {
      // インライン: :badge[テキスト]{type="info"}
      if (node.type === 'textDirective' && node.name === 'badge') {
        const type = (node.attributes && node.attributes.type) || 'default';
        if (!BADGE_TYPES.has(type)) {
          console.warn(`[directives] 知らないバッジ種別なので色が付きません: :badge{type="${type}"}`);
        }
        node.data = {
          hName: 'span',
          hProperties: { className: ['badge', `badge-${type}`] },
        };
        return;
      }

      if (node.type !== 'containerDirective') return;
      const data = node.data || (node.data = {});

      // Alert
      if (ALERT_TYPES.has(node.name)) {
        data.hName = 'aside';
        data.hProperties = { className: ['alert', `alert-${ALERT_TYPES.get(node.name)}`] };
        // アイコン枠（中身は CSS の mask-image で描画）
        node.children.unshift({
          type: 'paragraph',
          data: { hName: 'span', hProperties: { className: ['alert-icon'], 'aria-hidden': 'true' } },
          children: [],
        });
        // 本文をまとめる
        return;
      }

      // Collapsible（<details>）
      if (node.name === 'collapse' || node.name === 'details') {
        const titleChildren = takeLabel(node) || [{ type: 'text', value: '詳細' }];
        const desc = node.attributes && node.attributes.desc;
        const summaryChildren = [
          span(['collapsible-title'], titleChildren),
          ...(desc ? [textSpan(['collapsible-desc'], desc)] : []),
          { type: 'paragraph', data: { hName: 'span', hProperties: { className: ['collapsible-chevron'], 'aria-hidden': 'true' } }, children: [] },
        ];
        node.children.unshift({
          type: 'paragraph',
          data: { hName: 'summary', hProperties: { className: ['collapsible-summary'] } },
          children: summaryChildren,
        });
        data.hName = 'details';
        data.hProperties = { className: ['collapsible'] };
        return;
      }

      // Tabs
      if (node.name === 'tabs') {
        const tabs = node.children.filter(
          (c) => c.type === 'containerDirective' && c.name === 'tab'
        );
        const gid = `tabs-${++tabsSeq}`;
        const tabId = (i) => `${gid}-tab-${i}`;
        const panelId = (i) => `${gid}-panel-${i}`;
        const buttons = tabs.map((tab, i) => {
          const label = takeLabel(tab) || [{ type: 'text', value: `Tab ${i + 1}` }];
          return {
            type: 'paragraph',
            data: {
              hName: 'button',
              hProperties: {
                type: 'button',
                role: 'tab',
                id: tabId(i),
                ariaSelected: i === 0 ? 'true' : 'false',
                ariaControls: panelId(i),
                // 選択中のタブだけを Tab キーの移動先にし、左右キーで切り替える
                tabIndex: i === 0 ? 0 : -1,
                className: ['tab-btn', ...(i === 0 ? ['active'] : [])],
                dataIndex: String(i),
              },
            },
            children: label,
          };
        });
        tabs.forEach((tab, i) => {
          tab.data = {
            hName: 'div',
            hProperties: {
              role: 'tabpanel',
              id: panelId(i),
              ariaLabelledBy: tabId(i),
              tabIndex: 0,
              className: ['tab-panel', ...(i === 0 ? ['active'] : [])],
            },
          };
        });
        const tablist = {
          type: 'paragraph',
          data: { hName: 'div', hProperties: { className: ['tab-list'], role: 'tablist' } },
          children: buttons,
        };
        node.children = [tablist, ...tabs];
        data.hName = 'div';
        data.hProperties = { className: ['tabs'] };
        return;
      }

      // バナーの壁（88x31 などを敷き詰める）
      if (node.name === 'banners') {
        data.hName = 'div';
        data.hProperties = { className: ['banner-wall'] };
        return;
      }

      // Changelog
      if (node.name === 'changelog') {
        data.hName = 'div';
        data.hProperties = { className: ['changelog'] };
        return;
      }
      if (node.name === 'release') {
        const version = node.attributes && node.attributes.version;
        const date = node.attributes && node.attributes.date;
        const head = {
          type: 'paragraph',
          data: { hName: 'div', hProperties: { className: ['release-head'] } },
          children: [
            ...(version ? [textSpan(['release-version'], version)] : []),
            ...(date ? [textSpan(['release-date'], date)] : []),
          ],
        };
        node.children.unshift(head);
        data.hName = 'div';
        data.hProperties = { className: ['release'] };
        return;
      }

      // 綴り違いは黙って消える（HTML に何も出ない）ので、ビルドログに残す
      if (!KNOWN_DIRECTIVES.has(node.name)) {
        console.warn(`[directives] 知らないディレクティブなので無視します: :::${node.name}`);
      }
    });
  };
}
