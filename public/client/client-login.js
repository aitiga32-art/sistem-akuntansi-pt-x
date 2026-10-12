(function () {
  const form = document.getElementById('clientLoginForm');
  const passwordInput = document.getElementById('clientPassword');
  const usernameInput = document.getElementById('clientUsername');
  const toggleButton = document.getElementById('toggleClientPasswordBtn');
  const submitButton = document.getElementById('clientLoginSubmit');
  const statusBox = document.getElementById('clientLoginStatus');

  function setStatus(message, kind) {
    if (!statusBox) return;
    statusBox.textContent = message || '';
    statusBox.className = 'status' + (message ? ' show ' + (kind || 'info') : '');
  }

  function setLoading(isLoading) {
    if (submitButton) {
      submitButton.disabled = isLoading;
      submitButton.textContent = isLoading ? 'Memeriksa...' : 'Login Klien';
    }
  }

  async function postClientLogin(payload) {
    const response = await fetch('/app/api/client/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(function () {
      return {};
    });
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Login klien gagal.');
    }
    return data;
  }

  if (toggleButton && passwordInput) {
    toggleButton.addEventListener('click', function () {
      const visible = passwordInput.type === 'text';
      passwordInput.type = visible ? 'password' : 'text';
      toggleButton.setAttribute('title', visible ? 'Lihat password' : 'Sembunyikan password');
      toggleButton.setAttribute('aria-label', visible ? 'Lihat password' : 'Sembunyikan password');
    });
  }

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      if (!username || !password) {
        setStatus('Username/email dan password wajib diisi.', 'error');
        return;
      }

      setLoading(true);
      setStatus('Memeriksa akun client portal...', 'info');
      try {
        const result = await postClientLogin({ username, password });
        setStatus('Login berhasil. Membuka client portal...', 'info');
        window.location.assign(result.redirectUrl || '/app/client');
      } catch (err) {
        setStatus(err.message || 'Login klien gagal.', 'error');
        if (passwordInput) passwordInput.focus();
      } finally {
        setLoading(false);
      }
    });
  }
})();
