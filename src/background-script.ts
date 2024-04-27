import browser from 'webextension-polyfill';
import { id } from './stores';
import { NIL as NIL_UUID} from 'uuid';

const HOST_PATTERN = "://localhost:8080";

browser.runtime.onInstalled.addListener(()=>{
  console.log('Extension installed');
  const unsub = id.subscribe((value) => {
    if (value === NIL_UUID){
      fetch(`http${HOST_PATTERN}/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
      .then((response) => response.json())
      .then((json) => {
        id.set(json.id);
        console.log('ID set to', json.id)
      })
      .catch((error) => console.error(error));
    }
  })
  unsub();
});
