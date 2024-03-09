import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { PowerMonitor } from "./actions/power-monitor";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.ERROR);
console.log("Starting plugin");

// Register the increment action.
streamDeck.actions.registerAction(new PowerMonitor());

// Finally, connect to the Stream Deck.
streamDeck.connect();
