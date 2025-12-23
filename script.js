
if (window.__uuRootScriptInitialized) {
	console.debug('Universal Understanding (root) script already initialized');
} else {
	window.__uuRootScriptInitialized = true;
	document.addEventListener('DOMContentLoaded', function() {
		// Ensure the main stylesheet is loaded — some deeply-nested pages use
		// incorrect relative paths which can cause layout, font, and colour issues
		// on iPad/file:// views. If the expected `.container` rule isn't present,
		// try injecting candidate stylesheet locations.
		(function ensureStylesLoaded() {
			try {
				const hasContainer = !!document.querySelector('.container');
				if (!hasContainer) return; // nothing to check
				const el = document.querySelector('.container');
				const cs = window.getComputedStyle && window.getComputedStyle(el);
				const maxWidth = cs ? cs.maxWidth : '';
				// If maxWidth is 'none' or empty, stylesheet probably didn't load
				if (maxWidth && maxWidth !== '0px' && maxWidth !== 'none') return;
				// Build candidate hrefs relative to the current location and origin
				const origin = window.location.origin;
				const pathnameParts = (window.location.pathname || '/').split('/').filter(Boolean);
				const candidates = [
					'styles.css', './styles.css', '/styles.css',
					'Website/styles.css', './Website/styles.css', '/Website/styles.css',
					origin + '/styles.css', origin + '/Website/styles.css'
				];
				for (let i = pathnameParts.length; i >= 0; i--) {
					const prefix = '/' + pathnameParts.slice(0, i).join('/');
					candidates.push(prefix.replace(/\/+/g, '/') + '/styles.css');
					candidates.push(prefix.replace(/\/+/g, '/') + '/Website/styles.css');
					candidates.push(origin + prefix.replace(/\/+/g, '/') + '/styles.css');
					candidates.push(origin + prefix.replace(/\/+/g, '/') + '/Website/styles.css');
				}
				// Try to insert the first candidate that fetches successfully
				(function tryInject(i) {
					if (i >= candidates.length) return;
					const href = candidates[i];
					fetch(href, { method: 'GET', cache: 'no-store' })
						.then(r => {
							if (!r || !r.ok) return tryInject(i+1);
							return r.text()
								.then(txt => {
									if (!txt || txt.length < 10) return tryInject(i+1);
									const link = document.createElement('link');
									link.rel = 'stylesheet';
									link.href = href;
									document.head.appendChild(link);
									link.onload = function() {
										try { if (window.__uuDepthTimer) clearTimeout(window.__uuDepthTimer); } catch(e){}
										// Re-run card depth setup after styles are present
										try { setCardDepths(); } catch (err) {}
									};
								});
						})
						.catch(() => tryInject(i+1));
				}).call(null, 0);
			} catch (err) { /* ignore */ }
		})();
		// Freshness check: when the user opens the site directly (no same-origin referrer),
		// fetch the current page with `cache: "no-store"` and compare the 'Latest Update'
		// marker. If the fetched HTML differs (newer), reload with a cache-busting query
		// so GitHub Pages / the browser returns the latest content instead of a stale copy.
		(function ensurePageIsFreshOnEntry() {
			try {
				const updateEl = document.querySelector('.update-date');
				if (!updateEl) return;
				// Only run this when the user navigated directly (initial open)
				const ref = (document.referrer || '');
				const isDirectOpen = !ref || (new URL(ref, location.href).origin !== location.origin);
				if (!isDirectOpen) return;
				const currentMarker = updateEl.textContent.trim();
				fetch(location.href, { cache: 'no-store', credentials: 'same-origin' })
					.then(r => r.text())
					.then(txt => {
						if (!txt) return;
						// If the fresh HTML doesn't contain the same update marker, it's likely newer.
						if (!txt.includes(currentMarker)) {
							const u = new URL(location.href);
							u.searchParams.set('_', Date.now());
							location.replace(u.toString());
						}
					})
					.catch(() => {});
			} catch (e) { /* ignore */ }
		})();
	// Compute and cache script base URL for robust link resolution later
	(function computeScriptBase() {
		try {
			let scriptSrc = (document.currentScript && document.currentScript.src) || '';
			if (!scriptSrc) {
				const scripts = Array.from(document.getElementsByTagName('script'));
				for (let i = scripts.length - 1; i >= 0; i--) {
					const s = scripts[i].src || '';
					if (s && s.toLowerCase().indexOf('/script.js') !== -1) { scriptSrc = s; break; }
				}
			}
			if (scriptSrc) {
				window.__uuScriptBase = scriptSrc.slice(0, scriptSrc.lastIndexOf('/') + 1);
			} else {
				window.__uuScriptBase = window.location.origin + (window.location.pathname || '/');
			}
		} catch (e) { window.__uuScriptBase = window.location.origin + (window.location.pathname || '/'); }
	})();
	// Theme toggle functionality (ensure a toggle exists)
	let themeToggle = document.getElementById('themeToggle');
	const htmlElement = document.documentElement;
	const body = document.body;

	// Load saved theme preference
	const savedTheme = (function() { try { return localStorage.getItem('theme') || 'dark'; } catch (e) { return 'dark'; } })();
	if (savedTheme === 'light') {
		body.classList.add('light-mode');
		htmlElement.classList.add('light-mode');
	} else {
		body.classList.remove('light-mode');
		htmlElement.classList.remove('light-mode');
	}

	// Unified toggle function (outer-scoped so mobile/Safari can access it reliably)
	let __uuToggleLock = false;
	function toggleTheme(e) {
		if (e && e.preventDefault) e.preventDefault();
		if (__uuToggleLock) return;
		__uuToggleLock = true;
		try {
			const isLightMode = body.classList.toggle('light-mode');
			htmlElement.classList.toggle('light-mode', isLightMode);
			const btn = document.getElementById('themeToggle');
			if (btn) {
				btn.textContent = isLightMode ? 'Light' : 'Dark';
				btn.setAttribute('aria-pressed', isLightMode ? 'true' : 'false');
				btn.disabled = false;
				btn.style.pointerEvents = 'auto';
			}
			try { localStorage.setItem('theme', isLightMode ? 'light' : 'dark'); } catch (err) {}
		} finally {
			setTimeout(function(){ __uuToggleLock = false; }, 300);
		}
	}

	if (!themeToggle) {
		const nav = document.querySelector('.top-nav ul');
		if (nav) {
			const li = document.createElement('li');
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'theme-toggle';
			btn.id = 'themeToggle';
			btn.textContent = body.classList.contains('light-mode') ? 'Light' : 'Dark';
			btn.setAttribute('aria-pressed', body.classList.contains('light-mode') ? 'true' : 'false');
			btn.setAttribute('tabindex', '0');
			li.appendChild(btn);
			nav.appendChild(li);
			themeToggle = btn;
		}
	}

	if (themeToggle) {
		const isLight = body.classList.contains('light-mode');
		themeToggle.textContent = isLight ? 'Light' : 'Dark';
		themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
		themeToggle.setAttribute('tabindex', '0');
		// Attach events that all call the same outer-scoped toggle. Use both click and touchend
		// for compatibility; the toggle function has a short lock to avoid double-firing.
		themeToggle.addEventListener('click', toggleTheme, { passive: false });
		themeToggle.addEventListener('touchend', function(e) { if (e && e.preventDefault) e.preventDefault(); toggleTheme(e); }, { passive: false });
		themeToggle.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { if (e && e.preventDefault) e.preventDefault(); toggleTheme(e); } });
	}

	// Search functionality
	const searchBar = document.getElementById('siteSearch');
	const searchResults = document.getElementById('searchResults');
  
	// Define searchable topics (base list). We'll merge with generated sitemap when available.
	const topics = [
		{ title: 'Mathematical Foundations', path: 'Scientia/1-Mathematical-Foundations/index.html', section: 'Scientia', ref: 'SC1' },
		{ title: 'Algebra & Functions', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.1' },
		{ title: 'Basic Algebraic Manipulations', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/1-1-1-Basic-Algebraic-Manipulations/index.html', section: 'Scientia > Mathematical Foundations > Algebra & Functions', ref: 'SC1.1.1' },
		{ title: 'Exponents, Logarithms & Identities', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/1-1-2-Exponents-Logarithms-Identities/index.html', section: 'Scientia > Mathematical Foundations > Algebra & Functions', ref: 'SC1.1.2' },
		{ title: 'Trigonometric & Inverse Functions', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/1-1-3-Trigonometric-Inverse-Functions/index.html', section: 'Scientia > Mathematical Foundations > Algebra & Functions', ref: 'SC1.1.3' },
		{ title: 'Graphs & Transformations', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/1-1-4-Graphs-Transformations/index.html', section: 'Scientia > Mathematical Foundations > Algebra & Functions', ref: 'SC1.1.4' },
		{ title: 'Combinations & Permutations', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/1-1-5-Combinations-Permutations/index.html', section: 'Scientia > Mathematical Foundations > Algebra & Functions', ref: 'SC1.1.5' },
		{ title: 'Binomial Theorem (Binomial Expansion)', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/1-1-6-Binomial-Theorem/index.html', section: 'Scientia > Mathematical Foundations > Algebra & Functions', ref: 'SC1.1.6' },
		{ title: 'Sigma Notation & Summation', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/1-1-7-Sigma-Notation-Summation/index.html', section: 'Scientia > Mathematical Foundations > Algebra & Functions', ref: 'SC1.1.7' },
		{ title: 'Inequalities & Modulus', path: 'Scientia/1-Mathematical-Foundations/1-1-Algebra-and-Functions/1-1-8-Inequalities-Modulus/index.html', section: 'Scientia > Mathematical Foundations > Algebra & Functions', ref: 'SC1.1.8' },
		{ title: 'Calculus', path: 'Website/Scientia/1-Mathematical-Foundations/1-2-Calculus/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.2' },
		{ title: 'Linear Algebra', path: 'Website/Scientia/1-Mathematical-Foundations/1-3-Linear-Algebra/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.3' },
		{ title: 'Differential Equations', path: 'Website/Scientia/1-Mathematical-Foundations/1-4-Differential-Equations/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.4' },
		{ title: 'Complex Numbers & Complex Analysis', path: 'Website/Scientia/1-Mathematical-Foundations/1-5-Complex-Numbers/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.5' },
		{ title: 'Vector & Tensor Calculus', path: 'Website/Scientia/1-Mathematical-Foundations/1-6-Vector-and-Tensor-Calculus/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.6' },
		{ title: 'Differential Geometry', path: 'Website/Scientia/1-Mathematical-Foundations/1-7-Differential-Geometry/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.7' },
		{ title: 'Probability & Statistics', path: 'Website/Scientia/1-Mathematical-Foundations/1-8-Probability-and-Statistics/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.8' },
		{ title: 'Fourier & Transform Methods', path: 'Website/Scientia/1-Mathematical-Foundations/1-9-Fourier-and-Transform-Methods/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.9' },
		{ title: 'Group Theory Basics', path: 'Website/Scientia/1-Mathematical-Foundations/1-10-Group-Theory-Basics/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.10' },
		{ title: 'Number Theory', path: 'Website/Scientia/1-Mathematical-Foundations/1-11-Number-Theory/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.11' },
		{ title: 'Topology Basics', path: 'Website/Scientia/1-Mathematical-Foundations/1-12-Topology-Basics/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.12' },
		{ title: 'Advanced Linear Algebra & Functional Analysis', path: 'Website/Scientia/1-Mathematical-Foundations/1-13-Advanced-Linear-Algebra/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.13' },
		{ title: 'Transcendental Functions', path: 'Website/Scientia/1-Mathematical-Foundations/1-14-Transcendental-Functions/index.html', section: 'Scientia > Mathematical Foundations', ref: 'SC1.14' },
		{ title: 'Physics Foundations', path: 'Website/Scientia/2-Physics-Foundations/index.html', section: 'Scientia', ref: 'SC2' },
		{ title: 'Quantum Mechanics', path: 'Website/Scientia/3-Quantum-Mechanics/index.html', section: 'Scientia', ref: 'SC3' },
		{ title: 'Relativity', path: 'Website/Scientia/4-Relativity/index.html', section: 'Scientia', ref: 'SC4' },
		{ title: 'Foundational Biomedical Sciences', path: 'Vitalis/1-Foundational-Biomedical-Sciences/index.html', section: 'Vitalis', ref: 'VI1' },
		{ title: 'Biochemistry', path: 'Vitalis/1-Foundational-Biomedical-Sciences/1-2-Biochemistry/index.html', section: 'Vitalis > Foundational Biomedical Sciences', ref: 'VI1.2' },
		{ title: 'Lipid and Fatty Acid Metabolism', path: 'Vitalis/1-Foundational-Biomedical-Sciences/1-2-Biochemistry/1-2-4-Lipid-and-Fatty-Acid-Metabolism/index.html', section: 'Vitalis > Biochemistry', ref: 'VI1.2.4' },
		{ title: 'Beta Oxidation and Ketogenesis', displayTitle: 'Lipid and Fatty Acid Metabolism', path: 'Vitalis/1-Foundational-Biomedical-Sciences/1-2-Biochemistry/1-2-4-Lipid-and-Fatty-Acid-Metabolism/1-2-4-1-Beta-Oxidation-and-Ketogenesis/index.html', section: 'Vitalis > Biochemistry > Lipid and Fatty Acid Metabolism', ref: 'VI1.2.4.1' },
		{ title: 'Lipoprotein Metabolism', path: 'Vitalis/1-Foundational-Biomedical-Sciences/1-2-Biochemistry/1-2-4-Lipid-and-Fatty-Acid-Metabolism/1-2-4-3-Lipoprotein-Metabolism/index.html', section: 'Vitalis > Biochemistry > Lipid and Fatty Acid Metabolism', ref: 'VI1.2.4.3' },
		{ title: 'Cholesterol Synthesis', path: 'Vitalis/1-Foundational-Biomedical-Sciences/1-2-Biochemistry/1-2-4-Lipid-and-Fatty-Acid-Metabolism/1-2-4-2-Cholesterol-Synthesis/index.html', section: 'Vitalis > Biochemistry > Lipid and Fatty Acid Metabolism', ref: 'VI1.2.4.2' },
		{ title: 'Anatomy & Human Structure', path: 'Vitalis/2-Anatomy-and-Human-Structure/index.html', section: 'Vitalis', ref: 'VI2' },
		{ title: 'Physiology', path: 'Vitalis/3-Physiology/index.html', section: 'Vitalis', ref: 'VI3' },
		{ title: 'Pathology', path: 'Vitalis/4-Pathology/index.html', section: 'Vitalis', ref: 'VI4' },
		{ title: 'Pharmacology', path: 'Vitalis/5-Pharmacology/index.html', section: 'Vitalis', ref: 'VI5' },
		{ title: 'Clinical Medicine', path: 'Vitalis/6-Clinical-Medicine/index.html', section: 'Vitalis', ref: 'VI6' },
		{ title: 'Medical Specialties & Subspecialties', path: 'Vitalis/7-Medical-Specialties/index.html', section: 'Vitalis', ref: 'VI7' },
		{ title: 'Advanced & Research Medicine', path: 'Vitalis/8-Advanced-Research-Medicine/index.html', section: 'Vitalis', ref: 'VI8' }
	];

	// Map path -> canonical title from sitemap.json (used to prefer sitemap titles)
	const sitemapTitleMap = Object.create(null);

	// Try to load a generated sitemap (Website/sitemap.json) to include deep/nested pages.
	(async function loadSitemapAndMerge() {
		try {
			// Try multiple locations for sitemap.json so pages served from subpaths
			// (e.g. /Website/Vitalis/) still load the canonical sitemap.
			// Build a list of candidate sitemap locations to try. Include absolute
			// origin paths and parent-directory relative paths so pages served from
			// subfolders (e.g. /Website/Vitalis/) can still find the sitemap.
			const origin = window.location.origin;
			// Prepare variables early so we don't hit the temporal-dead-zone
			// when trying to read/write `pages` from the inline sitemap.
			let resp = null;
			let pages = null;
			// If an inline sitemap is present (helps file:// or restrictive browsers), prefer it.
			try {
				const inline = document.getElementById('sitemap-data');
				if (inline && inline.textContent && inline.textContent.trim()) {
					pages = JSON.parse(inline.textContent);
					console.debug('Loaded sitemap from inline #sitemap-data');
				}
			} catch (err) {
				/* ignore inline parse errors and continue to network fetches */
			}
			const pathnameParts = (window.location.pathname || '/').split('/').filter(Boolean);
			const candidates = [];
			// basic candidates (include explicit relative forms and dot-prefixed forms
			// to improve compatibility with file:// and iOS file access restrictions)
			candidates.push('sitemap.json');
			candidates.push('./sitemap.json');
			candidates.push('/sitemap.json');
			candidates.push('Website/sitemap.json');
			candidates.push('./Website/sitemap.json');
			candidates.push('/Website/sitemap.json');
			candidates.push(origin + '/sitemap.json');
			candidates.push(origin + '/Website/sitemap.json');
			// try parent directories: /a/b/c -> /a/b/sitemap.json, /a/sitemap.json, /sitemap.json
			for (let i = pathnameParts.length; i >= 0; i--) {
				const prefix = '/' + pathnameParts.slice(0, i).join('/');
				candidates.push(prefix.replace(/\/+/g, '/') + '/sitemap.json');
				candidates.push(origin + prefix.replace(/\/+/g, '/') + '/sitemap.json');
			}
			for (let i = 0; i < candidates.length; i++) {
				const url = candidates[i];
				try {
					resp = await fetch(url, { cache: 'no-store' });
					if (resp && resp.ok) {
						pages = await resp.json();
						console.debug('Loaded sitemap from', url);
						break;
					}
				} catch (err) {
					console.debug('sitemap fetch failed for', url, err && err.message);
				}
			}
			if (!pages) {
				console.debug('No sitemap.json found at any candidate location');
				return;
			}
			// Map pages into topic shape and merge, avoiding duplicates by path
			const existingPaths = new Set(topics.map(t => normalizePath(t.path)));
			let counter = 1;

			function deriveRefFromPath(normalizedPath, top) {
				// normalizedPath e.g. 'Vitalis/1-Foundational-Biomedical-Sciences/1-2-Biochemistry/...'
				const parts = (normalizedPath || '').split('/').filter(Boolean);
				const codeMap = { scientia: 'SC', vitalis: 'VI', logos: 'LO', sensus: 'SE' };
				const abbrev = codeMap[(top || parts[0] || '').toLowerCase()] || (parts[0] || '').slice(0,2).toUpperCase() || 'PG';
				const nums = [];
				// for each segment after the top-level, take the last numeric token in the leading dash-separated prefix
				for (let i = 1; i < parts.length; i++) {
					const seg = parts[i];
					const m = seg.match(/^(\d+(?:-\d+)*)/);
					if (m) {
						const tokens = m[1].split('-').filter(Boolean);
						nums.push(tokens[tokens.length - 1]);
					}
				}
				// if no numbers found, fallback to counter-like single number
				if (nums.length === 0) return `${abbrev}${counter++}`;
				return `${abbrev}${nums.join('.')}`;
			}
			// Helper: attempt to fetch the page and extract a `.card-ref` value.
			async function fetchCardRefForNormalized(normalized) {
				if (!normalized) return '';
				const origin = window.location.origin;
				const candidates = [
					normalized,
					'/' + normalized,
					'/Website/' + normalized,
					origin + '/' + normalized,
					origin + '/Website/' + normalized
				];
				for (let i = 0; i < candidates.length; i++) {
					try {
						const resp = await fetch(candidates[i], { cache: 'no-store' });
						if (!resp || !resp.ok) continue;
						const txt = await resp.text();
						if (!txt) continue;
						// Try DOM parsing first
						try {
							const parser = new DOMParser();
							const doc = parser.parseFromString(txt, 'text/html');
							const el = doc.querySelector('.card-ref');
							if (el && el.textContent && el.textContent.trim()) return el.textContent.trim();
						} catch (err) {
							// ignore DOM parse errors
						}
						// Fallback: regex find
						const m = txt.match(/<[^>]*class=["']card-ref["'][^>]*>([^<]+)<\//i);
						if (m && m[1]) return m[1].trim();
						// If no direct `.card-ref` found, attempt to find a parent index
						try {
							// Use the normalized path (not the candidate URL) to compute the parent index reliably
							const normParts = (normalized || '').split('/').filter(Boolean);
							if (normParts.length > 2) {
								// parent index is the folder containing the section cards: .../<parentFolder>/index.html
								const parentParts = normParts.slice(0, normParts.length - 2).concat(['index.html']);
								const parentPathBases = [
									'/' + parentParts.join('/'),
									'/Website/' + parentParts.join('/'),
									window.location.origin + '/' + parentParts.join('/')
								];
								for (let pi = 0; pi < parentPathBases.length; pi++) {
									try {
										const presp = await fetch(parentPathBases[pi], { cache: 'no-store' });
										if (!presp || !presp.ok) continue;
										const ptxt = await presp.text();
										const parser2 = new DOMParser();
										const pdoc = parser2.parseFromString(ptxt, 'text/html');
										const hrefToken = normParts[normParts.length - 2] || '';
										const card = Array.from(pdoc.querySelectorAll('.section-card')).find(c => {
											const h = (c.getAttribute('href') || '').replace(/\\/g, '/');
											return h.indexOf(hrefToken) !== -1 || h.endsWith(hrefToken + '/') || h.endsWith(hrefToken + '/index.html');
										});
										if (card) {
											const cref = card.querySelector('.card-ref');
											if (cref && cref.textContent && cref.textContent.trim()) return cref.textContent.trim();
										}
									} catch (err) {
										/* ignore parent fetch errors and try next base */
									}
								}
							}
						} catch (err) { /* ignore parent inspection errors */ }
					} catch (err) {
						// ignore fetch errors and try next candidate
					}
				}
				return '';
			}

			// Process sitemap pages sequentially so we can await page fetches when needed.
			for (let pi = 0; pi < pages.length; pi++) {
				const p = pages[pi];
				const normalized = normalizePath(p.path || p.rawPath || p.dir || '');
				if (!normalized) continue;
				// derive a clean page title: many sitemap entries include " — Section" suffix.
				const rawTitle = (p.title || '');
				const mainTitle = rawTitle.split(' — ')[0].trim() || rawTitle;
				// Save canonical sitemap title for this normalized path (preserve symbols)
				sitemapTitleMap[normalized] = mainTitle;

				const parts = (p.dir || p.path || '').split('/');
				const top = parts[0] || '';

				if (existingPaths.has(normalized)) {
					// Update existing static topic to use the sitemap's canonical page title
					for (let i = 0; i < topics.length; i++) {
						if (normalizePath(topics[i].path) === normalized) {
							if (mainTitle) topics[i].title = mainTitle;
							topics[i].path = normalized;
							try {
								// Prefer explicit `.card-ref` found on the page; fall back to derived ref
								const fetchedRef = await fetchCardRefForNormalized(normalized);
								if (fetchedRef) {
									topics[i].ref = fetchedRef;
								} else {
									topics[i].ref = deriveRefFromPath(normalized, top);
								}
							} catch (e) { /* ignore ref recompute errors */ }
							break;
						}
					}
					continue;
				}
				existingPaths.add(normalized);
				const section = top || (p.section || '');
				let ref = deriveRefFromPath(normalized, top);
				try {
					const pageRef = await fetchCardRefForNormalized(normalized);
					if (pageRef) ref = pageRef;
				} catch (e) { /* ignore */ }
				topics.push({ title: mainTitle || parts[parts.length-1] || normalized, path: normalized, section, ref });
			}
			// Sync any existing topics to use sitemap canonical titles when available
			for (let i = 0; i < topics.length; i++) {
				const n = normalizePath(topics[i].path || '');
				if (sitemapTitleMap[n]) {
					if (topics[i].title !== sitemapTitleMap[n]) {
						console.debug('Updating topic title from sitemap for', topics[i].path, '->', sitemapTitleMap[n]);
					}
					topics[i].title = sitemapTitleMap[n];
				}
			}
			// If the user has an active query, re-run the input event so results include merged pages
			if (searchBar && searchBar.value && searchBar.value.trim().length > 0) {
				try { searchBar.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) { /* ignore */ }
			}
		} catch (err) {
			console.debug('No sitemap.json found or failed to load:', err);
		}
	})();

	function normalizePath(p) {
		if (!p) return '';
		// Remove any leading Website/ or ./, convert windows backslashes
		return p.replace(/^Website[\\\/]?/i, '').replace(/^\.\//, '').replace(/\\/g, '/');
	}

	function computeDepthFromPath(p) {
		if (!p) return 1;
		const normalized = normalizePath(p || '').toLowerCase();
		// Emulate the CSS selectors used for `.section-card[href*="..."]` so
		// search badges pick the same colour level as card refs.
		const level4 = [
			'1-1-1-1-','1-1-1-2-','1-1-1-3-','1-1-1-4-','1-1-1-5-','1-1-1-6-',
			'1-1-2-1-','1-1-2-2-','1-1-2-3-','1-1-3-1-','1-1-3-2-','1-1-3-3-','1-1-3-4-','1-1-3-5-',
			'1-1-4-1-','1-1-4-2-','1-1-4-3-','1-1-5-1-','1-1-5-2-','1-1-5-3-',
			'1-1-6-1-','1-1-6-2-','1-1-6-3-','1-1-7-1-','1-1-7-2-','1-1-7-3-'
		];
		const level3 = [
			'1-1-1-','1-1-2-','1-1-3-','1-1-4-','1-1-5-','1-1-6-','1-1-7-',
			'1-2-1-','1-2-2-','1-2-3-'
		];
		const level2 = [
			'1-1-','1-2-','1-3-','1-4-','1-5-','1-6-','1-7-','1-8-','1-9-','1-10-','1-11-','1-12-','1-13-','1-14-',
			'2-1-','2-2-','3-1-','4-1-','5-1-','6-1-','7-1-','8-1-'
		];

		for (let i = 0; i < level4.length; i++) {
			if (normalized.indexOf(level4[i]) !== -1) return 4;
		}
		for (let i = 0; i < level3.length; i++) {
			if (normalized.indexOf(level3[i]) !== -1) return 3;
		}
		for (let i = 0; i < level2.length; i++) {
			if (normalized.indexOf(level2[i]) !== -1) return 2;
		}
		// Fallback: count numeric-leading segments (conservative)
		const parts = normalized.split('/').filter(Boolean);
		let count = 0;
		for (let i = 0; i < parts.length; i++) {
			const seg = parts[i] || '';
			if (/^\d+(?:-\d+)*[-_]/.test(seg)) count++;
		}
		return Math.max(1, count);
	}

	if (searchBar && searchResults) {
		// Detect current page context
		const currentPath = window.location.pathname;
		let currentContext = 'all';
    
		if (currentPath.includes('Scientia') || currentPath.includes('scientia')) {
			currentContext = 'scientia';
			searchBar.placeholder = 'Search Scientia topics (SC)...';
		} else if (currentPath.includes('Vitalis') || currentPath.includes('vitalis')) {
			currentContext = 'vitalis';
			searchBar.placeholder = 'Search Vitalis topics (VI)...';
		} else if (currentPath.includes('Logos') || currentPath.includes('logos')) {
			currentContext = 'logos';
			searchBar.placeholder = 'Search Logos topics (LO)...';
		} else if (currentPath.includes('Sensus') || currentPath.includes('sensus')) {
			currentContext = 'sensus';
			searchBar.placeholder = 'Search Sensus topics (SE)...';
		}
    
		searchBar.addEventListener('input', function(e) {
			const query = e.target.value.toLowerCase().trim();
      
			if (query.length === 0) {
				searchResults.classList.remove('active');
				searchResults.innerHTML = '';
				return;
			}

			// Filter topics based on current page context (use path/section match so deep pages are included)
			let contextTopics = topics;
			if (currentContext !== 'all') {
				contextTopics = topics.filter(t => (t.path || '').toLowerCase().includes(currentContext) || (t.section || '').toLowerCase().includes(currentContext));
			}

			const matches = contextTopics.filter(topic => {
				// Use sitemap canonical title if available (preserves symbols and correct spelling),
				// fall back to displayTitle/title from the static topics list.
				const normalizedPath = normalizePath(topic.path || '');
				const sitemapTitle = sitemapTitleMap[normalizedPath] || '';
				const titleSource = ((topic.displayTitle ? topic.displayTitle + ' ' : '') + (sitemapTitle || topic.title || '')).toLowerCase();
				const section = (topic.section || '').toLowerCase();
				const path = (topic.path || '').toLowerCase();
				const ref = (topic.ref || '').toLowerCase();
				return titleSource.includes(query) || section.includes(query) || path.includes(query) || ref.includes(query);
			});

			if (matches.length > 0) {
				searchResults.innerHTML = matches.map(match => {
					// Prefer sitemap canonical title if available (preserves symbols like β),
					// otherwise fall back to the topic's configured title.
					const titleToShow = sitemapTitleMap[normalizePath(match.path || '')] || match.title || '';
					// Always navigate to the specific page for this match (subsection path).
					const navPath = match.path || '';
					// Prefer using the topic `ref` (e.g. VI1.2.7.1) to determine depth
					// so search badges match the card refs exactly. Fall back to
					// path-derived depth when `ref` is missing.
					const depth = match.ref ? (match.ref.split('.').length) : computeDepthFromPath(match.path || '');
					return `\n          <div class="search-result-item" data-path="${navPath}">\n            <div class="search-result-content">\n              <div class="search-result-title">${titleToShow}</div>\n              <div class="search-result-path">${match.section || ''}</div>\n            </div>\n            <span class="search-ref" data-depth="${depth}">${match.ref || ''}</span>\n          </div>\n        `;
				}).join('');
				searchResults.classList.add('active');

				// We'll use delegated handlers for navigation and toggles (see below)
			} else {
				searchResults.innerHTML = '<div class="search-result-item" style="cursor: default; pointer-events: none;">No results found</div>';
				searchResults.classList.add('active');
			}
		});

		// Close search results when clicking outside
		document.addEventListener('click', function(e) {
			if (!searchBar.contains(e.target) && !searchResults.contains(e.target)) {
				searchResults.classList.remove('active');
			}
		});
    
		// Keep search open when focusing on search bar
		searchBar.addEventListener('focus', function() {
			if (this.value.trim().length > 0) {
				searchResults.classList.add('active');
			}
		});
	}

	// Delegated handler for toggles, theme button, and search results (works even for dynamically-inserted elements)
	if (!window.__uuDelegatedEventsInstalled) {
		window.__uuDelegatedEventsInstalled = true;
		document.body.addEventListener('click', function(e) {
			// Ensure section-card clicks always resolve correctly across hosting roots
			// (fixes touch/iOS navigation where relative paths sometimes 404).
			const sectionCard = e.target.closest('.section-card');
			if (sectionCard && sectionCard.getAttribute && sectionCard.getAttribute('href')) {
				// If the section-card itself is a native anchor element, allow the
				// browser's default navigation to proceed (prevents double-handling
				// that can break navigation). Only intercept non-anchor cards.
				if (sectionCard.tagName && sectionCard.tagName.toLowerCase() === 'a') {
					return; // let the anchor do its job
				}
				e.preventDefault();
				let target = sectionCard.getAttribute('href') || '';
				// Normalize any leading 'Website/' prefix and backslashes
				target = target.replace(/^Website[\\\/]/i, '').replace(/\\/g, '/').replace(/^\/+/, '');
				const href = resolveTargetUrl(target);
				try { console.debug('section-card navigate ->', href, 'from', window.location.pathname); } catch (e) {}
				window.location.assign(href);
				return;
			}
			const toggleBtn = e.target.closest('.toggle-btn');
			if (toggleBtn) {
				e.preventDefault();
				let nextDiv = toggleBtn.nextElementSibling;
				while (nextDiv && !nextDiv.classList.contains('toggle-content')) {
					nextDiv = nextDiv.nextElementSibling;
				}
				if (nextDiv) {
					const isExpanded = nextDiv.classList.contains('expanded');
					if (isExpanded) {
						nextDiv.classList.remove('expanded');
						toggleBtn.classList.remove('expanded');
					} else {
						nextDiv.classList.add('expanded');
						toggleBtn.classList.add('expanded');
					}
				}
				return;
			}

			const resultItem = e.target.closest('.search-result-item');
			if (resultItem) {
				e.preventDefault();
				let targetPath = resultItem.dataset.path || '';
				if (!targetPath) return;
				// Normalize any leading 'Website/' prefix and backslashes
				targetPath = targetPath.replace(/^Website[\\\/]/i, '').replace(/\\/g, '/').replace(/^\/+/, '');
				const clean = targetPath.replace(/^\/+/, '');
				const href = resolveTargetUrl(clean);
				try { console.debug('navigate ->', href, 'from', window.location.pathname); } catch (e) {}
				window.location.assign(href);
				return;
			}

			const themeBtn = e.target.closest('#themeToggle');
			if (themeBtn) {
				e.preventDefault();
				if (console && console.debug) console.debug('Root theme toggle clicked:', themeBtn, 'target:', e.target);
				try { toggleTheme(e); } catch (err) { console.error(err); }
				return;
			}
		}, false);
	}

	// Pointerup fallback for touch
	document.body.addEventListener('pointerup', function(e) {
		const themeBtn = e.target.closest('#themeToggle');
		if (themeBtn) {
				e.preventDefault();
				if (console && console.debug) console.debug('Root theme toggle pointerup:', themeBtn, 'target:', e.target);
				try { toggleTheme(e); } catch (err) { console.error(err); }
		}
	}, false);

	const form = document.getElementById('contactForm');

	// Ensure `.section-card` and inner `.card-ref` elements carry a `data-depth`
	// attribute so CSS can color them the same way search badges are colored.
	function setCardDepths() {
		const cards = document.querySelectorAll('.section-card');
		cards.forEach(card => {
			let depth = 1;
			const cardRefEl = card.querySelector('.card-ref');
			// Prefer explicit ref text inside the card (e.g. "VI1.2.7.1")
			if (cardRefEl) {
				const text = (cardRefEl.textContent || '').trim();
				if (text && text.indexOf('.') !== -1) {
					depth = text.split('.').length;
				} else if (card.getAttribute('href')) {
					depth = computeDepthFromPath(card.getAttribute('href'));
				} else {
					// try to infer from nested links
					const a = card.querySelector('a[href]');
					if (a) depth = computeDepthFromPath(a.getAttribute('href'));
				}
				cardRefEl.setAttribute('data-depth', String(depth));
			}
			card.setAttribute('data-depth', String(depth));
		});
	}

	// Run once on load and observe for dynamic changes
	try { setCardDepths(); } catch (err) { /* ignore */ }
	if (window.MutationObserver) {
		// Debounce DOM-heavy operations triggered by mutations to avoid jank on mobile
		let __uuDepthTimer = null;
		function scheduleSetCardDepths() {
			if (__uuDepthTimer) clearTimeout(__uuDepthTimer);
			__uuDepthTimer = setTimeout(function() {
				try { setCardDepths(); } catch (e) {}
				__uuDepthTimer = null;
			}, 120);
		}
		const mo = new MutationObserver(function(mutations) {
			// Only schedule a depth recalculation when relevant nodes are added/removed
			let interesting = false;
			for (let i = 0; i < mutations.length; i++) {
				const m = mutations[i];
				if (m.addedNodes && m.addedNodes.length) { interesting = true; break; }
				if (m.removedNodes && m.removedNodes.length) { interesting = true; break; }
				if (m.type === 'childList') { interesting = true; break; }
			}
			if (interesting) scheduleSetCardDepths();
		});
		mo.observe(document.body, { childList: true, subtree: true });
	}



	// Resolve a target path into an absolute URL robustly across hosting roots
	function resolveTargetUrl(cleanPath) {
		const clean = (cleanPath || '').replace(/^\/+/, '');
		// 1) Prefer a <base> element if present
		const baseEl = document.querySelector('base');
		if (baseEl && baseEl.href) {
			try { return new URL(clean, baseEl.href).href; } catch (e) { /* fallthrough */ }
		}

		// 2) Try to use the script's loaded URL (document.currentScript) to
		// derive the correct base path. This is robust across hosting roots
		// (for example when the site is served under /RepoName/Website/).
		try {
			let scriptSrc = (document.currentScript && document.currentScript.src) || '';
			if (!scriptSrc) {
				// Fallback: find a script tag that includes 'script.js'
				const scripts = Array.from(document.getElementsByTagName('script'));
				for (let i = scripts.length - 1; i >= 0; i--) {
					const s = scripts[i].src || '';
					if (s && s.toLowerCase().indexOf('/script.js') !== -1) { scriptSrc = s; break; }
				}
			}
			if (scriptSrc) {
				const scriptBase = scriptSrc.slice(0, scriptSrc.lastIndexOf('/') + 1);
				try { return new URL(clean, scriptBase).href; } catch (e) { /* fallthrough */ }
			}
		} catch (e) { /* fallthrough */ }

		// 3) If current pathname contains '/Website/' (possibly nested under a repo
		// root like '/RepoName/Website/'), preserve that prefix so links point
		// to the correct subfolder on the same host.
		try {
			const p = window.location.pathname || '';
			const lower = p.toLowerCase();
			const idx = lower.indexOf('/website/');
			if (idx !== -1) {
				const origPrefix = p.slice(0, idx + '/Website/'.length);
				return origPrefix + clean;
			}
		} catch (e) { /* fallthrough */ }

		// 4) Last resort, return root-relative
		return '/' + clean;
	}
	const result = document.getElementById('formResult');
	const submitBtn = form && form.querySelector('button[type="submit"]');

	form && form.addEventListener('submit', async (e)=> {
		e.preventDefault();
		result.textContent = '';
		if (!submitBtn) return;
		submitBtn.disabled = true;

		const email = document.getElementById('email')?.value || '';
		const message = document.getElementById('message')?.value || '';

		try {
			const resp = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, message })
			});

			if (resp.ok) {
				result.textContent = 'Thanks — your message was received.';
				form.reset();
			} else {
				const text = await resp.text().catch(()=>resp.statusText||'Error');
				result.textContent = 'Submission failed: ' + text;
			}
		} catch (err) {
			result.textContent = 'Could not contact server — message not saved locally.';
			console.error(err);
		}

		submitBtn.disabled = false;
	});
	});
}

