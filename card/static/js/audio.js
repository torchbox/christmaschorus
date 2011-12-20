function ChorusAudio(controller) {
	var self = {};
	
	var samples = {};
	var samplesToLoad = 0;
	var samplesLoaded = 0;
	
	var loadingProgress = $('<span></span>');
	var loadingPopup = $('<div class="loading">Loading... </div>').append(loadingProgress, '<div class="loading_bar"></div>');
	var loadingBarProgress = $('<div class="progress"></div>');
	loadingPopup.find('.loading_bar').append(loadingBarProgress);
	var loadingOverlay = $('<div class="loading_overlay"></div>');
	$('body').append(loadingOverlay, loadingPopup);
	
	function loadSample(note, len) {
		var sampleName = note + '_' + len;
		samplesToLoad++;
		Ample.openSound({
			'oggPath': 'http://d28mq1v6qnro1v.cloudfront.net/ogg/' + sampleName + '.ogg',
			'mp3Path': 'http://d28mq1v6qnro1v.cloudfront.net/mp3/' + sampleName + '.mp3',
			'volume': 0.5,
			'onSuccess': function(sample) {
				samples[note][len] = sample;
				samplesLoaded++;
				if (samplesLoaded == samplesToLoad) {
					loadingPopup.remove();
					loadingOverlay.remove();
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
		if (note == 'woof' || note == 'bell') {
			loadSample(note, 1);
		} else {
			for (var len = 1; len <= 3; len++) {
				loadSample(note, len);
			}
		}
	}
	
	function sampleNumberForNote(note) {
		if (note.noteName == 'woof' || note.noteName == 'bell') {
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
