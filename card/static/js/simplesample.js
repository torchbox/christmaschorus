(function() {
	var swfSuffix = 0;
	window.simplesample = {
		'drivers': {
			'html': {
				'load': function(oggPath, mp3Path, successCallback, failureCallback) {
					/* start by trying to create an audio element */
					var audio = $('<audio>\
						<source type="audio/mpeg; codecs=mp3" src="'+mp3Path+'" />\
						<source type="audio/ogg; codecs=vorbis" src="'+oggPath+'" />\
					</audio>');
					var audioElem = audio.get(0);
					if (!audioElem.canPlayType) {
						failureCallback();
						return;
					}
					
					/* browser recognises HTML5 audio - proceed to set sources */
					$('body').append(audio);
					/* listen for an error on the last source element, which indicates that neither source was playable */
					audio.find('source:last').get(0).addEventListener('error', function() {
						failureCallback();
					}, false)
					var hasLoaded = false;
					audioElem.addEventListener('canplaythrough', function() {
						if (hasLoaded) return;
						hasLoaded = true;
						successCallback({
							'play': function() {
								audioElem.currentTime = 0;
								audioElem.play();
							},
							'stop': function() {
								audioElem.pause();
							}
						})
					}, false)
					audioElem.load();
				}
			},
			'flash': {
				'load': function(oggPath, mp3Path, successCallback, failureCallback) {
					swfSuffix += 1;
					var flashObject = $('<object id="mp3swf'+swfSuffix+'" name="mp3swf'+swfSuffix+'" width="16" height="16" style="position: absolute; top: -100px;" type="application/x-shockwave-flash" data="' + simplesample.swfPath + '"><param name="movie" value="' + simplesample.swfPath + '" /><param name="flashvars" value="file=' + mp3Path + '" /></object>');
					$('body').append(flashObject);
					var flashElem = flashObject.get(0);
					
					/* check every 100ms whether flash methods have appeared */
					function ping() {
						if (flashElem.playMedia) {
							successCallback({
								'play': function() {flashElem.playMedia()},
								'stop': function() {flashElem.stopMedia()}
							});
						} else {
							setTimeout(ping, 100);
						}
					}
					ping();
				}
			}
		},
		'create': function(oggPath, mp3Path, loadedCallback) {
			var drivers = [simplesample.drivers.html, simplesample.drivers.flash];
			var driverIndex = 0;
			function tryDriver() {
				drivers[driverIndex].load(oggPath, mp3Path, loadedCallback, function() {
					driverIndex++;
					if (driverIndex < drivers.length) tryDriver();
				})
			}
			tryDriver();
		}
	}
})();
