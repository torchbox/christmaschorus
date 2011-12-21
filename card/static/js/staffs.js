function ChorusStaffs(controller) {
	var self = {};
	
	var initialDragX;
	function setStaffPosition(x) {
		x = Math.min(0, x);
		$('#staffs ul.notes').css({'left': x});
	}
	
	$('#staffs').append('<li id="add_track_staff"><div class="staff_controls"></div><div class="staff_viewport">\
			<div class="staff">\
				<div class="staff_bg"><button id="add_track">Add another part</button></div>\
			</div>\
		</div></li>');
	
	function Staff(track) {
		var staffLi = $('<li></li>');
		var recordButton = $('<a href="javascript:void(0)" class="record_button">Record</a>');
		staffLi.insertBefore('#add_track_staff');
		staffLi.append($('<div class="staff_controls"></div>').append(recordButton));
		recordButton.click(function() {
			track.onRequestRecord.trigger(track);
		})
		var staff = $('<div class="staff_viewport">\
			<div class="staff">\
				<div class="staff_bg"></div>\
				<ul class="notes"></ul>\
			</div>\
		</div>');
		staffLi.append(staff);
		setStaffPosition(0);
		staff.drag(function() {
			initialDragX = parseInt($('ul.notes', this).css('left'));
		}, function(e) {
			setStaffPosition(initialDragX + e.offsetX);
		}, function() {
		})
		
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
