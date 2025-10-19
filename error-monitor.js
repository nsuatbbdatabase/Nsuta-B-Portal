// Simple error monitor to display unhandledrejection and error events in-page for debugging
(function(){
  function showError(title, details) {
    try {
      const monitor = document.getElementById('errorMonitor');
      const body = document.getElementById('errorMonitorBody');
      if (!monitor || !body) return console.error(title, details);
      monitor.style.display = '';
      const entry = document.createElement('div');
      entry.style.borderTop = '1px dashed #eee';
      entry.style.padding = '0.5rem 0';
      entry.innerHTML = `<div style="font-weight:600;color:#b33;">${title}</div><pre style="white-space:pre-wrap;word-break:break-word;margin:0;font-family:inherit;font-size:12px;">${details}</pre>`;
      body.insertBefore(entry, body.firstChild);
    } catch (e) { console.error('Error monitor failed to render', e); }
  }

  window.addEventListener('unhandledrejection', function(ev) {
    const reason = ev.reason ? (ev.reason.stack || ev.reason.message || String(ev.reason)) : 'Unknown rejection';
    showError('Unhandled Promise Rejection', reason);
    console.warn('Unhandled rejection captured by monitor:', ev);
  });

  window.addEventListener('error', function(ev) {
    const msg = ev.error ? (ev.error.stack || ev.error.message) : (ev.message || 'Unknown error');
    showError('Runtime Error', msg);
    console.error('Runtime error captured by monitor:', ev.error || ev.message);
  });

  // Optional: capture console.error and also display
  const origConsoleError = console.error;
  console.error = function(){
    try {
      const args = Array.from(arguments).map(a => (a && a.stack) ? a.stack : (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      showError('Console.error', args);
    } catch(e){}
    origConsoleError.apply(console, arguments);
  };
})();
