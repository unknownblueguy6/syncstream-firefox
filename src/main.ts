import "./sidebar.css";
import Sidebar from "./Sidebar.svelte";

const sidebar = new Sidebar({
  target: document.getElementById("sidebar")!,
});

export default sidebar;
