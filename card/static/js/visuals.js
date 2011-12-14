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

ANIM_SPEED = 50;
function Face(li) {
	var img = $(li).find('img');
	img.css('opacity', 0.7);
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

FACES_BY_NOTE_ID = {};

$(function() {
	$('#singers li').each(function() {
		var face = Face(this);
		FACES_BY_NOTE_ID[this.id] = face;
		
		$(this).mousedown(function() {
			face.open();
			return false; /* disable dragging */
		}).mouseup(function() {
			face.close();
		})
	})
	
	setChoirSize();
	$(window).resize(setChoirSize);
	
	$('#current_song h2').css({'cursor': 'pointer'}).click(function() {
		showEditor();
	})
	$('#editor_close').css({'cursor': 'pointer'}).click(function() {
		hideEditor();
	})
})
