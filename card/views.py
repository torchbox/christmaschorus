from card.shortcuts import *
from card.models import *
from card.forms import *
from django.http import HttpResponseRedirect

def home(request):
	form = CreateSongForm()
	song = Song(notes_json = '[]')
	return render(request, 'index.html', {
		'song': song,
		'form': form,
		'latest_songs': Song.latest,
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
		'form': form,
		'latest_songs': Song.latest,
	})
