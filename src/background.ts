export type FeatureToggles = {
  previews: boolean;
};

export interface ThemeSettings {
  alpha: number;
  blur: number;
  colorAccentBg: string;
  colorBg: string;
  colorFg: string;
  colorHighlightBg: string;
  colorWindowBg: string;
  contrast: number;
  radius: number;
  name: string;
}

export type ThemeModeSettings = {
  mode: "custom" | "preset";
  customThemeData: ThemeSettings | null;
  preset: string;
  accentMode: "accent" | "highlight" | "bg";
};

export type ThemeSettingsWrapper = {
  regular: ThemeModeSettings;
  incognito: ThemeModeSettings;
};

export const DefaultThemeSettings: ThemeSettingsWrapper = {
  regular: {
    mode: "preset",
    preset: "dark",
    customThemeData: null,
    accentMode: "highlight",
  },
  incognito: {
    mode: "preset",
    preset: "private",
    customThemeData: null,
    accentMode: "highlight",
  },
};

export const DefaultFeatureToggles: FeatureToggles = { previews: false };

const subscriptions: Record<string, Set<chrome.runtime.Port>> = {};
const ports: chrome.runtime.Port[] = [];

let currentFeatureToggles: FeatureToggles = DefaultFeatureToggles;

const getFeatureToggles = async (): Promise<FeatureToggles> => {
  const result = await chrome.storage.sync.get("featureToggles");
  if (result.featureToggles) {
    return result.featureToggles;
  } else {
    return DefaultFeatureToggles;
  }
};

getFeatureToggles().then((featureToggles) => {
  currentFeatureToggles = featureToggles;
});

const setFeatureToggles = async (featureToggles: FeatureToggles) => {
  await chrome.storage.sync.set({ featureToggles });
  ports.forEach((port) => {
    port.postMessage({ type: "featureTogglesUpdated", data: [featureToggles] });
  });
};

const getThemeSettings = async (): Promise<ThemeSettingsWrapper> => {
  const result = await chrome.storage.sync.get("themeSettings");
  if (result.themeSettings) {
    const settings: ThemeSettingsWrapper = result.themeSettings;
    if (!settings.regular.accentMode) {
      settings.regular.accentMode = "accent";
    }
    if (!settings.incognito.accentMode) {
      settings.incognito.accentMode = "accent";
    }
    return settings;
  } else {
    return DefaultThemeSettings;
  }
};

const setThemeSettings = async (themeSettings: ThemeSettingsWrapper) => {
  await chrome.storage.sync.set({ themeSettings });
  ports.forEach((port) => {
    console.warn("Sending themeSettingsUpdated", themeSettings, port);
    port.postMessage({ type: "themeSettingsUpdated", data: [themeSettings] });
  });
};

const onMessage = (request, sender, sendResponse) => {
  if (request.type == "chrome.tabs") {
    console.log("chrome.tabs", request.method, request.input);
    chrome.tabs[request.method](...request.input).then((data) => {
      console.log("chrome.tabs", request.method, "response", data);
      sendResponse(data);
    });
  } else if (request.type == "custom") {
    console.log("custom", request.method, request);
    if (request.method == "getSenderTab") {
      sendResponse(sender.tab);
    }
    if (request.method == "getThemeSettings") {
      getThemeSettings().then((themeSettings) => {
        console.log("Got theme settings", themeSettings);
        sendResponse(themeSettings);
      });
    }
    if (request.method == "setThemeSettings") {
      setThemeSettings(request.themeSettings).then(() => {
        sendResponse("ok");
      });
    }
    if (request.method == "getFeatureToggles") {
      getFeatureToggles().then((featureToggles) => {
        console.log("Got feature toggles", featureToggles);
        sendResponse(featureToggles);
      });
    }
    if (request.method == "setFeatureToggles") {
      setFeatureToggles(request.featureToggles).then(() => {
        sendResponse("ok");
      });
    }
    if (request.method == "getVisitedTabIds") {
      console.log("getVisitedTabIds");
      chrome.tabs.query({ currentWindow: true }).then((tabs) => {
        console.log(
          "Got tabs",
          tabs.map((tab) => `visited#${tab.id}`)
        );
        chrome.storage.session
          .get(tabs.map((tab) => `visited#${tab.id}`))
          .then((visitedTabs: Record<string, true>) => {
            console.log("Got visitedTabs", visitedTabs);
            sendResponse(
              Object.keys(visitedTabs).map((key) => parseInt(key.split("#")[1]))
            );
          });
      });
    }
  } else {
    sendResponse("Something went wrong");
  }

  // Return true to indicate that we wish to send a response asynchronously
  return true;
};

