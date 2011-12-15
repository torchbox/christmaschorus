from card.shortcuts import *
from card.models import *
from card.forms import *
from django.http import HttpResponse, HttpResponseRedirect
import datetime

def home(request):
	form = CreateSongForm()
	song = Song(notes_json = '[[]]')
	return render(request, 'index.html', {
		'song': song,
		'title': 'Merry Christmas from Torchbox!',
		'form': form,
		'songs_by_torchbox': Song.by_torchbox(),
		'latest_songs': Song.latest(),
		'highest_voted_songs': Song.highest_voted(),
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
		'latest_songs': Song.latest(),
		'highest_voted_songs': Song.highest_voted(),
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
	return HttpResponse(song.score)
