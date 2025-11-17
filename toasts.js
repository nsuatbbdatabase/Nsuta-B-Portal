// Accessible toast/notification system
(function(){
  // Create container
  const container = document.createElement('div');
  container.id = 'app-toast-container';
  container.style.position = 'fixed';
  container.style.right = '1rem';
  container.style.top = '1rem';
  container.style.zIndex = 99999;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '0.5rem';
  // Create a persistent, screen-reader-only live region for assistive tech
  const liveRegion = document.createElement('div');
  liveRegion.id = 'app-toast-live';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  // Visually hide but keep in accessibility tree
  liveRegion.style.position = 'absolute';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.margin = '-1px';
  liveRegion.style.padding = '0';
  liveRegion.style.overflow = 'hidden';
  liveRegion.style.clip = 'rect(0 0 0 0)';
  liveRegion.style.whiteSpace = 'nowrap';
  liveRegion.style.border = '0';

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.contains(container)) document.body.appendChild(container);
    if (!document.body.contains(liveRegion)) document.body.appendChild(liveRegion);
  });
  function makeToast(msg, type='info', duration=3500) {
    const toast = document.createElement('div');
    toast.className = 'app-toast app-toast-' + type;
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    toast.style.background = type === 'error' ? '#fff1f0' : (type === 'warning' ? '#fffbe6' : '#f0f9ff');
    toast.style.color = type === 'error' ? '#611a15' : (type === 'warning' ? '#664d03' : '#0c5460');
    toast.style.border = '1px solid rgba(0,0,0,0.08)';
    toast.style.padding = '0.5rem 0.75rem';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
    toast.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';
    toast.style.fontSize = '13px';
    toast.textContent = msg;
    container.appendChild(toast);
    // update the persistent live region so screen readers reliably announce
    try { liveRegion.textContent = String(msg); } catch (e) { /* ignore */ }
    setTimeout(() => {
      try { toast.style.opacity = '0'; toast.style.transform = 'translateY(-6px)'; } catch(e){}
      setTimeout(() => { try { container.removeChild(toast); } catch(e){} }, 300);
    }, duration);
  }
  window.showToast = makeToast;
  // backward-compatible notify wrapper
  window.notify = function(msg, type='info', duration) { makeToast(String(msg), type, duration || 3500); };
  // Monkey-patch alert: prefer an in-page modal alert if available, fall back to toast
  try {
    window._originalAlert = window.alert.bind(window);
    window.alert = function(msg, opts) {
      try {
        if (typeof window.showAlert === 'function') {
          // showAlert returns a Promise; we don't need to await it here
          window.showAlert(String(msg), opts || {});
          return;
        }
      } catch (e) { /* ignore */ }
      // Fallback to a toast when modal alert isn't available
      makeToast(String(msg), 'info', 5000);
    };
  } catch(e) {}
  
  // Persistent loading / progress toast. Returns an object { update(percentOrText), close() }
  // Default message set to 'Saving...' to reflect common save flows. Callers can still pass text or update with a percent.
  window.showLoadingToast = function(initialMessage='Saving...', options = {}) {
    const toast = document.createElement('div');
    toast.className = 'app-toast app-toast-loading';
    toast.style.background = '#f0f5ff';
    toast.style.color = '#062a5a';
    toast.style.border = '1px solid rgba(0,0,0,0.06)';
    toast.style.padding = '0.6rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 8px 24px rgba(2,24,57,0.08)';
    toast.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';
    toast.style.fontSize = '13px';
    toast.style.minWidth = '200px';
    toast.style.display = 'flex';
    toast.style.flexDirection = 'column';
    toast.style.gap = '0.45rem';

    const line = document.createElement('div');
    line.textContent = String(initialMessage);
  const progressWrap = document.createElement('div');
  progressWrap.style.width = '100%';
  progressWrap.style.background = 'rgba(0,0,0,0.04)';
  progressWrap.style.borderRadius = '6px';
  progressWrap.style.height = '8px';
  const progressBar = document.createElement('div');
  progressBar.style.width = '0%';
  progressBar.style.height = '100%';
  progressBar.style.background = options.color || '#0b66b2';
  progressBar.style.borderRadius = '6px';
  progressBar.style.transition = 'width 220ms linear';
  progressWrap.appendChild(progressBar);

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';

  const pct = document.createElement('div');
  pct.textContent = '0%';
  pct.style.fontSize = '12px';
  pct.style.opacity = '0.85';

  // Create an indeterminate spinner element (hidden by default). If options.indeterminate is true
  // we'll show this spinner and hide the progress bar/percent.
    // Ensure spinner styles are present (inject CSS once so we don't rely on an external stylesheet)
    (function ensureSpinnerStyles(){
      try {
        if (document.getElementById('nsuta-toasts-styles')) return;
        const s = document.createElement('style');
        s.id = 'nsuta-toasts-styles';
        s.textContent = '\n.nsuta-spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,0.12);border-top-color:' + (options.color || '#0b66b2') + ';border-radius:50%;display:inline-block;vertical-align:middle;margin-right:8px;animation:nsuta-spin 0.9s linear infinite}\n@keyframes nsuta-spin{to{transform:rotate(360deg)}}\n';
        (document.head || document.documentElement).appendChild(s);
      } catch (e) { /* ignore */ }
    })();

    const spinner = document.createElement('span');
    spinner.className = 'nsuta-spinner';
    spinner.style.display = 'none';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'transparent';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';

  // Left side: pct (or spinner when indeterminate)
  const leftWrap = document.createElement('div');
  leftWrap.style.display = 'flex';
  leftWrap.style.alignItems = 'center';
  leftWrap.appendChild(spinner);
  leftWrap.appendChild(pct);
  footer.appendChild(leftWrap);
    footer.appendChild(closeBtn);

    toast.appendChild(line);
    toast.appendChild(progressWrap);
    toast.appendChild(footer);
    container.appendChild(toast);

    function setIndeterminateMode(enabled) {
      if (enabled) {
        progressWrap.style.display = 'none';
        pct.style.display = 'none';
        spinner.style.display = 'inline-block';
      } else {
        progressWrap.style.display = '';
        pct.style.display = '';
        spinner.style.display = 'none';
      }
    }

  // indeterminate default: true unless caller explicitly sets options.indeterminate
  // This keeps the previous behavior but uses a CSS animation instead of a JS interval.
  const useIndeterminate = (options && typeof options.indeterminate !== 'undefined') ? Boolean(options.indeterminate) : true;
  setIndeterminateMode(Boolean(useIndeterminate));

    function update(v) {
      if (options && options.indeterminate) {
        // In indeterminate mode, only allow text updates (ignore numeric progress)
        if (typeof v === 'string') line.textContent = v;
        return;
      }
      if (typeof v === 'number') {
        const clamped = Math.max(0, Math.min(100, Math.round(v)));
        progressBar.style.width = clamped + '%';
        pct.textContent = clamped + '%';
      } else if (typeof v === 'string') {
        line.textContent = v;
      }
    }
    function close() {
      try { container.removeChild(toast); } catch (e) {}
    }
    closeBtn.addEventListener('click', () => close());
    return { update, close };
  };
  
  // Accessible, promise-based confirmation modal.
  // Usage: const ok = await window.showConfirm('Are you sure?', { title: 'Confirm delete' });
  window.showConfirm = function(message, options = {}) {
    return new Promise((resolve) => {
      const title = options.title || 'Please confirm';
      const rememberKey = options.rememberKey || null;
      // Modal backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'app-confirm-backdrop';
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0'; backdrop.style.left = '0'; backdrop.style.right = '0'; backdrop.style.bottom = '0';
      backdrop.style.background = 'rgba(0,0,0,0.45)';
      backdrop.style.zIndex = 100000;
      backdrop.style.display = 'flex';
      backdrop.style.alignItems = 'center';
      backdrop.style.justifyContent = 'center';

      const dialog = document.createElement('div');
      dialog.className = 'app-confirm-dialog';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'app-confirm-title');
      dialog.style.background = '#fff';
      dialog.style.color = '#052a3a';
      dialog.style.padding = '1rem';
      dialog.style.borderRadius = '8px';
      dialog.style.minWidth = '320px';
      dialog.style.maxWidth = '92%';
      dialog.style.boxShadow = '0 10px 36px rgba(2,24,57,0.16)';

      dialog.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:0.6rem">
          <div id="app-confirm-title" style="font-weight:700;font-size:1rem">${String(title)}</div>
          <div style="color:#334;margin-top:4px">${String(message).replace(/\n/g, '<br/>')}</div>
          ${rememberKey ? '<label style="display:flex;align-items:center;gap:0.5rem;margin-top:0.6rem"><input type="checkbox" id="app-confirm-dontask" /> <span style="font-size:13px;color:#556">Don\'t ask me again for this action</span></label>' : ''}
          <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.6rem">
            <button class="app-confirm-cancel" type="button">No</button>
            <button class="app-confirm-ok" type="button" style="background:#0b66b2;color:#fff;border:none;padding:0.45rem 0.8rem;border-radius:6px">Yes</button>
          </div>
        </div>`;

      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      // basic focus management
      const okBtn = dialog.querySelector('.app-confirm-ok');
      const cancelBtn = dialog.querySelector('.app-confirm-cancel');
      const prevActive = document.activeElement;
      try { okBtn.focus(); } catch (e) {}

      // Ensure cleanup only runs once (prevents double-invocation leaving the dialog in DOM)
      let _confirmHandled = false;

      function cleanup(result) {
        if (_confirmHandled) return;
        _confirmHandled = true;
          // remove event listeners first
          try {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            backdrop.removeEventListener('click', onBackdropClick);
            dialog.removeEventListener('keydown', onKeyDown);
          } catch (e) {}
          // Read the "Don't ask again" checkbox state before removing the dialog
          let _persistDontAsk = false;
          try {
            if (rememberKey) {
              const cb = dialog.querySelector('#app-confirm-dontask');
              if (cb && cb.checked) _persistDontAsk = true;
            }
          } catch (e) {}
          // Hide then remove backdrop so the UI disappears immediately
          try { backdrop.style.display = 'none'; } catch (e) {}
          try { document.body.removeChild(backdrop); } catch (e) {}
          // Defensive: remove any stray confirm backdrops left behind
          try {
            const others = Array.from(document.querySelectorAll('.app-confirm-backdrop'));
            others.forEach(n => { try { if (n.parentNode) n.parentNode.removeChild(n); } catch (e) {} });
          } catch (e) {}
          try { if (prevActive && typeof prevActive.focus === 'function') prevActive.focus(); } catch (e) {}
          // Persist preference if requested
          try {
            if (_persistDontAsk && rememberKey) {
              try { localStorage.setItem('nsuta_confirm_' + rememberKey, 'false'); } catch (e) { /* ignore */ }
            }
          } catch (e) {}
          // Remove any global keydown listener we attached
          try { document.removeEventListener('keydown', onKeyDown); } catch (e) {}
        // Resolve after removal so callers won't see the modal still present
        resolve(Boolean(result));
      }

      // Use delegated listeners for robustness (buttons may vary across pages)
      const onBackdropClick = (ev) => {
        // If clicked outside the dialog content -> treat as cancel
        if (ev.target === backdrop) return cleanup(false);
        const okTarget = ev.target.closest && ev.target.closest('.app-confirm-ok');
        if (okTarget) return cleanup(true);
        const cancelTarget = ev.target.closest && ev.target.closest('.app-confirm-cancel');
        if (cancelTarget) return cleanup(false);
      };

      const onKeyDown = (ev) => {
        if (ev.key === 'Escape') { ev.preventDefault(); return cleanup(false); }
        if (ev.key === 'Enter') { ev.preventDefault(); return cleanup(true); }
      };

      // Attach delegated click listener to backdrop (catches button clicks and outside clicks)
      backdrop.addEventListener('click', onBackdropClick);
      // Keyboard on document to ensure it catches Enter/Escape even if dialog isn't focused
      document.addEventListener('keydown', onKeyDown);
    });
  };

  // Convenience alias used in codebase
  window.askConfirm = async function(message, opts) { return await window.showConfirm(message, opts); };
  
  // Async prompt modal: returns the user's input string, or null if cancelled
  // Usage: const val = await window.showPrompt('Enter name', { title: 'Delete class', placeholder: 'e.g., JHS 1', defaultValue: '' });
  window.showPrompt = function(message, options = {}) {
    return new Promise((resolve) => {
      const title = options.title || 'Input required';
      const placeholder = options.placeholder || '';
      const defaultValue = options.defaultValue || '';

      const backdrop = document.createElement('div');
      backdrop.className = 'app-prompt-backdrop';
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0'; backdrop.style.left = '0'; backdrop.style.right = '0'; backdrop.style.bottom = '0';
      backdrop.style.background = 'rgba(0,0,0,0.45)';
      backdrop.style.zIndex = 100000;
      backdrop.style.display = 'flex';
      backdrop.style.alignItems = 'center';
      backdrop.style.justifyContent = 'center';

      const dialog = document.createElement('div');
      dialog.className = 'app-prompt-dialog';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'app-prompt-title');
      dialog.style.background = '#fff';
      dialog.style.color = '#052a3a';
      dialog.style.padding = '1rem';
      dialog.style.borderRadius = '8px';
      dialog.style.minWidth = '320px';
      dialog.style.maxWidth = '92%';
      dialog.style.boxShadow = '0 10px 36px rgba(2,24,57,0.16)';

      dialog.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:0.6rem">
          <div id="app-prompt-title" style="font-weight:700;font-size:1rem">${String(title)}</div>
          <div style="color:#334;margin-top:4px">${String(message).replace(/\n/g, '<br/>')}</div>
          <input id="app-prompt-input" type="text" placeholder="${String(placeholder).replace(/"/g,'')}" value="${String(defaultValue).replace(/"/g,'') }" style="padding:0.5rem;border-radius:6px;border:1px solid rgba(0,0,0,0.12);width:100%" />
          <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.6rem">
            <button class="app-prompt-cancel" type="button">Cancel</button>
            <button class="app-prompt-ok" type="button" style="background:#0b66b2;color:#fff;border:none;padding:0.45rem 0.8rem;border-radius:6px">OK</button>
          </div>
        </div>`;

      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      const okBtn = dialog.querySelector('.app-prompt-ok');
      const cancelBtn = dialog.querySelector('.app-prompt-cancel');
      const input = dialog.querySelector('#app-prompt-input');
      const prevActive = document.activeElement;
      try { input.focus(); input.select(); } catch (e) {}

      function cleanup(result) {
        try { document.body.removeChild(backdrop); } catch (e) {}
        try { if (prevActive && typeof prevActive.focus === 'function') prevActive.focus(); } catch (e) {}
        resolve(result);
      }

      okBtn.addEventListener('click', () => cleanup(String(input.value)));
      cancelBtn.addEventListener('click', () => cleanup(null));
      backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) cleanup(null); });
      dialog.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') { ev.preventDefault(); cleanup(null); }
        if (ev.key === 'Enter') { ev.preventDefault(); cleanup(String(input.value)); }
      });
    });
  };

  // Modern single-button alert modal (promise-based). Usage: await showAlert('Saved');
  window.showAlert = function(message, options = {}) {
    return new Promise((resolve) => {
      const title = options.title || 'Notice';
      const okText = options.okText || 'OK';

      const backdrop = document.createElement('div');
      backdrop.className = 'app-alert-backdrop';
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0'; backdrop.style.left = '0'; backdrop.style.right = '0'; backdrop.style.bottom = '0';
      backdrop.style.background = 'rgba(0,0,0,0.45)';
      backdrop.style.zIndex = 100000;
      backdrop.style.display = 'flex';
      backdrop.style.alignItems = 'center';
      backdrop.style.justifyContent = 'center';

      const dialog = document.createElement('div');
      dialog.className = 'app-alert-dialog';
      dialog.setAttribute('role', 'alertdialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'app-alert-title');
      dialog.style.background = '#fff';
      dialog.style.color = '#052a3a';
      dialog.style.padding = '1rem';
      dialog.style.borderRadius = '8px';
      dialog.style.minWidth = '320px';
      dialog.style.maxWidth = '92%';
      dialog.style.boxShadow = '0 10px 36px rgba(2,24,57,0.16)';

      dialog.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:0.6rem">
          <div id="app-alert-title" style="font-weight:700;font-size:1rem">${String(title)}</div>
          <div style="color:#334;margin-top:4px">${String(message).replace(/\n/g, '<br/>')}</div>
          <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.6rem">
            <button class="app-alert-ok" type="button" style="background:#0b66b2;color:#fff;border:none;padding:0.45rem 0.8rem;border-radius:6px">${String(okText)}</button>
          </div>
        </div>`;

      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      // Focus management
      const okBtn = dialog.querySelector('.app-alert-ok');
      const prevActive = document.activeElement;
      try { okBtn.focus(); } catch (e) {}

      function cleanup() {
        try { document.body.removeChild(backdrop); } catch (e) {}
        try { if (prevActive && typeof prevActive.focus === 'function') prevActive.focus(); } catch (e) {}
        resolve(true);
      }

      okBtn.addEventListener('click', () => cleanup());
      backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) cleanup(); });
      dialog.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' || ev.key === 'Enter') { ev.preventDefault(); cleanup(); }
      });
    });
  };

  // Convenience alias for prompt
  window.askPrompt = async function(message, opts) { return await window.showPrompt(message, opts); };
  // Safe notification helper: prefer in-page notify/showToast, fall back to original alert
  window.safeNotify = function(message, type='info', duration) {
    try {
      if (typeof window.notify === 'function') return window.notify(message, type, duration);
    } catch (e) {}
    try {
      if (typeof window.showToast === 'function') return window.showToast(message, type, duration);
    } catch (e) {}
    try { if (window._originalAlert) return window._originalAlert(String(message)); } catch (e) {}
    // last resort
    try { alert(String(message)); } catch (e) { console.debug('Notification fallback:', message); }
  };
})();
