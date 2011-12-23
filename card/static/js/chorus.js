(function() {
	window.VALID_NOTE_NAMES = {
		'e2':1, 'f2':1, 'fs2':1, 'g2':1, 'gs2':1,
		'a2':1, 'as2':1, 'b2':1, 'c3':1, 'cs3':1,
		'd3':1, 'ds3':1, 'e3':1, 'f3':1, 'fs3':1,
		'g3':1, 'gs3':1, 'a3':1, 'as3':1, 'b3':1,
		'c4':1, 'cs4':1, 'd4':1, 'ds4':1, 'e4':1,
		'f4':1, 'fs4':1, 'g4':1,
		
		'woof':1, 'bell':1, 'clap':1
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
			}
			self.onLoad.trigger();
		}
		
		self.addTrack = function() {
			var track = Track([]);
			self.tracks.push(track);
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
		
		self.onAddNote = Event();
		self.onClear = Event();
		self.onStartRecording = Event();
		self.onStopRecording = Event();
		self.isRecording = false;
		
		/* validate note list */
		var validNotes = [];
		for (var i = 0; i < notes.length; i++) {
			if (notes[i].noteName in VALID_NOTE_NAMES) validNotes.push(notes[i]);
		}
		notes = validNotes;
		
		/* called by the controller on start of recording; user code should call controller.recordTrack(track) instead */
		self.startRecording = function() {
			self.isRecording = true;
			self.onStartRecording.trigger();
		}
		self.stopRecording = function() {
			self.isRecording = false;
			self.onStopRecording.trigger();
		}
		
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
		self.onLoadSong = Event();
		
		self.keyboardActive = true;
		
		self.song = Song(songData);
		
		self.loadSong = function(songWithMeta) {
			self.song.load(songWithMeta.note_data);
			$('#current_song h3 .title').text(songWithMeta.title);
			$('#current_song h3 .votes').text(songWithMeta.votes_string);
			if (songWithMeta.code) {
				$('#vote_controls form').attr('action', '/' + songWithMeta.code + '/vote/');
				$('#vote_controls').css({'visibility': 'visible'});
			} else {
				$('#vote_controls').css({'visibility': 'hidden'});
			}
			self.onLoadSong.trigger(songWithMeta);
		}
		window.loadSong = self.loadSong;
		
		var currentRecordingTrack = null;
		var recordingStartTime = null;
		self.isPlaying = false;
		
		self.recordTrack = function(track) {
			self.stopRecording();
			track.clear();
			currentRecordingTrack = track;
			track.startRecording();
			if (self.song.trackCount() > 1) {
				/* start timing and playing existing tracks immediately */
				recordingStartTime = (new Date).getTime();
				runPlayback();
			} else {
				recordingStartTime = null; /* start counting time on next note */
				self.onStartPlayback.trigger(); /* but tell listeners that playback has started (so relevant buttons change to 'stop') */
			}
			self.isPlaying = true;
		}
		
		self.onStopRecording = Event();
		self.stopRecording = function() {
			if (currentRecordingTrack) {
				currentRecordingTrack.stopRecording();
				currentRecordingTrack = null;
				$('#id_notes_json').val(JSON.stringify(self.song.getData()));
				self.onStopRecording.trigger();
				self.stopPlayback();
			}
		}
		
		noteTimeouts = [];
		
		function cancelNoteTimeouts() {
			for (var i = 0; i < noteTimeouts.length; i++) {
				clearTimeout(noteTimeouts[i]);
			}
		}
		
		self.startPlayback = function() {
			self.stopRecording();
			runPlayback();
		}
		
		runPlayback = function() {
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
		
		return self;
	}
})();
