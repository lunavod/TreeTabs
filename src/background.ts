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
  currentFeatureToggles = featureToggles;
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

class CustomApi {
  static getSenderTab(request, sender, sendResponse) {
    return sendResponse(sender.tab);
  }

  static getThemeSettings(request, sender, sendResponse) {
    return getThemeSettings().then((themeSettings) => {
      sendResponse(themeSettings);
    });
  }

  static setThemeSettings(request, sender, sendResponse) {
    return setThemeSettings(request.themeSettings).then(() => {
      sendResponse("ok");
    });
  }

  static getFeatureToggles(request, sender, sendResponse) {
    return getFeatureToggles().then((featureToggles) => {
      sendResponse(featureToggles);
    });
  }

  static setFeatureToggles(request, sender, sendResponse) {
    return setFeatureToggles(request.featureToggles).then(() => {
      sendResponse("ok");
    });
  }

  static getVisitedTabIds(request, sender, sendResponse) {
    chrome.tabs.query({ currentWindow: true }).then((tabs) => {
      chrome.storage.session
        .get(tabs.map((tab) => `visited#${tab.id}`))
        .then((visitedTabs: Record<string, true>) => {
          sendResponse(
            Object.keys(visitedTabs).map((key) => parseInt(key.split("#")[1]))
          );
        });
    });
  }

  static getTabCreatedDates(request, sender, sendResponse) {
    const tabIds: number[] = request.tabIds;
    chrome.storage.session
      .get(tabIds.map((tabId) => `createdDate#${tabId}`))
      .then((createdDates: Record<string, number>) => {
        const result: Record<number, number> = {};
        tabIds.forEach((tabId) => {
          result[tabId] = createdDates[`createdDate#${tabId}`] || Date.now();
        });
        sendResponse(result);
      });
  }
}

const onMessage = (request, sender, sendResponse) => {
  if (request.type == "chrome.tabs") {
    console.log("chrome.tabs", request.method, request.input);
    chrome.tabs[request.method](...request.input).then((data) => {
      console.log("chrome.tabs", request.method, "response", data);
      sendResponse(data);
    });
  } else if (request.type == "custom") {
    if (!CustomApi[request.method]) {
      console.error("Method not found", request.method);
      return sendResponse("Method not found");
    }
    CustomApi[request.method](request, sender, sendResponse);
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

function captureTab(tab: chrome.tabs.Tab) {
  if (!currentFeatureToggles.previews) return;

  chrome.tabs.captureVisibleTab(tab.windowId).then((dataUrl) => {
    console.warn("Got picture");
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
  if (tab.active && tab.id) {
    console.log("Set", `visited#${tab.id}`);
    chrome.storage.session.set({ [`visited#${tab.id}`]: true });
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  chrome.storage.session.set({ [`createdDate#${tab.id}`]: Date.now() });
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

chrome.runtime.onInstalled.addListener(function () {
  chrome.tabs.create({
    url: "https://tree-tabs-front.vercel.app/afterInstall",
    active: true,
  });

  chrome.tabs
    .query({ url: "https://tree-tabs-front.vercel.app/container" })
    .then((tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id);
      });
    });

  return false;
});
