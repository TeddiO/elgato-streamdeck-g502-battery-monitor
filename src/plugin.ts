import streamDeck from "@elgato/streamdeck";
import { PowerMonitor } from "./actions/power-monitor";

streamDeck.logger.setLevel("error");
streamDeck.actions.registerAction(new PowerMonitor());
streamDeck.connect();
