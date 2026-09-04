(() => {
  'use strict';

  const STORAGE_KEY = 'family-music-quest-profiles-v1';
  const LEGACY_KEYS = ['tgq-progress-v2', 'tgt-progress-v1', 'nova-piano-progress-v1'];
  const AVATARS = ['🎸', '🎹', '⭐', '🚀', '🐉', '🦊', '🐺', '🐱', '🎮', '⚡'];
  const THEMES = [
    { id:'lime', name:'Electric Lime', color:'#a8f23d' },
    { id:'purple', name:'Power Purple', color:'#9b8cff' },
    { id:'blue', name:'Sky Blue', color:'#38bdf8' },
    { id:'orange', name:'Amp Orange', color:'#fb923c' },
    { id:'pink', name:'Star Pink', color:'#f472b6' }
  ];

  const $ = selector => document.querySelector(selector);
  const uid = () => `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const cleanName = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  const emptyStore = () => ({ version:1, activeProfileId:null, legacyResetCompleted:false, profiles:[] });

  let store = loadStore();
  let setupDraft = { name:'', avatar:AVATARS[0], theme:THEMES[0].id };
  let editingId = null;

  function loadStore() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (value && Array.isArray(value.profiles)) {
        value.profiles = value.profiles.filter(profile => profile && profile.id && cleanName(profile.name)).map(profile => ({
          id:profile.id,
          name:cleanName(profile.name),
          avatar:AVATARS.includes(profile.avatar) ? profile.avatar : AVATARS[0],
          theme:THEMES.some(theme => theme.id === profile.theme) ? profile.theme : THEMES[0].id,
          guitarProgress:profile.guitarProgress || null,
          pianoProgress:profile.pianoProgress || null,
          createdAt:profile.createdAt || Date.now(),
          updatedAt:profile.updatedAt || Date.now()
        }));
        if (!value.profiles.some(profile => profile.id === value.activeProfileId)) value.activeProfileId = value.profiles[0]?.id || null;
        return { ...emptyStore(), ...value, version:1 };
      }
    } catch {}
    return emptyStore();
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function activeProfile() {
    return store.profiles.find(profile => profile.id === store.activeProfileId) || null;
  }

  function retireLegacyProgressOnce() {
    if (store.legacyResetCompleted) return;
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    store.legacyResetCompleted = true;
  }

  function themeColor(themeId) {
    return THEMES.find(theme => theme.id === themeId)?.color || THEMES[0].color;
  }

  function announceChange(reason) {
    updateIdentity();
    window.dispatchEvent(new CustomEvent('family-music:profile-changed', { detail:{ profile:clone(activeProfile()), reason } }));
  }

  function createProfile(name, avatar, theme) {
    const safeName = cleanName(name);
    if (!safeName) return null;
    retireLegacyProgressOnce();
    const profile = { id:uid(), name:safeName, avatar:AVATARS.includes(avatar) ? avatar : AVATARS[0], theme:THEMES.some(item => item.id === theme) ? theme : THEMES[0].id, guitarProgress:null, pianoProgress:null, createdAt:Date.now(), updatedAt:Date.now() };
    store.profiles.push(profile);
    store.activeProfileId = profile.id;
    persist();
    announceChange('created');
    return profile;
  }

  function switchProfile(id) {
    if (id === store.activeProfileId || !store.profiles.some(profile => profile.id === id)) return;
    window.dispatchEvent(new CustomEvent('family-music:profile-changing'));
    store.activeProfileId = id;
    persist();
    announceChange('switched');
  }

  function updateProfile(id, changes) {
    const profile = store.profiles.find(item => item.id === id);
    if (!profile) return false;
    const name = cleanName(changes.name);
    if (!name) return false;
    profile.name = name;
    if (AVATARS.includes(changes.avatar)) profile.avatar = changes.avatar;
    if (THEMES.some(theme => theme.id === changes.theme)) profile.theme = changes.theme;
    profile.updatedAt = Date.now();
    persist();
    announceChange('edited');
    return true;
  }

  function deleteProfile(id) {
    const index = store.profiles.findIndex(profile => profile.id === id);
    if (index < 0) return false;
    const wasActive = store.activeProfileId === id;
    window.dispatchEvent(new CustomEvent('family-music:profile-changing'));
    store.profiles.splice(index, 1);
    if (wasActive) store.activeProfileId = store.profiles[0]?.id || null;
    persist();
    announceChange('deleted');
    return true;
  }

  function getInstrumentProgress(instrument) {
    const profile = activeProfile();
    return clone(profile?.[`${instrument}Progress`] || null);
  }

  function saveInstrumentProgress(instrument, progress) {
    const profile = activeProfile();
    if (!profile || !['guitar', 'piano'].includes(instrument)) return;
    profile[`${instrument}Progress`] = clone(progress);
    profile.updatedAt = Date.now();
    persist();
  }

  function avatarChoices(selected) {
    return AVATARS.map(avatar => `<button type="button" class="profile-choice avatar-choice ${avatar === selected ? 'selected' : ''}" data-avatar="${avatar}" aria-label="Choose ${avatar}" aria-pressed="${avatar === selected}">${avatar}</button>`).join('');
  }

  function themeChoices(selected) {
    return THEMES.map(theme => `<button type="button" class="profile-choice theme-choice ${theme.id === selected ? 'selected' : ''}" data-theme="${theme.id}" aria-pressed="${theme.id === selected}"><i style="--choice-color:${theme.color}"></i><span>${theme.name}</span></button>`).join('');
  }

  function bindChoices(root, draft) {
    root.querySelectorAll('[data-avatar]').forEach(button => button.addEventListener('click', () => {
      draft.avatar = button.dataset.avatar;
      root.querySelectorAll('[data-avatar]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', selected); });
    }));
    root.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => {
      draft.theme = button.dataset.theme;
      root.querySelectorAll('[data-theme]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', selected); });
    }));
  }

  function showFirstRun(step = 1) {
    const panel = $('#profileSetup');
    panel.hidden = false;
    $('#profileManager').hidden = true;
    $('#instrumentChooser').hidden = true;
    if (step === 1) {
      panel.innerHTML = `<div class="profile-dialog"><p class="eyebrow">FAMILY MUSIC QUEST</p><h1>Who's playing?</h1><p class="muted">Enter a first name or nickname. Nothing goes online.</p><label class="profile-name-field">Your name<input id="newPlayerName" maxlength="24" autocomplete="nickname" placeholder="Type your name"></label><p id="profileSetupError" class="profile-error" hidden>Please enter a name.</p><button id="continueProfileSetup" class="button big">Continue</button></div>`;
      const input = $('#newPlayerName');
      input.value = setupDraft.name;
      $('#continueProfileSetup').onclick = () => {
        setupDraft.name = cleanName(input.value);
        if (!setupDraft.name) { $('#profileSetupError').hidden = false; input.focus(); return; }
        showFirstRun(2);
      };
      input.addEventListener('keydown', event => { if (event.key === 'Enter') $('#continueProfileSetup').click(); });
      input.focus();
      return;
    }
    panel.innerHTML = `<div class="profile-dialog wide"><button id="backProfileSetup" class="icon-button profile-dialog-back" aria-label="Back">←</button><p class="eyebrow">MAKE IT YOURS</p><h1>Ready, ${escapeHtml(setupDraft.name)}?</h1><h2>Choose your avatar</h2><div class="avatar-grid">${avatarChoices(setupDraft.avatar)}</div><h2>Choose your colour</h2><div class="theme-grid">${themeChoices(setupDraft.theme)}</div><button id="finishProfileSetup" class="button big">Start Playing</button></div>`;
    bindChoices(panel, setupDraft);
    $('#backProfileSetup').onclick = () => showFirstRun(1);
    $('#finishProfileSetup').onclick = () => {
      const profile = createProfile(setupDraft.name, setupDraft.avatar, setupDraft.theme);
      if (!profile) return showFirstRun(1);
      panel.hidden = true;
      showHome();
    };
  }

  function openManager() {
    const panel = $('#profileManager');
    panel.hidden = false;
    panel.innerHTML = `<div class="profile-dialog wide"><button id="closeProfileManager" class="icon-button profile-dialog-close" aria-label="Close profiles">✕</button><p class="eyebrow">WHO'S PLAYING?</p><h1>Choose a player</h1><div class="profile-list">${store.profiles.map(profile => `<button type="button" class="profile-list-item ${profile.id === store.activeProfileId ? 'active' : ''}" data-switch-profile="${profile.id}"><span>${profile.avatar}</span><strong>${escapeHtml(profile.name)}</strong>${profile.id === store.activeProfileId ? '<small>Playing now</small>' : '<small>Switch player</small>'}</button>`).join('')}</div><div class="profile-manager-actions"><button id="addLocalPlayer" class="button big">＋ Add Player</button><button id="editActiveProfile" class="button secondary">Edit Profile</button></div></div>`;
    $('#closeProfileManager').onclick = () => { panel.hidden = true; };
    panel.querySelectorAll('[data-switch-profile]').forEach(button => button.onclick = () => { switchProfile(button.dataset.switchProfile); panel.hidden = true; showHome(); });
    $('#addLocalPlayer').onclick = () => { setupDraft = { name:'', avatar:AVATARS[0], theme:THEMES[0].id }; panel.hidden = true; showFirstRun(1); };
    $('#editActiveProfile').onclick = openEditor;
  }

  function openEditor() {
    const profile = activeProfile();
    if (!profile) return;
    editingId = profile.id;
    const draft = { name:profile.name, avatar:profile.avatar, theme:profile.theme };
    const panel = $('#profileManager');
    panel.innerHTML = `<div class="profile-dialog wide"><button id="backToProfiles" class="icon-button profile-dialog-back" aria-label="Back to players">←</button><p class="eyebrow">EDIT PROFILE</p><h1>Make it yours</h1><label class="profile-name-field">Display name<input id="editPlayerName" maxlength="24" autocomplete="nickname" value="${escapeHtml(profile.name)}"></label><h2>Avatar</h2><div class="avatar-grid">${avatarChoices(draft.avatar)}</div><h2>Colour</h2><div class="theme-grid">${themeChoices(draft.theme)}</div><div class="profile-manager-actions"><button id="saveProfileEdit" class="button big">Save Changes</button><button id="deleteLocalProfile" class="button danger">Delete Player</button></div><p id="profileEditError" class="profile-error" hidden>Please enter a name.</p></div>`;
    bindChoices(panel, draft);
    $('#backToProfiles').onclick = openManager;
    $('#saveProfileEdit').onclick = () => {
      draft.name = cleanName($('#editPlayerName').value);
      if (!updateProfile(editingId, draft)) { $('#profileEditError').hidden = false; return; }
      panel.hidden = true;
    };
    $('#deleteLocalProfile').onclick = () => {
      const current = store.profiles.find(item => item.id === editingId);
      if (!current || !confirm(`Delete ${current.name} and all local Guitar and Piano progress?`)) return;
      deleteProfile(editingId);
      panel.hidden = true;
      if (store.profiles.length) showHome(); else { setupDraft = { name:'', avatar:AVATARS[0], theme:THEMES[0].id }; showFirstRun(1); }
    };
  }

  function updateIdentity() {
    const profile = activeProfile();
    if (!profile) return;
    document.documentElement.style.setProperty('--player-accent', themeColor(profile.theme));
    document.body.dataset.playerTheme = profile.theme;
    document.querySelectorAll('[data-player-name]').forEach(element => { element.textContent = profile.name; });
    document.querySelectorAll('[data-player-avatar]').forEach(element => { element.textContent = profile.avatar; });
    const greeting = $('#profileGreeting');
    if (greeting) greeting.textContent = `Welcome back, ${profile.name}!`;
  }

  function showHome() {
    if (!activeProfile()) return showFirstRun(1);
    updateIdentity();
    $('#profileSetup').hidden = true;
    $('#profileManager').hidden = true;
    $('#instrumentChooser').hidden = false;
    document.body.classList.remove('piano-active');
    $('#pianoApp').hidden = true;
    window.dispatchEvent(new CustomEvent('family-music:show-home'));
  }

  function init() {
    $('#profileMenuButton').addEventListener('click', openManager);
    updateIdentity();
    if (!activeProfile()) showFirstRun(1);
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }

  window.FMQProfiles = {
    storageKey:STORAGE_KEY,
    hasActiveProfile:() => Boolean(activeProfile()),
    getActiveProfile:() => clone(activeProfile()),
    getProfiles:() => clone(store.profiles),
    getInstrumentProgress,
    saveInstrumentProgress,
    showHome,
    openManager,
    createProfile,
    switchProfile,
    updateProfile,
    deleteProfile,
    _test:{ reload:() => { store=loadStore(); updateIdentity(); }, legacyKeys:[...LEGACY_KEYS] }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
