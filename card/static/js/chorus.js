(function() {
	window.VALID_NOTE_NAMES = {
		'e2':1, 'f2':1, 'fs2':1, 'g2':1, 'gs2':1,
		'a2':1, 'as2':1, 'b2':1, 'c3':1, 'cs3':1,
		'd3':1, 'ds3':1, 'e3':1, 'f3':1, 'fs3':1,
		'g3':1, 'gs3':1, 'a3':1, 'as3':1, 'b3':1,
		'c4':1, 'cs4':1, 'd4':1, 'ds4':1, 'e4':1,
		'f4':1, 'fs4':1, 'g4':1,
		
		'woof':1
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
		
		self.tracks = [];
		
		self.onLoad = Event();
		self.onAddTrack = Event();
		
		self.load = function(songData) {
			self.tracks = [];
			for (var i = 0; i < songData.length; i++) {
				self.tracks[i] = Track(songData[i]);
				self.tracks[i].onRequestRecord.bind(function(tr) {
					self.onRequestRecord.trigger(tr);
				})
			}
			self.onLoad.trigger();
		}
		
		self.onRequestRecord = Event();
		
		self.addTrack = function() {
			var track = Track([]);
			self.tracks.push(track);
			track.onRequestRecord.bind(function(tr) {
				self.onRequestRecord.trigger(tr);
			})
			self.onAddTrack.trigger(track);
		}
		
		self.duration = function() {
			var duration = 0;
			for (var i = 0; i < self.tracks.length; i++) {
				duration = Math.max(duration, self.tracks[i].duration());
			}
			return duration;
		}
		
		self.getData = function() {
			var data = [];
			for (var i = 0; i < self.tracks.length; i++) {
				data[i] = self.tracks[i].getData();
			}
			return data;
		}
		
		self.eachNote = function(callback) {
			for (var i = 0; i < self.tracks.length; i++) {
				self.tracks[i].eachNote(callback);
			}
		}
		
		self.trackCount = function() {
			return self.tracks.length;
		}
		
		self.load(songData);
		
		return self;
	}
	
	Track = function(notes) {
		var self = {};
		
		self.onRequestRecord = Event();
		self.onAddNote = Event();
		self.onClear = Event();
		
		/* validate note list */
		var validNotes = [];
		for (var i = 0; i < notes.length; i++) {
			if (notes[i].noteName in VALID_NOTE_NAMES) validNotes.push(notes[i]);
		}
		notes = validNotes;
		
		self.addNote = function(note) {
			if (!note.noteName in VALID_NOTE_NAMES) return;
			notes.push(note);
			self.onAddNote.trigger(note);
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
			notes = [];
			self.onClear.trigger();
		}
		
		return self;
	}
	
	window.ChorusController = function(songData) {
		var self = {};
		
		self.onStartPlayback = Event();
		self.onStopPlayback = Event();
		self.onPlayNote = Event();
		self.onStopNote = Event();
		
		self.keyboardActive = true;
		
		self.song = Song(songData);
		
		self.loadSong = function(songWithMeta) {
			self.song.load(songWithMeta.note_data);
			$('#current_song h3 .title').text(songWithMeta.title);
			$('#current_song h3 .votes').text(songWithMeta.votes_string);
			if (songWithMeta.code) {
				$('#vote_controls form').attr('action', '/' + songWithMeta.code + '/vote/');
				$('#vote_controls').show();
			} else {
				$('#vote_controls').hide();
			}
		}
		window.loadSong = self.loadSong;
		
		var currentRecordingTrack = null;
		var recordingStartTime = null;
		self.isPlaying = false;
		
		self.song.onRequestRecord.bind(function(track) {
			if (currentRecordingTrack == track) {
				/* stop recording */
				currentRecordingTrack = null;
				$('#id_notes_json').val(JSON.stringify(self.song.getData()));
				cancelNoteTimeouts();
				self.isPlaying = false;
				self.onStopPlayback.trigger();
				/* TODO: change label to 'Record' */
			} else {
				if (currentRecordingTrack) {
					/* TODO: stop the active recording of another track */
				}
				track.clear();
				currentRecordingTrack = track;
				if (self.song.trackCount() > 1) {
					/* start timing and playing existing tracks immediately */
					recordingStartTime = (new Date).getTime();
					self.startPlayback();
				} else {
					recordingStartTime = null; /* start counting time on next note */
					self.onStartPlayback.trigger();
				}
				self.isPlaying = true;
				/* TODO: change label to 'Stop recording' */
			}
		})
		
		noteTimeouts = [];
		
		function cancelNoteTimeouts() {
			for (var i = 0; i < noteTimeouts.length; i++) {
				clearTimeout(noteTimeouts[i]);
			}
		}
		
		self.startPlayback = function() {
			function getPlayCallbackForNote(note) {
				return function() {
					playNote(note)
					if (note.duration) {
						setTimeout(function() {stopNote(note)}, note.duration);
					}
				}
			}
			
			cancelNoteTimeouts();
			
			self.onStartPlayback.trigger();
			
			self.song.eachNote(function(note) {
				var timeout = setTimeout(function() {
					playNote(note);
					if (note.duration) {
						setTimeout(function() {stopNote(note)}, note.duration);
					}
				}, note.time);
				noteTimeouts.push(timeout);
			})
			noteTimeouts.push(setTimeout(function() {
				self.isPlaying = false;
				self.onStopPlayback.trigger();
			}, self.song.duration() ));
			self.isPlaying = true;
		}
		
		self.stopPlayback = function() {
			cancelNoteTimeouts();
			self.isPlaying = false;
			self.onStopPlayback.trigger();
		}
		
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
		}
		function stopNote(note) {
			self.onStopNote.trigger(note);
		}
		
		/* Disable playing by keyboard while lightbox is open */
		$(document).bind('cbox_open', function() { self.keyboardActive = false; })
		$(document).bind('cbox_closed', function() { self.keyboardActive = true; })
		
		$('#save').colorbox({'inline': true, 'href': '#save_popup'});
		
		$('#add_track').click(function() {
			self.song.addTrack();
		});
		
		return self;
	}
})();
