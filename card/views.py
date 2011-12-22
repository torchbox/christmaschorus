from card.shortcuts import *
from card.models import *
from card.forms import *
from django.http import HttpResponse, HttpResponseRedirect
import datetime
from django.conf import settings
from django.utils import simplejson

def home(request):
	form = CreateSongForm()
	
	try:
		# choose a random Torchbox song
		#song = Song.objects.filter(is_by_torchbox=True).order_by('?')[0]
		
		# choose We Wish You A Merry Christmas
		song = Song.objects.filter(code='9md8vr')[0]
	except IndexError:
		song = Song(notes_json = '[[]]')
	
	return render(request, 'index.html', {
		'song': song,
		'title': 'Merry Christmas from Torchbox!',
		'form': form,
		'songs_by_torchbox': Song.by_torchbox(),
		'songs_by_others': Song.by_others(),
		'share_url': settings.PUBLIC_ROOT_URL + '/',
		'editor_enabled': settings.SONG_EDITOR_ENABLED,
	})

def create_song(request):
	form = CreateSongForm(request.POST)
	song = form.save()
	if request.is_ajax():
		return HttpResponse(simplejson.dumps(song.as_json_data()), mimetype="text/javascript")
	else:
		return HttpResponseRedirect(song.get_absolute_url())

def song(request, code):
	song = get_object_or_404(Song, code = code)
	if request.is_ajax():
		return HttpResponse(simplejson.dumps(song.as_json_data()), mimetype="text/javascript")
	else:
		form = CreateSongForm()
		return render(request, 'index.html', {
			'song': song,
			'title': song.title,
			'form': form,
			'songs_by_torchbox': Song.by_torchbox(),
			'songs_by_others': Song.by_others(),
			# for now just share the site root, rather than specific songs
			#'share_url': settings.PUBLIC_ROOT_URL + song.get_absolute_url(),
			'share_url': settings.PUBLIC_ROOT_URL +'/',
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
		return HttpResponse(song.votes_string)
	else:
		return HttpResponseRedirect(song.get_absolute_url())
