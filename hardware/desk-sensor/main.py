# Wenbo's desk: live temperature for the portfolio website
# Runs on a Raspberry Pi Pico W (MicroPython). Reads the RP2040's built-in
# temperature sensor every minute and sends it to an Adafruit IO feed, which the
# website reads from its public "last value" URL.
#
# Fill in the four settings below, copy this file to the Pico as main.py,
# and it starts on power-up.

import network, time, machine, urequests

WIFI_SSID = "your-wifi-name"
WIFI_PASSWORD = "your-wifi-password"
AIO_USERNAME = "your-adafruit-io-username"
AIO_KEY = "your-adafruit-io-key"        # keep this file private; never commit a real key
FEED = "desk-temp"
EVERY_SECONDS = 60

# The built-in sensor sits on the chip, so it reads a few degrees above room
# temperature. Adjust after comparing with a thermometer.
OFFSET_C = -3.0

led = machine.Pin("LED", machine.Pin.OUT)
sensor = machine.ADC(4)


def read_temp_c():
    # average a few samples to smooth out ADC noise
    total = 0
    for _ in range(16):
        total += sensor.read_u16()
        time.sleep_ms(5)
    volts = (total / 16) * 3.3 / 65535
    return 27 - (volts - 0.706) / 0.001721 + OFFSET_C


def connect():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        for _ in range(30):
            if wlan.isconnected():
                break
            led.toggle()
            time.sleep(0.5)
    led.value(wlan.isconnected())
    return wlan.isconnected()


def send(value):
    url = "https://io.adafruit.com/api/v2/%s/feeds/%s/data" % (AIO_USERNAME, FEED)
    r = urequests.post(url, json={"value": "%.1f" % value}, headers={"X-AIO-Key": AIO_KEY})
    ok = r.status_code in (200, 201)
    r.close()
    return ok


while True:
    try:
        if connect():
            t = read_temp_c()
            print("desk temp %.1f C, sent:" % t, send(t))
        else:
            print("no wifi, will retry")
    except Exception as e:
        print("error:", e)
    time.sleep(EVERY_SECONDS)
