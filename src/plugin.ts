import streamDeck from "@elgato/streamdeck";
import { PowerMonitor } from "./actions/power-monitor";

streamDeck.logger.setLevel("error");
// Preserve compatibility with the manifest's pre-7.1 minimum version.
streamDeck.settings.useLegacySettingsBehavior = true;
streamDeck.actions.registerAction(new PowerMonitor());
streamDeck.connect();
