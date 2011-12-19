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
		Ample.openSound({
			'oggPath': 'http://christmascard.s3.amazonaws.com/ogg/' + sampleName + '.ogg',
			'mp3Path': 'http://christmascard.s3.amazonaws.com/mp3/' + sampleName + '.mp3',
			'volume': 0.5,
			'onSuccess': function(sample) {
				samples[note][len] = sample;
				samplesLoaded++;
				if (samplesLoaded == samplesToLoad) {
					loadingPopup.remove();
				} else {
					var progress = samplesLoaded * 100 / samplesToLoad;
					loadingProgress.text(Math.round(progress) + '%');
					loadingBarProgress.css('width', progress + '%');
				}
			},
			'onFailure': function() {
				if (console && console.log) console.log('loading failed for sample: ' + sampleName);
			}
		})
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
	
	function sampleNumberForNote(note) {
		if (note.noteName == 'woof') {
			return 1;
		} else {
			if (note.duration < 200) {
				return 1;
			} else if (note.duration < 500) {
				return 2;
			} else {
				return 3;
			}
		}
	}
	
	controller.onPlayNote.bind(function(note) {
		note.sampleNumber = sampleNumberForNote(note);
		samples[note.noteName][note.sampleNumber].play();
	})
	
	controller.onStopNote.bind(function(note) {
		if (note.sampleNumber == 3) {
			samples[note.noteName][note.sampleNumber].stop();
		}
	})
	
	return self;
}
