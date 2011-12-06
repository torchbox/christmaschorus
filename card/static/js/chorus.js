(function($) {
	NOTES_BY_KEYCODE = {
		90: 'c2', 83: 'cs2', 88: 'd2', 68: 'ds2', 67: 'e2',
		86: 'f2', 71: 'fs2', 66: 'g2', 72: 'gs2', 78: 'a2', 74: 'as2', 77: 'b2', 188: 'c3'
	}
	
	var keysPressed = {};
	
	var keyboardActive = true;
	var lastMouseNote = null;
	
	$.chorus = function(recordedNotes) {
		$(document).keydown(function(e) {
			if (!keyboardActive) return;
			if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
			var noteName = NOTES_BY_KEYCODE[e.which];
			if (noteName && !keysPressed[e.which]) {
				var note = registerNoteOn(noteName);
				keysPressed[e.which] = note;
			}
		}).keyup(function(e) {
			if (keysPressed[e.which]) {
				registerNoteOff(keysPressed[e.which]);
				keysPressed[e.which] = null;
			}
		})
		$('video').mousedown(function() {
			lastMouseNote = registerNoteOn(this.id);
		})
		$(document).mouseup(function() {
			if (lastMouseNote) {
				registerNoteOff(lastMouseNote);
				lastMouseNote = null;
			}
		})
		
		var isRecording = false;
		var recordingStartTime = null;
		var isPlaying = false;
		
		$('#record').click(function() {
			if (!isRecording) {
				$('#record').val('Stop recording');
				isRecording = true;
				recordedNotes = [[]];
				recordingStartTime = null; /* start counting time on next note */
			} else {
				$('#record').val('Record');
				isRecording = false;
				
				noteData = [];
				for (var i = 0; i < recordedNotes.length; i++) {
					var track = recordedNotes[i];
					var trackData = [];
					for (var j = 0; j < track.length; j++) {
						var note = track[j];
						trackData[j] = {
							'noteName': note.noteName, 'time': note.time, 'duration': note.duration
						};
					}
					noteData[i] = trackData;
				}
				$('#id_notes_json').val(JSON.stringify(noteData));
			}
		})
		
		noteTimeouts = [];
		
		function cancelNoteTimeouts() {
			for (var i = 0; i < noteTimeouts.length; i++) {
				clearTimeout(noteTimeouts[i]);
			}
		}
		
		function playRecording() {
			function getPlayCallbackForNote(note) {
				return function() {
					playNote(note)
					if (note.duration) {
						setTimeout(function() {stopNote(note)}, note.duration);
					}
				}
			}
			
			cancelNoteTimeouts();
			var songDuration = 0;
			for (var i = 0; i < recordedNotes.length; i++) {
				var track = recordedNotes[i];
				for (var j = 0; j < track.length; j++) {
					var note = track[j];
					noteTimeouts.push(setTimeout(getPlayCallbackForNote(note), note.time));
				}
				if (track.length > 0) {
					var lastNote = track[track.length - 1];
					var trackDuration = lastNote.time + (lastNote.duration || 0);
					songDuration = Math.max(songDuration, trackDuration);
				}
			}
			noteTimeouts.push(setTimeout(function() {
				isPlaying = false;
				$('#play').val('Play');
			}, songDuration));
			isPlaying = true;
		}
		
		$('#play').click(function() {
			if (isPlaying) {
				cancelNoteTimeouts();
				isPlaying = false;
				$('#play').val('Play');
			} else {
				playRecording();
				$('#play').val('Stop');
			}
		})
		
		function registerNoteOn(noteName) {
			var note = {
				noteName: noteName
			}
			if (isRecording) {
				var currentTime = (new Date).getTime();
				if (!recordingStartTime) {
					recordingStartTime = currentTime;
				}
				note.time = currentTime - recordingStartTime;
				recordedNotes[0].push(note);
				addNoteToStaff(note);
			}
			playNote(note);
			return note;
		}
		function registerNoteOff(note) {
			if (note.time != null) {
				var currentTime = (new Date).getTime();
				note.duration = (currentTime - recordingStartTime) - note.time;
			}
			stopNote(note);
		}
		
		function playNote(note) {
			var video = document.getElementById(note.noteName);
			video.currentTime = 0;
			video.play();
			if (note.elem) {
				note.elem.addClass('active');
				var currentX = parseInt($('#staff ul.notes').css('left'));
				var noteX = parseInt(note.elem.css('left'));
				if (noteX < -currentX || noteX > -currentX + $('#staff_viewport').width() - 100) {
					$('#staff ul.notes').css({'left': (noteX < 200 ? 0 : -noteX)});
				}
			}
		}
		function stopNote(note) {
			if (note.elem) {
				note.elem.removeClass('active');
			}
		}
		
		function addNoteToStaff(note) {
			var noteLi = $('<li></li>').addClass(note.noteName);
			$('#staff ul').append(noteLi);
			noteLi.css({
				'left': note.time/10 + 40 + 'px'
			});
			note.elem = noteLi;
		}
		/* TODO: create one staff per track */
		for (var i = 0; i < recordedNotes[0].length; i++) {
			addNoteToStaff(recordedNotes[0][i]);
		}
		
		/* Disable playing by keyboard while lightbox is open */
		$(document).bind('cbox_open', function() { keyboardActive = false; })
		$(document).bind('cbox_closed', function() { keyboardActive = true; })
		
		$('#share').colorbox({'inline': true, 'href': '#save_popup'});
		
		var initialDragX;
		$('#staff').drag(function() {
			initialDragX = parseInt($('ul.notes', this).css('left'));
		}, function(e) {
			var newX = initialDragX + e.offsetX;
			newX = Math.min(0, newX);
			$('ul.notes', this).css({'left': newX});
		}, function() {
		})
	}
})(jQuery);
