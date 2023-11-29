/* global browser */

const excluded = new Set();
let tid = null;

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

async function doUnload() {
  const includepins = await getFromStorage("boolean", "includepins", false);

  let qry = {
    url: "*://*/*",
    currentWindow: true,
    discarded: false,
  };
  if (!includepins) {
    qry["pinned"] = false;
  }

  const tabs = await browser.tabs.query(qry);
  const maxactivtabs = await getFromStorage("number", "maxactivtabs", 3);

  // remove excluded and order tabs (by last accessed time
  let tabIds = tabs
    .filter((t) => !excluded.has(t.id))
    .sort((a, b) => {
      return b.lastAccessed - a.lastAccessed;
    })
    .map((t) => t.id);

  // remove user defined number of last accessed tabs
  if (tabIds.length > maxactivtabs) {
    tabIds = tabIds.slice(maxactivtabs);
    browser.tabs.discard(tabIds);
  }
}

async function onClicked(/*tab ,clickData*/) {
  const tabs = await browser.tabs.query({
    currentWindow: true,
    highlighted: true,
  });
  for (const tab of tabs) {
    if (excluded.has(tab.id)) {
      excluded.delete(tab.id);
      browser.browserAction.setBadgeText({ tabId: tab.id, text: "" });
    } else {
      excluded.add(tab.id);
      browser.browserAction.setBadgeText({ tabId: tab.id, text: "off" });
    }
  }
}

function onRemoved(tabId /*,removeInfo*/) {
  if (excluded.has(tabId)) {
    excluded.delete(tabId);
  }
}

function delay_unload() {
  clearTimeout(tid);
  tid = setTimeout(doUnload, 2000);
}

// default state is disabled
browser.browserAction.disable();

// add listeners
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onActivated.addListener(delay_unload);
browser.tabs.onUpdated.addListener(
  (tabId, changeInfo, tab) => {
    if (/^https?:/.test(tab.url)) {
      if (changeInfo.status === "complete") {
        if (excluded.has(tabId)) {
          browser.browserAction.setBadgeText({ tabId: tabId, text: "off" });
        } else {
          browser.browserAction.setBadgeText({ tabId: tabId, text: "" });
        }
        browser.browserAction.enable(tabId);
      } else {
        delay_unload();
      }
    } else {
      browser.browserAction.disable(tabId);
    }
  },
  { properties: ["status"] }
);
