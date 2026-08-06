const $base = document.getElementById("apiBase");
const $token = document.getElementById("apiToken");
const $agent = document.getElementById("agentImport");
const $saved = document.getElementById("saved");

// apiBase får synkas mellan enheter (ej känsligt), men API-token är en hemlighet
// och ska ALDRIG ligga i chrome.storage.sync — den synkas då okrypterad till
// Googles moln. Token lever därför bara i chrome.storage.local (på enheten).
chrome.storage.sync.get(["apiBase", "apiToken", "agentImportEnabled"], (syncCfg) => {
  $base.value = syncCfg.apiBase || "";
  // Agent-läget (sidstyrd import) är AV som default — måste slås på aktivt.
  $agent.checked = syncCfg.agentImportEnabled === true;
  chrome.storage.local.get(["apiToken"], (localCfg) => {
    if (!localCfg.apiToken && syncCfg.apiToken) {
      // Migrera bort gammal token ur moln-synken: flytta till lokal lagring och
      // rensa den molnsynkade kopian.
      chrome.storage.local.set({ apiToken: syncCfg.apiToken });
      chrome.storage.sync.remove("apiToken");
      $token.value = syncCfg.apiToken;
    } else {
      $token.value = localCfg.apiToken || "";
    }
  });
});

document.getElementById("save").addEventListener("click", () => {
  const apiBase = $base.value.trim();
  const apiToken = $token.value.trim();
  // apiBase i sync, token endast lokalt. Rensa även ev. kvarvarande molnkopia.
  chrome.storage.sync.set({ apiBase, agentImportEnabled: $agent.checked });
  chrome.storage.sync.remove("apiToken");
  chrome.storage.local.set({ apiToken }, () => {
    $saved.textContent = "Sparat!";
    setTimeout(() => ($saved.textContent = ""), 1500);
  });
});
