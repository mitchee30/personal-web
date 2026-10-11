# Wenbo's desk: live sensor for the website

A Raspberry Pi Pico W on my desk reads its built-in temperature sensor once a
minute and posts it to Adafruit IO. The home page of the portfolio reads the
latest value and shows "Wenbo's desk right now: 22.4°C". No extra parts needed.

## Set it up (about 15 minutes)

1. **Adafruit IO account** (free): sign up at io.adafruit.com.
   - Create a feed named `desk-temp`.
   - Open the feed's settings and set **Visibility: Public**, so the website can
     read it without a key.
   - Copy your username and your **AIO Key** (the key icon at the top).
2. **Flash MicroPython** onto the Pico W: hold BOOTSEL, plug it in, and drag the
   Pico W `.uf2` from micropython.org onto the drive that appears.
3. **Edit `main.py`**: fill in your Wi-Fi name and password, Adafruit IO
   username and key. Do not commit the real key to GitHub.
4. **Copy `main.py` to the Pico** with Thonny (File, Save as, Raspberry Pi Pico,
   name it `main.py`). Unplug and plug back in. The LED stays on once it is on
   Wi-Fi, and readings appear on the feed page within a minute.
5. **Turn on the widget**: in `assets/extras.js`, set
   `SENSOR_URL = "https://io.adafruit.com/api/v2/YOUR_USERNAME/feeds/desk-temp/data/last"`.

When the Pico is off for more than 30 minutes, the site says the sensor is asleep
and shows the last reading instead.

## Ideas for later

- Swap the chip sensor for a BME280 (temperature, humidity, pressure) on I2C.
- Add a light sensor so the site knows whether my desk lamp is on.
- Let visitors press a button on the site that blinks an LED on the desk.