const onConnect = (port) => {
  console.warn("Port connected");
  port.onMessage.addListener((msg) => {
    console.log("background.ts: ", msg);
    if (msg.type === "subscribe") {
      if (subscriptions[msg.topic]) {
        subscriptions[msg.topic].add(port);
      } else {
        subscriptions[msg.topic] = new Set([port]);
      }
    }
    if (msg.type === "unsubscribe") {
      if (subscriptions[msg.topic]) {
        subscriptions[msg.topic].delete(port);
      } else {
        subscriptions[msg.topic] = new Set([]);
      }
    }
  });

  ports.push(port);

  port.onDisconnect.addListener(() => {
    console.warn("Port disconnected");
    Object.keys(subscriptions).forEach((topic) => {
      subscriptions[topic].delete(port);
    });
    ports.splice(ports.indexOf(port), 1);
  });
};

chrome.runtime.onMessage.addListener(onMessage);
chrome.runtime.onMessageExternal.addListener(onMessage);

chrome.runtime.onConnect.addListener(onConnect);
chrome.runtime.onConnectExternal.addListener(onConnect);

const allowedDomains = [
  "http://localhost",
  "https://tree-tabs-front.vercel.app",
];

function insertExtensionId(tab: chrome.tabs.Tab) {
  return;
  if (!tab.id) return;
  if (
    !allowedDomains.some((domain) => tab.url?.startsWith(domain)) &&
    !tab.url?.includes("vercel.app")
  )
    return;

  console.log("Inserting extension id: ", tab.id, tab.windowId);

  try {
    chrome.scripting
      .executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: (extensionId) => {
          console.log("Extension id: ", extensionId);
          const insert = () => {
            const container = document.querySelector(
              "#extension-id-container"
            ) as HTMLElement | null;
            if (!container) {
              console.error("No container");
              return;
            }
            if (container.dataset.extensionId == extensionId) return;
            container.setAttribute("data-extension-id", extensionId.toString());
          };
          if (document.readyState === "complete") {
            insert();
          } else {
            document.addEventListener("DOMContentLoaded", insert);
          }
        },
        args: [chrome.runtime.id],
      })
      .catch((e) => {
        console.error(e);
        console.log("On tab", tab.id, tab.url, tab.windowId);
      });
  } catch (e) {
    console.error(e);
    console.log("On tab", tab.id, tab.url, tab.windowId);
  }
}

chrome.tabs.query({}, (tabs) => {
  tabs.forEach((tab) => {
    insertExtensionId(tab);
  });
});

function captureTab(tab: chrome.tabs.Tab) {
  if (!currentFeatureToggles.previews) return;

  chrome.tabs.captureVisibleTab(tab.windowId).then((dataUrl) => {
    console.log("Got picture", dataUrl);
    ports.forEach((port) => {
      console.log("Sending picture");
      port.postMessage({
        type: "tabs.onTabCaptured",
        data: [tab.id, dataUrl],
      });
    });
  });
}

const eventTypes = [
  "onUpdated",
  "onActivated",
  "onCreated",
  "onRemoved",
  "onReplaced",
  "onDetached",
  "onAttached",
  "onMoved",
  "onHighlighted",
];

eventTypes.forEach((eventType) => {
  chrome.tabs[eventType].addListener((...args) => {
    console.warn(`tabs.${eventType}`, args);
    ports.forEach((port) => {
      console.log("Sending", `tabs.${eventType} to `, port);
      port.postMessage({ type: `tabs.${eventType}`, data: args });
    });
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  insertExtensionId(tab);
  if (tab.active && tab.id) {
    console.log("Set", `visited#${tab.id}`);
    chrome.storage.session.set({ [`visited#${tab.id}`]: true });
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  insertExtensionId(tab);
  if (tab.active && tab.id) {
    console.log("Set", `visited#${tab.id}`);
    chrome.storage.session.set({ [`visited#${tab.id}`]: true });
  }
});

chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
  console.log("Set", `visited#${activeInfo.tabId}`);
  chrome.storage.session.set({ [`visited#${activeInfo.tabId}`]: true });
  console.log("Getting picture");
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    captureTab(tab);
  });
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  chrome.tabs.get(addedTabId, (tab) => {
    insertExtensionId(tab);
    if (tab.active && tab.id) {
      console.log("Set", `visited#${tab.id}`);
      chrome.storage.session.set({ [`visited#${tab.id}`]: true });
    }
  });
  console.log("Remove", `visited#${removedTabId}`);
  chrome.storage.session.remove(`visited#${removedTabId}`);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  console.log("Remove", `visited#${tabId}`);
  chrome.storage.session.remove(`visited#${tabId}`);
});

// Set interval to keep the extension alive
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true });
}, 15000);
