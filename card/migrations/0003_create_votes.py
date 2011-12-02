# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Vote'
        db.create_table('card_vote', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('song', self.gf('django.db.models.fields.related.ForeignKey')(related_name='votes', to=orm['card.Song'])),
            ('score', self.gf('django.db.models.fields.IntegerField')()),
            ('vote_date', self.gf('django.db.models.fields.DateField')()),
            ('ip_address', self.gf('django.db.models.fields.IPAddressField')(max_length=15)),
        ))
        db.send_create_signal('card', ['Vote'])


    def backwards(self, orm):
        
        # Deleting model 'Vote'
        db.delete_table('card_vote')


    models = {
        'card.song': {
            'Meta': {'object_name': 'Song'},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '16'}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'notes_json': ('django.db.models.fields.TextField', [], {}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        'card.vote': {
            'Meta': {'object_name': 'Vote'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ip_address': ('django.db.models.fields.IPAddressField', [], {'max_length': '15'}),
            'score': ('django.db.models.fields.IntegerField', [], {}),
            'song': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'votes'", 'to': "orm['card.Song']"}),
            'vote_date': ('django.db.models.fields.DateField', [], {})
        }
    }

    complete_apps = ['card']
