<script lang="ts">
  import browser from "webextension-polyfill";
  import { onMount, onDestroy } from "svelte";

  import Room from "./Room.svelte";
  import { code, messages } from "../stores";
  import { EventType, convertMessageToUIEvent } from "../events";
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
      joinedRoom = true;
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
      type: EventType.CREATE_ROOM,
      data: {},
    };
    console.log(createRoomEvent);
    clientPort.postMessage(createRoomEvent);
  }

  async function joinRoom() {
    if (code_input.length === 6 && /^[A-Z]+$/.test(code_input)) {
      const joinRoomEvent: UIEvent = {
        timestamp: new Date(),
        type: EventType.JOIN_ROOM,
        data: { code: code_input },
      };
      console.log(joinRoomEvent);
      clientPort.postMessage(joinRoomEvent);
    }
  }

  function handleMessage(event: CustomEvent<string>) {
    console.log("UI received message", event);
    const rawMessage = event.detail;
    const formattedMessage = `You: ${rawMessage}`;
    messages.set([...$messages, formattedMessage]);
    clientPort.postMessage(convertMessageToUIEvent(rawMessage));
  }

  onMount(() => {
    // Fetch initial code or perform any other initialization logic
    // browser.runtime.onMessage.addListener(eventListener);
    console.log("mounted UI");
    clientPort.onMessage.addListener((event: UIEvent) => {
      console.log("UI received message", event);
      if (event.type === EventType.ZERO) {
        console.log("ZERO");
        canCreateRoom = event.data.canCreateRoom;
        isEditable = event.data.isEditable;
      } else if (event.type === EventType.CREATE_ROOM) {
        console.log("CREATE_ROOM");
        code_input = event.data.code;
        if (event.data.code !== "") {
          canCreateRoom = false;
          isEditable = false;
          joinedRoom = true;
        }
      } else if (event.type === EventType.JOIN_ROOM) {
        console.log("JOIN_ROOM");
        if (event.data.success) {
          canCreateRoom = false;
          isEditable = false;
          joinedRoom = true;
        }
      } else if (event.type === EventType.MESSAGE) {
        console.log("MESSAGE");
        messages.set([...$messages, event.data.message]);
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
    <Room messages={$messages} on:message={handleMessage} />
  {/if}
</main>
