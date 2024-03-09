import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import streamDeck, { LogLevel } from "@elgato/streamdeck";
import WebSocket from 'ws';

const logger = streamDeck.logger.createScope("Websocket Log");
logger.setLevel(LogLevel.TRACE);

let regex = /g502/g;
let deviceID: string = "";
let ws: WebSocket;
let curBattery: number = 0;


function GetBatteryLevel(deviceID: string) {
	ws.send(JSON.stringify(
		{
			"msgid": "",
			"verb": "GET",
			"path": `/battery/${deviceID}/state`
		})
	);
}

function SubscribeToBatteryLevel() {
	ws.send(JSON.stringify(
		{
			"msgid": "",
			"verb": "SUBSCRIBE",
			"path": `/battery/state/changed`
		})
	);
}

@action({ UUID: "com.teddi.g502-battery-monitor.increment" })
export class PowerMonitor extends SingletonAction {
	
	onWillAppear(ev: WillAppearEvent<any>): void | Promise<void> {
		ws = new WebSocket('ws://localhost:9010', "json");

		ws.on('open', function open() {
			logger.debug("Connected to G-HUB WebSocket");

			// Lets snag the device ID first
			ws.send(JSON.stringify(
				{
					"msgid": "",
					"verb": "GET",
					"path": "/devices/list" 
				})
			);
		});

		ws.on('message', function message(data) {
			let dataMap = JSON.parse(data.toString());

			// TODO: Iterate through the device list and find a G502.
			if (dataMap.path === "/devices/list" && (regex.test(dataMap.payload.deviceInfos[0].deviceModel))) {
				logger.debug("Received /devices/list");
				deviceID = dataMap.payload.deviceInfos[0].id;
				logger.debug(`Device ID: ${deviceID}`);
				GetBatteryLevel(deviceID)
			}

			if (dataMap.path === `/battery/${deviceID}/state`) {
				logger.debug(`Received /battery/${deviceID}/state`);
				curBattery = dataMap.payload.percentage;
				SubscribeToBatteryLevel();
				ev.action.setTitle(`${curBattery}%`);
			}

			if (dataMap.path === "/battery/state/changed") {
				// Need to wait for the event...
				logger.debug(`Received /battery/state/changed`);
				if (dataMap.payload.deviceId === deviceID) {
					curBattery = dataMap.payload.percentage;
					ev.action.setTitle(`${curBattery}%`);
				}
			}

	
		});

		return ev.action.setTitle("Pending information...");
	}

	// TODO: Deal with the fact where if we change screen, we'll want to kill the websocket connection.
	// onWillDisappear(ev: WillAppearEvent<any>): void | Promise<void> {

	// }
}

