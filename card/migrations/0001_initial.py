# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Song'
        db.create_table('card_song', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('notes_json', self.gf('django.db.models.fields.TextField')()),
            ('code', self.gf('django.db.models.fields.CharField')(max_length=16)),
        ))
        db.send_create_signal('card', ['Song'])


    def backwards(self, orm):
        
        # Deleting model 'Song'
        db.delete_table('card_song')


    models = {
        'card.song': {
            'Meta': {'object_name': 'Song'},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '16'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'notes_json': ('django.db.models.fields.TextField', [], {}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        }
    }

    complete_apps = ['card']
