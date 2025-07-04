/* global window document */
/* eslint-disable vars-on-top, no-var, object-shorthand, no-console */
(function (window) {
  var representationsEl = document.getElementById("representations");

  representationsEl.addEventListener("change", function () {
    var selectedIndex = representationsEl.selectedIndex;

    if (!selectedIndex || selectedIndex < 1 || !window.vhs) {
      return;
    }
    var selectedOption =
      representationsEl.options[representationsEl.selectedIndex];

    if (!selectedOption) {
      return;
    }

    var id = selectedOption.value;

    window.vhs.representations().forEach(function (rep) {
      rep.playlist.disabled = rep.id !== id;
    });

    window.mpc.fastQualityChange_();
  });
  var isManifestObjectType = function (url) {
    return /application\/vnd\.videojs\.vhs\+json/.test(url);
  };
  var hlsOptGroup = document.querySelector('[label="hls"]');
  // var dashOptGroup = document.querySelector('[label="dash"]');
  // var drmOptGroup = document.querySelector('[label="drm"]');
  // var liveOptGroup = document.querySelector('[label="live"]');
  // var llliveOptGroup = document.querySelector('[label="low latency live"]');
  var manifestOptGroup = document.querySelector(
    '[label="json manifest object"]'
  );

  var sourceList;
  var hlsDataManifest;
  var dashDataManifest;

  var addSourcesToDom = function () {
    if (!sourceList || !hlsDataManifest || !dashDataManifest) {
      return;
    }

    sourceList.forEach(function (source) {
      var option = document.createElement("option");

      option.innerText = source.name;
      option.value = source.uri;

      // if (source.keySystems) {
      //   option.setAttribute(
      //     "data-key-systems",
      //     JSON.stringify(source.keySystems, null, 2)
      //   );
      // }

      if (source.mimetype) {
        option.setAttribute("data-mimetype", source.mimetype);
      }

      if (source.features.indexOf("low-latency") !== -1) {
        llliveOptGroup.appendChild(option);
      } else if (source.features.indexOf("live") !== -1) {
        liveOptGroup.appendChild(option);
      } else if (source.keySystems) {
        drmOptGroup.appendChild(option);
      } else if (source.mimetype === "application/x-mpegurl") {
        hlsOptGroup.appendChild(option);
      } else if (source.mimetype === "application/dash+xml") {
        dashOptGroup.appendChild(option);
      }
    });

    var hlsOption = document.createElement("option");
    var dashOption = document.createElement("option");

    // dashOption.innerText =
    //   "Dash Manifest Object Test, does not survive page reload";
    // dashOption.value = `data:application/vnd.videojs.vhs+json,${dashDataManifest}`;
    // hlsOption.innerText =
    //   "HLS Manifest Object Test, does not survive page reload";
    // hlsOption.value = `data:application/vnd.videojs.vhs+json,${hlsDataManifest}`;

    manifestOptGroup.appendChild(hlsOption);
    manifestOptGroup.appendChild(dashOption);
  };

  var sourcesXhr = new window.XMLHttpRequest();

  sourcesXhr.addEventListener("load", function () {
    sourceList = JSON.parse(sourcesXhr.responseText);
    addSourcesToDom();
  });
  sourcesXhr.open("GET", "./scripts/sources.json");
  sourcesXhr.send();

  var hlsManifestXhr = new window.XMLHttpRequest();

  hlsManifestXhr.addEventListener("load", function () {
    hlsDataManifest = hlsManifestXhr.responseText;
    addSourcesToDom();
  });
  hlsManifestXhr.open("GET", "./scripts/hls-manifest-object.json");
  hlsManifestXhr.send();

  var dashManifestXhr = new window.XMLHttpRequest();

  dashManifestXhr.addEventListener("load", function () {
    dashDataManifest = dashManifestXhr.responseText;
    addSourcesToDom();
  });
  dashManifestXhr.open("GET", "./scripts/dash-manifest-object.json");
  dashManifestXhr.send();

  // all relevant elements
  var urlButton = document.getElementById("load-url");
  var sources = document.getElementById("load-source");
  var stateEls = {};

  var getInputValue = function (el) {
    if (
      el.type === "url" ||
      el.type === "text" ||
      el.nodeName.toLowerCase() === "textarea"
    ) {
      if (isManifestObjectType(el.value)) {
        return "";
      }
      return encodeURIComponent(el.value);
    } else if (el.type === "select-one") {
      return el.options[el.selectedIndex].value;
    } else if (el.type === "checkbox") {
      return el.checked;
    }

    console.warn("unhandled input type " + el.type);
    return "";
  };

  var setInputValue = function (el, value) {
    if (
      el.type === "url" ||
      el.type === "text" ||
      el.nodeName.toLowerCase() === "textarea"
    ) {
      el.value = decodeURIComponent(value);
    } else if (el.type === "select-one") {
      for (var i = 0; i < el.options.length; i++) {
        if (el.options[i].value === value) {
          el.options[i].selected = true;
        }
      }
    } else {
      // get the `value` into a Boolean.
      el.checked = JSON.parse(value);
    }
  };

  var newEvent = function (name) {
    var event;

    if (typeof window.Event === "function") {
      event = new window.Event(name);
    } else {
      event = document.createEvent("Event");
      event.initEvent(name, true, true);
    }

    return event;
  };

  // taken from video.js
  var getFileExtension = function (path) {
    var splitPathRe;
    var pathParts;

    if (typeof path === "string") {
      splitPathRe =
        /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]*?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/i;
      pathParts = splitPathRe.exec(path);

      if (pathParts) {
        return pathParts.pop().toLowerCase();
      }
    }

    return "";
  };

  var saveState = function () {
    var query = "";

    if (!window.history.replaceState) {
      return;
    }

    Object.keys(stateEls).forEach(function (elName) {
      var symbol = query.length ? "&" : "?";

      query += symbol + elName + "=" + getInputValue(stateEls[elName]);
    });

    window.history.replaceState({}, "vhs demo", query);
  };

  window.URLSearchParams =
    window.URLSearchParams ||
    function (locationSearch) {
      this.get = function (name) {
        var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
          locationSearch
        );

        return results ? decodeURIComponent(results[1]) : null;
      };
    };

  // eslint-disable-next-line
  var loadState = function () {
    var params = new window.URLSearchParams(window.location.search);

    return Object.keys(stateEls).reduce(function (acc, elName) {
      acc[elName] =
        typeof params.get(elName) !== "object"
          ? params.get(elName)
          : getInputValue(stateEls[elName]);
      return acc;
    }, {});
  };

  // eslint-disable-next-line
  var reloadScripts = function (urls, cb) {
    var el = document.getElementById("reload-scripts");

    if (!el) {
      el = document.createElement("div");
      el.id = "reload-scripts";
      document.body.appendChild(el);
    }

    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    var loaded = [];

    var checkDone = function () {
      if (loaded.length === urls.length) {
        cb();
      }
    };

    urls.forEach(function (url) {
      var script = document.createElement("script");

      // scripts marked as defer will be loaded asynchronously but will be executed in the order they are in the DOM
      script.defer = true;
      // dynamically created scripts are async by default unless otherwise specified
      // async scripts are loaded asynchronously but also executed as soon as they are loaded
      // we want to load them in the order they are added therefore we want to turn off async
      script.async = false;
      script.src = url;
      script.onload = function () {
        loaded.push(url);
        checkDone();
      };
      el.appendChild(script);
    });
  };

  var regenerateRepresentations = function () {
    while (representationsEl.firstChild) {
      representationsEl.removeChild(representationsEl.firstChild);
    }

    var selectedIndex;

    window.vhs.representations().forEach(function (rep, i) {
      var option = document.createElement("option");

      option.value = rep.id;
      option.innerText = JSON.stringify({
        id: rep.id,
        videoCodec: rep.codecs.video,
        audioCodec: rep.codecs.audio,
        bandwidth: rep.bandwidth,
        heigth: rep.heigth,
        width: rep.width,
      });

      if (window.mpc.media().id === rep.id) {
        selectedIndex = i;
      }

      representationsEl.appendChild(option);
    });

    representationsEl.selectedIndex = selectedIndex;
  };

  function getBuffered(buffered) {
    var bufferedText = "";

    if (!buffered) {
      return bufferedText;
    }

    if (buffered.length) {
      bufferedText += buffered.start(0) + " - " + buffered.end(0);
    }
    for (var i = 1; i < buffered.length; i++) {
      bufferedText += ", " + buffered.start(i) + " - " + buffered.end(i);
    }
    return bufferedText;
  }

  var setupSegmentMetadata = function (player) {
    // setup segment metadata
    var segmentMetadata = document.querySelector("#segment-metadata");

    player.one("loadedmetadata", function () {
      var tracks = player.textTracks();
      var segmentMetadataTrack;

      for (var i = 0; i < tracks.length; i++) {
        if (tracks[i].label === "segment-metadata") {
          segmentMetadataTrack = tracks[i];
        }
      }

      while (segmentMetadata.children.length) {
        segmentMetadata.removeChild(segmentMetadata.firstChild);
      }

      if (segmentMetadataTrack) {
        segmentMetadataTrack.addEventListener("cuechange", function () {
          var cues = segmentMetadataTrack.activeCues || [];

          while (segmentMetadata.children.length) {
            segmentMetadata.removeChild(segmentMetadata.firstChild);
          }

          for (var j = 0; j < cues.length; j++) {
            var text = JSON.stringify(JSON.parse(cues[j].text), null, 2);
            var li = document.createElement("li");
            var pre = document.createElement("pre");

            pre.classList.add("border", "rounded", "p-2");
            pre.textContent = text;
            li.appendChild(pre);
            segmentMetadata.appendChild(li);
          }
        });
      }
    });
  };

  var setupPlayerStats = function (player) {
    player.on("dispose", () => {
      if (window.statsTimer) {
        window.clearInterval(window.statsTimer);
        window.statsTimer = null;
      }
    });
    var currentTimeStat = document.querySelector(".current-time-stat");
    var bufferedStat = document.querySelector(".buffered-stat");
    var playableBufferStat = document.querySelector(
      ".current-playablebuffer-stat"
    );
    var videoBufferedStat = document.querySelector(".video-buffered-stat");
    var audioBufferedStat = document.querySelector(".audio-buffered-stat");
    var seekableStartStat = document.querySelector(".seekable-start-stat");
    var seekableEndStat = document.querySelector(".seekable-end-stat");
    var videoBitrateState = document.querySelector(".video-bitrate-stat");
    var measuredBitrateStat = document.querySelector(".measured-bitrate-stat");
    var videoTimestampOffset = document.querySelector(".video-timestampoffset");
    var audioTimestampOffset = document.querySelector(".audio-timestampoffset");

    player.on("timeupdate", function () {
      currentTimeStat.textContent = player.currentTime().toFixed(1);
      const playableBuffer = player.buffered().end(0) - player.currentTime();
      playableBufferStat.textContent = playableBuffer.toFixed(2);
    });

    window.statsTimer = window.setInterval(function () {
      var oldStart;
      var oldEnd;
      var seekable = player.seekable();

      if (seekable && seekable.length) {
        oldStart = seekableStartStat.textContent;
        if (seekable.start(0).toFixed(1) !== oldStart) {
          seekableStartStat.textContent = seekable.start(0).toFixed(1);
        }
        oldEnd = seekableEndStat.textContent;
        if (seekable.end(0).toFixed(1) !== oldEnd) {
          seekableEndStat.textContent = seekable.end(0).toFixed(1);
        }
      }

      // buffered
      bufferedStat.textContent = getBuffered(player.buffered());

      // exit early if no VHS
      if (!player.tech(true).vhs) {
        videoBufferedStat.textContent = "";
        audioBufferedStat.textContent = "";
        playableBufferStat.textContent = "";
        videoBitrateState.textContent = "";
        measuredBitrateStat.textContent = "";
        videoTimestampOffset.textContent = "";
        audioTimestampOffset.textContent = "";
        return;
      }

      videoBufferedStat.textContent = getBuffered(
        player.tech(true).vhs.masterPlaylistController_.mainSegmentLoader_
          .sourceUpdater_.videoBuffer &&
          player.tech(true).vhs.masterPlaylistController_.mainSegmentLoader_
            .sourceUpdater_.videoBuffer.buffered
      );

      // demuxed audio
      var audioBuffer = getBuffered(
        player.tech(true).vhs.masterPlaylistController_.audioSegmentLoader_
          .sourceUpdater_.audioBuffer &&
          player.tech(true).vhs.masterPlaylistController_.audioSegmentLoader_
            .sourceUpdater_.audioBuffer.buffered
      );

      // muxed audio
      if (!audioBuffer) {
        audioBuffer = getBuffered(
          player.tech(true).vhs.masterPlaylistController_.mainSegmentLoader_
            .sourceUpdater_.audioBuffer &&
            player.tech(true).vhs.masterPlaylistController_.mainSegmentLoader_
              .sourceUpdater_.audioBuffer.buffered
        );
      }
      audioBufferedStat.textContent = audioBuffer;

      if (
        player.tech(true).vhs.masterPlaylistController_.audioSegmentLoader_
          .sourceUpdater_.audioBuffer
      ) {
        audioTimestampOffset.textContent =
          player.tech(
            true
          ).vhs.masterPlaylistController_.audioSegmentLoader_.sourceUpdater_.audioBuffer.timestampOffset;
      } else if (
        player.tech(true).vhs.masterPlaylistController_.mainSegmentLoader_
          .sourceUpdater_.audioBuffer
      ) {
        audioTimestampOffset.textContent =
          player.tech(
            true
          ).vhs.masterPlaylistController_.mainSegmentLoader_.sourceUpdater_.audioBuffer.timestampOffset;
      }

      if (
        player.tech(true).vhs.masterPlaylistController_.mainSegmentLoader_
          .sourceUpdater_.videoBuffer
      ) {
        videoTimestampOffset.textContent =
          player.tech(
            true
          ).vhs.masterPlaylistController_.mainSegmentLoader_.sourceUpdater_.videoBuffer.timestampOffset;
      }

      // bitrates
      var playlist = player.tech_.vhs.playlists.media();

      if (playlist && playlist.attributes && playlist.attributes.BANDWIDTH) {
        videoBitrateState.textContent =
          (playlist.attributes.BANDWIDTH / 1024).toLocaleString(undefined, {
            maximumFractionDigits: 1,
          }) + " kbps";
      }
      if (player.tech_.vhs.bandwidth) {
        measuredBitrateStat.textContent =
          (player.tech_.vhs.bandwidth / 1024).toLocaleString(undefined, {
            maximumFractionDigits: 1,
          }) + " kbps";
      }
    }, 500);
  };

  [
    "debug",
    "autoplay",
    "muted",
    "fluid",
    "minified",
    "sync-workers",
    "liveui",
    "llhls",
    "url",
    "type",
    "keysystems",
    "buffer-water",
    "exact-manifest-timings",
    "pixel-diff-selector",
    "network-info",
    "dts-offset",
    "override-native",
    "preload",
    "mirror-source",
  ].forEach(function (name) {
    stateEls[name] = document.getElementById(name);
  });

  window.startDemo = function (cb) {
    var state = loadState();

    Object.keys(state).forEach(function (elName) {
      setInputValue(stateEls[elName], state[elName]);
    });

    Array.prototype.forEach.call(sources.options, function (s, i) {
      if (s.value === state.url) {
        sources.selectedIndex = i;
      }
    });

    stateEls.fluid.addEventListener("change", function (event) {
      saveState();
      if (event.target.checked) {
        window["player-fixture"].style.aspectRatio = "16/9";
        window["player-fixture"].style.minHeight = "initial";
      } else {
        window["player-fixture"].style.aspectRatio = "";
        window["player-fixture"].style.minHeight = "250px";
      }
      window.player.fluid(event.target.checked);
    });

    stateEls.muted.addEventListener("change", function (event) {
      saveState();
      window.player.muted(event.target.checked);
    });

    stateEls.autoplay.addEventListener("change", function (event) {
      saveState();
      window.player.autoplay(event.target.checked);
    });

    // stateEls that reload the player and scripts
    [
      "mirror-source",
      "sync-workers",
      "preload",
      "llhls",
      "buffer-water",
      "override-native",
      "liveui",
      "pixel-diff-selector",
      "network-info",
      "dts-offset",
      "exact-manifest-timings",
    ].forEach(function (name) {
      stateEls[name].addEventListener("change", function (event) {
        saveState();

        stateEls.minified.dispatchEvent(newEvent("change"));
      });
    });

    stateEls.debug.addEventListener("change", function (event) {
      saveState();
      window.videojs.log.level(event.target.checked ? "debug" : "info");
    });

    stateEls.minified.addEventListener("change", function (event) {
      var urls = [
        "node_modules/video.js/dist/alt/video.core",
        "node_modules/videojs-contrib-eme/dist/videojs-contrib-eme",
        "node_modules/videojs-contrib-quality-levels/dist/videojs-contrib-quality-levels",
        "node_modules/videojs-http-source-selector/dist/videojs-http-source-selector",
      ].map(function (url) {
        return url + (event.target.checked ? ".min" : "") + ".js";
      });

      if (stateEls["sync-workers"].checked) {
        urls.push("dist/videojs-http-streaming-sync-workers.js");
      } else {
        urls.push(
          "node_modules/@videojs/http-streaming/dist/videojs-http-streaming.js"
        );
      }

      saveState();

      if (window.player) {
        window.player.dispose();
        delete window.player;
      }
      if (window.videojs) {
        delete window.videojs;
      }

      reloadScripts(urls, function () {
        var player;
        var fixture = document.getElementById("player-fixture");
        var videoEl = document.createElement("video-js");

        videoEl.setAttribute("controls", "");
        videoEl.setAttribute(
          "preload",
          stateEls.preload.options[stateEls.preload.selectedIndex].value ||
            "auto"
        );
        videoEl.className = "vjs-default-skin";
        fixture.appendChild(videoEl);

        var mirrorSource = getInputValue(stateEls["mirror-source"]);

        player = window.player = window.videojs(videoEl, {
          plugins: {
            httpSourceSelector: {
              default: "auto",
            },
          },
          liveui: stateEls.liveui.checked,
          enableSourceset: mirrorSource,
          html5: {
            vhs: {
              overrideNative: getInputValue(stateEls["override-native"]),
              experimentalBufferBasedABR: getInputValue(
                stateEls["buffer-water"]
              ),
              experimentalLLHLS: getInputValue(stateEls.llhls),
              experimentalExactManifestTimings: getInputValue(
                stateEls["exact-manifest-timings"]
              ),
              experimentalLeastPixelDiffSelector: getInputValue(
                stateEls["pixel-diff-selector"]
              ),
              useNetworkInformationApi: getInputValue(stateEls["network-info"]),
              useDtsForTimestampOffset: getInputValue(stateEls["dts-offset"]),
            },
          },
        });

        setupPlayerStats(player);
        setupSegmentMetadata(player);

        // save player muted state interation
        player.on("volumechange", function () {
          if (stateEls.muted.checked !== player.muted()) {
            stateEls.muted.checked = player.muted();
            saveState();
          }
        });

        player.on("sourceset", function () {
          var source = player.currentSource();

          if (source.keySystems) {
            var copy = JSON.parse(JSON.stringify(source.keySystems));

            // have to delete pssh as it will often make keySystems too big
            // for a uri
            Object.keys(copy).forEach(function (key) {
              if (copy[key].hasOwnProperty("pssh")) {
                delete copy[key].pssh;
              }
            });

            stateEls.keysystems.value = JSON.stringify(copy, null, 2);
          }

          if (source.src) {
            stateEls.url.value = encodeURI(source.src);
          }

          if (source.type) {
            stateEls.type.value = source.type;
          }

          saveState();
        });

        player.width(640);
        player.height(264);

        // configure videojs-contrib-eme
        player.eme();

        stateEls.debug.dispatchEvent(newEvent("change"));
        stateEls.muted.dispatchEvent(newEvent("change"));
        stateEls.fluid.dispatchEvent(newEvent("change"));
        stateEls.autoplay.dispatchEvent(newEvent("change"));

        // run the load url handler for the intial source
        if (stateEls.url.value) {
          urlButton.dispatchEvent(newEvent("click"));
        } else {
          sources.dispatchEvent(newEvent("change"));
        }
        player.on("loadedmetadata", function () {
          if (player.tech_.vhs) {
            window.vhs = player.tech_.vhs;
            window.mpc = player.tech_.vhs.masterPlaylistController_;
            window.mpc.masterPlaylistLoader_.on(
              "mediachange",
              regenerateRepresentations
            );
            regenerateRepresentations();
          } else {
            window.vhs = null;
            window.mpc = null;
          }
        });
        cb(player);
      });
    });

    var urlButtonClick = function (event) {
      var ext;
      var type = stateEls.type.value;

      // reset type if it's a manifest object's type
      if (type === "application/vnd.videojs.vhs+json") {
        type = "";
      }

      if (isManifestObjectType(stateEls.url.value)) {
        type = "application/vnd.videojs.vhs+json";
      }

      if (!type.trim()) {
        ext = getFileExtension(stateEls.url.value);

        if (ext === "mpd") {
          type = "application/dash+xml";
        } else if (ext === "m3u8") {
          type = "application/x-mpegURL";
        }
      }

      saveState();

      var source = {
        src: stateEls.url.value,
        type: type,
      };

      if (stateEls.keysystems.value) {
        source.keySystems = JSON.parse(stateEls.keysystems.value);
      }

      sources.selectedIndex = -1;

      Array.prototype.forEach.call(sources.options, function (s, i) {
        if (s.value === stateEls.url.value) {
          sources.selectedIndex = i;
        }
      });

      window.player.src(source);
    };

    urlButton.addEventListener("click", urlButtonClick);
    urlButton.addEventListener("tap", urlButtonClick);

    sources.addEventListener("change", function (event) {
      var selectedOption = sources.options[sources.selectedIndex];

      if (!selectedOption) {
        return;
      }
      var src = selectedOption.value;

      stateEls.url.value = src;
      stateEls.type.value = selectedOption.getAttribute("data-mimetype");
      stateEls.keysystems.value =
        selectedOption.getAttribute("data-key-systems");

      urlButton.dispatchEvent(newEvent("click"));
    });

    stateEls.url.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        urlButton.click();
      }
    });
    stateEls.url.addEventListener("input", function (event) {
      if (stateEls.type.value.length) {
        stateEls.type.value = "";
      }
    });
    stateEls.type.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        urlButton.click();
      }
    });

    // run the change handler for the first time
    stateEls.minified.dispatchEvent(newEvent("change"));
  };
})(window);

function getCurrentlyPlayingSegment(tech) {
  var target_media = tech.vhs.playlists.media();
  var snapshot_time = tech.currentTime();

  var segment;

  if (
    !target_media ||
    !target_media.segments ||
    !target_media.segments.length === 0
  ) {
    return null;
  }

  // Iterate trough available segments and get first within which snapshot_time is
  for (var i = 0, l = target_media.segments.length; i < l; i++) {
    // Note: segment.end may be undefined or is not properly set
    if (snapshot_time < target_media.segments[i].end) {
      segment = target_media.segments[i];
      break;
    }
  }

  if (!segment) {
    segment = target_media.segments[0];
  }

  return segment;
}
