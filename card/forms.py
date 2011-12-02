from django import forms
from card.models import *

class CreateSongForm(forms.ModelForm):
	class Meta:
		model = Song
		fields = ['title', 'notes_json']
		widgets = {
			'notes_json': forms.HiddenInput(),
		}
