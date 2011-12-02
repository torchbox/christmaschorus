from card.shortcuts import *

def home(request):
	return render(request, 'index.html', {})
