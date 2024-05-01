<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  import Room from "./Room.svelte";
  import { code } from "../stores";
  import browser from "webextension-polyfill";
  import { UIEventType } from "../events";
  import type { UIEvent } from "../events";

  let code_input = "";
  let buttonText = "Copy";
  let isEditable = true;
  let joinedRoom = false;
  let canCreateRoom = false;

  const unsub = code.subscribe((value) => {
    code_input = value;
    if (value !== "") {
      isEditable = false;
    }
  });

  const clientPort = browser.runtime.connect({ name: "UI" });

  $: {
    code_input = code_input;
    isEditable = isEditable;
    joinedRoom = joinedRoom;
    canCreateRoom = canCreateRoom;
  }

  function copyText() {
    navigator.clipboard.writeText(code_input);
    buttonText = "Copied!";
  }

  async function createRoom() {
    const createRoomEvent: UIEvent = {
      timestamp: new Date(),
      type: UIEventType.CREATE_ROOM,
      data: {},
    };
    console.log(createRoomEvent);
    clientPort.postMessage(createRoomEvent);
  }

  async function joinRoom() {
    if (code_input.length === 6 && /^[A-Z]+$/.test(code_input)) {
      const joinRoomEvent: UIEvent = {
        timestamp: new Date(),
        type: UIEventType.JOIN_ROOM,
        data: { code: code_input },
      };
      console.log(joinRoomEvent);
      clientPort.postMessage(joinRoomEvent);
    }
  }

  onMount(() => {
    // Fetch initial code or perform any other initialization logic
    // browser.runtime.onMessage.addListener(eventListener);
    console.log("mounted UI");
    clientPort.onMessage.addListener((message: UIEvent) => {
      console.log("UI received message", message);
      if (message.type === UIEventType.ZERO) {
        console.log("ZERO");
        canCreateRoom = message.data.canCreateRoom;
        isEditable = message.data.isEditable;
      } else if (message.type === UIEventType.CREATE_ROOM) {
        console.log("CREATE_ROOM");
        code_input = message.data.code;
        if (message.data.code !== "") {
          canCreateRoom = false;
          isEditable = false;
          joinedRoom = true;
        }
      } else if (message.type === UIEventType.JOIN_ROOM) {
        console.log("JOIN_ROOM");
        if (message.data.success) {
          canCreateRoom = false;
          isEditable = false;
          joinedRoom = true;
        }
      }
    });
  });

  onDestroy(() => {
    unsub();
    clientPort.disconnect();
  });
</script>

<main>
  <div>
    <input
      type="text"
      bind:value={code_input}
      disabled={!isEditable}
      size="12"
    />
    <button on:click={copyText}>{buttonText}</button>
  </div>

  <div>
    <button on:click={createRoom} disabled={!canCreateRoom}>Create</button>
    <button on:click={joinRoom} disabled={!isEditable}>Join</button>
  </div>

  <hr />
  {#if joinedRoom}
    <Room />
  {/if}
</main>
