from django.conf.urls.defaults import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    url(r'^admin/', include(admin.site.urls)),
    
    url(r'^$', 'card.views.home', name='home'),
    url(r'^create/$', 'card.views.create_song', name='create_song'),
    url(r'^(\w+)/$', 'card.views.song', name='song'),
    url(r'^(\w+)/vote/$', 'card.views.vote', name='vote'),
)
urlpatterns += staticfiles_urlpatterns()
