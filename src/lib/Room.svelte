<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  export let messages: string[];
  let messageInput = "";

  function sendMessage() {
    dispatch("message", messageInput);
    messageInput = "";
    // currentMessages = [...currentMessages, messageInput];
    // messages.set(currentMessages);
  }

  onMount(() => {
    console.log("mounted Room UI");
  });
</script>

<main>
  <!-- Scrollable list of messages -->
  <div class="message-list">
    {#each messages as message, index}
      <div key={index}>{message}</div>
    {/each}
  </div>

  <!-- Text box and send button -->
  <div>
    <input type="text" bind:value={messageInput} />
    <button on:click={sendMessage}>Send</button>
  </div>
</main>

<style>
  .message-list {
    overflow-y: auto; /* Enable vertical scrolling */
    color: rgba(255, 255, 255, 0.87);
    border: 1px solid #ccc; /* Add a border for visual separation */
    padding: 8px;
  }
</style>
