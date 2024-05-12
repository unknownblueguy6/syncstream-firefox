import { writable } from "svelte/store";
import { NIL as NIL_UUID } from "uuid";
// import browser from "webextension-polyfill";

function createLocalStorageStore<Type>(
  key: string,
  startValue: Type,
  storageType: string = "local",
) {
  const { subscribe, set } = writable(startValue);

  browser.storage[storageType].get(key).then((result: Record<string, Type>) => {
    if (result[key] !== undefined) {
      set(result[key]);
    }
  });

  return {
    subscribe,
    set: (value: Type) => {
      browser.storage[storageType].set({ [key]: value });
      set(value);
    },
  };
}

const id = createLocalStorageStore("id", NIL_UUID);
const code = createLocalStorageStore("code", "");
const token = createLocalStorageStore("token", NIL_UUID);

const messages = createLocalStorageStore<string[]>("messages", [], "session");

export { id, code, token, messages };
