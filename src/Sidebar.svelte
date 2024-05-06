<script lang="ts">
  import { onMount } from "svelte";
  import browser from "webextension-polyfill";
  import UI from "./lib/UI.svelte";

  onMount(() => {
    console.log("mounted Sidebar");
    browser.browserAction.onClicked.addListener(() => {
      browser.sidebarAction.close();
    });
  });
</script>

<main>
  <UI />
</main>
