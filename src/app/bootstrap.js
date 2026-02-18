import { loadVerbsDataset } from "../services/verbsService.js";
import { initPractice } from "../features/practice/index.js";
import { initLoginModal } from "../shared/components/modal.js";

console.log("Verb Flow initialized");

initPractice();
initLoginModal();

loadVerbsDataset()
    .then((verbs) => console.log("Dataset loaded:", verbs.length, "verbs"))
    .catch((err) => console.error("Dataset load failed", err));
