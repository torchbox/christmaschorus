function ChorusFaces(controller) {
	var self = {};
	FACES_BY_NOTE_ID = {};
	
	ANIM_SPEED = 50;
	function Face(li) {
		var img = $(li).find('img');
		img.css('opacity', 0.7);
		
		if (li.id == 'face_woof') {
			return {
				'open': function() {
					img.css({'opacity': 0.8});
					setTimeout(function() {img.css({'opacity': 0.9})}, ANIM_SPEED);
					setTimeout(function() {img.css({'opacity': 1})}, ANIM_SPEED*2);
				},
				'close': function() {
					img.css({'opacity': 0.9});
					setTimeout(function() {img.css({'opacity': 0.8})}, ANIM_SPEED);
					setTimeout(function() {img.css({'opacity': 0.7})}, ANIM_SPEED*2);
				}
			}
		} else {
			return {
				'open': function() {
					img.css({'top': '-100%', 'opacity': 0.8});
					setTimeout(function() {img.css({'top': '-200%', 'opacity': 0.9})}, ANIM_SPEED);
					setTimeout(function() {img.css({'top': '-300%', 'opacity': 1})}, ANIM_SPEED*2);
				},
				'close': function() {
					img.css({'top': '-200%', 'opacity': 0.9});
					setTimeout(function() {img.css({'top': '-100%', 'opacity': 0.8})}, ANIM_SPEED);
					setTimeout(function() {img.css({'top': '0%', 'opacity': 0.7})}, ANIM_SPEED*2);
				}
			}
		}
	}
	
	var lastMouseNote = null;
	
	$('#singers li').each(function() {
		var face = Face(this);
		FACES_BY_NOTE_ID[this.id] = face;
		var noteName = this.id.replace(/^face_/, '');
		
		$(this).mousedown(function() {
			lastMouseNote = controller.registerNoteOn(noteName);
			return false; /* disable dragging */
		});
		
		var bio = $('.bio', this);
		$(this).hover(function() {
			bio.show();
		}, function() {
			bio.hide();
		})
	})
	
	$(document).mouseup(function() {
		if (lastMouseNote) {
			controller.registerNoteOff(lastMouseNote);
			lastMouseNote = null;
		}
	})
	
	controller.onPlayNote.bind(function(note) {
		FACES_BY_NOTE_ID['face_' + note.noteName].open();
	})
	
	controller.onStopNote.bind(function(note) {
		FACES_BY_NOTE_ID['face_' + note.noteName].close();
	})
	
	return self;
}
