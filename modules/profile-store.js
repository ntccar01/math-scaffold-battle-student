(function () {
  "use strict";

  const PROFILE_INDEX_KEY = "math-scaffold-battle:profiles:v1";
  const ACTIVE_PROFILE_KEY = "math-scaffold-battle:active-profile:v1";
  const PROFILE_DATA_PREFIX = "math-scaffold-battle:profile:v1:";
  const LEGACY_MIGRATION_KEY = "math-scaffold-battle:legacy-migration:v1";

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function cleanText(value, maxLength) {
    return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
  }

  function listProfiles() {
    const profiles = readJson(PROFILE_INDEX_KEY, []);
    if (!Array.isArray(profiles)) return [];
    return profiles
      .filter((profile) => profile && typeof profile.id === "string")
      .sort((a, b) => String(b.lastActiveAt || "").localeCompare(String(a.lastActiveAt || "")));
  }

  function saveProfiles(profiles) {
    return writeJson(PROFILE_INDEX_KEY, profiles);
  }

  function profileDataKey(profileId) {
    return `${PROFILE_DATA_PREFIX}${profileId}`;
  }

  function readProfileData(profileId) {
    const saved = readJson(profileDataKey(profileId), null);
    if (saved && saved.profileId === profileId && saved.progressByUnit && typeof saved.progressByUnit === "object") {
      return saved;
    }
    return {
      version: 1,
      profileId,
      progressByUnit: {}
    };
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `student-${window.crypto.randomUUID()}`;
    }
    return `student-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createProfile(input) {
    const className = cleanText(input.className, 20);
    const seatNo = cleanText(input.seatNo, 6);
    const displayName = cleanText(input.displayName, 20);
    if (!className || !seatNo || !displayName) {
      throw new Error("請完整填寫班級、座號與顯示名稱。");
    }

    const profiles = listProfiles();
    const duplicate = profiles.find((profile) =>
      String(profile.className || "").toLocaleLowerCase() === className.toLocaleLowerCase()
      && String(profile.seatNo || "").toLocaleLowerCase() === seatNo.toLocaleLowerCase()
    );
    if (duplicate) return { profile: duplicate, isExisting: true };

    const now = new Date().toISOString();
    const profile = {
      id: createId(),
      className,
      seatNo,
      displayName,
      createdAt: now,
      lastActiveAt: now
    };
    if (!saveProfiles([profile, ...profiles])) {
      throw new Error("瀏覽器無法保存資料，請確認不是受限制的無痕模式。");
    }
    writeJson(profileDataKey(profile.id), {
      version: 1,
      profileId: profile.id,
      progressByUnit: {}
    });
    return { profile, isExisting: false };
  }

  function getProfile(profileId) {
    return listProfiles().find((profile) => profile.id === profileId) || null;
  }

  function getActiveProfile() {
    try {
      const profileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      return profileId ? getProfile(profileId) : null;
    } catch {
      return null;
    }
  }

  function setActiveProfile(profileId) {
    const profile = getProfile(profileId);
    if (!profile) return null;
    localStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    touchProfile(profile.id);
    return getProfile(profile.id);
  }

  function clearActiveProfile() {
    try {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    } catch {
      // 儲存區受限制時保持未登入狀態。
    }
  }

  function touchProfile(profileId) {
    const profiles = listProfiles();
    const now = new Date().toISOString();
    const next = profiles.map((profile) => profile.id === profileId ? { ...profile, lastActiveAt: now } : profile);
    saveProfiles(next);
  }

  function loadUnitState(profileId, unitId) {
    return readProfileData(profileId).progressByUnit[unitId]?.state || null;
  }

  function saveUnitState(profileId, unitId, state) {
    if (!getProfile(profileId)) return false;
    const profileData = readProfileData(profileId);
    profileData.progressByUnit[unitId] = {
      savedAt: new Date().toISOString(),
      state
    };
    const saved = writeJson(profileDataKey(profileId), profileData);
    if (saved) touchProfile(profileId);
    return saved;
  }

  function clearUnitState(profileId, unitId) {
    const profileData = readProfileData(profileId);
    delete profileData.progressByUnit[unitId];
    return writeJson(profileDataKey(profileId), profileData);
  }

  function readLegacyState(legacyKey) {
    if (readJson(LEGACY_MIGRATION_KEY, null)) return null;
    return readJson(legacyKey, null);
  }

  function markLegacyMigrated(profileId, legacyKey) {
    const saved = writeJson(LEGACY_MIGRATION_KEY, {
      profileId,
      migratedAt: new Date().toISOString()
    });
    if (saved) localStorage.removeItem(legacyKey);
  }

  function deleteProfile(profileId) {
    const next = listProfiles().filter((profile) => profile.id !== profileId);
    if (!saveProfiles(next)) return false;
    localStorage.removeItem(profileDataKey(profileId));
    if (localStorage.getItem(ACTIVE_PROFILE_KEY) === profileId) clearActiveProfile();
    return true;
  }

  function isStorageAvailable() {
    const key = "math-scaffold-battle:storage-test";
    try {
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  window.StudentProfileStore = {
    listProfiles,
    createProfile,
    getProfile,
    getActiveProfile,
    setActiveProfile,
    clearActiveProfile,
    loadUnitState,
    saveUnitState,
    clearUnitState,
    readLegacyState,
    markLegacyMigrated,
    deleteProfile,
    isStorageAvailable
  };
})();
