function ChorusAudio(controller) {
	var self = {};
	
	var samples = {};
	samplesToLoad = 0;
	samplesLoaded = 0;
	
	loadingProgress = $('<span></span>');
	loadingPopup = $('<div class="loading">Loading...</div>').append(loadingProgress);
	$('body').prepend(loadingPopup);
	
	function loadSample(note, len) {
		var sampleName = note + '_' + len;
		samplesToLoad++;
		simplesample.create(
			'http://christmascard.s3.amazonaws.com/ogg/' + sampleName + '.ogg',
			'http://christmascard.s3.amazonaws.com/mp3/' + sampleName + '.mp3',
			function(sample) {
				samples[note][len] = sample;
				samplesLoaded++;
				if (samplesLoaded == samplesToLoad) {
					loadingPopup.remove();
				} else {
					loadingProgress.text(Math.round(samplesLoaded * 100 / samplesToLoad) + '%');
				}
			}
		)
	}
	
	for (var note in VALID_NOTE_NAMES) {
		samples[note] = {};
		for (var len = 1; len <= 3; len++) {
			loadSample(note, len);
		}
	}
	
	function sampleElementForNote(note) {
		var noteLength = 2;
		if (note.duration < 200) {
			noteLength = 1;
		} else if (note.duration > 500) {
			noteLength = 3;
		}
		return samples[note.noteName][noteLength];
	}
	
	controller.onPlayNote.bind(function(note) {
		var sample = sampleElementForNote(note);
		sample.play();
	})
	
	controller.onStopNote.bind(function(note) {
		if (note.duration > 500) {
			var sample = sampleElementForNote(note);
			sample.stop();
		}
	})
	
	return self;
}
