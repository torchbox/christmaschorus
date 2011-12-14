var editorActive = false;

function fitChoirInDimensions(availableWidth, availableHeight, animate) {
	var choirWidth = availableHeight * 800/360;
	if (choirWidth > availableWidth) {
		choirWidth = availableWidth;
		choirHeight = choirWidth * 360/800;
	} else {
		choirHeight = availableHeight;
	}
	if (animate) {
		$('#choir').animate({'width': choirWidth + 'px', 'height': choirHeight + 'px'});
	} else {
		$('#choir').css({'width': choirWidth + 'px', 'height': choirHeight + 'px'});
	}
}

function setChoirSize(animate) {
	if (editorActive) {
		var availableHeight = $(window).height() - $('#title').height() - $('#songsheet').height() - $('#editor').height();
	} else {
		var availableHeight = $(window).height() - $('#title').height() - $('#songsheet').height() - $('#current_song').height();
	}
	var availableWidth = $(window).width();
	fitChoirInDimensions(availableWidth, availableHeight, animate);
}

function showEditor() {
	$('#current_song').hide();
	$('#editor').show().animate({'bottom': '0px'});
	editorActive = true;
	setChoirSize(true);
}
function hideEditor() {
	$('#editor').animate({'bottom': '-260px'}, function() {
		$('#editor').hide();
		$('#current_song').show();
	});
	editorActive = false;
	setChoirSize(true);
}

$(function() {
	setChoirSize();
	$(window).resize(setChoirSize);
	
	$('#current_song h2').css({'cursor': 'pointer'}).click(function() {
		showEditor();
	})
	$('#editor_close').css({'cursor': 'pointer'}).click(function() {
		hideEditor();
	})
})
