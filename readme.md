# G502 Battery Stream Deck Monitor

A plugin for the Stream Deck that allows for monitoring the battery level of a Logitech G502 Lightspeed mouse (and variants).

Upon boot or back to the page with the indicator on, it'll query the battery level and update the charge accordingly. It'll also give you an indicator for when it's charging and / or fully charged.

- Requires the Logitech G-Hub to be installed.
- Based on the beta NodeJS SDK for the Stream Deck (https://github.com/elgatosf/streamdeck)
- Requires Stream Deck 6.4 or newer.

## Installation

To install, grab the latest release from the [releases page](https://github.com/TeddiO/elgato-streamdeck-g502-battery-monitor/releases) and extract it to the plugin folder for the Stream Deck. On Windows, this is usually `C:\Users\<username>\AppData\Roaming\Elgato\StreamDeck\Plugins`. Once extracted, restart the Stream Deck software and you should see the G502 Battery Monitor in the list of plugins.

## Usage

Simply drag the plugin onto the Stream Deck and it'll start monitoring the battery level of the G502 Lightspeed mouse. It'll also show the charging status and occasionally flash a warning icon when the battery level drops below 20%.

### MacOS

This has been untested on MacOS. It might work, it might not 🤷.
