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

$(function() {
	var playerFurnitureHeight = $('#title').height() + $('#songsheet').height() + $('#current_song').height();
	var editorFurnitureHeight = $('#title').height() + $('#editor').height() + 30;
	window.setChoirSize = function(animate) {
		if (editorActive) {
			var availableHeight = $(window).height() - editorFurnitureHeight;
		} else {
			var availableHeight = $(window).height() - playerFurnitureHeight;
		}
		availableHeight -= 30; /* enforce margin */
		var availableWidth = $(window).width();
		fitChoirInDimensions(availableWidth, availableHeight, animate);
	}
	
	setChoirSize();
	$(window).resize(function() {setChoirSize()});
	setTimeout(function() {setChoirSize()}, 1000);

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
		$('#current_song').removeClass('playing');
		$('#playback').text('Playback').removeClass('playing');
	})
	controller.onStartPlayback.bind(function() {
		$('#play').val('Stop');
		$('#current_song').addClass('playing');
		$('#playback').text('Playing').addClass('playing');
	})

	var existingSongIsLoaded = true; /* as opposed to one they're creating */

	function showEditor() {
		if (existingSongIsLoaded) {
			controller.loadSong({
				'note_data': [[]],
				'title': 'New song',
				'votes_string': ''
			});
			existingSongIsLoaded = false;
		}
		$('#current_song').hide();
		$('#editor').show().animate({'bottom': '0px'});
		$('#songsheet').slideUp();
		editorActive = true;
		setChoirSize(true);
	}
	function hideEditor() {
		$('#editor').animate({'bottom': '-244px'}, function() {
			$('#editor').hide();
			$('#current_song').show();
		});
		$('#songsheet').slideDown();
		editorActive = false;
		setChoirSize(true);
	}
	
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
			$('ul', songSelector).slideDown('fast');
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

		$('li a', this).click(function() {
			if (controller.isPlaying) controller.stopPlayback();

			var code = this.href.match(/\/(\w+)\/$/)[1];
			location.hash = code;
			$.getJSON(this.href, function(response) {
				controller.loadSong(response);
				existingSongIsLoaded = true;
				controller.startPlayback();
			})
			closeSelector();
			return false;
		})
	})

	$('a#share_twitter').click(function() {
		window.open(this.href, '_blank', 'width=550,height=450');
		return false;
	})
	$('a#share_facebook').click(function() {
		window.open(this.href, '_blank', 'width=550,height=450');
		return false;
	})

	controller.onLoadSong.bind(function(songWithMeta) {
		if (songWithMeta.code) {
			var twitterUrl = 'https://twitter.com/share?url=' + encodeURIComponent('http://sing.torchbox.com/#' + songWithMeta.code) + '&text=' + encodeURIComponent("Happy Christmas from everyone at @torchbox! Choose your favourite carol and we'll sing it to you.");
			var facebookUrl = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent('http://sing.torchbox.com/#' + songWithMeta.code);
            var emailUrl = 'mailto:?Subject=The Torchbox Christmas Choir!&body=' + encodeURIComponent('http://sing.torchbox.com/#' + songWithMeta.code);
			$('a#share_twitter').attr('href', twitterUrl);
			$('a#share_facebook').attr('href', facebookUrl);
            $('a#share_email').attr('href', emailUrl);
			if (window.setChoirSize) setChoirSize();
		}
	})

	/* Disable playing by keyboard while lightbox is open */
	$(document).bind('cbox_open', function() { controller.keyboardActive = false; })
	$(document).bind('cbox_closed', function() { controller.keyboardActive = true; })
	
	$('#save').colorbox({'inline': true, 'href': '#save_popup'});
	
	$('#add_track').click(function() {
		controller.song.addTrack();
	});
	
	return self;
};
