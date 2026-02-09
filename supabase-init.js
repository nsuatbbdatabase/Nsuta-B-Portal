// Minimal Supabase client initializer for local pages.
// Usage:
// - Replace the placeholders below with your Supabase project URL and anon key,
//   OR set `window.SUPABASE_CONFIG = { url: 'https://xyz.supabase.co', anonKey: 'public-...' }` before this script runs.
// - This file will attach the client to `window.supabaseClient` for pages that expect it.

(function () {
	const cfg = window.SUPABASE_CONFIG || {
		url: 'https://omhmahhfeduejykrxflx.supabase.co',
		anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
	};

	if (!cfg.url || cfg.url.includes('REPLACE_WITH')) {
		console.error('supabase-init: Supabase config missing. Set window.SUPABASE_CONFIG or replace placeholders in supabase-init.js');
		return;
	}

	function tryCreateClient() {
		try {
			// supabase-js v2 (CDN) exposes `createClient`; some bundlers expose `supabase` with createClient
			if (typeof createClient === 'function') {
				window.supabaseClient = createClient(cfg.url, cfg.anonKey);
				return true;
			}
			if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
				window.supabaseClient = supabase.createClient(cfg.url, cfg.anonKey);
				return true;
			}
		} catch (e) {
			console.error('supabase-init: error creating client', e);
		}
		return false;
	}

	if (tryCreateClient()) {
		console.log('supabase-init: supabaseClient initialized');
		try { document.dispatchEvent(new CustomEvent('supabase:ready', { detail: { client: window.supabaseClient } })); } catch (e) {}
		// Quick network/DNS smoke-check: attempt to fetch the project root to reveal resolution errors early.
		(async function networkCheck(){
			if (!cfg.url) return;
			try {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 3000);
				// Use no-cors mode so CORS doesn't mask DNS/network failures. The response will be opaque
				await fetch(cfg.url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
				clearTimeout(timeout);
				console.log('supabase-init: network check OK for', cfg.url);
			} catch (err) {
				console.error('supabase-init: network check failed for', cfg.url, err && err.message ? err.message : err);
								try {
									// If a client was already created, emit a non-fatal warning so pages
									// that already have a client can proceed. Emit a fatal 'network-failed'
									// only when no client exists.
									const detail = { url: cfg.url, error: (err && err.message) || String(err) };
									if (window.supabaseClient) {
										console.warn('supabase-init: network warning (client exists)', detail);
										try { document.dispatchEvent(new CustomEvent('supabase:network-warning', { detail })); } catch(e){}
									} else {
										try { document.dispatchEvent(new CustomEvent('supabase:network-failed', { detail })); } catch(e){}
									}
								} catch(e){}
			}
		})();
		return;
	}

	// Fallback: load supabase JS from CDN then initialize
	const cdn = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.min.js';
	const script = document.createElement('script');
	script.src = cdn;
	script.crossOrigin = 'anonymous';
	script.onload = () => {
		if (tryCreateClient()) {
			console.log('supabase-init: supabase client created after loading CDN');
			try { document.dispatchEvent(new CustomEvent('supabase:ready', { detail: { client: window.supabaseClient } })); } catch (e) {}
		} else {
			console.error('supabase-init: failed to create supabase client after loading CDN');
		}
	};
	script.onerror = () => console.error('supabase-init: failed to load supabase JS from CDN');
	document.head.appendChild(script);
})();

// Helper: promise-based wait for supabase client readiness
// Usage: window.waitForSupabase().then(client => { /* safe to use window.supabaseClient */ });
if (!window.waitForSupabase) {
	window.waitForSupabase = function waitForSupabase(timeoutMs = 8000) {
		return new Promise((resolve, reject) => {
			if (window.supabaseClient) return resolve(window.supabaseClient);
			const onReady = () => {
				clear();
				return resolve(window.supabaseClient);
			};
			const onNetworkFailed = (ev) => {
				// still allow resolution if client exists; otherwise reject
				if (window.supabaseClient) return onReady();
				clear();
				return reject(new Error('supabase network failed: ' + (ev && ev.detail && ev.detail.url ? ev.detail.url : 'unknown')));
			};
			const timer = setTimeout(() => {
				document.removeEventListener('supabase:ready', onReady);
				document.removeEventListener('supabase:network-failed', onNetworkFailed);
				reject(new Error('waitForSupabase: timeout after ' + timeoutMs + 'ms'));
			}, timeoutMs);
			function clear() { clearTimeout(timer); document.removeEventListener('supabase:ready', onReady); document.removeEventListener('supabase:network-failed', onNetworkFailed); }
			document.addEventListener('supabase:ready', onReady, { once: true });
			document.addEventListener('supabase:network-failed', onNetworkFailed, { once: true });
		});
	};

	window.onSupabaseReady = function onSupabaseReady(cb) {
		if (window.supabaseClient) { try { cb(window.supabaseClient); } catch (e) { console.error(e); } return; }
		document.addEventListener('supabase:ready', function handler(ev) { try { cb(window.supabaseClient); } catch (e) { console.error(e); } }, { once: true });
	};
}

