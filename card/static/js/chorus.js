	VALID_NOTE_NAMES = {
		'e2':1, 'f2':1, 'fs2':1, 'g2':1, 'gs2':1,
		'a2':1, 'as2':1, 'b2':1, 'c3':1, 'cs3':1,
		'd3':1, 'ds3':1, 'e3':1, 'f3':1, 'fs3':1,
		'g3':1, 'gs3':1, 'a3':1, 'as3':1, 'b3':1,
		'c4':1, 'cs4':1, 'd4':1, 'ds4':1, 'e4':1,
		'f4':1, 'fs4':1, 'g4':1
	};
	
	function Event() {
		var self = {};
		var listeners = [];
		
		self.bind = function(callback) {
			listeners.push(callback);
		}
		self.unbind = function(callback) {
			for (var i = listeners.length - 1; i >= 0; i--) {
				if (listeners[i] == callback) listeners.splice(i, 1);
			}
		}
		self.trigger = function() {
			var args = arguments;
			/* event is considered 'cancelled' if any handler returned a value of false
				(specifically false, not just a falsy value). Exactly what this means is
				up to the caller - we just return false */
			var cancelled = false;
			for (var i = 0; i < listeners.length; i++) {
				cancelled = cancelled || (listeners[i].apply(null, args) === false);
			};
			return !cancelled;
		}
		
		return self;
	}
	
	Song = function(songData) {
		var self = {};
		
		var tracks = [];
		
		self.load = function(songData) {
			$('#staffs').empty();
			tracks = [];
			for (var i = 0; i < songData.length; i++) {
				tracks[i] = Track(songData[i]);
				tracks[i].onRequestRecord.bind(function(tr) {
					self.onRequestRecord.trigger(tr);
				})
			}
		}
		
		self.onRequestRecord = Event();
		
		self.addTrack = function() {
			var track = Track([]);
			tracks.push(track);
			track.onRequestRecord.bind(function(tr) {
				self.onRequestRecord.trigger(tr);
			})
		}
		
		self.duration = function() {
			var duration = 0;
			for (var i = 0; i < tracks.length; i++) {
				duration = Math.max(duration, tracks[i].duration());
			}
			return duration;
		}
		
		self.getData = function() {
			var data = [];
			for (var i = 0; i < tracks.length; i++) {
				data[i] = tracks[i].getData();
			}
			return data;
		}
		
		self.eachNote = function(callback) {
			for (var i = 0; i < tracks.length; i++) {
				tracks[i].eachNote(callback);
			}
		}
		
		self.trackCount = function() {
			return tracks.length;
		}
		
		self.load(songData);
		
		return self;
	}
	
	var initialDragX;
	function setStaffPosition(x) {
		x = Math.min(0, x);
		$('#staffs ul.notes').css({'left': x});
	}
	
	Track = function(notes) {
		var self = {};
		
		self.onRequestRecord = Event();
		
		function createStaff(container) {
			var staff = $('<div class="staff_viewport">\
				<div class="staff">\
					<table>\
						<tr><td></td></tr>\
						<tr><td></td></tr>\
						<tr><td></td></tr>\
						<tr><td></td></tr>\
						<tr><td></td></tr>\
						<tr><td></td></tr>\
					</table>\
					<ul class="notes"></ul>\
				</div>\
			</div>');
			container.append(staff);
			setStaffPosition(0);
			staff.drag(function() {
				initialDragX = parseInt($('ul.notes', this).css('left'));
			}, function(e) {
				setStaffPosition(initialDragX + e.offsetX);
			}, function() {
			})
			return staff;
		}
		
		var staffLi = $('<li></li>');
		var recordButton = $('<input type="button" value="Record" />');
		$('#staffs').append(staffLi);
		staffLi.append(recordButton);
		recordButton.click(function() {
			self.onRequestRecord.trigger(self);
		})
		var staff = createStaff(staffLi);
		
		function addNoteToStaff(note) {
			var noteLi = $('<li></li>').addClass(note.noteName);
			$('ul.notes', staff).append(noteLi);
			noteLi.css({
				'left': note.time/10 + 40 + 'px'
			});
			note.elem = noteLi;
		}
		
		/* validate note list */
		var validNotes = [];
		for (var i = 0; i < notes.length; i++) {
			if (notes[i].noteName in VALID_NOTE_NAMES) validNotes.push(notes[i]);
		}
		notes = validNotes;
		
		for (var i = 0; i < notes.length; i++) {
			var note = notes[i];
			addNoteToStaff(note);
		}
		
		self.addNote = function(note) {
			if (!note.noteName in VALID_NOTE_NAMES) return;
			notes.push(note);
			addNoteToStaff(note);
		}
		
		self.duration = function() {
			if (notes.length) {
				var lastNote = notes[notes.length - 1];
				return lastNote.time + (lastNote.duration || 0);
			} else {
				return 0;
			}
		}
		
		self.getData = function() {
			var trackData = [];
			for (var j = 0; j < notes.length; j++) {
				var note = notes[j];
				trackData[j] = {
					'noteName': note.noteName, 'time': note.time, 'duration': note.duration
				};
			}
			return trackData;
		}
		
		self.eachNote = function(callback) {
			for (var i = 0; i < notes.length; i++) {
				callback(notes[i]);
			}
		}
		
		self.clear = function() {
			$('ul.notes', staff).empty();
			notes = [];
		}
		
		return self;
	}
	
	window.ChorusController = function(songData) {
		self = {};
		
		self.onPlayNote = Event();
		self.onStopNote = Event();
		
		self.keyboardActive = true;
		
		var song = Song(songData);
		
		self.loadSong = function(songData) {
			song.load(songData);
		}
		
		var currentRecordingTrack = null;
		var recordingStartTime = null;
		var isPlaying = false;
		
		song.onRequestRecord.bind(function(track) {
			if (currentRecordingTrack == track) {
				/* stop recording */
				currentRecordingTrack = null;
				$('#id_notes_json').val(JSON.stringify(song.getData()));
				cancelNoteTimeouts();
				isPlaying = false;
				/* TODO: change label to 'Record' */
			} else {
				if (currentRecordingTrack) {
					/* TODO: stop the active recording of another track */
				}
				track.clear();
				currentRecordingTrack = track;
				if (song.trackCount() > 1) {
					/* start timing and playing existing tracks immediately */
					recordingStartTime = (new Date).getTime();
					playRecording();
				} else {
					recordingStartTime = null; /* start counting time on next note */
				}
				isPlaying = true;
				/* TODO: change label to 'Stop recording' */
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
			song.eachNote(function(note) {
				var timeout = setTimeout(function() {
					playNote(note);
					if (note.duration) {
						setTimeout(function() {stopNote(note)}, note.duration);
					}
				}, note.time);
				noteTimeouts.push(timeout);
			})
			noteTimeouts.push(setTimeout(function() {
				isPlaying = false;
				$('#play').val('Play');
			}, song.duration() ));
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
		
		self.registerNoteOn = function(noteName) {
			var note = {
				noteName: noteName
			}
			if (currentRecordingTrack) {
				var currentTime = (new Date).getTime();
				if (!recordingStartTime) {
					recordingStartTime = currentTime;
				}
				note.time = currentTime - recordingStartTime;
				currentRecordingTrack.addNote(note);
			}
			playNote(note);
			return note;
		}
		self.registerNoteOff = function(note) {
			if (note.time != null) {
				var currentTime = (new Date).getTime();
				note.duration = (currentTime - recordingStartTime) - note.time;
			}
			stopNote(note);
		}
		
		function playNote(note) {
			self.onPlayNote.trigger(note);
			if (note.elem) {
				note.elem.addClass('active');
				var currentX = parseInt($('#staffs ul.notes').css('left'));
				var noteX = parseInt(note.elem.css('left'));
				if (noteX < -currentX || noteX > -currentX + $('#staffs .staff_viewport').width() - 100) {
					setStaffPosition(noteX < 200 ? 0 : -noteX);
				}
			}
		}
		function stopNote(note) {
			self.onStopNote.trigger(note);
			if (note.elem) {
				note.elem.removeClass('active');
			}
		}
		
		/* Disable playing by keyboard while lightbox is open */
		$(document).bind('cbox_open', function() { self.keyboardActive = false; })
		$(document).bind('cbox_closed', function() { self.keyboardActive = true; })
		
		$('#share').colorbox({'inline': true, 'href': '#save_popup'});
		
		$('#add_track').click(function() {
			song.addTrack();
		});
		
		return self;
	}
