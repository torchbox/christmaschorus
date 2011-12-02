# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'Song.created_at'
        db.add_column('card_song', 'created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=datetime.datetime(2011, 12, 2, 14, 54, 2, 947350), blank=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'Song.created_at'
        db.delete_column('card_song', 'created_at')


    models = {
        'card.song': {
            'Meta': {'object_name': 'Song'},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '16'}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'notes_json': ('django.db.models.fields.TextField', [], {}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        }
    }

    complete_apps = ['card']
