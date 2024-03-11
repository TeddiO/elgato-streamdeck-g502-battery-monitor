import { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck, { LogLevel } from "@elgato/streamdeck";
import WebSocket from 'ws';

const logLevels: { [key: string]: LogLevel } = {
	'debug': LogLevel.DEBUG,
	'info': LogLevel.INFO,
	'warn': LogLevel.WARN,
	'error': LogLevel.ERROR,
	'trace': LogLevel.TRACE
};

const logLevel = process.env.BATTERY_MONITOR_LOGLEVEL ? logLevels[process.env.BATTERY_MONITOR_LOGLEVEL.toLowerCase()] : LogLevel.ERROR;
const logger = streamDeck.logger.createScope("Websocket Log");
logger.setLevel(logLevel);

let regex = /g502/g;
let deviceID: string = "";
let ws: WebSocket;
let curBattery: number = 0;
let initialized: boolean = false;

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

const states: { [key: string]: string } = { "charging": "⚡", "fullyCharged": "🔋" };
function HandleChargeString(dataMap: any) {
	
	if (dataMap.payload.fullyCharged) {
		return "🔋100%";
	}

	if (dataMap.payload.charging) {
		return `⚡${curBattery}%`;
	}

	return `${curBattery}%`;
}

@action({ UUID: "com.teddi.g502-battery-monitor.increment" })
export class PowerMonitor extends SingletonAction {
	
	onWillAppear(ev: WillAppearEvent<any>): void | Promise<void> {
		ws = new WebSocket('ws://localhost:9010', "json");

		setTimeout(() => {
			if (!initialized) {
				ws.close();
				logger.debug("Attempting to close WebSocket connection and re-init...");
				this.onWillAppear(ev);
				return;
			}
		}, 5000);

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
			logger.debug("Sent request for /devices/list");
		});

		ws.on('message', function message(data) {
			logger.debug(`Received message from G-HUB`);
			let dataMap = JSON.parse(data.toString());
	
			if (dataMap.path === "/devices/list") {
				logger.debug("Received /devices/list");
				for (let device of dataMap.payload.deviceInfos) {
					if (regex.test(device.deviceModel)) {
						deviceID = device.id;
						logger.debug(`Device ID: ${deviceID}`);
						GetBatteryLevel(deviceID)
						initialized = true;
						return;
					}
				}
			}

			if (dataMap.path === `/battery/${deviceID}/state`) {
				logger.debug(`Received /battery/${deviceID}/state`);
				curBattery = dataMap.payload.percentage;
				SubscribeToBatteryLevel();
				ev.action.setTitle(HandleChargeString(dataMap));
				return;
			}

			if (dataMap.path === "/battery/state/changed") {
				logger.debug(`Received /battery/state/changed`);
				if (dataMap.payload.deviceId === deviceID) {
					curBattery = dataMap.payload.percentage;
					ev.action.setTitle(HandleChargeString(dataMap));

					if (curBattery <= 20) {
						ev.action.showAlert()
					}
				}
			}
			return;
		});
		

		ws.on('error', function error(err) {
			logger.error(`WebSocket error: ${err}`);
		});

		
		return ev.action.setTitle("...%");
	}

	onWillDisappear(ev: WillDisappearEvent<any>): void | Promise<void> {
		logger.debug("Closing WebSocket connection");
		ws.close();
		initialized = false;
		logger.debug("WebSocket connection closed");
	}
}

