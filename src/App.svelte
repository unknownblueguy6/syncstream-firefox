<script lang="ts">
  import { onMount } from "svelte";
  
  import Counter from "./lib/Counter.svelte";

  onMount(() => {
    console.log("mounted Sidebar");
  });
</script>

<main>
  <div class="card">
    <Counter />
  </div>
</main>
