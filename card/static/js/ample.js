(function() {
	/* a Driver encapsulates a particular sound-generating mechanism and exposes a single
	public endpoint, openSound, which accepts a sound spec object, onSuccess callback and
	onFailure callback, and asynchronously creates a sound object from the sound spec.
	
	Note that the sound spec object may itself contain onSuccess and onFailure callbacks,
	but it is NOT the responsibility of the driver to call these.
	*/
	function BaseDriver() {
		var self = {};
		self.driverName = 'BaseDriver';
		
		/* subclasses override self.init to perform one-time initialisation */
		self.init = function(onSuccess, onFailure) {
			/* default no-initialisation-required initialiser, immediately returns success */
			onSuccess();
		}
		
		var initStarted = false;
		var initSucceeded = false;
		var initFailed = false;
		var soundSpecsWaitingForInit = [];
		
		self.openSound = function(soundSpec, onSuccess, onFailure) {
			function enqueueSoundSpecUntilInitCompleted() {
				soundSpecsWaitingForInit.push({
					soundSpec: soundSpec,
					onSuccess: onSuccess,
					onFailure: onFailure
				});
			}
			
			if (!initStarted) {
				initStarted = true;
				enqueueSoundSpecUntilInitCompleted();
				self.init(function() {
					/* init succeeded - proceed to open all queued sound specs */
					initSucceeded = true;
					for (var i = 0; i < soundSpecsWaitingForInit.length; i++) {
						var spec = soundSpecsWaitingForInit[i];
						self.openSoundAsInitialised(spec.soundSpec, spec.onSuccess, spec.onFailure);
					}
				}, function() {
					/* init failed - notify all queued sound specs of failure */
					initFailed = true;
					for (var i = 0; i < soundSpecsWaitingForInit.length; i++) {
						soundSpecsWaitingForInit[i].onFailure();
					}
				});
			} else if (!initSucceeded && !initFailed) {
				/* waiting for init to complete */
				enqueueSoundSpecUntilInitCompleted();
			} else if (initSucceeded) {
				/* can open sound immediately */
				self.openSoundAsInitialised(soundSpec, onSuccess, onFailure);
			} else { /* initFailed */
				/* fail opening immediately */
				onFailure();
			}
		}
		
		/* subclasses override self.openSoundAsInitialised to perform the action of
			opening a sound once self.init has succeeded. */
		self.openSoundAsInitialised = function(soundSpec, onSuccess, onFailure) {
			/* default no-behaviour-implemented behaviour: immediately return failure */
			onFailure();
		}
		
		return self;
	}
	
	function HtmlAudioDriver() {
		var self = BaseDriver();
		self.driverName = 'HtmlAudioDriver';
		
		var hasConfirmedLackOfSupport = false;
		
		self.openSoundAsInitialised = function(soundSpec, onSuccess, onFailure) {
			/* if we've previously confirmed that the browser doesn't recognise audio.canPlayType,
				don't bother repeating the exercise */
			if (hasConfirmedLackOfSupport) {
				onFailure();
				return;
			}
			
			/* start by trying to create an audio element */
			/* TODO: html-escape URLs */
			var audio = $('<audio>\
				<source type="audio/mpeg; codecs=mp3" src="'+soundSpec.mp3Path+'" />\
				<source type="audio/ogg; codecs=vorbis" src="'+soundSpec.oggPath+'" />\
			</audio>');
			var audioElem = audio.get(0);
			if (!audioElem.canPlayType) {
				hasConfirmedLackOfSupport = true;
				onFailure();
				return;
			}
			
			var hasReturned = false; /* ensure that we only call onSuccess/onFailure once, even if
				the relevant audio events are triggered multiple times for some reason */
			
			/* browser recognises HTML5 audio - proceed to set sources */
			$('body').append(audio);
			/* listen for an error on the last source element, which indicates that neither source was playable */
			audio.find('source:last').get(0).addEventListener('error', function() {
				if (!hasReturned) {
					hasReturned = true;
					onFailure();
				}
			}, false)
			if (soundSpec.volume) audioElem.volume = soundSpec.volume;
			
			audioElem.addEventListener('loadedmetadata', function() {
				if (!hasReturned) {
					hasReturned = true;
					onSuccess({
						'play': function() {
							audioElem.currentTime = 0;
							audioElem.play();
						},
						'stop': function() {
							audioElem.pause();
						}
					})
				}
			}, false)
			
			audioElem.load();
		}
		
		return self;
	}
	
	function FlashMp3Driver() {
		var self = BaseDriver();
		self.driverName = 'FlashMp3Driver';
		
		var flashElem;
		var successCallbacksBySoundId = {};
		
		self.init = function(onSuccess, onFailure) {
			$('body').append('<div id="ample_mp3_manager" style="position: absolute; top: -100px;"></div>');
			swfobject.embedSWF(Ample.swfPath, 'ample_mp3_manager',
				'16', '16', /* Flash movie dimensions */
				'9', /* minimum Flash version required */
				false, /* express install URL */
				false, /* flashvars */
				false, /* object params */
				{'style': 'position: absolute; top: -100px'}, /* object attributes */
				function(e) { /* oncomplete callback */
					if (e.success) {
						/* check every 100ms whether flash methods have appeared */
						function ping() {
							if (e.ref.openSound) {
								flashElem = e.ref;
								
								/* swf will call this whenever a sound has completed loading,
								passing in the sound ID */
								Ample.flashMp3DriverSoundLoaded = function(soundId) {
									successCallbacksBySoundId[soundId]({
										'play': function() {flashElem.playSound(soundId)},
										'stop': function() {flashElem.stopSound(soundId)}
									})
								}
								
								onSuccess();
							} else {
								setTimeout(ping, 100);
							}
						}
						ping();
					} else {
						onFailure();
					}
				}
			);
		}
		
		self.openSoundAsInitialised = function(soundSpec, onSuccess, onFailure) {
			var soundId = flashElem.openSound(soundSpec.mp3Path, soundSpec.volume || 1);
			/* store the success callback to be called when the swf
			pings Ample.flashMp3DriverSoundLoaded */
			successCallbacksBySoundId[soundId] = onSuccess;
		}
		
		return self;
	}
	
	var Ample = {};
	
	if ($.browser.mozilla || ($.browser.safari && !navigator.userAgent.match(/Chrome/))) {
		/* trust these browsers to do html audio better than flash... */
		var drivers = [HtmlAudioDriver(), FlashMp3Driver()];
	} else {
		var drivers = [FlashMp3Driver(), HtmlAudioDriver()];
	}
	
	Ample.openSound = function(soundSpec) {
		var driverIndex = 0;
		function tryDriver() {
			drivers[driverIndex].openSound(soundSpec, function(sound) {
				/* success */
				if (soundSpec.onSuccess) soundSpec.onSuccess(sound);
			}, function() {
				/* failure; try next driver */
				driverIndex++;
				if (driverIndex < drivers.length) {
					tryDriver();
				} else {
					/* all drivers failed */
					if (soundSpec.onFailure) soundSpec.onFailure();
				}
			})
		}
		tryDriver();
	}
	
	window.Ample = Ample;
})();
