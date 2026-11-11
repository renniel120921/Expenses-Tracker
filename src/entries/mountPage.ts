import { createApp, type Component } from "vue";
import "@/styles/main.css";
import { initNetworkListeners } from "@/lib/offlineSync";
import { initServiceWorker } from "@/lib/swRegistration";

export function mountPage(rootComponent: Component): void {
  initNetworkListeners();
  if (import.meta.env.PROD) {
    initServiceWorker();
  }
  createApp(rootComponent).mount("#app");
}
