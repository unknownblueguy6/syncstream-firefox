import { writable } from "svelte/store";
import { NIL as NIL_UUID } from "uuid";
// import browser from "webextension-polyfill";

function createLocalStorageStore(key: string, startValue: string) {
  const { subscribe, set } = writable(startValue);

  browser.storage.local.get(key).then((result) => {
    if (result[key] !== undefined) {
      set(result[key]);
    }
  });

  return {
    subscribe,
    set: (value: string) => {
      browser.storage.local.set({ [key]: value });
      set(value);
    },
  };
}

const id = createLocalStorageStore("id", NIL_UUID);
const code = createLocalStorageStore("code", "");
const token = createLocalStorageStore("token", NIL_UUID);

export { id, code, token };
