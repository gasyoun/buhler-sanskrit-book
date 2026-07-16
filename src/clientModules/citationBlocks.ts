/**
 * Citation block anchors (issue #5).
 *
 * Turns each top-level content block of a docs page (paragraph, Sanskrit
 * sentence block, table, list) into a linkable anchor: the block gets an
 * `id="block-N"` and a small clickable number in the left margin, so a passage
 * can be cited/shared by URL as `.../lesson3#block-12`. The number is injected
 * as a real <a> (styled in custom.css) rather than a CSS counter so it can be
 * clicked and linked. Numbers are hidden on narrow screens via CSS.
 */

const BLOCK_SELECTOR =
  ':scope > p, :scope > .sanscript-text, :scope > table, :scope > ul, :scope > ol';

function decorate(): void {
  const roots = document.querySelectorAll<HTMLElement>('.theme-doc-markdown');
  roots.forEach((root) => {
    const blocks = root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR);
    let n = 0;
    blocks.forEach((block) => {
      n += 1;
      const id = `block-${n}`;
      block.id = id;
      block.classList.add('cited-block');

      let anchor = block.querySelector<HTMLAnchorElement>(
        ':scope > a.block-number',
      );
      if (!anchor) {
        anchor = document.createElement('a');
        anchor.className = 'block-number';
        // Absolutely positioned (see custom.css), so it stays out of table/list
        // flow even though it is appended as a child.
        block.appendChild(anchor);
      }
      anchor.href = `#${id}`;
      anchor.textContent = String(n);
      anchor.title = `Блок ${n}`;
      anchor.setAttribute('aria-label', `Ссылка на блок ${n}`);
    });
  });

  honorPendingHash();
  syncTargetHighlight();
}

function hashBlockId(): string | null {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  return /^block-\d+$/.test(id) ? id : null;
}

// The block ids are assigned above (post-hydration), so a `#block-N` present in
// the URL on a fresh load couldn't be resolved by the browser's initial scroll.
// Scroll to it now that the id exists.
function honorPendingHash(): void {
  const id = hashBlockId();
  if (!id) return;
  document.getElementById(id)?.scrollIntoView();
}

// `:target` is not re-evaluated when an element gets its id after page load, so
// the "followed a link here" highlight is driven with an explicit class instead.
function syncTargetHighlight(): void {
  const id = hashBlockId();
  document
    .querySelectorAll<HTMLElement>('.cited-block.block-target')
    .forEach((el) => {
      if (el.id !== id) el.classList.remove('block-target');
    });
  if (id) {
    const el = document.getElementById(id);
    if (el?.classList.contains('cited-block')) el.classList.add('block-target');
  }
}

function schedule(): void {
  if (typeof window === 'undefined') return;
  // Defer until after the route's DOM has painted.
  window.requestAnimationFrame(() => window.requestAnimationFrame(decorate));
}

// Runs after the route's content has rendered — on the initial load (post
// hydration) and after every client-side navigation. Mutating the DOM here
// (rather than eagerly on module load) avoids racing React hydration.
export function onRouteDidUpdate(): void {
  schedule();
}

// Keep the highlight in sync when the hash changes on the same page (clicking a
// block number, browser back/forward). Adding a listener does not touch the DOM,
// so it is safe to register at module load.
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', syncTargetHighlight);
}
