require 'midilib'
require 'generator'
require 'json'

# Create a new, empty sequence.
seq = MIDI::Sequence.new()

# Utility class to merge several Enumerables (each of which emit comparable
# objects in order) into one ordered Enumerable. Used to merge all MIDI tracks
# into a single stream
class IteratorMerger
	include Enumerable
	
	def initialize
		@streams = []
		@enumerables = []
	end
	
	def add(enumerable)
		@enumerables << enumerable
		# convert enumerable object to an iterator responding to end?, current and next
		@streams << Generator.new(enumerable)
	end
	
	def each
		until @streams.all?{|stream| stream.end?}
			# while there are still some objects in the stream,
			# pick the stream whose next object is first in order
			next_stream = @streams.reject{|stream| stream.end?}.min{|a,b|
				a.current <=> b.current
			}
			yield next_stream.next, @streams.index(next_stream)
		end
	end
end

song_data = []
active_notes = {}

# Read the contents of a MIDI file into the sequence.
File.open(ARGV[0], 'rb') { | file |
	# Create a stream of all MIDI events from all tracks
	event_stream = IteratorMerger.new
	seq.read(file) { | track, num_tracks, i |
		# puts "Loaded track #{i} of #{num_tracks}"
		next unless track
		event_stream.add(track)
		song_data.push([])
	}
	
	# Keeping track of the time at which the last tempo change event occurred,
	# and the new tempo, will allow us to calculate an exact microsecond time
	# for each subsequent event.
	last_tempo_event_microsecond_time = 0
	default_bpm = MIDI::Sequence::DEFAULT_TEMPO
	default_microseconds_per_beat = MIDI::Tempo.bpm_to_mpq(default_bpm)
	last_tempo_event = MIDI::Tempo.new(default_microseconds_per_beat)
	
	event_stream.each do |event, track_number|
		# Calculate absolute microsecond time of the event
		delta_from_last_tempo_event = event.time_from_start - last_tempo_event.time_from_start
		current_microseconds_per_beat = last_tempo_event.tempo
		
		#beats_since_last_tempo_event = delta_from_last_tempo_event / seq.ppqn
		#microseconds_since_last_tempo_event = beats_since_last_tempo_event * current_microseconds_per_beat
		# -> refactored to avoid floating point division:
		microseconds_since_last_tempo_event = delta_from_last_tempo_event * current_microseconds_per_beat / seq.ppqn
		
		current_microsecond_time = last_tempo_event_microsecond_time + microseconds_since_last_tempo_event
		
		case event
			when MIDI::Tempo
				# Keep track of tempo changes so that we can calculate subsequent microsecond timings
				last_tempo_event = event
				last_tempo_event_microsecond_time = current_microsecond_time
			when MIDI::NoteOnEvent
				note_name = event.pch_oct.sub('#', 's').downcase
				if note_name == 'd2'
					note_name = 'woof'
				elsif note_name == 'c2'
					note_name = 'bell'
				elsif note_name == 'cs2'
					note_name = 'clap'
				end
				note = {
					'noteName' => note_name,
					'time' => current_microsecond_time/1000
				}
				active_notes[event.note] = note
				song_data[track_number].push(note)
			when MIDI::NoteOffEvent
				if active_notes[event.note]
					note = active_notes[event.note]
					note['duration'] = current_microsecond_time/1000 - note['time']
				end
		end
		
	end
}

song_data.reject!{|track| track.empty?}

puts song_data.to_json
