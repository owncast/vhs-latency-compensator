# Owncast Live Video Latency Compensator

## Overview

The Owncast Latency Compensator is a JavaScript module designed to keep HLS video streams using [VideoJS](https://videojs.com/) [VHS](https://github.com/videojs/http-streaming) to have as low latency as possible given the network conditions for the player. It is not compatible with device-native HLS playback such as Safari. It aims to stay as close to the live edge as possible without causing buffering or playback issues. It works by intelligently adjusting playback speed and, when necessary, jumping forward in the stream to reduce latency between the viewer and the live broadcast.

## How It Works

### The Latency Problem

In live streaming, viewers are always slightly behind the actual live broadcast. This delay (latency) occurs due to:

1. **Server-side delays**: The time it takes to encode and package video segments
2. **Client-side delays**: Natural stutters in playback, processing delays, and network hiccups that compound over time

Without intervention, this latency can grow from a few seconds to many seconds or even minutes, making the viewing experience feel less "live."

### The Solution

The Latency Compensator monitors your stream's latency and takes action when you fall too far behind:

1. **Speed Adjustment**: Gradually increases playback speed to catch up
2. **Forward Jumping**: In extreme cases, skips ahead to get closer to live
3. **Safety First**: Backs off immediately if there's any risk of buffering

### Video playback requirements

- The speed a viewer is consuming video into the player must be fast enough to allow faster than realtime playback. The latency compensator keeps an eye on the download speed and the amount of already buffered video when making decisions on if, and how much, latency can be compensated for.
- The smaller the segment duration is, the lower you can get your latency.

### Where will this not work?

You _need_ be using the VideoJS VHS tech for this to work. That means anything using native playback (such as HLS on Safari) are not supported. You will want to check what method of playback tech is being used before you use this.

## Key Features

### Imperceptible Speed Changes

- Uses micro-adjustments that are below the threshold of human perception
- Speed changes are spread over minutes rather than seconds
- Audio pitch and tempo changes are virtually unnoticeable

### Buffer Protection

- Continuously monitors buffer health and trends
- Requires a healthy buffer cushion before taking any action
- Tracks whether the buffer is growing, stable, or shrinking
- Immediately stops all compensation if buffering occurs

### Conservative Decision Making

- Waits for the stream to stabilize after startup
- Requires multiple consecutive stable checks before making changes
- Uses conservative bandwidth estimates based on historical data
- Remembers buffering events and becomes progressively more cautious

### Intelligent Thresholds

The compensator operates within dynamically calculated zones based on segment duration:

- **Comfort Zone**: Close enough to live that no action is needed
- **Action Zone**: Far enough behind that catching up would be beneficial
- **Safety Zone**: Maintains a minimum distance from live to prevent buffering

## Configuration

The compensator uses various tunable constants that control its behavior:

- **Buffering Limits**: How many buffering events before giving up
- **Speed Limits**: Maximum playback speed increase
- **Ramp Rates**: How quickly speed changes are applied
- **Check Intervals**: How often the system evaluates conditions
- **Bandwidth Requirements**: Minimum network headroom needed
- **Buffer Requirements**: Minimum buffer health for safe operation
- **Startup Delays**: Time to wait before beginning compensation

See the constants at the top of the script for current values and tuning.

## Usage

### Basic Setup

```javascript
import LatencyCompensator from "./latencyCompensator.js";

// Initialize with your video.js player instance
const compensator = new LatencyCompensator(player);

// Set clock skew with the time skew in milliseconds from the server
compensator.setClockSkew(skewInMilliseconds);

// Enable the compensator
compensator.enable();
```

## Demo Page

Change to the `demo` directory and install the dependencies and run the demo server. You can then visit `http://localhost:8080` to test the compensator in action with a basic test page.

- `npm install`
- `npm start`

## Probably not Production ready

This is an early attempt a the above approaches to reduce latency for live playback, however when things go wrong they can often put people's players in a worse place than they started due to re-buffering events. Continued work should be done to make sure attempting to get you closer to live never ends up in these states.

## Contributions

Since, in theory, this small library is helpful to anybody using VideoJS's HTTP Streaming, if we all band together we should be able to work out bugs and improving this so all of us have something that helps us with our respective projects.
