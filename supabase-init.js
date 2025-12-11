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

