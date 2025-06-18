{
	"Name": "G502 Battery Monitor",
	"Version": "__VERSION__",
	"Author": "Teddi",
	"Actions": [
		{
			"Name": "G502 Battery Monitor",
			"UUID": "com.teddi.g502-battery-monitor.monitor",
			"Icon": "imgs/actions/app/mouse-image",
			"Tooltip": "",
			"Controllers": [
				"Keypad"
			],
			"States": [
				{
					"Image": "imgs/actions/app/mouse-image",
					"TitleAlignment": "middle",
					"TitleColor": "#54f859",
					"FontSize": 16
				}
			]
		}
	],
	"Category": "G502 Battery Monitor",
	"CategoryIcon": "imgs/plugin/category-icon",
	"CodePath": "bin/plugin.js",
	"Description": "Monitors the battery status of G502 Wireless devices",
	"Icon": "imgs/plugin/marketplace",
	"SDKVersion": 2,
	"Software": {
		"MinimumVersion": "6.5"
	},
	"OS": [
		{
			"Platform": "mac",
			"MinimumVersion": "10.15"
		},
		{
			"Platform": "windows",
			"MinimumVersion": "10"
		}
	],
	"Nodejs": {
		"Version": "20",
		"Debug": "enabled"
	},
	"UUID": "com.teddi.g502-battery-monitor"
}
