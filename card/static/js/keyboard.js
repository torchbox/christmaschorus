function ChorusKeyboard(controller) {
	var self = {};
	
	var keysPressed = {};
	
	$(document).keydown(function(e) {
		if (!controller.keyboardActive) return;
		if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
		var noteName = NOTES_BY_KEYCODE[e.which];
		if (noteName && !keysPressed[e.which]) {
			var note = controller.registerNoteOn(noteName);
			keysPressed[e.which] = note;
		}
	}).keyup(function(e) {
		if (keysPressed[e.which]) {
			controller.registerNoteOff(keysPressed[e.which]);
			keysPressed[e.which] = null;
		}
	})
	
	return self;
}
