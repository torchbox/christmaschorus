(function($) {
	NOTES_BY_KEYCODE = {
		90: 'c2', 83: 'cs2', 88: 'd2', 68: 'ds2', 67: 'e2',
		86: 'f2', 71: 'fs2', 66: 'g2', 72: 'gs2', 78: 'a2', 74: 'as2', 77: 'b2', 188: 'c3'
	}
	
	var keysPressed = {};
	
	var keyboardActive = true;
	
	$.chorus = function(recordedNotes) {
		$(document).keydown(function(e) {
			if (!keyboardActive) return;
			if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
			var note = NOTES_BY_KEYCODE[e.which];
			if (note && !keysPressed[e.which]) {
				keysPressed[e.which] = true;
				playNote(note);
			}
		}).keyup(function(e) {
			var note = NOTES_BY_KEYCODE[e.which];
			if (note) keysPressed[e.which] = false;
		})
		$('video').mousedown(function() {
			playNote(this.id);
		})
		
		var isRecording = false;
		var recordingStartTime = null;
		
		$('#record').click(function() {
			if (!isRecording) {
				$('#record').val('Stop recording');
				isRecording = true;
				recordedNotes = [];
				recordingStartTime = null; /* start counting time on next note */
			} else {
				$('#record').val('Record');
				isRecording = false;
				$('#id_notes_json').val(JSON.stringify(recordedNotes));
			}
		})
		
		$('#play').click(function() {
			function getPlayCallbackForNote(note) {
				return function() {playNote(note)}
			}
			for (var i = 0; i < recordedNotes.length; i++) {
				setTimeout(getPlayCallbackForNote(recordedNotes[i].note), recordedNotes[i].time);
			}
		})
		
		function playNote(note) {
			var video = document.getElementById(note);
			video.currentTime = 0;
			video.play();
			if (isRecording) {
				var currentTime = (new Date).getTime();
				if (!recordingStartTime) {
					recordingStartTime = currentTime;
				}
				recordedNotes.push({
					time: currentTime - recordingStartTime,
					note: note
				});
			}
		}
		
		function addNoteToStaff(note) {
			var noteLi = $('<li></li>').addClass(note.note);
			$('#staff ul').append(noteLi);
			noteLi.css({
				'left': note.time/10 + 'px'
			});
		}
		for (var i = 0; i < recordedNotes.length; i++) {
			addNoteToStaff(recordedNotes[i]);
		}
		
		/* Disable playing by keyboard while lightbox is open */
		$(document).bind('cbox_open', function() { keyboardActive = false; })
		$(document).bind('cbox_closed', function() { keyboardActive = true; })
		
		$('#share').colorbox({'inline': true, 'href': '#save_popup'});
	}
})(jQuery);
