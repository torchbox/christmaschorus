function ChorusKeyboard(controller) {
	var self = {};
	
	var keysPressed = {};
	
	NOTES_BY_KEYCODE = {
		90: 'e2', 88: 'f2', 68: 'fs2', 67: 'g2', 70: 'gs2', 86: 'a2',
		71: 'as2', 66: 'b2', 78: 'c3', 74: 'cs3', 77: 'd3', 75: 'ds3', 188: 'e3',
		190: 'f3', 186: 'fs3', 59: 'fs3', 191: 'g3',
		
		81: 'e3', 87: 'f3', 51: 'fs3', 69: 'g3', 52: 'gs3', 82: 'a3', 53: 'as3', 84: 'b3',
		89: 'c4', 55: 'cs4', 85: 'd4', 56: 'ds4', 73: 'e4', 79: 'f4', 48: 'fs4', 80: 'g4',
		
		32: 'woof'
	}
	
	$(document).keydown(function(e) {
	console.log(e.which);
		if (!controller.keyboardActive) return;
		if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
		var noteName = NOTES_BY_KEYCODE[e.which];
		if (noteName && !keysPressed[e.which]) {
			var note = controller.registerNoteOn(noteName);
			keysPressed[e.which] = note;
			$('#piano_'+noteName).addClass('active');
		}
	}).keyup(function(e) {
		if (keysPressed[e.which]) {
			controller.registerNoteOff(keysPressed[e.which]);
			$('#piano_'+keysPressed[e.which].noteName).removeClass('active');
			keysPressed[e.which] = null;
		}
	})
	
	return self;
}
