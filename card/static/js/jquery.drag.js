var dragStartX, dragStartY;
$.fn.drag = function(startHandler, dragHandler, endHandler) {
	var source;
	var mousemoveHandler = function(e) {
		e.offsetX = e.clientX - dragStartX;
		e.offsetY = e.clientY - dragStartY;
		if (dragHandler != null) dragHandler.call(source, e);
		return false;
	}
	var mouseupHandler = function(e) {
		if (endHandler != null) endHandler.call(source, e);
		$(document).unbind('mousemove', mousemoveHandler);
		$(document).unbind('mouseup', mouseupHandler);
	}
	this.mousedown(function(e) {
		source = this;
		if (startHandler != null) startHandler.call(this, e);
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		$(document).mousemove(mousemoveHandler).mouseup(mouseupHandler);
		return false; /* prevent bubbling of mousedown event to things underneath */
	})
	return this;
}
