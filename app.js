(() => {
  'use strict';

  const APP_VERSION = '2.3.0';
  const DB_NAME = 'tucker-guitar-trainer';
  const DB_VERSION = 1;
  const STORE_SONGS = 'songs';
  const HIT_WINDOW = 0.46;
  const NOTE_LOOKAHEAD = 3.2;

  const STRING_INFO = [
    { label:'E', number:6, name:'Low E', openMidi:40, color:'#ef4444' },
    { label:'A', number:5, name:'A', openMidi:45, color:'#f97316' },
    { label:'D', number:4, name:'D', openMidi:50, color:'#facc15' },
    { label:'G', number:3, name:'G', openMidi:55, color:'#22c55e' },
    { label:'B', number:2, name:'B', openMidi:59, color:'#38bdf8' },
    { label:'e', number:1, name:'High e', openMidi:64, color:'#a78bfa' }
  ];

  const NOTE_NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const TAB_LESSONS = [
    { icon:'⑥', title:'Six lines = six strings', text:'Each line follows one guitar string. The top line is thin high e; the bottom line is thick low E.', tab:'e|———\nB|———\nG|———\nD|———\nA|———\nE|———', fret:'Hold the guitar normally: the thick low E is physically closest to your face.' },
    { icon:'↕', title:'Why low E is at the bottom', text:'Tab is drawn as if the guitar neck were tipped toward you. That makes the thick low E appear on the bottom.', tab:'e  ← thinnest\nB\nG\nD\nA\nE  ← thickest', fret:'The diagram matches what you see when you look down over the neck.' },
    { icon:'3', title:'Numbers mean frets', text:'A number tells you which fret to press on that string. Read from left to right.', tab:'e|——3——5——|', fret:'Press just behind fret 3, play it, then move to fret 5.' },
    { icon:'0', title:'Zero means open', text:'Play that string without holding any fret.', tab:'A|——0——2——|', fret:'Pick open A, then press the second fret on A.' },
    { icon:'→', title:'Spacing shows timing', text:'Notes farther apart leave more time. Keep counting through empty space and rests.', tab:'E|—0—0———3—|', fret:'Two close open notes, wait, then fret 3.' },
    { icon:'≡', title:'Stacked notes form chords', text:'Numbers directly above one another are played together.', tab:'e|—0—|\nB|—0—|\nG|—0—|\nD|—2—|\nA|—2—|\nE|—0—|', fret:'That stacked shape is an E minor chord.' },
    { icon:'⌁', title:'Technique symbols', text:'Slides use / or \\, hammer-ons h, pull-offs p, bends b, vibrato ~, palm mute PM and muted notes x.', tab:'E|—3/5—5h7—7p5—x—|\n       PM——', fret:'The coloured highway also labels these techniques when the song file provides them.' }
  ];

  const chords = [
    { name:'Em', frets:'0 2 2 0 0 0', note:'Easy first chord. Strum all 6 strings.' },
    { name:'E', frets:'0 2 2 1 0 0', note:'Like Em with one extra finger.' },
    { name:'A', frets:'x 0 2 2 2 0', note:'Start from the A string.' },
    { name:'D', frets:'x x 0 2 3 2', note:'Use the four thinnest strings.' },
    { name:'C', frets:'x 3 2 0 1 0', note:'Avoid the low E string.' },
    { name:'G', frets:'3 2 0 0 0 3', note:'Let the middle strings ring.' },
    { name:'Am', frets:'x 0 2 2 1 0', note:'Useful minor open chord.' },
    { name:'Dm', frets:'x x 0 2 3 1', note:'Use the four thinnest strings.' }
  ];

  function seq(pattern, startBeat = 1, step = 1) {
    return pattern.map((p, i) => ({ string:p[0], fret:p[1], beat:startBeat + i * step }));
  }

  function timed(pattern) {
    return pattern.map(p => ({ string:p[0], fret:p[1], beat:p[2] }));
  }

  function chordSeq(shapes, startBeat = 1, step = 2) {
    return shapes.map((shape, i) => {
      const chordNotes = shape.map(note => ({ string:note[0], fret:note[1] }));
      return { ...chordNotes[0], beat:startBeat + i * step, duration:1, chordNotes };
    });
  }

  const worlds = [
    {
      id:'tab-decoder', number:1, title:'Tab Decoder', subtitle:'Learn what tab means by playing it',
      levels:[
        {
          id:'zero-open', title:'0 = Open', short:'Open-string hits', bpm:60,
          tag:'TAB DECODER', headline:'0 means OPEN',
          lesson:'The bottom E line in tab is your thickest string. A 0 means do not hold a fret — just pick the string.',
          hint:'Bottom E line + 0 = open low E.',
          notes:seq([[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]])
        },
        {
          id:'fret-numbers', title:'Numbers = Frets', short:'0, 3 and 5', bpm:60,
          tag:'TAB DECODER', headline:'The number tells you the fret',
          lesson:'A 3 means hold the 3rd fret on that string. A 5 means the 5th fret. Read the number on the falling block and the matching tab column.',
          hint:'Number = fret. 0 = open.',
          notes:seq([[0,0],[0,3],[0,0],[0,5],[0,3],[0,0],[0,3],[0,5]])
        },
        {
          id:'a-string', title:'Meet the A String', short:'Move one string', bpm:60,
          tag:'TAB DECODER', headline:'Each tab line is a different string',
          lesson:'The A line is the next string up from the bottom E line. Same rule: 0 is open, 2 means 2nd fret, 3 means 3rd fret.',
          hint:'Watch the A line light up in the live tab.',
          notes:seq([[1,0],[1,2],[1,3],[1,2],[1,0],[1,3],[1,2],[1,0]])
        },
        {
          id:'string-jump', title:'String Jump', short:'E ↔ A', bpm:64,
          tag:'TAB DECODER', headline:'Follow the line AND the number',
          lesson:'Now the notes move between the low E and A strings. First find the string, then play the fret number.',
          hint:'Lane tells you the string. Number tells you the fret.',
          notes:seq([[0,0],[1,0],[0,3],[1,2],[0,5],[1,3],[0,3],[1,2],[0,0]])
        },
        {
          id:'first-riff', title:'First Riff', short:'Read a real pattern', bpm:68,
          tag:'WORLD 1 BOSS', headline:'You are reading tab now',
          lesson:'No new rule here. Read the string and fret, keep the beat, and try to finish with a combo.',
          hint:'Don’t stare at your hands — glance down only when you need to.',
          notes:seq([[0,0],[0,0],[0,3],[0,0],[0,5],[0,3],[1,0],[1,2],[0,3],[0,0],[1,3],[1,2]])
        }
      ]
    },
    {
      id:'riff-runner', number:2, title:'Riff Runner', subtitle:'Timing, string changes and faster reactions',
      levels:[
        {
          id:'d-string', title:'Add the D String', short:'Three strings', bpm:68,
          tag:'RIFF RUNNER', headline:'Third string unlocked',
          lesson:'The D string is string 4. Watch how its tab line sits above A and low E.',
          hint:'Low E → A → D climbs upward in tab.',
          notes:seq([[0,0],[1,0],[2,0],[1,2],[2,2],[1,3],[0,3],[2,0],[1,2],[0,0]])
        },
        {
          id:'steady-eights', title:'Steady Eighths', short:'Quicker picking', bpm:72,
          tag:'RHYTHM', headline:'Two notes per beat',
          lesson:'The blocks are closer together now. Use small pick movements and try alternate down-up picking.',
          hint:'Stay relaxed. Speed comes from smaller movement.',
          notes:seq([[0,0],[0,0],[0,3],[0,3],[1,0],[1,0],[1,2],[1,2],[0,5],[0,5],[0,3],[0,3]],1,.5)
        },
        {
          id:'three-string-riff', title:'Three-String Riff', short:'E, A and D', bpm:74,
          tag:'RIFF RUNNER', headline:'Track the lane changes',
          lesson:'The notes can jump across three strings. Read ahead by one block instead of waiting until the note reaches the line.',
          hint:'Eyes ahead, hands follow.',
          notes:seq([[0,0],[1,2],[2,2],[1,0],[0,3],[1,3],[2,0],[1,2],[0,5],[2,2],[1,0],[0,3]])
        },
        {
          id:'speed-run', title:'Speed Run', short:'80 BPM', bpm:80,
          tag:'SPEED RUN', headline:'Same rules, less time',
          lesson:'Nothing new to memorize. This level is about recognizing tab quickly and hitting the right note on time.',
          hint:'If it falls apart, retry until 75% feels easy.',
          notes:seq([[0,0],[0,3],[1,0],[1,2],[0,5],[1,3],[2,0],[2,2],[1,2],[0,3],[0,0],[1,0],[2,2],[1,3]])
        },
        {
          id:'garage-boss', title:'Garage Boss', short:'Long riff', bpm:82,
          tag:'WORLD 2 BOSS', headline:'Put the pieces together',
          lesson:'Longer pattern, faster tempo, three strings. Build the combo instead of chasing a perfect score.',
          hint:'A clean 80% is better than a frantic 100% attempt.',
          notes:seq([[0,0],[0,0],[0,3],[1,0],[1,2],[0,5],[0,3],[1,3],[2,0],[2,2],[1,2],[0,3],[0,0],[1,0],[1,3],[2,2],[1,2],[0,5]])
        }
      ]
    },
    {
      id:'fretboard-explorer', number:3, title:'Fretboard Explorer', subtitle:'Use all six strings and higher notes',
      levels:[
        {
          id:'g-string', title:'G String', short:'String 3', bpm:70,
          tag:'FRETBOARD EXPLORER', headline:'Meet the G string',
          lesson:'The G line is the third line from the top in normal tab. Play open, 2nd and 4th fret.',
          hint:'G string = string 3.',
          notes:seq([[3,0],[3,2],[3,4],[3,2],[3,0],[3,4],[3,2],[3,0]])
        },
        {
          id:'b-string', title:'B String', short:'String 2', bpm:70,
          tag:'FRETBOARD EXPLORER', headline:'One string from the top',
          lesson:'The B string is the second-thinnest string. In tab it is the second line from the top.',
          hint:'B line is directly under high e.',
          notes:seq([[4,0],[4,1],[4,3],[4,1],[4,0],[4,3],[4,1],[4,0]])
        },
        {
          id:'high-e', title:'High e', short:'String 1', bpm:70,
          tag:'FRETBOARD EXPLORER', headline:'The TOP tab line',
          lesson:'The top line in tab is the thinnest high-e string. That is why tab can look upside down at first.',
          hint:'Top tab line = thinnest string.',
          notes:seq([[5,0],[5,1],[5,3],[5,5],[5,3],[5,1],[5,0],[5,3]])
        },
        {
          id:'six-string-scan', title:'Six-String Scan', short:'All strings', bpm:74,
          tag:'FRETBOARD EXPLORER', headline:'Read the whole tab staff',
          lesson:'Every string is now in play. The falling highway and live tab show the same note in two different ways.',
          hint:'Use the tab to understand; use the highway to react.',
          notes:seq([[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[5,3],[4,3],[3,2],[2,2],[1,2],[0,3]])
        },
        {
          id:'tab-boss', title:'Tab Boss', short:'All six strings', bpm:78,
          tag:'WORLD 3 BOSS', headline:'You can read beginner tab',
          lesson:'This final starter mission uses all six strings. One star means you have the basics needed to start learning simple songs.',
          hint:'Read ahead and keep moving after a miss.',
          notes:seq([[0,0],[1,2],[2,2],[3,0],[4,1],[5,0],[5,3],[4,3],[3,2],[2,0],[1,3],[0,3],[2,2],[4,1],[5,0],[3,0]])
        }
      ]
    },
    {
      id:'rhythm-foundations', number:4, title:'Rhythm Foundations', subtitle:'Count the beat and make every note land together',
      levels:[
        { id:'quarter-pulse', title:'Quarter-Note Pulse', short:'Count 1 2 3 4', bpm:64, tag:'RHYTHM FOUNDATIONS', headline:'The beat is the engine', lesson:'Count “1, 2, 3, 4” out loud and use one relaxed down-pick on every number. Keep counting even after a miss.', hint:'Count aloud: 1, 2, 3, 4.', notes:seq([[0,0],[0,0],[0,0],[0,0],[1,0],[1,0],[1,0],[1,0]]) },
        { id:'alternate-eighths', title:'Down-Up Eighths', short:'Pick twice per beat', bpm:62, tag:'RHYTHM FOUNDATIONS', headline:'Down and up share the beat', lesson:'Say “1 and 2 and 3 and 4 and.” Pick down on each number and up on each “and.” Make the pick movement small.', hint:'Numbers = down. “And” = up.', notes:seq([[0,0],[0,0],[0,0],[0,0],[0,3],[0,3],[0,3],[0,3],[1,0],[1,0],[1,0],[1,0],[1,2],[1,2],[1,2],[1,2]],1,.5) },
        { id:'rests-and-space', title:'Rests & Space', short:'Keep counting silently', bpm:66, tag:'RHYTHM FOUNDATIONS', headline:'Silence is part of the riff', lesson:'Some beats have no note. Keep your foot and your counting moving through the empty space so the next note lands on time.', hint:'A gap is not a stop — keep counting.', notes:timed([[0,0,1],[0,0,2],[0,3,4],[0,3,5],[1,0,7],[1,2,8],[0,0,10],[0,3,12]]) },
        { id:'rhythm-gears', title:'Change Gears', short:'Quarters ↔ eighths', bpm:66, tag:'RHYTHM FOUNDATIONS', headline:'Switch speeds without rushing', lesson:'Start with one note per beat, move to two, then return to one. The main beat never speeds up—only your picking pattern changes.', hint:'The pulse stays steady while the notes change.', notes:timed([[0,0,1],[0,3,2],[1,0,3],[1,2,4],[0,0,5],[0,0,5.5],[0,3,6],[0,3,6.5],[1,0,7],[1,0,7.5],[1,2,8],[1,2,8.5],[0,3,9],[1,2,10],[1,0,11],[0,0,12]]) },
        { id:'rhythm-boss', title:'Rhythm Boss', short:'Pulse, eighths & rests', bpm:70, tag:'WORLD 4 BOSS', headline:'Hold the groove together', lesson:'This combines steady beats, down-up picking and rests. Your job is not to panic after a miss—find the count and rejoin.', hint:'Lose a note? Find the next big beat.', notes:timed([[0,0,1],[0,3,2],[1,0,3],[1,2,4],[0,0,5],[0,0,5.5],[0,3,6],[0,3,6.5],[1,0,8],[1,2,9],[2,0,10],[2,2,10.5],[1,2,11],[1,0,11.5],[0,3,12],[0,0,13],[1,0,15],[0,0,16]]) }
      ]
    },
    {
      id:'fretting-hand', number:5, title:'Fretting Hand', subtitle:'Build clean, controlled fingers without squeezing',
      levels:[
        { id:'first-finger', title:'First-Finger Control', short:'Open ↔ first fret', bpm:58, tag:'FRETTING HAND', headline:'Fret close to the wire', lesson:'Use your index finger just behind the first fret—not on top of it. Press only hard enough for a clean note, then relax.', hint:'Fingertip close behind the fret wire.', notes:seq([[5,0],[5,1],[5,0],[5,1],[4,0],[4,1],[4,0],[4,1]]) },
        { id:'chromatic-climb', title:'1-2-3-4 Crawl', short:'One finger per fret', bpm:54, tag:'FRETTING HAND', headline:'Give every finger a job', lesson:'On the low E string, use index, middle, ring and pinky for frets 1, 2, 3 and 4. Move slowly and keep the thumb relaxed.', hint:'Index 1 · middle 2 · ring 3 · pinky 4.', notes:seq([[0,1],[0,2],[0,3],[0,4],[0,1],[0,2],[0,3],[0,4]]) },
        { id:'chromatic-return', title:'4-3-2-1 Return', short:'Control the way back', bpm:54, tag:'FRETTING HAND', headline:'Coming down counts too', lesson:'Start with all four fingers placed, then lift one at a time from fret 4 back to fret 1. Keep unused fingers near the strings.', hint:'Lift small; do not fling fingers away.', notes:seq([[0,4],[0,3],[0,2],[0,1],[1,4],[1,3],[1,2],[1,1]]) },
        { id:'chromatic-crossing', title:'Crawl Across Strings', short:'E, A and D', bpm:58, tag:'FRETTING HAND', headline:'Carry the shape to a new string', lesson:'Play 1-2-3-4 on E, A and D. Let the whole hand move together when changing strings and keep alternate picking.', hint:'Same four fingers, one string higher.', notes:seq([[0,1],[0,2],[0,3],[0,4],[1,1],[1,2],[1,3],[1,4],[2,1],[2,2],[2,3],[2,4]],1,.75) },
        { id:'fretting-boss', title:'Clean-Fret Boss', short:'Climb, cross & return', bpm:62, tag:'WORLD 5 BOSS', headline:'Clean notes before fast notes', lesson:'Combine climbs, string changes and the return trip. If a note buzzes, slow down and place the fingertip closer to the fret.', hint:'Relaxed thumb, curved fingers, small lifts.', notes:seq([[0,1],[0,2],[0,3],[0,4],[1,1],[1,2],[1,3],[1,4],[2,4],[2,3],[2,2],[2,1],[1,4],[1,3],[1,2],[1,1],[0,4],[0,3],[0,2],[0,1]],1,.75) }
      ]
    },
    {
      id:'riff-workshop', number:6, title:'Riff Workshop', subtitle:'Turn small patterns into music you can remember',
      levels:[
        { id:'two-note-phrase', title:'Two-Note Phrase', short:'Repeat 0–3', bpm:66, tag:'RIFF WORKSHOP', headline:'A riff is a pattern', lesson:'Play the two-note idea four times. Look for the repeating shape instead of reading every block as a brand-new problem.', hint:'See the pair: open, three.', notes:seq([[0,0],[0,3],[0,0],[0,3],[0,0],[0,3],[0,0],[0,3]]) },
        { id:'three-note-phrase', title:'Three-Note Phrase', short:'Chunk three notes', bpm:68, tag:'RIFF WORKSHOP', headline:'Remember a small chunk', lesson:'The phrase is open E, third fret E, open A. Say the string and fret once, then try to feel the repeated shape.', hint:'E0 · E3 · A0, then repeat.', notes:seq([[0,0],[0,3],[1,0],[0,0],[0,3],[1,0],[0,0],[0,3],[1,0],[0,0],[0,3],[1,0]]) },
        { id:'position-shift', title:'Position Shift', short:'Move 2 ↔ 5', bpm:62, tag:'RIFF WORKSHOP', headline:'Move the hand, not just the finger', lesson:'When the riff moves from fret 2 to fret 5, release pressure and slide the hand into the new area. Land first, then press.', hint:'Release, move, land, press.', notes:seq([[1,2],[1,2],[1,5],[1,5],[1,2],[1,5],[0,3],[0,5],[1,2],[1,5]]) },
        { id:'cross-string-riff', title:'Cross-String Riff', short:'Follow a repeating shape', bpm:72, tag:'RIFF WORKSHOP', headline:'Let both hands travel together', lesson:'This phrase crosses E, A and D. Keep the pick close to the strings and read one note ahead before each change.', hint:'Eyes lead; both hands follow.', notes:seq([[0,0],[0,3],[1,0],[1,2],[2,0],[1,2],[0,3],[0,0],[0,0],[1,2],[2,2],[1,0]]) },
        { id:'riff-boss', title:'Riff Builder Boss', short:'Learn a longer phrase', bpm:76, tag:'WORLD 6 BOSS', headline:'Build it from chunks', lesson:'Treat this as four small phrases, not one giant line. After a miss, jump back into the next phrase instead of restarting in your head.', hint:'Chunk it: four notes at a time.', notes:seq([[0,0],[0,3],[1,0],[1,2],[0,5],[0,3],[1,2],[1,0],[2,0],[2,2],[1,2],[0,3],[0,0],[1,0],[1,3],[2,2],[1,2],[0,5],[0,3],[0,0]]) }
      ]
    },
    {
      id:'song-ready', number:7, title:'Song Ready', subtitle:'Practice the habits that make full songs possible',
      levels:[
        { id:'steady-minute', title:'Steady Stamina', short:'A longer clean run', bpm:68, tag:'SONG READY', headline:'Relaxation creates endurance', lesson:'This run is longer on purpose. Check your shoulders, loosen your grip and use tiny pick strokes so you do not tense up halfway through.', hint:'Loose shoulders. Light grip. Keep breathing.', notes:seq([[0,0],[0,3],[1,0],[1,2],[0,0],[0,3],[1,0],[1,2],[0,0],[0,3],[1,0],[1,2],[2,0],[2,2],[1,0],[1,2],[2,0],[2,2],[1,0],[0,3],[0,0],[1,0],[1,2],[0,3]]) },
        { id:'read-ahead', title:'Read Ahead', short:'Watch the next change', bpm:74, tag:'SONG READY', headline:'Your eyes should arrive first', lesson:'Keep your eyes one or two blocks ahead of what your hands are playing. This gives your hands time to prepare for string changes.', hint:'Play this note; look at the next one.', notes:seq([[0,0],[1,2],[2,0],[0,3],[1,0],[2,2],[3,0],[1,3],[0,5],[2,0],[1,2],[3,2],[2,2],[1,0],[0,3],[0,0]]) },
        { id:'recover-the-beat', title:'Recover the Beat', short:'Rejoin after rests', bpm:72, tag:'SONG READY', headline:'Mistakes do not stop the song', lesson:'Songs keep going when you miss. Use each gap to find the count, look ahead and join on the next clear note.', hint:'Do not chase missed notes—catch the next one.', notes:timed([[0,0,1],[0,3,1.5],[1,0,2],[1,2,2.5],[0,0,4],[1,0,5],[2,0,6],[1,2,6.5],[0,3,8],[0,5,8.5],[1,3,9],[1,2,9.5],[2,0,11],[1,0,12],[0,3,13],[0,0,13.5]]) },
        { id:'section-practice', title:'Song Section', short:'Repeat a 4-bar idea', bpm:78, tag:'SONG READY', headline:'Practice sections, not whole songs', lesson:'Real songs become manageable when you loop a short section. Notice the same phrase returning and try to improve each repeat.', hint:'One section, four better attempts.', notes:seq([[0,0],[0,3],[1,0],[1,2],[0,5],[0,3],[1,0],[0,0],[0,0],[0,3],[1,0],[1,2],[0,5],[0,3],[1,0],[0,0],[0,0],[0,3],[1,0],[1,2],[0,5],[0,3],[1,0],[0,0]]) },
        { id:'first-set-boss', title:'First Set', short:'Everything together', bpm:80, tag:'WORLD 7 BOSS', headline:'You are ready to train on songs', lesson:'Use everything you have practiced: count, read ahead, stay loose, recognize chunks and recover after a miss. Finishing calmly is the win.', hint:'Keep going. The next note matters most.', notes:timed([[0,0,1],[0,3,1.5],[1,0,2],[1,2,2.5],[0,5,3],[0,3,3.5],[1,0,4],[0,0,5],[2,0,6],[2,2,6.5],[1,2,7],[0,3,7.5],[0,0,9],[1,0,10],[2,0,11],[3,0,12],[3,2,12.5],[2,2,13],[1,2,13.5],[0,3,14],[0,0,15],[0,3,15.5],[1,0,16],[1,2,16.5],[0,5,17],[1,3,17.5],[2,2,18],[1,2,18.5],[0,3,19],[0,0,20]]) }
      ]
    },
    {
      id:'player-foundations', number:8, title:'Player Foundations', subtitle:'Posture, pick control, tuning and clean first notes',
      levels:[
        { id:'hold-and-pick', title:'Hold & Pick', short:'Relaxed setup', bpm:54, tag:'PLAYER FOUNDATIONS', headline:'Set up without fighting the guitar', lesson:'Sit tall, relax both shoulders and rest the guitar securely. Hold the pick between thumb and index finger with only the tip showing, then make tiny down-strokes.', hint:'Loose shoulder · light pick grip · small motion.', notes:seq([[0,0],[0,0],[1,0],[1,0],[2,0],[2,0]]) },
        { id:'string-names', title:'String Names', short:'E A D G B e', bpm:56, tag:'PLAYER FOUNDATIONS', headline:'Know all six strings', lesson:'From thickest to thinnest the strings are E, A, D, G, B, e. Follow each colour across the highway and say its name before you pick.', hint:'Thick to thin: E A D G B e.', notes:seq([[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[5,0],[4,0],[3,0],[2,0],[1,0],[0,0]]) },
        { id:'tuning-check', title:'Tuning Check', short:'Match the open notes', bpm:52, tag:'PLAYER FOUNDATIONS', headline:'Tune before practice', lesson:'Use the Tuner in Tools before starting. Each open string should settle on E2, A2, D3, G3, B3 or E4, then play this slow check.', hint:'Tune first. Turn the peg in tiny amounts.', notes:seq([[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]],1,2) },
        { id:'clean-pressure', title:'Clean Pressure', short:'Fret without squeezing', bpm:54, tag:'PLAYER FOUNDATIONS', headline:'Use only the pressure you need', lesson:'Curve the fingertip and place it just behind the fret wire. If it buzzes, move closer to the wire before squeezing harder.', hint:'Close behind the wire; thumb relaxed.', notes:seq([[0,1],[0,2],[1,1],[1,2],[2,1],[2,2]],1,1.5) },
        { id:'foundation-boss', title:'Ready Position', short:'Set up and play clean', bpm:60, tag:'WORLD 8 BOSS', headline:'Good habits make playing easier', lesson:'Check posture, pick grip and tuning, then play across every string with clean open and fretted notes.', hint:'Stop and reset if your hands become tense.', notes:seq([[0,0],[0,2],[1,0],[1,2],[2,0],[2,2],[3,0],[3,2],[4,0],[4,1],[5,0],[5,1]]) }
      ]
    },
    {
      id:'chords-strumming', number:9, title:'Chords & Strumming', subtitle:'Power-chord shapes, changes and steady strums',
      levels:[
        { id:'first-power-chord', title:'First Power Chord', short:'E5 shape', bpm:56, tag:'CHORDS & STRUMMING', headline:'Two notes move as one shape', lesson:'Play open low E and fret 2 on the A string together. Keep the other strings quiet. The highway stacks chord notes at the same play line.', hint:'E open + A fret 2.', notes:chordSeq([[[0,0],[1,2]],[[0,0],[1,2]],[[0,0],[1,2]],[[0,0],[1,2]]]) },
        { id:'moving-power-chord', title:'Moving Power Chord', short:'E5 to G5 to A5', bpm:58, tag:'CHORDS & STRUMMING', headline:'Keep the shape together', lesson:'Move the same two-fret power-chord relationship up the neck. Release pressure while moving, land both fingers, then strum.', hint:'Move the whole hand; do not stretch from behind.', notes:chordSeq([[[0,0],[1,2]],[[0,3],[1,5]],[[0,5],[1,7]],[[0,3],[1,5]],[[0,0],[1,2]]]) },
        { id:'open-chord-change', title:'Open Chord Change', short:'Em to A', bpm:52, tag:'CHORDS & STRUMMING', headline:'Change shapes on the beat', lesson:'Form Em, strum, release, then form A. The mic scores an anchor note while the full coloured shape shows what both hands should play.', hint:'Move slowly enough to land every finger together.', notes:chordSeq([[[0,0],[1,2],[2,2],[3,0],[4,0],[5,0]],[[1,0],[2,2],[3,2],[4,2],[5,0]],[[0,0],[1,2],[2,2],[3,0],[4,0],[5,0]],[[1,0],[2,2],[3,2],[4,2],[5,0]]],1,3) },
        { id:'down-up-strum', title:'Down-Up Strum', short:'1 & 2 & 3 & 4 &', bpm:58, tag:'CHORDS & STRUMMING', headline:'Keep the strumming hand moving', lesson:'Strum down on the numbers and up on each “and.” Keep the hand swinging even when a future pattern skips a strum.', hint:'Down on numbers · up on “and”.', notes:chordSeq(Array(8).fill([[0,0],[1,2],[2,2],[3,0],[4,0],[5,0]]),1,.5) },
        { id:'chord-groove-boss', title:'Garage Groove', short:'Power chords & strumming', bpm:64, tag:'WORLD 9 BOSS', headline:'Make the changes feel musical', lesson:'Hold a steady pulse while the chord shape moves. A clean change that stays in time matters more than a rushed perfect shape.', hint:'Keep the beat moving through every change.', notes:chordSeq([[[0,0],[1,2]],[[0,0],[1,2]],[[0,3],[1,5]],[[0,3],[1,5]],[[0,5],[1,7]],[[0,5],[1,7]],[[0,3],[1,5]],[[0,0],[1,2]]],1,1) }
      ]
    },
    {
      id:'guitar-techniques', number:10, title:'Guitar Techniques', subtitle:'Slides, legato, palm muting and expressive notes',
      levels:[
        { id:'slide-start', title:'Slides', short:'3 into 5', bpm:56, tag:'GUITAR TECHNIQUES', headline:'Keep contact while the note moves', lesson:'Pick fret 3, keep light pressure and slide the same finger to fret 5. The SLIDE badge shows the movement.', hint:'Pick once, slide smoothly, arrive on time.', notes:timed([[0,3,1],[0,5,2],[1,3,4],[1,5,5]]).map((n,i)=>({ ...n, technique:i%2===0?'SLIDE':'', duration:1 })) },
        { id:'hammer-on-start', title:'Hammer-Ons', short:'5h7', bpm:54, tag:'GUITAR TECHNIQUES', headline:'Make the second note with the fretting hand', lesson:'Pick fret 5, then hammer another finger firmly onto fret 7 without picking again. Keep the first finger planted.', hint:'One pick; two clear notes.', notes:timed([[0,5,1],[0,7,2],[1,5,4],[1,7,5]]).map((n,i)=>({ ...n, technique:i%2===0?'H':'', duration:1 })) },
        { id:'pull-off-start', title:'Pull-Offs', short:'7p5', bpm:54, tag:'GUITAR TECHNIQUES', headline:'Release into the lower note', lesson:'Start with fingers on frets 5 and 7. Pick fret 7, then lightly pull that finger away so fret 5 rings.', hint:'A small sideways release makes the second note speak.', notes:timed([[0,7,1],[0,5,2],[1,7,4],[1,5,5]]).map((n,i)=>({ ...n, technique:i%2===0?'P':'', duration:1 })) },
        { id:'palm-mute-start', title:'Palm Muting', short:'Tight low-E pulse', bpm:64, tag:'GUITAR TECHNIQUES', headline:'Rest the picking-hand edge near the bridge', lesson:'Lightly touch the strings beside the bridge with the edge of your palm. The notes should sound short and chunky, not completely dead.', hint:'Move toward the bridge if the note disappears.', notes:seq([[0,0],[0,0],[0,3],[0,3],[0,5],[0,5],[0,3],[0,0]],1,.5).map(n=>({ ...n, technique:'PM', duration:.35 })) },
        { id:'technique-boss', title:'Technique Riff', short:'Slide, legato & mute', bpm:68, tag:'WORLD 10 BOSS', headline:'Use technique to shape the riff', lesson:'Follow the badges and combine palm-muted picking, a slide, hammer-on and pull-off in one original practice riff.', hint:'Learn one pair at a time, then connect them.', notes:[{string:0,fret:0,beat:1,technique:'PM',duration:.4},{string:0,fret:0,beat:1.5,technique:'PM',duration:.4},{string:0,fret:3,beat:2,technique:'SLIDE',duration:1},{string:0,fret:5,beat:3},{string:1,fret:5,beat:4,technique:'H',duration:1},{string:1,fret:7,beat:5},{string:1,fret:7,beat:6,technique:'P',duration:1},{string:1,fret:5,beat:7},{string:0,fret:3,beat:8},{string:0,fret:0,beat:9,technique:'PM',duration:1}] }
      ]
    }
  ];

  const flatLevels = worlds.flatMap(w => w.levels.map((l, i) => ({ ...l, worldId:w.id, worldNumber:w.number, worldTitle:w.title, worldIndex:worlds.indexOf(w), levelIndex:i })));

  const achievements = [
    { icon:'🎸', title:'First Note', text:'Hit your first note', test:s => s.totalHits >= 1 },
    { icon:'⭐', title:'First Star', text:'Earn your first mission star', test:s => totalStars(s) >= 1 },
    { icon:'🔥', title:'On Fire', text:'Reach a 10-note combo', test:s => s.bestCombo >= 10 },
    { icon:'🎯', title:'Bullseye', text:'Finish a mission at 90%+', test:s => s.bestAccuracy >= 90 },
    { icon:'🏁', title:'Tab Decoder', text:'Clear World 1', test:s => worldCleared(0, s) },
    { icon:'⚡', title:'Riff Runner', text:'Clear World 2', test:s => worldCleared(1, s) },
    { icon:'🗺️', title:'Fretboard Explorer', text:'Clear World 3', test:s => worldCleared(2, s) },
    { icon:'🥁', title:'Rhythm Keeper', text:'Clear World 4', test:s => worldCleared(3, s) },
    { icon:'🖐️', title:'Clean Fingers', text:'Clear World 5', test:s => worldCleared(4, s) },
    { icon:'🧩', title:'Riff Builder', text:'Clear World 6', test:s => worldCleared(5, s) },
    { icon:'🚀', title:'Song Ready', text:'Clear World 7', test:s => worldCleared(6, s) },
    { icon:'🤘', title:'Ready Position', text:'Clear Player Foundations', test:s => worldCleared(7, s) },
    { icon:'🔊', title:'Chord Driver', text:'Clear Chords & Strumming', test:s => worldCleared(8, s) },
    { icon:'✨', title:'Technique Starter', text:'Clear Guitar Techniques', test:s => worldCleared(9, s) },
    { icon:'💯', title:'Century Club', text:'Hit 100 notes', test:s => s.totalHits >= 100 }
  ];

  let state = loadProgress();
  let dbPromise = null;
  let currentSong = null;
  let alphaApi = null;
  let loadedSongScore = null;
  let loadedSongTracks = [];
  let songLevelSpec = null;
  let alphaPlayerReady = false;
  let mutedBackingTrack = null;
  let deferredInstallPrompt = null;
  let metronomeTimer = null;
  let metronomeBeat = 0;
  let bpm = 80;
  let tunerActive = false;
  let selectedDeviceId = '';
  let game = null;
  let feedbackTimer = null;
  let tabCurrentIndex = -1;
  let inputChallengeHits = new Set();
  let inputCalibration = null;
  let dailyPractice = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const audio = createAudioEngine();
  window.FMQGuitarAudio = audio;

  // Piano has its own detector. Stop Guitar listening before entering Piano so
  // two microphone pipelines never compete; Guitar behavior otherwise stays unchanged.
  window.addEventListener('music-app:leave-guitar', () => {
    if (audio.active) audio.stop();
    tunerActive = false;
    $('#inputToggle').textContent = 'Enable Guitar Input';
    $('#tunerToggle').textContent = 'Start Tuner';
  });
  window.addEventListener('family-music:profile-changing', stopForProfileChange);
  window.addEventListener('family-music:profile-changed', reloadActiveProfile);

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Always boot into the normal app shell; CSS also honors [hidden].
    $('#gameScreen').hidden = true;
    $('#resultScreen').hidden = true;
    bindNavigation();
    bindGameControls();
    bindInput();
    bindSongImport();
    bindMetronome();
    bindTuner();
    bindProgress();
    bindPwaInstall();
    renderWorldMap();
    renderTabLessons();
    renderChords();
    renderInputChallenges();
    updateStats();
    refreshSongs();
    updateNetworkBadge();
    registerServiceWorker();
    audio.subscribe(handleAudioFrame);
    applySavedInputSettings();
  }

  function defaultState() {
    return { xp:0, stars:{}, songBest:{}, levelRuns:{}, levelDensity:{}, totalHits:0, totalMisses:0, bestCombo:0, bestAccuracy:0, practiceSeconds:0, practiceDays:{}, missionsPlayed:0, songRuns:0, skillModel:window.FMQPracticeIntelligence?.emptySkillModel?.()||null, settings:{ gameView:'highway', noteDensity:1, adaptiveDifficulty:true, noiseGate:.018, inputDeviceId:'', calibrated:false } };
  }

  function loadProgress() {
    const base = defaultState();
    try {
      const saved = window.FMQProfiles?.getInstrumentProgress('guitar');
      if (saved && typeof saved === 'object') return { ...base, ...saved, stars:saved.stars || {}, songBest:saved.songBest || {}, levelRuns:saved.levelRuns || {}, levelDensity:saved.levelDensity || {}, practiceDays:saved.practiceDays || {}, settings:{ ...base.settings, ...(saved.settings || {}) } };
    } catch {}
    return base;
  }

  function saveProgress() {
    window.FMQProfiles?.saveInstrumentProgress('guitar', state);
    updateStats();
  }

  function stopForProfileChange() {
    stopGameLoop();
    if (audio.active) audio.stop();
    if (metronomeTimer) stopMetronome();
    tunerActive = false;
    dailyPractice = null;
    closePlayer();
    $('#gameScreen').hidden = true;
    $('#resultScreen').hidden = true;
  }

  function reloadActiveProfile() {
    state = loadProgress();
    applySavedInputSettings();
    renderWorldMap();
    renderAchievements();
    updateStats();
    showView('play');
  }

  function bindNavigation() {
    $$('[data-view-target]').forEach(el => el.addEventListener('click', () => showView(el.dataset.viewTarget)));
  }

  function showView(name) {
    if (!name) return;
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
    $$('.nav-button').forEach(b => b.classList.toggle('active', b.dataset.viewTarget === name));
    window.scrollTo({ top:0, behavior:'smooth' });
    if (name === 'progress') renderAchievements();
  }

  function renderTabLessons() {
    const grid = $('#tabLessonGrid');
    grid.innerHTML = TAB_LESSONS.map((lesson, i) => `<article class="tab-lesson-card" style="--lesson-string:${STRING_INFO[i % 6].color}"><div class="tab-lesson-icon">${lesson.icon}</div><div><h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(lesson.text)}</p><div class="tab-example"><pre>${escapeHtml(lesson.tab)}</pre><span>${escapeHtml(lesson.fret)}</span></div></div><button class="button secondary" data-tab-exercise="${Math.min(i, 14)}">Try it</button></article>`).join('');
    $$('[data-tab-exercise]', grid).forEach(button => button.addEventListener('click', () => {
      setGameView('tab');
      launchLevel(flatLevels[Number(button.dataset.tabExercise)]?.id || 'zero-open', true);
    }));
    $('#startTabCourse').addEventListener('click', () => {
      setGameView('tab');
      launchLevel('zero-open', true);
    });
  }

  function renderWorldMap() {
    const map = $('#worldMap');
    map.innerHTML = worlds.map((world, wi) => {
      const missionCards = world.levels.map(level => {
        const flatIndex = flatLevels.findIndex(l => l.id === level.id);
        const unlocked = isLevelUnlocked(flatIndex);
        const stars = Number(state.stars[level.id] || 0);
        const current = flatIndex === nextLevelIndex();
        return `<button class="mission-card ${stars ? 'complete' : ''} ${current ? 'current' : ''}" data-level-id="${level.id}" ${unlocked ? '' : 'disabled'}>
          <span class="mission-num">MISSION ${flatIndex + 1}</span>
          <strong>${escapeHtml(level.title)}</strong>
          <small>${escapeHtml(level.short)}</small>
          <span class="mission-stars">${starsText(stars)}</span>
        </button>`;
      }).join('');
      return `<section class="world ${wi > 0 && !isLevelUnlocked(worldStartIndex(wi)) ? 'locked-world' : ''}">
        <div class="world-head"><div><p class="eyebrow">WORLD ${world.number}</p><h3>${escapeHtml(world.title)}</h3><span>${escapeHtml(world.subtitle)}</span></div><span>${worldStars(wi)} / ${world.levels.length * 3} stars</span></div>
        <div class="mission-row">${missionCards}</div>
      </section>`;
    }).join('');
    $$('[data-level-id]', map).forEach(btn => btn.addEventListener('click', () => launchLevel(btn.dataset.levelId)));
  }

  function worldStartIndex(worldIndex) {
    let n = 0;
    for (let i = 0; i < worldIndex; i++) n += worlds[i].levels.length;
    return n;
  }

  function isLevelUnlocked(index) {
    if (index <= 0) return true;
    if (flatLevels[index]?.id === 'hold-and-pick') return true;
    const prev = flatLevels[index - 1];
    return Number(state.stars[prev.id] || 0) >= 1;
  }

  function nextLevelIndex() {
    const idx = flatLevels.findIndex((level, i) => isLevelUnlocked(i) && Number(state.stars[level.id] || 0) < 1);
    return idx >= 0 ? idx : flatLevels.length - 1;
  }

  function worldStars(worldIndex) {
    return worlds[worldIndex].levels.reduce((n, l) => n + Number(state.stars[l.id] || 0), 0);
  }

  function totalStars(s = state) {
    return Object.values(s.stars || {}).reduce((n, v) => n + Number(v || 0), 0);
  }

  function worldCleared(worldIndex, s = state) {
    return worlds[worldIndex].levels.every(l => Number(s.stars?.[l.id] || 0) >= 1);
  }

  function starsText(n) {
    return `${'★'.repeat(n)}${'☆'.repeat(3 - n)}`;
  }

  function bindGameControls() {
    $('#startDailyPractice').addEventListener('click', startDailyPractice);
    $('#continueMission').addEventListener('click', () => launchLevel(state.missionsPlayed === 0 && !state.stars['hold-and-pick'] ? 'hold-and-pick' : flatLevels[nextLevelIndex()].id));
    $('#startFoundations').addEventListener('click', () => {
      const foundation = worlds.find(world => world.id === 'player-foundations');
      const next = foundation?.levels.find(level => Number(state.stars[level.id] || 0) < 1) || foundation?.levels[0];
      launchLevel(next?.id || 'hold-and-pick');
    });
    $('#exitGame').addEventListener('click', exitGame);
    $('#gameStart').addEventListener('click', startMission);
    $('#gamePause').addEventListener('click', togglePause);
    $('#gameLoopStart').addEventListener('click', () => setGuitarLoopPoint('start'));
    $('#gameLoopEnd').addEventListener('click', () => setGuitarLoopPoint('end'));
    $('#gameCountIn').addEventListener('change', e => {
      state.settings = { ...(state.settings || {}), countIn:Boolean(e.target.checked) };
      saveProgress();
    });
    $('#gameLoop').addEventListener('click', () => {
      if (!game) return;
      game.loop = !game.loop;
      $('#gameLoop').textContent = game.loop ? '↻ Loop On' : '↻ Loop Off';
      $('#gameLoop').setAttribute('aria-pressed', String(game.loop));
      if (game.loop && game.running) restartPracticeLoop();
    });
    $('#showNoteHighway').addEventListener('click', () => setGameView('highway'));
    $('#showTabHighway').addEventListener('click', () => setGameView('tab'));
    $('#gameNoteDensity').addEventListener('change', e => {
      const chosen = Number(e.target.value) || 1;
      state.settings = { ...(state.settings || {}), noteDensity:chosen };
      if (game?.practiceKey) state.levelDensity[game.practiceKey] = chosen;
      saveProgress();
      if (game?.level) launchLevel(game.level, true);
    });
    $('#gameAdaptive').addEventListener('change', e => {
      state.settings = { ...(state.settings || {}), adaptiveDifficulty:Boolean(e.target.checked) };
      saveProgress();
    });
    $('#retryLevel').addEventListener('click', () => {
      $('#resultScreen').hidden = true;
      if (game?.mode === 'song' && game.level) launchLevel(game.level);
      else launchLevel(game?.level?.id || flatLevels[nextLevelIndex()].id);
    });
    $('#nextLevel').addEventListener('click', () => {
      $('#resultScreen').hidden = true;
      if (dailyPractice && dailyPractice.index < dailyPractice.levelIds.length - 1) {
        dailyPractice.index++;
        launchLevel(dailyPractice.levelIds[dailyPractice.index], true);
        return;
      }
      if (dailyPractice) dailyPractice = null;
      if (game?.mode === 'song') {
        launchNextSongSection();
        return;
      }
      const currentIndex = game ? flatLevels.findIndex(l => l.id === game.level.id) : nextLevelIndex();
      const next = Math.min(flatLevels.length - 1, currentIndex + 1);
      launchLevel(flatLevels[next].id);
    });
    $('#backToMap').addEventListener('click', () => {
      dailyPractice = null;
      $('#resultScreen').hidden = true;
      $('#gameScreen').hidden = true;
      if (game?.mode === 'song') {
        showView('songs');
      } else {
        renderWorldMap();
        showView('play');
      }
    });
  }

  function startDailyPractice() {
    const next = flatLevels[nextLevelIndex()]?.id || 'zero-open';
    const review = flatLevels.find((level, index) => isLevelUnlocked(index) && Number(state.stars[level.id] || 0) < 2 && level.id !== next)?.id || 'clean-pressure';
    dailyPractice = { index:0, levelIds:['hold-and-pick', review, next].filter((id, i, all) => id && all.indexOf(id) === i) };
    launchLevel(dailyPractice.levelIds[0], true);
  }

  function setGameView(view) {
    const next = view === 'tab' ? 'tab' : 'highway';
    state.settings = { ...(state.settings || {}), gameView:next };
    saveProgress();
    $('#gameScreen').classList.toggle('tab-mode', next === 'tab');
    $('#showNoteHighway').classList.toggle('active', next === 'highway');
    $('#showTabHighway').classList.toggle('active', next === 'tab');
  }

  function launchLevel(levelOrId, freePractice = false) {
    const isSongLevel = levelOrId && typeof levelOrId === 'object';
    const level = isSongLevel ? levelOrId : flatLevels.find(l => l.id === levelOrId);
    if (!level) return;
    if (!freePractice && !isSongLevel && !isLevelUnlocked(flatLevels.findIndex(l => l.id === level.id))) {
      toast('Earn a star on the previous mission first.');
      return;
    }
    stopGameLoop();
    $('#gameScreen').classList.remove('playing');
    const stringInfo = level.stringInfo || STRING_INFO;
    const secondsPerBeat = 60 / Math.max(20, Number(level.bpm) || 80);
    const practiceKey = levelPracticeKey(level);
    const density = Math.max(.5, Math.min(1, Number(state.levelDensity?.[practiceKey] ?? state.settings?.noteDensity) || 1));
    const sourceNotes = density >= 1 ? level.notes : level.notes.filter((_, i) => i === 0 || Math.floor((i + 1) * density) > Math.floor(i * density));
    const events = sourceNotes.map((n, i) => ({
      ...n,
      index:i,
      time:Number.isFinite(n.time) ? n.time : n.beat * secondsPerBeat,
      clock:level.mode === 'song' && level.songSpec?.backingEnabled && Number.isFinite(n.tick)
        ? n.tick - Number(level.sectionStartTick || 0)
        : (Number.isFinite(n.time) ? n.time : n.beat * secondsPerBeat),
      durationClock:level.mode === 'song' && level.songSpec?.backingEnabled
        ? Math.max(0, Number(n.durationTicks) || 0)
        : Math.max(0, Number(n.duration) || (Number(n.durationTicks) || 0) / 960) * secondsPerBeat,
      midi:Number.isFinite(n.midi) ? n.midi : (stringInfo[n.string]?.openMidi ?? STRING_INFO[n.string]?.openMidi ?? 40) + n.fret,
      status:'pending',
      element:null,
      elements:[]
    })).sort((a,b) => a.clock - b.clock).map((e, i) => ({ ...e, index:i }));
    if (!events.length) {
      toast('This section has no playable guitar notes.');
      return;
    }
    game = {
      mode:level.mode || 'mission',
      level,
      practiceKey,
      density,
      stringInfo,
      events,
      running:false,
      paused:false,
      startPerf:0,
      songClockTick:0,
      songTempo:Number(level.bpm) || 80,
      pausedAt:0,
      raf:0,
      hits:0,
      misses:0,
      combo:0,
      bestCombo:0,
      score:0,
      loop:false,
      loopStart:0,
      loopEnd:null,
      restartingLoop:false,
      startToken:0,
      listenOnly:Boolean(level.listenOnly),
      lastWrongFeedback:0,
      lastAcceptedPitchClass:null,
      lastAcceptedEvent:-1,
      tabWindowStart:0,
      fretWindowStart:1,
      startedAtDate:Date.now(),
      endTime:(events.at(-1)?.time || 0) + 1.2,
      endClock:Number(level.sectionEndTick) > Number(level.sectionStartTick)
        ? Number(level.sectionEndTick) - Number(level.sectionStartTick)
        : null
    };
    tabCurrentIndex = -1;
    $('#gameScreen').hidden = false;
    setGameView(state.settings?.gameView || 'highway');
    $('#resultScreen').hidden = true;
    $('#gameStart').hidden = false;
    $('#gameNoteDensity').value = String(density);
    $('#gameAdaptive').checked = state.settings?.adaptiveDifficulty !== false;
    $('#resultEyebrow').textContent = game.mode === 'song' ? 'SONG SECTION COMPLETE' : 'MISSION COMPLETE';
    $('#backToMap').textContent = game.mode === 'song' ? 'Back to Song' : 'Mission Map';
    $('#gameWorldLabel').textContent = game.mode === 'song'
      ? `SONG LEVEL · ${String(level.trackName || 'GUITAR').toUpperCase()}`
      : `WORLD ${level.worldNumber} · ${level.worldTitle.toUpperCase()}`;
    $('#gameLevelTitle').textContent = level.title;
    $('#gameLessonTag').textContent = level.tag;
    $('#gameLessonHeadline').textContent = level.headline;
    $('#gameLessonText').textContent = level.lesson;
    $('#tabHint').textContent = level.hint;
    $('#gameStart').textContent = audio.active ? (game.mode === 'song' ? 'Start Song Level' : 'Start Mission') : 'Enable Guitar & Start';
    $('#gameStart').disabled = false;
    $('#gamePause').disabled = true;
    $('#gamePause').textContent = 'Pause';
    $('#gameLoop').textContent = '↻ Loop Off';
    $('#gameLoop').setAttribute('aria-pressed', 'false');
    $('#gameCountIn').checked = state.settings?.countIn !== false;
    $('#gameLoopStart').hidden = $('#gameLoopEnd').hidden = game.mode !== 'song';
    $('#gameLoopStart').textContent = 'A · Start';
    $('#gameLoopEnd').textContent = 'B · End';
    $('#gameScore').textContent = '0';
    $('#gameAccuracy').textContent = '100%';
    $('#gameCombo').textContent = '0';
    $('#gameHearing').textContent = audio.lastResult?.note || '—';
    $('#nextNoteText').textContent = formatExpected(events[0]);
    $('#gameProgressBar').style.width = '0%';
    renderStringLabels();
    renderLiveTab();
    renderGameNotes();
    updateGameBoard(0);
  }

  function levelPracticeKey(level) {
    return level?.mode === 'song' ? level.songKey || level.id || level.title : level?.id || level?.title || 'practice';
  }

  async function startMission() {
    if (!game || game.running) return;
    const startingGame = game;
    const startToken = ++game.startToken;
    $('#gameStart').disabled = true;
    $('#gameStart').textContent = 'Getting input…';
    try {
      if (!game.listenOnly && !audio.active) await startAudioInput(selectedDeviceId);
      $('#gameScreen').classList.add('playing');
      if (state.settings?.countIn !== false) await runCountdown(game.songTempo, game.level?.songSpec?.speed || 1);
      if (game !== startingGame || startToken !== game.startToken || !$('#gameScreen').classList.contains('playing')) return;
      if (usesSongBackingClock()) {
        configureSongBacking(game.level);
        if (!alphaApi.play()) throw new Error('Backing player is not ready yet.');
      }
      game.running = true;
      game.startPerf = performance.now();
      game.paused = false;
      $('#gameStart').hidden = true;
      $('#gamePause').disabled = false;
      game.raf = requestAnimationFrame(gameLoop);
    } catch (err) {
      console.error(err);
      $('#gameScreen').classList.remove('playing');
      $('#gameStart').disabled = false;
      $('#gameStart').textContent = 'Try Guitar Input Again';
      toast('I could not access the guitar input. Check Chrome microphone permission.');
    }
  }

  function runCountdown(bpm = 80, speed = 1) {
    return new Promise(resolve => {
      const el = $('#countdown');
      el.hidden = false;
      const steps = ['3','2','1','GO!'];
      let i = 0;
      el.textContent = steps[i];
      clickSound(true);
      const timer = setInterval(() => {
        i++;
        if (i >= steps.length) {
          clearInterval(timer);
          el.hidden = true;
          resolve();
          return;
        }
        el.textContent = steps[i];
        clickSound(i === steps.length - 1);
      }, window.FMQPracticeTools?.beatMilliseconds(bpm, speed) || 750);
    });
  }

  function gameLoop(now) {
    if (!game?.running) return;
    if (game.paused) {
      game.raf = requestAnimationFrame(gameLoop);
      return;
    }
    const t = currentGameClock(now);
    updateGameBoard(t);
    markExpiredNotes(t);
    updateCurrentTab(t);
    const activeEvents = game.events.filter(ev => ev.status !== 'skipped');
    const total = activeEvents.length;
    const done = activeEvents.filter(ev => ev.status === 'hit' || ev.status === 'miss').length;
    $('#gameProgressBar').style.width = `${Math.min(100, (done / total) * 100)}%`;
    const endClock = game.loop && Number.isFinite(game.loopEnd)
      ? game.loopEnd
      : usesSongBackingClock() ? (game.endClock ?? game.events.at(-1)?.clock) : game.endTime;
    if (t >= endClock && done >= total) {
      if (game.loop) {
        restartPracticeLoop();
        return;
      }
      finishMission();
      return;
    }
    game.raf = requestAnimationFrame(gameLoop);
  }

  async function restartPracticeLoop() {
    if (!game || game.restartingLoop) return;
    game.restartingLoop = true;
    const loopGame = game;
    game.running = false;
    cancelAnimationFrame(game.raf);
    if (usesSongBackingClock()) alphaApi?.pause?.();
    const start = Number.isFinite(game.loopStart) ? game.loopStart : 0;
    const end = Number.isFinite(game.loopEnd) ? game.loopEnd : (usesSongBackingClock() ? game.endClock : game.endTime);
    game.events.forEach(ev => {
      ev.status = ev.clock >= start && ev.clock <= end ? 'pending' : 'skipped';
      ev.elements.forEach(el => { el.classList.remove('hit','miss','demo'); el.hidden = true; });
    });
    game.hits = 0; game.misses = 0; game.combo = 0; game.score = 0; game.songClockTick = start;
    $$('.tab-cell.hit,.tab-cell.miss,.tab-cell.demo', $('#liveTab')).forEach(cell => cell.classList.remove('hit','miss','demo'));
    updateGameHud();
    if (state.settings?.countIn !== false) await runCountdown(game.songTempo, game.level?.songSpec?.speed || 1);
    if (game !== loopGame || !$('#gameScreen').classList.contains('playing')) { loopGame.restartingLoop = false; return; }
    if (usesSongBackingClock()) {
      configureSongBacking(game.level);
      const absoluteStart = Number(game.level.sectionStartTick || 0) + start;
      alphaApi.tickPosition = absoluteStart;
      game.songClockTick = start;
      alphaApi.play();
    }
    game.startPerf = performance.now() - start * 1000;
    game.running = true;
    game.restartingLoop = false;
    game.raf = requestAnimationFrame(gameLoop);
  }

  function guitarLoopLimit() {
    return usesSongBackingClock() ? Number(game.endClock || game.events.at(-1)?.clock || 1) : Number(game.endTime || 1);
  }

  function guitarClockSeconds(value) {
    return usesSongBackingClock() ? value / gameClockWindows().unitsPerSecond : value;
  }

  function setGuitarLoopPoint(which) {
    if (!game || game.mode !== 'song') return;
    const current = Math.max(0, Math.min(guitarLoopLimit(), currentGameClock()));
    if (which === 'start') game.loopStart = current;
    else game.loopEnd = current;
    if (!Number.isFinite(game.loopEnd)) game.loopEnd = guitarLoopLimit();
    const minimum = gameClockWindows().unitsPerSecond;
    const valid = window.FMQPracticeTools?.validateLoop(game.loopStart, game.loopEnd, guitarLoopLimit(), minimum) || {start:game.loopStart,end:game.loopEnd};
    game.loopStart = valid.start; game.loopEnd = valid.end;
    const format = window.FMQPracticeTools?.formatPracticeTime || (n => `${Math.round(n)}s`);
    $('#gameLoopStart').textContent = `A · ${format(guitarClockSeconds(game.loopStart))}`;
    $('#gameLoopEnd').textContent = `B · ${format(guitarClockSeconds(game.loopEnd))}`;
    game.loop = true;
    $('#gameLoop').textContent = '↻ Loop On';
    $('#gameLoop').setAttribute('aria-pressed', 'true');
    if (game.running) restartPracticeLoop();
  }

  function updateGameBoard(t) {
    if (!game) return;
    const board = $('#gameBoard');
    const rect = board.getBoundingClientRect();
    const hitY = rect.height - 58;
    const spawnY = 48;
    const hitX = Math.max(118, rect.width * .16);
    const spawnX = rect.width - 44;
    const clock = gameClockWindows();
    updateFretWindow(t, clock.lookahead);
    renderBeatMarkers(t, clock, spawnY, hitY, hitX, spawnX);
    game.events.forEach(ev => {
      const dt = ev.clock - t;
      if (!ev.elements?.length) return;
      const inRange = dt <= clock.lookahead && dt >= -clock.expired;
      ev.elements.forEach(el => { el.hidden = !inRange; });
      if (!inRange) return;
      const progress = Math.max(0, Math.min(1.08, 1 - dt / clock.lookahead));
      const y = spawnY + progress * (hitY - spawnY);
      const flatView = $('#gameScreen').classList.contains('tab-mode');
      const scale = .58 + .42 * Math.min(1, progress);
      const sustainTravel = flatView ? hitY - spawnY : spawnX - hitX;
      const sustain = Math.min(flatView ? 110 : 190, Math.max(0, Number(ev.durationClock || 0) / clock.lookahead * sustainTravel));
      ev.elements.forEach(el => {
        const stringIndex = Number(el.dataset.stringIndex);
        const x = flatView
          ? rect.width * ((stringIndex + .5) / 6)
          : spawnX - progress * (spawnX - hitX);
        const laneTop = 58;
        const laneBottom = rect.height - 35;
        const laneY = laneTop + ((5 - stringIndex) + .5) / 6 * (laneBottom - laneTop);
        const stringOffset = flatView ? 0 : laneY - y;
        el.style.left = `${x}px`;
        el.style.top = `${y + stringOffset}px`;
        el.style.transform = `translate(-50%,-50%) scale(${scale})`;
        el.style.setProperty('--sustain-length', `${sustain}px`);
      });
    });
    const next = game.events.find(e => e.status === 'pending');
    $('#nextNoteText').textContent = next ? formatExpected(next) : 'Finish strong!';
    updateHighwayFocus(next);
  }

  function updateHighwayFocus(next) {
    if (!next) return;
    const shape = Array.isArray(next.chordNotes) && next.chordNotes.length ? next.chordNotes : [next];
    const activeStrings = new Set(shape.map(note => Number(note.string)));
    $$('.string-labels span').forEach(label => label.classList.toggle('active', activeStrings.has(Number(label.dataset.string))));
    const frets = eventFrets(next);
    $$('.fret-lane').forEach(lane => lane.classList.toggle('active', frets.includes(Number(lane.dataset.fret)) || (!frets.length && Number(lane.dataset.fret) === 0)));
    const info = game.stringInfo || STRING_INFO;
    const cue = shape.map(note => {
      const string = info[note.string] || STRING_INFO[note.string];
      return `${string?.name || `String ${6 - note.string}`} · ${Number(note.fret) === 0 ? 'OPEN' : `FRET ${note.fret}`}`;
    }).join('  +  ');
    $('#handPosition').classList.toggle('open-focus', !frets.length);
    $('#handPositionText').textContent = cue;
  }

  function eventFrets(ev) {
    const shape = Array.isArray(ev?.chordNotes) && ev.chordNotes.length ? ev.chordNotes : [ev];
    return shape.map(note => Number(note?.fret)).filter(fret => Number.isFinite(fret) && fret > 0);
  }

  function updateFretWindow(t, lookahead) {
    const upcoming = game.events.filter(ev => ev.status === 'pending' && ev.clock >= t - .15 * lookahead && ev.clock <= t + lookahead * .72);
    const frets = upcoming.flatMap(eventFrets);
    const anchor = frets.length ? Math.min(...frets) : 1;
    let nextStart = Math.max(1, anchor - 1);
    if (frets.length) {
      const max = Math.max(...frets);
      if (max - nextStart > 4) nextStart = Math.max(1, max - 4);
    }
    if (nextStart === game.fretWindowStart) return;
    game.fretWindowStart = nextStart;
    renderFretboard();
  }

  function renderFretboard() {
    if (!game) return;
    const start = Math.max(1, Number(game.fretWindowStart) || 1);
    const frets = [0, start, start + 1, start + 2, start + 3, start + 4];
    $('#laneBackground').innerHTML = frets.map((fret, i) => `<i class="fret-lane ${i === 0 ? 'open-lane' : ''}" data-fret="${fret}"><span>${i === 0 ? 'OPEN' : fret}</span></i>`).join('');
    $('#fretLabels').innerHTML = frets.map((fret, i) => `<span class="${i === 0 ? 'open-label' : ''}">${i === 0 ? '0 · OPEN' : `FRET ${fret}`}</span>`).join('');
    $('#handPositionText').textContent = `OPEN · ${start}–${start + 4}`;
  }

  function renderBeatMarkers(t, clock, spawnY, hitY, hitX, spawnX) {
    const layer = $('#beatLayer');
    if (!layer || !game) return;
    const unitsPerBeat = usesSongBackingClock() ? 960 : 60 / Math.max(20, Number(game.level?.bpm) || 80);
    const first = Math.ceil(t / unitsPerBeat) * unitsPerBeat;
    let markerIndex = 0;
    for (let beat = first, i = 0; beat <= t + clock.lookahead && i < 12; beat += unitsPerBeat, i++) {
      const progress = Math.max(0, Math.min(1, 1 - (beat - t) / clock.lookahead));
      const y = spawnY + progress * (hitY - spawnY);
      const width = 46 + 42 * progress;
      const sideways = !$('#gameScreen').classList.contains('tab-mode');
      const x = spawnX - progress * (spawnX - hitX);
      const beatNumber = Math.round(beat / unitsPerBeat);
      let marker = layer.children[markerIndex];
      if (!marker) {
        marker = document.createElement('i');
        layer.appendChild(marker);
      }
      marker.className = `beat-marker ${sideways ? 'sideways' : ''} ${beatNumber % 4 === 0 ? 'measure' : ''}`;
      marker.style.top = sideways ? '58px' : `${y}px`;
      marker.style.left = sideways ? `${x}px` : '50%';
      marker.style.width = sideways ? (beatNumber % 4 === 0 ? '3px' : '1px') : `${width}%`;
      marker.style.height = sideways ? `${Math.max(80, hitY - 38)}px` : (beatNumber % 4 === 0 ? '2px' : '1px');
      marker.hidden = false;
      markerIndex++;
    }
    Array.from(layer.children).slice(markerIndex).forEach(marker => { marker.hidden = true; });
  }

  function markExpiredNotes(t) {
    game.events.forEach(ev => {
      if (ev.status === 'pending' && game.listenOnly && t >= ev.clock) markDemo(ev);
      else if (ev.status === 'pending' && t > ev.clock + gameClockWindows().hit) markMiss(ev);
    });
  }

  function markDemo(ev) {
    ev.status = 'demo';
    game.hits++;
    ev.elements.forEach(el => el.classList.add('demo'));
    updateTabEvent(ev);
    updateGameHud();
  }

  function updateCurrentTab(t) {
    if (!game) return;
    let closest = -1;
    let closestDelta = Infinity;
    game.events.forEach(ev => {
      if (ev.status !== 'pending') return;
      const d = Math.abs(ev.clock - t);
      if (d < closestDelta) { closestDelta = d; closest = ev.index; }
    });
    if (closest === tabCurrentIndex) return;
    tabCurrentIndex = closest;
    if (closest >= 0 && (closest < game.tabWindowStart + 4 || closest >= game.tabWindowStart + 28)) {
      renderLiveTabWindow(Math.max(0, closest - 8));
    }
    $$('.tab-cell.current', $('#liveTab')).forEach(c => c.classList.remove('current'));
    if (closest >= 0) {
      $$(`[data-tab-col="${closest}"]`, $('#liveTab')).forEach(c => c.classList.add('current'));
      const target = $(`[data-tab-col="${closest}"]`, $('#liveTab'));
      target?.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
    }
  }

  function renderStringLabels() {
    const info = game?.stringInfo || STRING_INFO;
    const wrap = $('#stringLabels');
    if (!wrap) return;
    wrap.innerHTML = [...info].reverse().map((s, reverseIndex) => {
      const i = info.length - 1 - reverseIndex;
      const number = info.length - i;
      const edge = i === 0 ? ' thick' : i === info.length - 1 ? ' thin' : '';
      return `<span class="string-label-${i}" data-string="${i}" style="--string-color:${s.color || STRING_INFO[i]?.color}">${escapeHtml(s.label)}<small>${number}${edge}</small></span>`;
    }).join('');
    $('#stringBed').innerHTML = [...info].reverse().map((s, reverseIndex) => {
      const i = info.length - 1 - reverseIndex;
      return `<i data-string="${i}" style="--string-color:${s.color || STRING_INFO[i]?.color}"></i>`;
    }).join('');
    renderFretboard();
  }

  function renderGameNotes() {
    const layer = $('#noteLayer');
    layer.innerHTML = '';
    game.events.forEach(ev => {
      const shape = Array.isArray(ev.chordNotes) && ev.chordNotes.length ? ev.chordNotes : [{ string:ev.string, fret:ev.fret, midi:ev.midi, technique:ev.technique }];
      ev.elements = shape.map(note => {
        const el = document.createElement('div');
        const technique = note.technique || ev.technique || '';
        el.className = `falling-note string-${note.string} ${game.listenOnly ? 'listen-note' : ''} ${Number(note.fret) === 0 ? 'open-note' : ''} ${technique ? 'has-technique' : ''}`;
        const string = (game.stringInfo || STRING_INFO)[note.string] || STRING_INFO[note.string];
        const stringName = `${string?.label || '?'}${string?.number || 6 - Number(note.string)}`;
        el.innerHTML = `<span class="note-string">${escapeHtml(stringName)}</span><b>${Number(note.fret) === 0 ? 'OPEN' : Number(note.fret)}</b>${technique ? `<small>${escapeHtml(technique)}</small>` : ''}`;
        el.hidden = true;
        el.dataset.eventIndex = ev.index;
        el.dataset.stringIndex = note.string;
        el.dataset.fret = Number(note.fret) || 0;
        el.dataset.chordSize = shape.length;
        layer.appendChild(el);
        return el;
      });
      ev.element = ev.elements[0];
    });
  }

  function renderLiveTab() {
    renderLiveTabWindow(0);
  }

  function renderLiveTabWindow(start = 0) {
    const wrap = $('#liveTab');
    const info = game?.stringInfo || STRING_INFO;
    game.tabWindowStart = Math.max(0, Math.min(start, Math.max(0, game.events.length - 32)));
    const visibleEvents = game.events.slice(game.tabWindowStart, game.tabWindowStart + 32);
    const rows = Array.from({ length:info.length }, (_, i) => info.length - 1 - i);
    wrap.innerHTML = `<div class="tab-grid" style="--tab-cols:${visibleEvents.length}">${rows.map(stringIndex => {
      const label = info[stringIndex]?.label || `S${info.length - stringIndex}`;
      const cells = visibleEvents.map(ev => {
        const shape = Array.isArray(ev.chordNotes) && ev.chordNotes.length ? ev.chordNotes : [ev];
        const tabNote = shape.find(note => note.string === stringIndex);
        return `<span class="tab-cell string-text-${stringIndex} ${tabNote ? 'note' : ''} ${ev.status !== 'pending' ? ev.status : ''}" data-tab-col="${ev.index}" data-tab-event="${ev.index}">${tabNote ? tabNote.fret : '—'}</span>`;
      }).join('');
      return `<div class="tab-row"><span class="tab-row-label">${escapeHtml(label)}</span>${cells}</div>`;
    }).join('')}</div>`;
  }

  function updateTabEvent(ev) {
    $$(`[data-tab-event="${ev.index}"]`, $('#liveTab')).forEach(c => c.classList.add(ev.status));
  }

  function handleAudioFrame(result) {
    if (inputCalibration && result.freq && result.rms > .001) inputCalibration.samples.push(result.rms);
    updateInputMonitor(result);
    if (tunerActive) updateTuner(result);
    if (!game?.running || game.paused || !result.freq) return;
    $('#gameHearing').textContent = result.note || '—';
    const t = currentGameClock(performance.now());
    const hitWindow = gameClockWindows().hit;
    const candidates = game.events
      .filter(ev => ev.status === 'pending' && Math.abs(ev.clock - t) <= hitWindow && pitchMatches(result.freq, midiToFreq(ev.midi)))
      .sort((a,b) => Math.abs(a.clock - t) - Math.abs(b.clock - t));
    if (!candidates.length) {
      const expected = game.events.find(ev => ev.status === 'pending' && Math.abs(ev.clock - t) <= hitWindow);
      if (expected && result.onset && performance.now() - game.lastWrongFeedback > 500) {
        game.lastWrongFeedback = performance.now();
        showGameFeedback('WRONG NOTE', 'miss', expected);
      }
      return;
    }
    const ev = candidates[0];
    const pitchClass = ev.midi % 12;
    const repeatedPitch = game.lastAcceptedPitchClass === pitchClass;
    if (repeatedPitch && !result.onset) return;
    markHit(ev, t);
    game.lastAcceptedPitchClass = pitchClass;
    game.lastAcceptedEvent = ev.index;
  }

  function markHit(ev, t) {
    if (ev.status !== 'pending') return;
    ev.status = 'hit';
    ev.timingMs = (t - ev.clock) / gameClockWindows().unitsPerSecond * 1000;
    game.hits++;
    game.combo++;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    const timing = Math.abs(ev.clock - t) / gameClockWindows().unitsPerSecond;
    const timingBonus = timing < .12 ? 60 : timing < .24 ? 30 : 0;
    game.score += 100 + timingBonus + Math.min(100, game.combo * 4);
    ev.elements.forEach(el => el.classList.add('hit'));
    updateTabEvent(ev);
    const signedTiming = (t - ev.clock) / gameClockWindows().unitsPerSecond;
    const feedback = timing < .1 ? 'PERFECT!' : signedTiming < 0 ? 'EARLY' : 'LATE';
    showGameFeedback(feedback, 'hit', ev);
    updateGameHud();
  }

  function markMiss(ev) {
    if (ev.status !== 'pending') return;
    ev.status = 'miss';
    game.misses++;
    game.combo = 0;
    ev.elements.forEach(el => el.classList.add('miss'));
    updateTabEvent(ev);
    showGameFeedback('MISS', 'miss', ev);
    updateGameHud();
  }

  function updateGameHud() {
    const attempts = game.hits + game.misses;
    const accuracy = attempts ? Math.round(game.hits / attempts * 100) : 100;
    $('#gameScore').textContent = game.score.toLocaleString();
    $('#gameCombo').textContent = game.combo;
    $('#gameAccuracy').textContent = `${accuracy}%`;
  }

  function showGameFeedback(text, type, ev = null) {
    const el = $('#gameFeedback');
    clearTimeout(feedbackTimer);
    el.textContent = text;
    el.className = `game-feedback show ${type}`;
    if (ev && !$('#gameScreen').classList.contains('tab-mode')) {
      const board = $('#gameBoard').getBoundingClientRect();
      el.style.top = `${58 + ((5 - Number(ev.string)) + .5) / 6 * (board.height - 93)}px`;
      el.style.left = `${Math.max(118, board.width * .16) + 72}px`;
      el.style.bottom = 'auto';
    } else {
      el.style.top = '';
      el.style.left = '50%';
      el.style.bottom = '';
    }
    feedbackTimer = setTimeout(() => { el.className = 'game-feedback'; }, 350);
  }

  function finishMission() {
    if (!game) return;
    stopGameLoop();
    $('#gameScreen').classList.remove('playing');
    const total = game.events.length;
    const accuracy = total ? Math.round(game.hits / total * 100) : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 75 ? 2 : accuracy >= 55 ? 1 : 0;
    const isSong = game.mode === 'song';
    const coach = buildPracticeCoach(game, accuracy);
    if (window.FMQPracticeIntelligence) {
      game.events.forEach(event => { state.skillModel = window.FMQPracticeIntelligence.updateSkill(state.skillModel, `string:${event.string}:fret:${event.fret}`, event.status === 'hit', event.timingMs || 0); });
    }
    const adaptiveMessage = updateAdaptiveDifficulty(game, accuracy);
    if (isSong) {
      const key = game.level.songKey || `${game.level.songId || 'song'}:${game.level.trackIndex || 0}:${game.level.songSpec?.startBar || 0}`;
      const previous = state.songBest[key] || { stars:0, accuracy:0 };
      state.songBest[key] = { stars:Math.max(previous.stars || 0, stars), accuracy:Math.max(previous.accuracy || 0, accuracy) };
      state.songRuns++;
    } else {
      const oldStars = Number(state.stars[game.level.id] || 0);
      state.stars[game.level.id] = Math.max(oldStars, stars);
      state.missionsPlayed++;
    }
    state.totalHits += game.hits;
    state.totalMisses += game.misses;
    state.bestCombo = Math.max(state.bestCombo, game.bestCombo);
    state.bestAccuracy = Math.max(state.bestAccuracy, accuracy);
    const elapsed = Math.max(0, (Date.now() - game.startedAtDate) / 1000);
    state.practiceSeconds += Math.min(900, elapsed);
    state.practiceDays[new Date().toISOString().slice(0,10)] = true;
    const xpEarned = Math.round(game.hits * 7 + stars * 40 + game.bestCombo * 2);
    state.xp += xpEarned;
    saveProgress();
    if (!isSong) renderWorldMap();

    $('#gameScreen').hidden = true;
    $('#resultScreen').hidden = false;
    $('#resultStars').textContent = starsText(stars);
    $('#resultAccuracy').textContent = `${accuracy}%`;
    $('#resultCombo').textContent = game.bestCombo;
    $('#resultXp').textContent = `+${xpEarned}`;
    $('#resultCoach').hidden = false;
    $('#resultCoach').innerHTML = `<strong>${escapeHtml(coach.title)}</strong><span>${escapeHtml(coach.message)}</span>${adaptiveMessage ? `<small>${escapeHtml(adaptiveMessage)}</small>` : ''}`;
    if (isSong) {
      const spec = game.level.songSpec;
      const rangeName = spec?.fullSong ? 'song' : 'section';
      $('#resultTitle').textContent = stars === 3 ? `${rangeName === 'song' ? 'Song' : 'Section'} crushed!` : stars === 2 ? 'Nice run!' : stars === 1 ? `${rangeName === 'song' ? 'Song' : 'Section'} cleared!` : 'Run it again!';
      $('#resultMessage').textContent = stars ? `That ${rangeName} is now scored. Retry it for more stars${rangeName === 'section' ? ' or move on to the next chunk' : ''}.` : `Slow it down or retry this ${rangeName} until the notes start to feel automatic.`;
      const hasNext = Boolean(spec && spec.endBar < spec.totalBars);
      $('#nextLevel').hidden = !hasNext;
      $('#nextLevel').textContent = 'Next Section ▶';
    } else {
      $('#resultTitle').textContent = stars === 3 ? 'Crushed it!' : stars === 2 ? 'Nice run!' : stars === 1 ? 'Mission cleared!' : 'Almost there!';
      $('#resultMessage').textContent = stars ? 'You unlocked the next mission. Retry anytime to chase more stars.' : 'Get to 55% accuracy to earn the first star and unlock the next mission.';
      const currentIndex = flatLevels.findIndex(l => l.id === game.level.id);
      const atEnd = currentIndex >= flatLevels.length - 1;
      $('#nextLevel').hidden = atEnd || stars < 1;
      $('#nextLevel').textContent = 'Next Mission ▶';
    }
    if (dailyPractice) {
      const remaining = dailyPractice.levelIds.length - dailyPractice.index - 1;
      $('#resultEyebrow').textContent = `TODAY’S PRACTICE · STEP ${dailyPractice.index + 1} OF ${dailyPractice.levelIds.length}`;
      $('#nextLevel').hidden = remaining <= 0;
      $('#nextLevel').textContent = remaining > 0 ? 'Next Practice Step ▶' : 'Practice Complete';
      $('#backToMap').textContent = 'Finish for Today';
    }
  }

  function buildPracticeCoach(currentGame, accuracy) {
    const misses = currentGame.events.filter(event => event.status === 'miss');
    if (!misses.length) return { title:'Clean run!', message:'No missed notes. Try the next difficulty or a little more speed.' };
    const counts = new Map();
    misses.forEach(event => {
      const key = `${event.string}:${event.fret}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const [key, count] = [...counts.entries()].sort((a,b) => b[1] - a[1])[0];
    const [stringIndex, fret] = key.split(':').map(Number);
    const string = currentGame.stringInfo[stringIndex] || STRING_INFO[stringIndex];
    return { title:'Best thing to practise next', message:`${string?.name || 'That string'} · ${fret === 0 ? 'open' : `fret ${fret}`} caused ${count} ${count === 1 ? 'miss' : 'misses'}. Loop this lesson and watch that lane.` };
  }

  function updateAdaptiveDifficulty(currentGame, accuracy) {
    if (state.settings?.adaptiveDifficulty === false || currentGame.listenOnly) return '';
    const key = currentGame.practiceKey || levelPracticeKey(currentGame.level);
    const run = state.levelRuns[key] || { good:0 };
    run.good = accuracy >= 85 ? run.good + 1 : 0;
    const levels = [.5,.75,1];
    const current = Number(currentGame.density) || 1;
    const currentIndex = Math.max(0, levels.findIndex(level => Math.abs(level - current) < .01));
    let next = current;
    if (run.good >= 2 && currentIndex < levels.length - 1) { next = levels[currentIndex + 1]; run.good = 0; }
    else if (accuracy < 55) next = levels[Math.max(0, currentIndex - 1)];
    state.levelRuns[key] = run;
    if (next === current) return accuracy >= 85 && current < 1 ? 'One more strong run will unlock more notes.' : current >= 1 && accuracy >= 85 ? 'You are playing the complete note pattern.' : '';
    state.levelDensity[key] = next;
    return next > current ? `Auto difficulty increased the next run to ${Math.round(next * 100)}% of the notes.` : `Auto difficulty reduced the next run to ${Math.round(next * 100)}% so the skill is easier to practise.`;
  }

  function togglePause() {
    if (!game?.running) return;
    if (!game.paused) {
      game.paused = true;
      game.pausedAt = performance.now();
      if (usesSongBackingClock()) alphaApi?.pause();
      $('#gamePause').textContent = 'Resume';
      showGameFeedback('PAUSED', 'hit');
    } else {
      game.startPerf += performance.now() - game.pausedAt;
      game.paused = false;
      if (usesSongBackingClock()) alphaApi?.play();
      $('#gamePause').textContent = 'Pause';
    }
  }

  function exitGame() {
    const returnToSongs = game?.mode === 'song';
    stopGameLoop();
    $('#gameScreen').classList.remove('playing');
    $('#gameScreen').hidden = true;
    $('#resultScreen').hidden = true;
    $('#gameStart').hidden = false;
    dailyPractice = null;
    showView(returnToSongs ? 'songs' : 'play');
  }

  function stopGameLoop() {
    if (game?.raf) cancelAnimationFrame(game.raf);
    if (game?.mode === 'song') releaseSongBacking();
    if (game) { game.startToken++; game.running = false; game.paused = false; game.restartingLoop = false; game.raf = 0; }
  }

  function releaseSongBacking() {
    alphaApi?.stop?.();
    if (mutedBackingTrack && alphaApi) {
      alphaApi.changeTrackMute([mutedBackingTrack], false);
      mutedBackingTrack = null;
    }
    if (alphaApi) alphaApi.playbackRange = null;
  }

  function usesSongBackingClock() {
    return Boolean(game?.mode === 'song' && game.level?.songSpec?.backingEnabled && alphaApi);
  }

  function currentGameClock(now = performance.now()) {
    if (!game) return 0;
    return usesSongBackingClock() ? game.songClockTick : (now - game.startPerf) / 1000;
  }

  function gameClockWindows() {
    if (!usesSongBackingClock()) {
      return { lookahead:NOTE_LOOKAHEAD, hit:HIT_WINDOW, expired:.75, unitsPerSecond:1 };
    }
    const unitsPerSecond = 960 * Math.max(20, Number(game.songTempo) || 80) / 60;
    return {
      lookahead:NOTE_LOOKAHEAD * unitsPerSecond,
      hit:HIT_WINDOW * unitsPerSecond,
      expired:.75 * unitsPerSecond,
      unitsPerSecond
    };
  }

  function configureSongBacking(level) {
    if (!alphaApi || !alphaPlayerReady) throw new Error('Backing instruments are still loading.');
    if (mutedBackingTrack) {
      alphaApi.changeTrackMute([mutedBackingTrack], false);
      mutedBackingTrack = null;
    }
    const selectedTrack = loadedSongScore?.tracks?.[level.trackIndex];
    if (selectedTrack) {
      alphaApi.changeTrackMute([selectedTrack], true);
      mutedBackingTrack = selectedTrack;
    }
    alphaApi.playbackSpeed = Number(level.songSpec?.speed) || 1;
    alphaApi.masterVolume = Number(level.songSpec?.backingVolume ?? .8);
    alphaApi.playbackRange = {
      startTick:Number(level.sectionStartTick) || 0,
      endTick:Number(level.sectionEndTick) || Number(level.sectionStartTick) + 960
    };
    alphaApi.tickPosition = Number(level.sectionStartTick) || 0;
    game.songClockTick = 0;
  }

  function formatExpected(ev) {
    if (!ev) return '—';
    const info = game?.stringInfo || STRING_INFO;
    const s = info[ev.string] || STRING_INFO[ev.string] || { name:`String ${6 - ev.string}` };
    return `${s.name} · fret ${ev.fret} · ${midiToName(ev.midi)}`;
  }

  function bindInput() {
    $('#calibrateInput').addEventListener('click', runInputCalibration);
    $('#inputToggle').addEventListener('click', async () => {
      if (audio.active) {
        audio.stop();
        updateInputButtons();
        return;
      }
      try { await startAudioInput(selectedDeviceId); } catch (err) { console.error(err); toast('Microphone/input permission was blocked.'); }
    });
    $('#audioDeviceSelect').addEventListener('change', async e => {
      selectedDeviceId = e.target.value;
      state.settings = { ...(state.settings || {}), inputDeviceId:selectedDeviceId };
      saveProgress();
      if (audio.active) {
        try { await startAudioInput(selectedDeviceId); } catch (err) { console.error(err); toast('Could not switch input device.'); }
      }
    });
    $('#noiseGate').addEventListener('input', e => {
      audio.noiseGate = Number(e.target.value);
      state.settings = { ...(state.settings || {}), noiseGate:audio.noiseGate, calibrated:false };
      saveProgress();
      const v = audio.noiseGate;
      $('#noiseGateText').textContent = v < .012 ? 'Very sensitive' : v < .025 ? 'Normal' : v < .045 ? 'Less sensitive' : 'High noise room';
    });
  }

  function applySavedInputSettings() {
    selectedDeviceId = state.settings?.inputDeviceId || '';
    audio.noiseGate = Math.max(.005, Math.min(.08, Number(state.settings?.noiseGate) || .018));
    $('#noiseGate').value = String(audio.noiseGate);
    const v = audio.noiseGate;
    $('#noiseGateText').textContent = v < .012 ? 'Very sensitive' : v < .025 ? 'Normal' : v < .045 ? 'Less sensitive' : 'High noise room';
    $('#calibrationStatus').textContent = state.settings?.calibrated ? `Ready · gate ${audio.noiseGate.toFixed(3)}` : 'Not calibrated yet';
  }

  async function runInputCalibration() {
    const button = $('#calibrateInput');
    if (inputCalibration) return;
    try {
      if (!audio.active) await startAudioInput(selectedDeviceId);
      inputCalibration = { samples:[] };
      button.disabled = true;
      button.textContent = 'Play all six strings…';
      $('#calibrationStatus').textContent = 'For 6 seconds, pick each open string cleanly.';
      setTimeout(() => {
        const samples = inputCalibration?.samples || [];
        inputCalibration = null;
        button.disabled = false;
        button.textContent = 'Calibrate Again';
        if (samples.length < 8) {
          $('#calibrationStatus').textContent = 'Not enough signal—turn up the guitar or move closer and retry.';
          return;
        }
        samples.sort((a,b) => a - b);
        const quietPlaying = samples[Math.floor(samples.length * .2)];
        const gate = Math.max(.005, Math.min(.05, quietPlaying * .42));
        audio.noiseGate = gate;
        $('#noiseGate').value = String(gate);
        state.settings = { ...(state.settings || {}), noiseGate:gate, inputDeviceId:selectedDeviceId, calibrated:true };
        saveProgress();
        applySavedInputSettings();
        toast('Input calibrated for this guitar setup.');
      }, 6000);
    } catch (err) {
      console.error(err);
      inputCalibration = null;
      button.disabled = false;
      button.textContent = 'Calibrate Input';
      $('#calibrationStatus').textContent = 'Chrome could not access that input device.';
    }
  }

  async function startAudioInput(deviceId = '') {
    await audio.start(deviceId);
    selectedDeviceId = audio.deviceId || deviceId || '';
    state.settings = { ...(state.settings || {}), inputDeviceId:selectedDeviceId };
    saveProgress();
    await refreshAudioDevices();
    updateInputButtons();
  }

  async function refreshAudioDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput');
    const select = $('#audioDeviceSelect');
    select.innerHTML = devices.map((d, i) => `<option value="${escapeHtml(d.deviceId)}">${escapeHtml(d.label || `Audio input ${i + 1}`)}</option>`).join('');
    select.disabled = devices.length <= 1;
    if (selectedDeviceId && devices.some(d => d.deviceId === selectedDeviceId)) select.value = selectedDeviceId;
  }

  function updateInputButtons() {
    $('#inputToggle').textContent = audio.active ? 'Stop Listening' : 'Enable Guitar Input';
    $('#gameStart')?.classList.toggle('input-ready', audio.active);
  }

  function renderInputChallenges() {
    $('#inputChallenges').innerHTML = STRING_INFO.map((s, i) => `<div class="input-challenge" data-input-challenge="${i}"><strong>${s.label}${Math.floor(s.openMidi / 12) - 1}</strong><span>${s.name} · open</span></div>`).join('');
  }

  function updateInputMonitor(result) {
    const signal = Math.min(100, Math.max(0, result.rms * 1500));
    $('#signalBar').style.width = `${signal}%`;
    if (!audio.active) {
      $('#inputNote').textContent = '—';
      $('#inputFreq').textContent = 'Play one string';
      $('#inputAccuracy').textContent = 'Input is off';
      $('#inputAccuracy').className = 'input-status';
      return;
    }
    if (!result.freq) {
      $('#inputNote').textContent = '…';
      $('#inputFreq').textContent = 'Listening';
      $('#inputAccuracy').textContent = result.rms > audio.noiseGate ? 'Finding pitch…' : 'Play a clean single note';
      $('#inputAccuracy').className = 'input-status';
      return;
    }
    $('#inputNote').textContent = result.note;
    $('#inputFreq').textContent = `${result.freq.toFixed(1)} Hz`;
    $('#inputAccuracy').textContent = result.onset ? 'Attack detected ✓' : 'Signal locked';
    $('#inputAccuracy').className = 'input-status good';
    STRING_INFO.forEach((s, i) => {
      const f = midiToFreq(s.openMidi);
      if (exactOrHarmonicMatch(result.freq, f)) {
        inputChallengeHits.add(i);
        $(`[data-input-challenge="${i}"]`)?.classList.add('hit');
      }
    });
  }

  function bindTuner() {
    $('#tunerToggle').addEventListener('click', async () => {
      if (!tunerActive) {
        try {
          if (!audio.active) await startAudioInput(selectedDeviceId);
          tunerActive = true;
          $('#tunerToggle').textContent = 'Stop Tuner';
        } catch (err) { console.error(err); toast('Could not access the guitar input.'); }
      } else {
        tunerActive = false;
        $('#tunerToggle').textContent = 'Start Tuner';
        $('#tunerMessage').textContent = 'Tuner is off.';
      }
    });
  }

  function updateTuner(result) {
    if (!result.freq) {
      $('#tunerMessage').textContent = 'Play one string clearly.';
      return;
    }
    const midi = 69 + 12 * Math.log2(result.freq / 440);
    const nearest = Math.round(midi);
    const cents = (midi - nearest) * 100;
    const name = NOTE_NAMES[(nearest % 12 + 12) % 12];
    const octave = Math.floor(nearest / 12) - 1;
    $('#tunerNote').textContent = name;
    $('#tunerOctave').textContent = octave;
    $('#tunerFrequency').textContent = `${result.freq.toFixed(1)} Hz`;
    $('#tunerNeedle').style.left = `${50 + Math.max(-50, Math.min(50, cents))}%`;
    $('#tunerMessage').textContent = Math.abs(cents) < 5 ? 'In tune ✓' : cents < 0 ? `${Math.abs(cents).toFixed(0)} cents flat` : `${Math.abs(cents).toFixed(0)} cents sharp`;
  }

  function createAudioEngine() {
    const listeners = new Set();
    return {
      context:null, stream:null, source:null, analyser:null, buffer:null, active:false, raf:0, lastTick:0,
      lastResult:{ freq:null, rms:0, note:'—', onset:false, midi:null }, envelope:0, lastMidi:null, noiseGate:.018, deviceId:'',
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      async ensureContext() {
        if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
        if (this.context.state === 'suspended') await this.context.resume();
        return this.context;
      },
      async start(deviceId = '') {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Audio input is not supported in this browser.');
        this.stop(false);
        const constraints = { audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false, channelCount:1 } };
        if (deviceId) constraints.audio.deviceId = { exact:deviceId };
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.deviceId = this.stream.getAudioTracks()[0]?.getSettings()?.deviceId || deviceId || '';
        const ctx = await this.ensureContext();
        this.source = ctx.createMediaStreamSource(this.stream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0;
        this.buffer = new Float32Array(this.analyser.fftSize);
        this.source.connect(this.analyser);
        this.active = true;
        this.envelope = 0;
        this.lastMidi = null;
        const tick = now => {
          if (!this.active) return;
          if (now - this.lastTick >= 42) {
            this.lastTick = now;
            this.analyser.getFloatTimeDomainData(this.buffer);
            const raw = autoCorrelate(this.buffer, ctx.sampleRate, this.noiseGate);
            const prevEnvelope = this.envelope;
            this.envelope = prevEnvelope * .82 + raw.rms * .18;
            const onset = raw.rms > this.noiseGate && raw.rms > Math.max(this.noiseGate * 1.4, prevEnvelope * 1.38);
            let result = { freq:raw.freq, rms:raw.rms, onset, note:'—', midi:null };
            if (raw.freq) {
              const midiFloat = 69 + 12 * Math.log2(raw.freq / 440);
              const midi = Math.round(midiFloat);
              result.midi = midi;
              result.note = midiToName(midi);
            }
            this.lastResult = result;
            listeners.forEach(fn => { try { fn(result); } catch (err) { console.error(err); } });
          }
          this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
      },
      stop(updateUi = true) {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.stream?.getTracks().forEach(t => t.stop());
        try { this.source?.disconnect(); } catch {}
        this.stream = null; this.source = null; this.analyser = null; this.buffer = null; this.active = false;
        this.lastResult = { freq:null, rms:0, note:'—', onset:false, midi:null };
        if (updateUi) updateInputButtons();
      }
    };
  }

  function autoCorrelate(input, sampleRate, gate) {
    const size = input.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += input[i] * input[i];
    rms = Math.sqrt(rms / size);
    if (rms < gate) return { freq:null, rms };

    let r1 = 0, r2 = size - 1;
    const trim = .2;
    for (let i = 0; i < size / 2; i++) { if (Math.abs(input[i]) < trim) { r1 = i; break; } }
    for (let i = 1; i < size / 2; i++) { if (Math.abs(input[size - i]) < trim) { r2 = size - i; break; } }
    const buf = input.slice(r1, r2);
    const n = buf.length;
    if (n < 128) return { freq:null, rms };
    const c = new Float32Array(n);
    for (let lag = 0; lag < n; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) sum += buf[i] * buf[i + lag];
      c[lag] = sum;
    }
    let d = 0;
    while (d + 1 < n && c[d] > c[d + 1]) d++;
    let maxVal = -Infinity, maxPos = -1;
    const maxLag = Math.min(n - 2, Math.floor(sampleRate / 55));
    for (let i = Math.max(d, Math.floor(sampleRate / 1200)); i <= maxLag; i++) {
      if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
    }
    if (maxPos <= 1 || !Number.isFinite(maxVal)) return { freq:null, rms };
    let T0 = maxPos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const denom = x1 - 2 * x2 + x3;
    if (denom !== 0) T0 += .5 * (x1 - x3) / denom;
    const freq = sampleRate / T0;
    if (!Number.isFinite(freq) || freq < 55 || freq > 1300) return { freq:null, rms };
    return { freq, rms };
  }

  function pitchMatches(freq, targetFreq) {
    if (!freq || !targetFreq) return false;
    let cents = 1200 * Math.log2(freq / targetFreq);
    cents = ((cents + 600) % 1200 + 1200) % 1200 - 600;
    return Math.abs(cents) <= 58;
  }

  function exactOrHarmonicMatch(freq, targetFreq) {
    if (!freq || !targetFreq) return false;
    const ratios = [1,2,.5];
    return ratios.some(r => Math.abs(1200 * Math.log2(freq / (targetFreq * r))) < 70);
  }

  function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function midiToName(midi) { return `${NOTE_NAMES[(midi % 12 + 12) % 12]}${Math.floor(midi / 12) - 1}`; }

  function bindMetronome() {
    $('#metroToggle').addEventListener('click', () => metronomeTimer ? stopMetronome() : startMetronome());
    $('#bpmDown').addEventListener('click', () => setBpm(bpm - 5));
    $('#bpmUp').addEventListener('click', () => setBpm(bpm + 5));
    $('#bpmSlider').addEventListener('input', e => setBpm(Number(e.target.value), true));
  }

  function setBpm(value, fromSlider = false) {
    bpm = Math.max(40, Math.min(220, Math.round(value)));
    $('#bpmValue').textContent = bpm;
    if (!fromSlider) $('#bpmSlider').value = bpm;
    if (metronomeTimer) { stopMetronome(); startMetronome(); }
  }

  async function startMetronome() {
    await audio.ensureContext();
    metronomeBeat = 0;
    clickBeat();
    metronomeTimer = setInterval(clickBeat, 60000 / bpm);
    $('#metroToggle').textContent = 'Stop';
  }

  function stopMetronome() {
    clearInterval(metronomeTimer);
    metronomeTimer = null;
    $('#metroToggle').textContent = 'Start';
    $$('#beatDots span').forEach(d => d.classList.remove('active'));
  }

  function clickBeat() {
    clickSound(metronomeBeat === 0);
    $$('#beatDots span').forEach((d, i) => d.classList.toggle('active', i === metronomeBeat));
    metronomeBeat = (metronomeBeat + 1) % 4;
  }

  async function clickSound(accent = false) {
    try {
      const ctx = await audio.ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = accent ? 1200 : 820;
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.12, ctx.currentTime + .003);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .055);
      osc.connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + .06);
    } catch {}
  }

  function renderChords() {
    $('#chordGrid').innerHTML = chords.map(c => `<article class="chord-card"><strong>${c.name}</strong><code>${c.frets}</code><span>${c.note}</span></article>`).join('');
  }

  function bindSongImport() {
    const input = $('#songFileInput');
    const zone = $('#dropZone');
    input.addEventListener('change', () => importFiles([...input.files]));
    ['dragenter','dragover'].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.add('dragging'); }));
    ['dragleave','drop'].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.remove('dragging'); }));
    zone.addEventListener('drop', e => importFiles([...e.dataTransfer.files]));
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') input.click(); });
    $('#closePlayer').addEventListener('click', closePlayer);
    $('#alphaPlay').addEventListener('click', () => alphaApi?.playPause());
    $('#alphaStop').addEventListener('click', () => alphaApi?.stop());
    $('#alphaSpeed').addEventListener('change', e => { if (alphaApi) alphaApi.playbackSpeed = Number(e.target.value); });
    $('#songTrackSelect').addEventListener('change', () => { updateSongSectionOptions(); updateSongLevelPreview(); });
    $('#songSectionSelect').addEventListener('change', updateSongLevelPreview);
    $('#songLineMode').addEventListener('change', updateSongLevelPreview);
    $('#songGameSpeed').addEventListener('change', updateSongLevelPreview);
    $('#songDifficulty').addEventListener('change', updateSongLevelPreview);
    $('#songBackingEnabled').addEventListener('change', updateSongLevelPreview);
    $('#songBackingVolume').addEventListener('input', e => {
      $('#songBackingVolumeText').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
      if (alphaApi) alphaApi.masterVolume = Number(e.target.value);
    });
    $('#playSongAsLevel').addEventListener('click', startImportedSongLevel);
  }

  async function importFiles(files) {
    const allowed = ['gp','gpx','gp3','gp4','gp5','musicxml','xml','txt','tab'];
    let imported = 0;
    for (const file of files) {
      const ext = extensionOf(file.name);
      if (!allowed.includes(ext)) { toast(`Skipped ${file.name}: unsupported file type.`); continue; }
      await putSong({ id:`${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`, name:file.name, ext, size:file.size, createdAt:Date.now(), blob:file });
      imported++;
    }
    $('#songFileInput').value = '';
    await refreshSongs();
    if (imported) toast(`${imported} file${imported === 1 ? '' : 's'} saved.`);
  }

  function getDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE_SONGS)) req.result.createObjectStore(STORE_SONGS, { keyPath:'id' }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function putSong(record) { const db = await getDb(); return txPromise(db, 'readwrite', s => s.put(record)); }
  async function getSongs() { const db = await getDb(); const songs = await txPromise(db, 'readonly', s => s.getAll()); return songs.sort((a,b) => b.createdAt - a.createdAt); }
  async function getSong(id) { const db = await getDb(); return txPromise(db, 'readonly', s => s.get(id)); }
  async function deleteSong(id) { const db = await getDb(); return txPromise(db, 'readwrite', s => s.delete(id)); }
  function txPromise(db, mode, fn) { return new Promise((resolve,reject) => { const tx=db.transaction(STORE_SONGS,mode); const req=fn(tx.objectStore(STORE_SONGS)); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }

  async function refreshSongs() {
    let songs = [];
    try { songs = await getSongs(); } catch (err) { console.error(err); }
    $('#songCount').textContent = songs.length;
    const list = $('#songList');
    if (!songs.length) { list.className='song-list empty-state'; list.textContent='No songs imported yet.'; return; }
    list.className='song-list';
    list.innerHTML = songs.map(s => `<div class="song-item"><button class="song-main" data-open-song="${s.id}"><strong>${escapeHtml(stripExtension(s.name))}</strong><span>${s.ext.toUpperCase()} · ${formatBytes(s.size)}</span></button><button class="icon-button" data-delete-song="${s.id}" aria-label="Delete ${escapeHtml(s.name)}">🗑</button></div>`).join('');
    $$('[data-open-song]', list).forEach(b => b.addEventListener('click', () => openSong(b.dataset.openSong)));
    $$('[data-delete-song]', list).forEach(b => b.addEventListener('click', async () => {
      const song = await getSong(b.dataset.deleteSong);
      if (song && confirm(`Delete ${song.name} from this browser?`)) { if (currentSong?.id === song.id) closePlayer(); await deleteSong(song.id); await refreshSongs(); toast('Song removed.'); }
    }));
  }

  async function openSong(id) {
    const song = await getSong(id); if (!song) return;
    currentSong = song;
    loadedSongScore = null;
    loadedSongTracks = [];
    songLevelSpec = null;
    alphaPlayerReady = false;
    $('#playerEmpty').hidden = true;
    $('#playerContent').hidden = false;
    $('#playerSongName').textContent = stripExtension(song.name);
    $('#songGameSetup').hidden = true;
    $('#textTab').hidden = true;
    $('#alphaTab').hidden = false;
    $('#alphaControls').hidden = false;
    $('#alphaStatus').textContent = 'Loading…';
    if (song.ext === 'txt' || song.ext === 'tab') {
      destroyAlphaTab();
      $('#alphaControls').hidden = true;
      $('#alphaTab').hidden = true;
      $('#songGameSetup').hidden = true;
      $('#textTab').hidden = false;
      $('#textTab').textContent = await song.blob.text();
      return;
    }
    try {
      if (!window.alphaTab) throw new Error('Tab player library is unavailable. Connect to the internet once and reload.');
      destroyAlphaTab();
      const viewport = $('#tabViewport');
      alphaApi = new alphaTab.AlphaTabApi($('#alphaTab'), {
        player:{ enablePlayer:true, enableCursor:true, enableUserInteraction:true, soundFont:'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.4/dist/soundfont/sonivox.sf2', scrollElement:viewport },
        display:{ scale:.9 }
      });
      alphaApi.scoreLoaded.on(score => {
        loadedSongScore = score;
        setupSongGame(score);
      });
      alphaApi.renderStarted.on(() => { $('#alphaStatus').textContent = 'Rendering…'; });
      alphaApi.renderFinished.on(() => { $('#alphaStatus').textContent = 'Ready'; });
      alphaApi.playerReady.on(() => { alphaPlayerReady = true; $('#alphaStatus').textContent = 'Ready to play'; });
      alphaApi.playerPositionChanged.on(args => {
        if (!game || game.mode !== 'song') return;
        game.songClockTick = Math.max(0, Number(args.currentTick) - Number(game.level.sectionStartTick || 0));
        game.songTempo = Number(args.modifiedTempo) || Number(game.level.bpm) || 80;
      });
      alphaApi.playerStateChanged.on(args => { $('#alphaPlay').textContent = args.state === 1 ? '❚❚ Pause' : '▶ Play'; });
      alphaApi.error.on(err => { console.error(err); $('#alphaStatus').textContent = 'Could not open this file'; $('#songGameSetup').hidden = true; });
      alphaApi.load(await song.blob.arrayBuffer());
    } catch (err) { console.error(err); $('#alphaStatus').textContent = err.message || 'Could not load tab.'; toast(err.message || 'Could not load tab.'); }
  }

  function setupSongGame(score) {
    const tracks = Array.from(score?.tracks || []);
    loadedSongTracks = tracks.map((track, index) => {
      const staff = getFrettedStaff(track);
      const bars = staff ? Array.from(staff.bars || []) : [];
      const stringCount = staff ? getStaffTuning(staff).length : 0;
      const noteCount = staff ? countPlayableNotes(staff) : 0;
      return { index, track, staff, bars, stringCount, noteCount, playable:Boolean(staff && stringCount === 6 && noteCount > 0) };
    });
    const playable = loadedSongTracks.filter(t => t.playable);
    const select = $('#songTrackSelect');
    select.innerHTML = loadedSongTracks.map(t => {
      const name = t.track?.name || t.track?.shortName || `Track ${t.index + 1}`;
      const detail = t.playable ? `${t.stringCount} strings · ${t.noteCount} notes` : 'not a 6-string guitar track';
      return `<option value="${t.index}" ${t.playable ? '' : 'disabled'}>${escapeHtml(name)} — ${detail}</option>`;
    }).join('');
    if (!playable.length) {
      $('#songGameSetup').hidden = false;
      $('#songGameInfo').textContent = 'I could not find a playable six-string guitar track in this file.';
      $('#playSongAsLevel').disabled = true;
      $('#songSectionSelect').innerHTML = '<option>No playable sections</option>';
      return;
    }
    select.value = String(playable[0].index);
    $('#playSongAsLevel').disabled = false;
    $('#songGameSetup').hidden = false;
    $('#songGameInfo').textContent = `${playable.length} playable guitar track${playable.length === 1 ? '' : 's'} found. Full chord shapes are shown; the selected low or high anchor lets the microphone score them reliably.`;
    updateSongSectionOptions();
    updateSongLevelPreview();
  }

  function getFrettedStaff(track) {
    const staves = Array.from(track?.staves || []);
    return staves.find(staff => {
      const tuning = getStaffTuning(staff);
      if (tuning.length < 4 || tuning.length > 8) return false;
      return Array.from(staff?.bars || []).some(bar => Array.from(bar?.voices || []).some(voice => Array.from(voice?.beats || []).some(beat => Array.from(beat?.notes || []).some(note => Number.isFinite(Number(note?.string)) && Number(note.string) > 0))));
    }) || null;
  }

  function getStaffTuning(staff) {
    try {
      const direct = Array.from(staff?.tuning || []).map(Number).filter(Number.isFinite);
      if (direct.length) return direct;
    } catch {}
    try {
      const nested = Array.from(staff?.stringTuning?.tunings || []).map(Number).filter(Number.isFinite);
      if (nested.length) return nested;
    } catch {}
    return [];
  }

  function countPlayableNotes(staff) {
    let count = 0;
    Array.from(staff?.bars || []).forEach(bar => Array.from(bar?.voices || []).forEach(voice => Array.from(voice?.beats || []).forEach(beat => {
      Array.from(beat?.notes || []).forEach(note => {
        const str = Number(note?.string), fret = Number(note?.fret);
        if (Number.isFinite(str) && str >= 1 && str <= 6 && Number.isFinite(fret) && fret >= 0 && !note.isDead && !note.tieOrigin) count++;
      });
    })));
    return count;
  }

  function updateSongSectionOptions() {
    const meta = loadedSongTracks.find(t => t.index === Number($('#songTrackSelect').value));
    const select = $('#songSectionSelect');
    if (!meta?.playable) { select.innerHTML = '<option>No playable sections</option>'; return; }
    const total = meta.bars.length;
    const chunk = 8;
    const options = [`<option value="full">Full song · Bars 1–${total}</option>`];
    for (let start = 0; start < total; start += chunk) {
      const end = Math.min(total, start + chunk);
      options.push(`<option value="${start}:${end}" ${start === 0 ? 'selected' : ''}>Bars ${start + 1}–${end}</option>`);
    }
    select.innerHTML = options.join('');
    if (songLevelSpec && songLevelSpec.trackIndex === meta.index) {
      const wanted = songLevelSpec.fullSong ? 'full' : `${songLevelSpec.startBar}:${songLevelSpec.endBar}`;
      if ([...select.options].some(o => o.value === wanted)) select.value = wanted;
    }
  }

  function readSongBuilderSpec() {
    const trackIndex = Number($('#songTrackSelect').value);
    const meta = loadedSongTracks.find(t => t.index === trackIndex);
    if (!meta?.playable) return null;
    const sectionValue = String($('#songSectionSelect').value || '0:8');
    const fullSong = sectionValue === 'full';
    const parts = sectionValue.split(':').map(Number);
    const startBar = fullSong ? 0 : Math.max(0, Number.isFinite(parts[0]) ? parts[0] : 0);
    const endBar = fullSong ? meta.bars.length : Math.min(meta.bars.length, Number.isFinite(parts[1]) ? parts[1] : startBar + 8);
    return {
      trackIndex,
      startBar,
      endBar,
      fullSong,
      totalBars:meta.bars.length,
      lineMode:$('#songLineMode').value === 'high' ? 'high' : 'low',
      speed:Math.max(.4, Math.min(1, Number($('#songGameSpeed').value) || .75)),
      difficulty:Math.max(1, Math.min(8, Number($('#songDifficulty').value) || 4)),
      backingEnabled:$('#songBackingEnabled').value !== 'off',
      backingVolume:Math.max(0, Math.min(1, Number($('#songBackingVolume').value) || 0))
    };
  }

  function updateSongLevelPreview() {
    const spec = readSongBuilderSpec();
    if (!spec || !loadedSongScore) { $('#songLevelPreview').textContent = 'Choose a playable guitar track.'; return; }
    try {
      const level = buildImportedLevel(loadedSongScore, spec, true);
      const simplification = level.chordsSimplified ? ` · ${level.chordsSimplified} chord beat${level.chordsSimplified === 1 ? '' : 's'} simplified` : '';
      const backing = spec.backingEnabled ? ' · backing instruments on' : ' · backing off';
      const stage = spec.difficulty === 1 ? 'rhythm listen' : `difficulty ${spec.difficulty}/8`;
      $('#songLevelPreview').textContent = `${level.notes.length} ${spec.difficulty === 1 ? 'guided' : 'scored'} notes · ${stage} · ${Math.round(level.bpm)} BPM${backing}${simplification}`;
    } catch (err) {
      $('#songLevelPreview').textContent = err.message || 'This section cannot be converted.';
    }
  }

  function startImportedSongLevel() {
    if (!loadedSongScore || !currentSong) { toast('Open a Guitar Pro or MusicXML file first.'); return; }
    const spec = readSongBuilderSpec();
    if (!spec) { toast('Choose a playable guitar track.'); return; }
    try {
      songLevelSpec = spec;
      alphaApi?.stop?.();
      const level = buildImportedLevel(loadedSongScore, spec, false);
      launchLevel(level);
    } catch (err) {
      console.error(err);
      toast(err.message || 'Could not turn this section into a level.');
    }
  }

  function launchNextSongSection() {
    if (!loadedSongScore || !game?.level?.songSpec) { showView('songs'); return; }
    const previous = game.level.songSpec;
    if (previous.endBar >= previous.totalBars) { showView('songs'); return; }
    const length = Math.max(1, previous.endBar - previous.startBar);
    const next = { ...previous, startBar:previous.endBar, endBar:Math.min(previous.totalBars, previous.endBar + length) };
    songLevelSpec = next;
    $('#songTrackSelect').value = String(next.trackIndex);
    updateSongSectionOptions();
    const optionValue = `${next.startBar}:${next.endBar}`;
    if ([...$('#songSectionSelect').options].some(o => o.value === optionValue)) $('#songSectionSelect').value = optionValue;
    const level = buildImportedLevel(loadedSongScore, next, false);
    launchLevel(level);
  }

  function buildImportedLevel(score, spec, previewOnly = false) {
    const meta = loadedSongTracks.find(t => t.index === spec.trackIndex);
    if (!meta?.playable) throw new Error('That track is not a playable six-string guitar track.');
    const track = meta.track;
    const staff = meta.staff;
    const bars = meta.bars.slice(spec.startBar, spec.endBar);
    const groups = new Map();
    let chordGroups = 0;
    bars.forEach(bar => {
      Array.from(bar?.voices || []).forEach(voice => {
        Array.from(voice?.beats || []).forEach(beat => {
          const notes = Array.from(beat?.notes || []).filter(note => {
            const str = Number(note?.string), fret = Number(note?.fret);
            return Number.isFinite(str) && str >= 1 && str <= 6 && Number.isFinite(fret) && fret >= 0 && !note.isDead && !note.tieOrigin;
          });
          if (!notes.length) return;
          const fallbackTick = Number(bar?.masterBar?.start || 0) + Number(beat?.playbackStart || 0);
          const tick = Number.isFinite(Number(beat?.absolutePlaybackStart)) ? Number(beat.absolutePlaybackStart) : fallbackTick;
          const key = String(Math.round(tick));
          if (!groups.has(key)) groups.set(key, { tick, notes:[], durationTicks:0 });
          const group = groups.get(key);
          group.notes.push(...notes);
          const beatDuration = Number(beat?.playbackDuration || beat?.duration || 0);
          if (Number.isFinite(beatDuration)) group.durationTicks = Math.max(group.durationTicks, beatDuration);
        });
      });
    });
    const ordered = [...groups.values()].sort((a,b) => a.tick - b.tick);
    if (!ordered.length) throw new Error('No playable notes were found in this section.');
    const firstTick = ordered[0].tick;
    const tempo = Math.max(30, Number(score?.tempo) || 80);
    const gameBpm = tempo * spec.speed;
    const raw = [];
    ordered.forEach(group => {
      const unique = [];
      const seen = new Set();
      group.notes.forEach(note => {
        const stringNumber = Number(note.string);
        const fret = Number(note.fret);
        const midiRaw = Number(note.realValue);
        const midi = Number.isFinite(midiRaw) ? Math.round(midiRaw) : Math.round(Number(note.stringTuning) + fret);
        if (!Number.isFinite(midi)) return;
        const key = `${stringNumber}:${fret}:${midi}`;
        if (seen.has(key)) return;
        seen.add(key);
        unique.push({ stringNumber, string:stringNumber - 1, fret, midi, note, technique:readTechnique(note) });
      });
      if (!unique.length) return;
      if (unique.length > 1) chordGroups++;
      unique.sort((a,b) => a.midi - b.midi);
      const chosen = spec.lineMode === 'high' ? unique.at(-1) : unique[0];
      const quarterBeats = (group.tick - firstTick) / 960;
      raw.push({ string:chosen.stringNumber - 1, fret:chosen.fret, midi:chosen.midi, tick:group.tick, beat:2 + quarterBeats, durationTicks:group.durationTicks, technique:chosen.technique, chordNotes:unique.map(note => ({ string:note.string, fret:note.fret, midi:note.midi, technique:note.technique })) });
    });
    const completeNotes = raw.filter((n, i) => i === 0 || n.beat !== raw[i-1].beat || n.midi !== raw[i-1].midi);
    const notes = applySongDifficulty(completeNotes, spec.difficulty);
    if (!notes.length) throw new Error('No scored notes remained after simplifying this section.');
    const noteLimit = spec.fullSong ? 2000 : 420;
    if (notes.length > noteLimit) throw new Error(spec.fullSong ? 'This song has more than 2,000 scored notes. Choose an 8-bar section for smoother play.' : 'This 8-bar section is unusually dense. Choose a different guitar track for now.');
    const stringInfo = makeStringInfoFromStaff(staff);
    const trackName = track?.name || track?.shortName || `Track ${spec.trackIndex + 1}`;
    const sectionName = spec.fullSong ? 'Full Song' : `Bars ${spec.startBar + 1}–${spec.endBar}`;
    const sectionStartTick = Number(bars[0]?.masterBar?.start ?? firstTick);
    const nextBar = meta.bars[spec.endBar];
    const finalTick = ordered.at(-1)?.tick ?? firstTick;
    const sectionEndTick = Number(nextBar?.masterBar?.start ?? (finalTick + 960));
    return {
      id:`song:${currentSong?.id || 'local'}:${spec.trackIndex}:${spec.startBar}:${spec.endBar}:${spec.lineMode}:${spec.speed}:${spec.difficulty}`,
      mode:'song',
      songId:currentSong?.id || 'local',
      songKey:`${currentSong?.id || 'local'}:${spec.trackIndex}:${spec.startBar}:${spec.endBar}:${spec.lineMode}:d${spec.difficulty}`,
      trackIndex:spec.trackIndex,
      trackName,
      songSpec:{ ...spec },
      sectionStartTick,
      sectionEndTick,
      stringInfo,
      title:`${stripExtension(currentSong?.name || score?.title || 'Imported Song')} · ${sectionName}`,
      tag:'SONG GAME · BETA',
      headline:`${trackName} · ${sectionName}`,
      lesson:spec.difficulty === 1 ? 'Listen to the backing and watch how the notes line up with the pulse. Tap your foot and count before trying to play.' : spec.lineMode === 'high' ? 'The highway shows every note in a chord shape while the microphone uses its highest note as the scoring anchor.' : 'The highway shows every note in a chord shape while the microphone uses its lowest/root note as the scoring anchor.',
      hint:'The live tab below mirrors the simplified playable line generated from your imported file.',
      bpm:gameBpm,
      notes,
      listenOnly:spec.difficulty === 1,
      difficulty:spec.difficulty,
      chordsSimplified:chordGroups,
      previewOnly
    };
  }

  function applySongDifficulty(notes, difficulty = 7) {
    const stage = Math.max(1, Math.min(8, Number(difficulty) || 7));
    if (stage >= 7) return notes;
    if (stage === 1) return notes.filter((_, i) => i % 2 === 0);
    if (stage === 2) {
      const counts = new Map();
      notes.forEach(note => counts.set(note.string, (counts.get(note.string) || 0) + 1));
      const mainString = [...counts.entries()].sort((a,b) => b[1] - a[1])[0]?.[0] ?? 0;
      const result = notes.filter((note, i) => note.string === mainString && i % 2 === 0);
      return result.length ? result : notes.slice(0, 1);
    }
    const ratios = { 3:.35, 4:.5, 5:.68, 6:.84 };
    const keepEvery = 1 / ratios[stage];
    const result = notes.filter((_, i) => Math.floor((i + 1) / keepEvery) > Math.floor(i / keepEvery) || i === 0);
    return result.length ? result : notes.slice(0, 1);
  }

  function readTechnique(note) {
    if (note?.isPalmMute || note?.palmMute) return 'PM';
    if ((Number(note?.slideType) || 0) > 0) return 'SLIDE';
    if (note?.isHammerPullOrigin || note?.hammerPullOrigin || note?.hammerPullDestination) return 'H/P';
    if ((Number(note?.bendType) || 0) > 0 || Number(note?.bends?.length) > 0) return 'BEND';
    if ((Number(note?.vibrato) || 0) > 0) return 'VIB';
    return '';
  }

  function makeStringInfoFromStaff(staff) {
    const tuningTopToBottom = getStaffTuning(staff);
    const tuningLowToHigh = tuningTopToBottom.length === 6 ? [...tuningTopToBottom].reverse() : STRING_INFO.map(s => s.openMidi);
    return tuningLowToHigh.map((midi, i) => {
      const name = midiToName(Math.round(midi));
      const pitch = name.replace(/\d+$/, '');
      return { label:i === 5 && pitch === 'E' ? 'e' : pitch, number:6 - i, name:`String ${6 - i} (${name})`, openMidi:Math.round(midi), color:STRING_INFO[i]?.color };
    });
  }

  function destroyAlphaTab() {
    if (alphaApi) { try { alphaApi.destroy(); } catch {} alphaApi=null; }
    alphaPlayerReady = false;
    mutedBackingTrack = null;
    loadedSongScore = null;
    loadedSongTracks = [];
    $('#alphaTab').innerHTML='';
  }

  function closePlayer() {
    destroyAlphaTab();
    currentSong=null;
    songLevelSpec=null;
    $('#songGameSetup').hidden=true;
    $('#playerContent').hidden=true;
    $('#playerEmpty').hidden=false;
  }

  function bindProgress() {
    $('#resetProgress').addEventListener('click', () => {
      if (!confirm('Reset all Guitar Quest mission progress and XP?')) return;
      state = defaultState(); saveProgress(); renderWorldMap(); renderAchievements(); toast('Game progress reset.');
    });
  }

  function playerLevel(xp) { return Math.floor(Math.max(0,xp) / 300) + 1; }
  function rankName(level) { return level >= 10 ? 'Stage Monster' : level >= 7 ? 'Riff Hunter' : level >= 4 ? 'Garage Player' : 'Garage Rookie'; }

  function updateStats() {
    const level = playerLevel(state.xp);
    const into = state.xp % 300;
    const pct = into / 300 * 100;
    const minutes = Math.floor(state.practiceSeconds / 60);
    $('#headerLevel').textContent = `Lv ${level}`; $('#headerXp').textContent = `${state.xp} XP`;
    $('#heroLevel').textContent = level; $('#heroXpText').textContent = `${into} / 300 XP`; $('#heroXpBar').style.width = `${pct}%`;
    $('#statStars').textContent = totalStars(); $('#statCombo').textContent = state.bestCombo; $('#statHits').textContent = state.totalHits; $('#statMinutes').textContent = minutes;
    $('#progressLevel').textContent = level; $('#progressTitleRank').textContent = rankName(level); $('#progressXpBar').style.width = `${pct}%`; $('#progressXpText').textContent = `${state.xp} XP total · ${into} / 300 to next level`;
    $('#progressStars').textContent = totalStars(); $('#progressHits').textContent = state.totalHits; $('#progressCombo').textContent = state.bestCombo; $('#progressMinutes').textContent = minutes;
    renderAchievements();
  }

  function renderAchievements() {
    $('#achievementGrid').innerHTML = achievements.map(a => { const unlocked = a.test(state); return `<article class="achievement ${unlocked ? 'unlocked' : ''}"><div class="achievement-icon">${a.icon}</div><strong>${a.title}</strong><span>${a.text}</span></article>`; }).join('');
  }

  function bindPwaInstall() {
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt = e; $('#installButton').hidden = false; });
    $('#installButton').addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $('#installButton').hidden = true;
    });
  }

  function updateNetworkBadge() {
    const apply = () => { $('#offlineBadge').textContent = navigator.onLine ? 'Online' : 'Offline'; };
    apply(); window.addEventListener('online', apply); window.addEventListener('offline', apply);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js?v=2.6.0');
      reg.update().catch(() => null);
    } catch (err) { console.error(err); }
  }

  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function extensionOf(name) { return (name.split('.').pop() || '').toLowerCase(); }
  function stripExtension(name) { return name.replace(/\.[^.]+$/, ''); }
  function formatBytes(n) { if (n < 1024) return `${n} B`; if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`; return `${(n/1024/1024).toFixed(1)} MB`; }
  function escapeHtml(s) { return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  window.FMQGuitarTest = { getState:() => JSON.parse(JSON.stringify(state)), reloadActiveProfile, defaultState };
  console.info(`Guitar Quest ${APP_VERSION}`);
})();
