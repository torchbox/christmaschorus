function ChorusStaffs(controller) {
	var self = {};
	
	var initialDragX;
	function addDragBehaviour(staff) {
		staff.drag(function() {
			initialDragX = parseInt($('ul.notes', this).css('left'));
		}, function(e) {
			setStaffPosition(initialDragX + e.offsetX);
		}, function() {
		})
	}
	
	function setStaffPosition(x) {
		x = Math.min(0, x);
		$('#staffs ul.notes').css({'left': x});
	}
	
	var addStaff = $('<li id="add_track_staff"><div class="staff_controls"></div><div class="staff_viewport">\
		<div class="staff">\
			<div class="staff_bg"><button id="add_track">Add another part</button></div>\
			<ul class="notes"></ul>\
		</div>\
	</div></li>')
	$('#staffs').append(addStaff);
	addDragBehaviour(addStaff);
	
	function Staff(track) {
		var staffLi = $('<li></li>');
		var recordButton = $('<button class="record_button">Record</button>');
		staffLi.insertBefore('#add_track_staff');
		staffLi.append($('<div class="staff_controls"></div>').append(recordButton));
		if (editorActive) $('#staffs').jScrollPane();
		recordButton.click(function() {
			if (track.isRecording) {
				controller.stopRecording();
			} else {
				controller.recordTrack(track);
			}
		})
		
		track.onStartRecording.bind(function() {
			recordButton.text('Stop').addClass('recording');
		})
		track.onStopRecording.bind(function() {
			recordButton.text('Record').removeClass('recording');
		})
		
		var staff = $('<div class="staff_viewport">\
			<div class="staff">\
				<div class="staff_bg"></div>\
				<ul class="notes"></ul>\
			</div>\
		</div>');
		staffLi.append(staff);
		setStaffPosition(0);
		addDragBehaviour(staff);
		
		function addNote(note) {
			var noteLi = $('<li></li>').addClass(note.noteName);
			$('ul.notes', staff).append(noteLi);
			noteLi.css({
				'left': note.time/6 + 40 + 'px'
			});
			note.elem = noteLi;
		}
		track.eachNote(addNote);
		track.onAddNote.bind(addNote);
		track.onClear.bind(function() {
			$('ul.notes', staff).empty();
		})
	}
	
	function loadSong() {
		$('#staffs li:not(#add_track_staff)').remove();
		for (var i = 0; i < controller.song.tracks.length; i++) {
			Staff(controller.song.tracks[i]);
		}
	}
	loadSong();
	controller.song.onLoad.bind(loadSong);
	
	controller.song.onAddTrack.bind(function(track) {
		Staff(track);
	})
	
	controller.onPlayNote.bind(function(note) {
		if (note.elem) {
			note.elem.addClass('active');
			var currentX = parseInt($('#staffs ul.notes').css('left'));
			var noteX = parseInt(note.elem.css('left'));
			if (noteX < -currentX || noteX > -currentX + $('#staffs .staff_viewport').width() - 100) {
				setStaffPosition(noteX < 200 ? 0 : -noteX);
			}
		}
	})
	controller.onStopNote.bind(function(note) {
		if (note.elem) {
			note.elem.removeClass('active');
		}
	})
	
	return self;
}
