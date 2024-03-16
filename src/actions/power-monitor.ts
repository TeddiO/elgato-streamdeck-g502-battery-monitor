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

const logger = streamDeck.logger.createScope("Websocket Log");
const logLevel = process.env.BATTERY_MONITOR_LOGLEVEL ? logLevels[process.env.BATTERY_MONITOR_LOGLEVEL.toLowerCase()] : LogLevel.ERROR;
logger.setLevel(logLevel);


let regex = /g502/;
let deviceID: string = "";
let ws: WebSocket;
let screenEvent: WillAppearEvent<any>;
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

function HandleChargeString(dataMap: any) {
	
	if (dataMap.payload.fullyCharged) {
		return "🔋100%";
	}

	if (dataMap.payload.charging) {
		return `⚡${curBattery}%`;
	}

	return `${curBattery}%`;
}

function AttemptRetry(retryTime: number = 5000) {
	logger.debug(`Attempting retry in ${retryTime / 1000} seconds`);
	let timeoutAttempt = setTimeout(() => {
		logger.debug("Attempting to close WebSocket connection and re-init...");
		ws.close();
		logger.debug("WebSocket connection closed");
		ws = CreateWebsocket();
		logger.debug("WebSocket initializing...");
	}, retryTime);
}

function OpenWebSocket() {
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
}

function OnWebsocketMessage(data: WebSocket.Data) {
	logger.debug(`Received message from G-HUB`);
	let dataMap = JSON.parse(data.toString());

	if (dataMap.path === "/devices/list") {
		logger.debug("Received /devices/list");
		if (dataMap.payload.deviceInfos.length === 0) {
			logger.error("No devices found, retrying in 10 seconds...");
			AttemptRetry(10000);
			return;
		}

		for (let device of dataMap.payload.deviceInfos) {
			let regexTest = regex.test(device.deviceModel);
			if (regexTest) {
				logger.debug(`Valid device: ${device}`);
				deviceID = device.id;
				logger.debug(`Device ID: ${deviceID}`);
				GetBatteryLevel(deviceID)
				initialized = true;
				return;
			}
		}

		// Edge case if a device isn't plugged in yet or G-HUB is having a moment
		if (!initialized) {
			logger.error("No G502 devices found, retrying in 10 seconds...");
			AttemptRetry(10000);
			return;
		}
	}

	if (dataMap.path === `/battery/${deviceID}/state`) {
		logger.debug(`Received /battery/${deviceID}/state`);
		if (!dataMap.payload || !dataMap.payload.percentage) {
			AttemptRetry(10000);
			return;
		}

		logger.debug(`Battery: ${dataMap.payload.percentage}%`);
		curBattery = dataMap.payload.percentage;
		SubscribeToBatteryLevel();
		screenEvent.action.setTitle(HandleChargeString(dataMap));
		return;
	}

	if (dataMap.path === "/battery/state/changed") {
		logger.debug(`Received /battery/state/changed`);
		if (dataMap.payload.deviceId === deviceID) {
			curBattery = dataMap.payload.percentage;
			screenEvent.action.setTitle(HandleChargeString(dataMap));

			if (curBattery <= 20) {
				screenEvent.action.showAlert()
			}
		}
	}
	return;
}

function OnWebsocketError(err: Error) {
	logger.error(`WebSocket error: ${err}`);
}

function OnWebsocketClose() {
	logger.debug("WebSocket connection closed");
	if (!initialized) {
		AttemptRetry();
	}
}

function CreateWebsocket() {
	ws = new WebSocket('ws://localhost:9010', "json");

	ws.on('open', OpenWebSocket);
	ws.on('message', OnWebsocketMessage);
	ws.on('error', OnWebsocketError);
	ws.on('close', OnWebsocketClose);
	return ws;
}

@action({ UUID: "com.teddi.g502-battery-monitor.monitor" })
export class PowerMonitor extends SingletonAction {
	onWillAppear(ev: WillAppearEvent<any>): void | Promise<void> {
		logger.debug("WebSocket initializing...");
		ws = CreateWebsocket()
		screenEvent = ev;
		
		return ev.action.setTitle("🕒...%");
	}

	onWillDisappear(screenEvent: WillDisappearEvent<any>): void | Promise<void> {
		logger.debug("Changing page: Closing WebSocket connection");
		ws.close();
		logger.debug("Changing page: WebSocket connection closed");
	}
}

