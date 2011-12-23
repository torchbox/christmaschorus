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
			controller.stopPlayback();
			controller.loadSong({
				'note_data': [[]],
				'title': 'New song',
				'votes_string': ''
			});
			existingSongIsLoaded = false;
			$('#save').addClass('disabled');
		}
		$('#current_song').hide();
		$('#staffs .record_button:eq(0)').addClass('click_me');
		$('#editor').show().animate({'bottom': '0px'}, function() {
			setTimeout(function() {
				$('#staffs .record_button:eq(0)').removeClass('click_me');
			}, 1500);
		});
		$('#songsheet').slideUp();
		editorActive = true;
		setChoirSize(true);
		$('#staffs').jScrollPane();
	}
	controller.onStopRecording.bind(function() {$('#save').removeClass('disabled');})
	function hideEditor() {
		controller.stopRecording();
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

	$('#songsheet .songs:eq(1) ul').jScrollPane();
		
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
				if (!$(event.target).hasClass('jspDrag')) { /* hack: prevent firefox from closing on dragging scrollbar. Why it thinks that's a click event, or that the scrollbar isn't in songSelector, is beyond me... */
					closeSelector();
				}
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

	$('a#share_twitter,a#popup_share_twitter').click(function() {
		window.open(this.href, '_blank', 'width=550,height=450');
		return false;
	})
	$('a#share_facebook,a#popup_share_facebook').click(function() {
		window.open(this.href, '_blank', 'width=550,height=450');
		return false;
	})

	controller.onLoadSong.bind(function(songWithMeta) {
		if (songWithMeta.code) {
			var shareUrl = 'http://sing.torchbox.com/#' + songWithMeta.code
			var twitterUrl = 'https://twitter.com/share?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent("Happy Christmas from everyone at @torchbox! Choose your favourite carol and we'll sing it to you.");
			var twitterMySongUrl = 'https://twitter.com/share?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent("I've made the @Torchbox #Christmas Choir sing a song for you!");
			var facebookUrl = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(shareUrl);
            var emailUrl = 'mailto:?Subject=The Torchbox Christmas Choir!&body=' + encodeURIComponent(shareUrl);
            var emailMySongUrl = 'mailto:?Subject=The Torchbox Christmas Choir!&body=' + encodeURIComponent("I've made the Torchbox Christmas Choir sing a song for you! " + shareUrl);
			$('a#share_twitter').attr('href', twitterUrl);
			$('a#share_facebook').attr('href', facebookUrl);
            $('a#share_email').attr('href', emailUrl);
			$('a#popup_share_twitter').attr('href', twitterMySongUrl);
			$('a#popup_share_facebook').attr('href', facebookUrl);
            $('a#popup_share_email').attr('href', emailMySongUrl);
            $('#share_popup h2 a').attr('href', shareUrl).text('sing.torchbox.com/#' + songWithMeta.code);
			if (window.setChoirSize) setChoirSize();
		}
	})

	/* Disable playing by keyboard while lightbox is open */
	$(document).bind('cbox_open', function() { controller.keyboardActive = false; })
	$(document).bind('cbox_closed', function() { controller.keyboardActive = true; })
	
	$('#save').click(function() {
		if ($(this).is('.disabled')) return;
		$.colorbox({'inline': true, 'href': '#save_popup',
			'onComplete': function() {
				$('#id_title').addClass('placeholder').val('Enter a name here').one('focus', function() {
					$(this).removeClass('placeholder').val('');
				});
			}
		})
	});
	
	$('#save_popup form').submit(function() {
		$.post(this.action, $(this).serialize(), function(response) {
			controller.loadSong(response);
			location.hash = response.code;
			$.colorbox({'inline': true, 'href': '#share_popup'});
		}, 'json')
		return false;
	})
	
	$('#add_track').click(function() {
		controller.song.addTrack();
	});
	
	return self;
};
