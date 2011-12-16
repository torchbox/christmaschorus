function ChorusAudio(controller) {
	var self = {};
	
	var samples = {};
	samplesToLoad = 0;
	samplesLoaded = 0;
	
	loadingProgress = $('<span></span>');
	loadingPopup = $('<div class="loading">Loading... </div>').append(loadingProgress, '<div class="loading_bar"></div>');
	loadingBarProgress = $('<div class="progress"></div>');
	loadingPopup.find('.loading_bar').append(loadingBarProgress);
	$('body').append(loadingPopup);
	
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
					var progress = samplesLoaded * 100 / samplesToLoad;
					loadingProgress.text(Math.round(progress) + '%');
					loadingBarProgress.css('width', progress + '%');
				}
			}
		)
	}
	
	for (var note in VALID_NOTE_NAMES) {
		samples[note] = {};
		if (note == 'woof') {
			loadSample('woof', 1);
		} else {
			for (var len = 1; len <= 3; len++) {
				loadSample(note, len);
			}
		}
	}
	
	function sampleElementForNote(note) {
		if (note.noteName == 'woof') {
			return samples['woof'][1];
		} else {
			var noteLength = 2;
			if (note.duration < 200) {
				noteLength = 1;
			} else if (note.duration > 500) {
				noteLength = 3;
			}
			return samples[note.noteName][noteLength];
		}
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
