import LatencyCompensator from "./latencyCompensator.js";

var isRunningStat = document.querySelector(".latency-compensator-running");
var currentRateStat = document.querySelector(".current-rate-stat");
var currentLatencyStat = document.querySelector(".current-latency-stat");
var latencyMinMaxStat = document.querySelector(".latency-min-max");
var bufferingEventsStat = document.querySelector(".buffering-events-stat");
var inTimeoutStat = document.querySelector(".in-timeout-stat");
var timeoutRemainingStat = document.querySelector(".timeout-remaining-stat");

window.startDemo(function (player) {
  console.log("Enabling latency compensator...");
  window.latencyCompensator = new LatencyCompensator(player);

  window.latencyCompensator.onStats = (stats) => {
    const {
      latency,
      running,
      inTimeout,
      maxStartingLatency,
      minEndingLatency,
      bufferingEvents,
      timeoutRemaining,
      targetPlaybackRate,
    } = stats;
    console.log("Stats", stats);

    isRunningStat.textContent = running ? "True" : "False";
    bufferingEventsStat.textContent = currentRateStat.textContent =
      `${targetPlaybackRate.toFixed(3)}x` || targetPlaybackRate.toFixed(3);
    currentLatencyStat.textContent = latency / 1000;
    bufferingEventsStat.textContent = bufferingEvents;
    inTimeoutStat.textContent = inTimeout ? "True" : "False";

    timeoutRemainingStat.textContent = `${timeoutRemaining / 1000}s`;

    if (maxStartingLatency !== 0 && minEndingLatency !== 0) {
      latencyMinMaxStat.textContent = `${(maxStartingLatency / 1000).toFixed(
        2
      )} < - > ${(minEndingLatency / 1000).toFixed(2)}`;
    }
  };

  window.latencyCompensator.enable();
});
