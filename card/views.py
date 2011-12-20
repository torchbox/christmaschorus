from card.shortcuts import *
from card.models import *
from card.forms import *
from django.http import HttpResponse, HttpResponseRedirect
import datetime
from django.conf import settings

def home(request):
	form = CreateSongForm()
	
	# choose a random Torchbox song
	try:
		song = Song.objects.filter(is_by_torchbox=True).order_by('?')[0]
	except IndexError:
		song = Song(notes_json = '[[]]')
	
	return render(request, 'index.html', {
		'song': song,
		'title': 'Merry Christmas from Torchbox!',
		'form': form,
		'songs_by_torchbox': Song.by_torchbox(),
		'songs_by_others': Song.by_others(),
		'full_url': settings.PUBLIC_ROOT_URL + '/',
		'editor_enabled': settings.SONG_EDITOR_ENABLED,
	})

def create_song(request):
	form = CreateSongForm(request.POST)
	song = form.save()
	return HttpResponseRedirect(song.get_absolute_url())

def song(request, code):
	song = get_object_or_404(Song, code = code)
	form = CreateSongForm()
	return render(request, 'index.html', {
		'song': song,
		'title': song.title,
		'form': form,
		'songs_by_torchbox': Song.by_torchbox(),
		'songs_by_others': Song.by_others(),
		'full_url': settings.PUBLIC_ROOT_URL + song.get_absolute_url(),
		'editor_enabled': settings.SONG_EDITOR_ENABLED,
	})

def vote(request, code):
	song = get_object_or_404(Song, code = code)
	if request.POST and request.POST.get('score') in ('-1', '1'):
		try:
			vote = Vote.objects.get(
				song = song,
				vote_date = datetime.date.today(),
				ip_address = request.META['REMOTE_ADDR'])
		except Vote.DoesNotExist:
			vote = Vote(
				song = song,
				vote_date = datetime.date.today(),
				ip_address = request.META['REMOTE_ADDR'])
		vote.score = request.POST['score']
		vote.save()
	if request.is_ajax():
		if song.score == 1:
			return HttpResponse("(1 vote)")
		else:
			return HttpResponse("(%s votes)" % song.score)
	else:
		return HttpResponseRedirect(song.get_absolute_url())
