# VideoJS Live HTTP Streaming Latency Compensator

## What

This is an early and experimental approach to reduce the latency of live video streaming when using [VideoJS](https://videojs.com/) [VHS](https://github.com/videojs/http-streaming). It is not compatible with device-native HLS playback such as Safari.

It has not been tested using DASH.

## How

Two approaches are used to get the player as close as possible to live:

- For large amounts of latency compensation a time jump occurs. This is visible and can be jarring to the viewer.
- For smaller amounts of latency compensation the playback speed is increased to reach the target latency. This can result in odd audio artifacts, primarily when the content is music heavy, but often times it's not noticeable.

### Requirements

- The speed a viewer is consuming video into the player must be fast enough to allow faster than realtime playback. The latency compensator keeps an eye on the download speed and the amount of already buffered video when making decisions on if, and how much, latency can be compensated for.
- The smaller the segment duration is, the lower you can get your latency.

### Target values

Because latency is directly connected to segment duration, it uses the segment duration to determine the maximum (begin compensating for latency) and minimum (stop compensating) latency. The smaller the segment, the lower, in theory, you can get your latency.

### Buffering Events

If re-buffering occurs the latency compensator will go into a _"timeout"_ period to allow things to get back on track. If too many re-buffering events occur within a window the latency compensator will completely turn off, as it is assumed that the conditions to get closer to live are not available.

Re-buffering will also cause the latency compensator to re-calculate the target latency values, using the point where the re-buffering events take place as a cue that those values may be as low as possible.

Re-buffering events are also the largest culprit for major latency. So if trying to compensate for latency actually causes more re-buffering events it would be very counter productive. It should be generally seen that prioritizing latency over all else is a fool's errand, because you'll have more latency than you had before if you're paused and waiting for re-buffering all the time.

## Where will this not work?

You _need_ be using the VideoJS VHS tech for this to work. That means anything using native playback (such as HLS on Safari) are not supported. You will want to check what method of playback tech is being used before you use this.

## Usage

First you should check if you're using the VHS tech.
Then create an instance of `LatencyCompensator` and pass in your videojs player instance.

```javascript
latencyCompensator = new LatencyCompensator(myPlayer);
latencyCompensator.enable();
```

## Probably not Production ready

This is an early attempt a the above approaches to reduce latency for live playback, however when things go wrong they can often put people's players in a worse place than they started due to re-buffering events. Continued work should be done to make sure attempting to get you closer to live never ends up in these states.

## Contributions

Since, in theory, this small library is helpful to anybody using VideoJS's HTTP Streaming, if we all band together we should be able to work out bugs and improving this so all of us have something that helps us with our respective projects.
