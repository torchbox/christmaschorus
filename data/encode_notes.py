import subprocess

NOTES = [
	("Alice C la_bip_4", "c4"),
	("Andy bom_bip", "b2"),
	("CHRIS EB_bip", "ds3"),
	("DAVE MIDDLE F_bip", "f3"),
	("Ed Bb_bip", "as2"),
	("HELEN HIGH E_bip", "e4"),
	("IAN G#_bip", "gs2"),
	("JAMES F#_bip", "fs2"),
	("JOE F#_bip", "fs4"),
	("JOHAN F_bip", "f2"),
	("JONNY C#_bip", "cs3"),
	("JP F#_bip", "fs3"),
	#("MATT E LA_bip", "e4"), # using Helen's e4 instead
	#("MATTHEW HIGH F_bip", "f3"), # will replace with Dave
	#("MATTHEW LOW F_bip", "f2"), # will replace with Johan
	#("MATTHEW LOW F#_bip", "fs2"), # will replace with James
	("MATTHEW HIGH G_bip", "g4"),
	("Neal A-ish_bip", "a2"),
	("NEIL D_bip", "d3"),
	("NICK B", "b3"),
	("Olly C bom_bip", "c3"),
	("PAUL G_bip_1", "g3"),
	("PETE G_bip", "g2"),
	("ROB HIGH F LA_bip", "f4"),
	("ROBBIE G# BOM_bip_1", "gs3"),
	("SALLY Eb_bip", "ds4"),
	("STEVE E_bip", "e3"),
	("STEWART A_bip", "a3"),
	("SUSAN D_bip", "d4"),
	("Tom low E", "e2"),
	("VICTORIA C#_bip", "cs4"),
	("Wes Bb_bip", "as3"),
]

for (infile_root, outfile_root) in NOTES:
	for length in (1,2,3):
		infile = "%s.0%d.aif" % (infile_root, length)
		outfile_wav = "wav/%s_%d.wav" % (outfile_root, length)
		outfile_ogg = "ogg/%s_%d.ogg" % (outfile_root, length)
		outfile_mp3 = "mp3/%s_%d.mp3" % (outfile_root, length)
		subprocess.check_call(["sox", infile, "-c1", outfile_wav])
		subprocess.check_call(["oggenc", "-q1", outfile_wav, "-o", outfile_ogg])
		subprocess.check_call(["lame", "--preset", "cbr", "64", outfile_wav, outfile_mp3])
