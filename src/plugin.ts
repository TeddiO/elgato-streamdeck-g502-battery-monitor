import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { PowerMonitor } from "./actions/power-monitor";

streamDeck.logger.setLevel(LogLevel.ERROR);
streamDeck.actions.registerAction(new PowerMonitor());
streamDeck.connect();
