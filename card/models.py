from django.db import models
from django.db.models import Sum
import random

class Song(models.Model):
	title = models.CharField(max_length=255)
	notes_json = models.TextField()
	code = models.CharField(max_length = 16)
	created_at = models.DateTimeField(auto_now_add = True)
	is_by_torchbox = models.BooleanField(default=False)
	
	# TODO: validate that notes_json is valid JSON
	
	def save(self, *args, **kwargs):
		if not self.code:
			while True:
				code = ''.join(random.choice('BCDFGHJKLMNPQRSTVWXYZ0123456789bcdfghjklmnpqrstvwxyz') for x in range(6))
				if not Song.objects.filter(code = code).count():
					break
			self.code = code
		
		return super(Song, self).save(*args, **kwargs)
	
	def __unicode__(self):
		return self.title
	
	@models.permalink
	def get_absolute_url(self):
		return ('card.views.song', [self.code])
	
	@property
	def score(self):
		return self.votes.all().aggregate(Sum('score'))['score__sum'] or 0
	
	@property
	def votes_string(self):
		score = self.score
		if score == 1:
			return "(1 vote)"
		else:
			return "(%s votes)" % score
	
	@staticmethod
	def latest():
		return Song.objects.order_by('-created_at')[:10].annotate(vote_score = Sum('votes__score'))
	
	@staticmethod
	def by_torchbox():
		return Song.objects.annotate(vote_score = Sum('votes__score')).filter(is_by_torchbox=True).order_by('-vote_score')
	
	@staticmethod
	def by_others():
		return Song.objects.annotate(vote_score = Sum('votes__score')).filter(is_by_torchbox=False).order_by('-vote_score')[:10]

class Vote(models.Model):
	song = models.ForeignKey(Song, related_name = 'votes')
	score = models.IntegerField(choices = ((1,'+'), (-1, '-')) )
	vote_date = models.DateField()
	ip_address = models.IPAddressField()
