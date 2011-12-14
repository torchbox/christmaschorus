(function() {
	var swfSuffix = 0;
	window.simplesample = {
		'create': function(oggPath, mp3Path, loadedCallback) {
			function useFlashFallback() {
				swfSuffix += 1;
				var flashObject = $('<object id="mp3swf'+swfSuffix+'" name="mp3swf'+swfSuffix+'" width="16" height="16" style="position: absolute; top: -100px;" type="application/x-shockwave-flash" data="' + simplesample.swfPath + '"><param name="movie" value="' + simplesample.swfPath + '" /><param name="flashvars" value="file=' + mp3Path + '" /></object>');
				$('body').append(flashObject);
				var flashElem = flashObject.get(0);
				
				/* check every 100ms whether flash methods have appeared */
				function ping() {
					if (flashElem.playMedia) {
						loadedCallback({
							'play': flashElem.playMedia,
							'stop': flashElem.stopMedia
						});
					} else {
						setTimeout(ping, 100);
					}
				}
				ping();
			}
			
			/* start by trying to create an audio element */
			var audio = $('<audio>\
				<source type="audio/mpeg; codecs=mp3" src="'+mp3Path+'" />\
				<source type="audio/ogg; codecs=vorbis" src="'+oggPath+'" />\
			</audio>');
			var audioElem = audio.get(0);
			if (audioElem.canPlayType) {
				/* browser recognises HTML5 audio - proceed to set sources */
				$('body').append(audio);
				/* listen for an error on the last source element, which indicates that neither source was playable */
				audio.find('source:last').get(0).addEventListener('error', function() {
					useFlashFallback();
				}, false)
				audioElem.addEventListener('loadedmetadata', function() {
					loadedCallback({
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
			} else {
				/* browser doesn't recognise HTML5 audio */
				useFlashFallback();
			}
		}
	}
})()