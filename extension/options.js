const $base = document.getElementById("apiBase");
const $token = document.getElementById("apiToken");
const $saved = document.getElementById("saved");

chrome.storage.sync.get(["apiBase", "apiToken"], (cfg) => {
  $base.value = cfg.apiBase || "";
  $token.value = cfg.apiToken || "";
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({ apiBase: $base.value.trim(), apiToken: $token.value.trim() }, () => {
    $saved.textContent = "Sparat!";
    setTimeout(() => ($saved.textContent = ""), 1500);
  });
});
