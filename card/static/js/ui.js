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
	
	$('#songsheet .songs').each(function() {
		var songSelector = this;
		var isOpen = false;
		
		function openSelector() {
			$('ul', songSelector).show();
			isOpen = true;
		}
		function closeSelector() {
			$('ul', songSelector).hide();
			isOpen = false;
		}
		
		$('ul', songSelector).hide();
		$('h2', songSelector).css('cursor', 'pointer');
		$(document).click(function(event) {
			if ($.contains(songSelector, event.target) && !isOpen) {
				openSelector();
			} else {
				closeSelector();
			}
		})
		
	})
	
	$('#vote_controls form').each(function() {
		var form = this;
		$(form).submit(function() {
			$.post(form.action, $(form).serialize(), function(response) {
				$('#current_song .votes').text(response).css({'opacity': 0}).animate({'opacity': 1});
			})
			return false;
		})
		var submit = $('input[type=submit]', form);
		submit.replaceWith(
			$('<a href="javascript:void(0)"></a>').text(submit.val()).click(function() {$(form).submit()})
		)
	})
});

function ChorusUi(controller) {
	var self = {};
	
	$('#play,#playback').click(function() {
		if (controller.isPlaying) {
			controller.stopPlayback();
		} else {
			controller.startPlayback();
		}
	})
	controller.onStopPlayback.bind(function() {
		$('#play').val('Play');
		$('#playback').val('Playback');
	})
	controller.onStartPlayback.bind(function() {
		$('#play').val('Stop');
		$('#playback').val('Stop');
	})
	
	return self;
};
