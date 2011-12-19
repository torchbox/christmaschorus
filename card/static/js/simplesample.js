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
					
					elemId = 'mp3swf'+swfSuffix;
					$('body').append('<div id="'+elemId+'" style="position: absolute; top: -100px;"></div>');
					swfobject.embedSWF(simplesample.swfPath, elemId, '16', '16', '9', false, {'file': mp3Path}, false, {'style': 'position: absolute; top: -100px'}, function(e) {
						if (e.success) {
							/* check every 100ms whether flash methods have appeared */
							function ping() {
								if (e.ref.playMedia) {
									successCallback({
										'play': function() {e.ref.playMedia()},
										'stop': function() {e.ref.stopMedia()}
									});
								} else {
									setTimeout(ping, 100);
								}
							}
							ping();
						} else {
							failureCallback();
						}
					})
				}
			}
		},
		'create': function(oggPath, mp3Path, loadedCallback) {
			if ($.browser.mozilla || ($.browser.safari && !navigator.userAgent.match(/Chrome/))) {
				/* trust these browsers to do html audio better than flash... */
				var drivers = [simplesample.drivers.html, simplesample.drivers.flash];
			} else {
				var drivers = [simplesample.drivers.flash, simplesample.drivers.html];
			}
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
