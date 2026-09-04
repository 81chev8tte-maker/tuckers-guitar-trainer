(function (root) {
  'use strict';

  const PIANO_MIN = 21;
  const PIANO_MAX = 108;
  const simultaneousWindow = 0.03;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const median = values => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };

  function groupNotes(notes) {
    const groups = [];
    notes.forEach(note => {
      const previous = groups[groups.length - 1];
      if (previous && Math.abs(previous[0].start - note.start) <= simultaneousWindow) previous.push(note);
      else groups.push([note]);
    });
    return groups;
  }

  function inferRole(track, notes, averagePitch, chordRatio) {
    const label = `${track.name || ''} ${track.instrument || ''}`.toLowerCase();
    if (track.channels?.includes(9) && !notes.length) return 'Drums';
    if (/bass|cello|low/.test(label) || averagePitch < 48) return 'Bass / left hand';
    if (/melody|vocal|lead|solo|right|rh\b/.test(label)) return 'Melody / right hand';
    if (/left|lh\b/.test(label)) return 'Left hand';
    if (/piano|keyboard|keys|grand/.test(label)) return chordRatio > 0.22 ? 'Piano accompaniment' : 'Piano part';
    if (chordRatio < 0.08 && averagePitch >= 55) return 'Likely melody';
    if (chordRatio > 0.28) return 'Likely accompaniment';
    return 'Playable part';
  }

  function analyzeMidiTrack(track, tempo = 120) {
    const notes = (track.notes || [])
      .filter(note => note.channel !== 9 && note.midi >= PIANO_MIN && note.midi <= PIANO_MAX && Number.isFinite(note.start))
      .sort((a, b) => a.start - b.start || a.midi - b.midi);
    if (!notes.length) {
      return {
        playable: false, role: track.channels?.includes(9) ? 'Drums' : 'No piano notes',
        difficulty: 'Not playable', stars: 0, score: 99, recommendationScore: -999,
        reason: track.channels?.includes(9) ? 'Drum track—not used for piano practice.' : 'No valid piano notes found.'
      };
    }

    const groups = groupNotes(notes);
    const chordGroups = groups.filter(group => group.length > 1);
    const min = Math.min(...notes.map(note => note.midi));
    const max = Math.max(...notes.map(note => note.midi));
    const span = max - min;
    const end = Math.max(...notes.map(note => note.start + Math.max(0.08, note.duration || 0)));
    const start = notes[0].start;
    const duration = Math.max(1, end - start);
    const density = notes.length / duration;
    const chordRatio = chordGroups.length / Math.max(1, groups.length);
    const maxPolyphony = Math.max(...groups.map(group => group.length));
    const groupPitches = groups.map(group => Math.max(...group.map(note => note.midi)));
    const jumps = groupPitches.slice(1).map((pitch, index) => Math.abs(pitch - groupPitches[index]));
    const averagePitch = notes.reduce((total, note) => total + note.midi, 0) / notes.length;
    const medianJump = median(jumps);
    const largeJumpRatio = jumps.filter(jump => jump >= 12).length / Math.max(1, jumps.length);

    let score = 0;
    score += density > 5 ? 4 : density > 3.2 ? 3 : density > 2 ? 2 : density > 1.2 ? 1 : 0;
    score += chordRatio > 0.45 ? 4 : chordRatio > 0.22 ? 3 : chordRatio > 0.08 ? 1 : 0;
    score += maxPolyphony >= 5 ? 3 : maxPolyphony >= 3 ? 2 : maxPolyphony === 2 ? 1 : 0;
    score += span > 48 ? 3 : span > 36 ? 2 : span > 24 ? 1 : 0;
    score += medianJump > 9 ? 2 : medianJump > 5 ? 1 : 0;
    score += largeJumpRatio > 0.2 ? 2 : largeJumpRatio > 0.08 ? 1 : 0;
    score += tempo > 150 ? 2 : tempo > 115 ? 1 : 0;

    const difficulty = score <= 3 ? 'Beginner' : score <= 8 ? 'Intermediate' : 'Advanced';
    const stars = difficulty === 'Beginner' ? 1 : difficulty === 'Intermediate' ? 2 : 3;
    const mostlySingle = chordRatio < 0.1;
    const comfortableRange = min >= 48 && max <= 84;
    const role = inferRole(track, notes, averagePitch, chordRatio);
    let recommendationScore = 100;
    recommendationScore -= score * 6;
    recommendationScore -= chordRatio * 55;
    recommendationScore -= Math.max(0, density - 2) * 8;
    recommendationScore -= largeJumpRatio * 30;
    recommendationScore += mostlySingle ? 18 : 0;
    recommendationScore += comfortableRange ? 12 : 0;
    recommendationScore += /melody|right hand|piano part/i.test(role) ? 10 : 0;
    recommendationScore += clamp(Math.log10(notes.length + 1) * 4, 0, 10);

    const traits = [
      mostlySingle ? 'Mostly single notes' : chordRatio < 0.3 ? 'Some chords' : 'Many chords',
      density < 1.3 ? 'Relaxed speed' : density < 3 ? 'Medium speed' : 'Fast notes',
      span <= 24 ? 'Compact range' : span <= 48 ? `Uses about ${Math.ceil((span + 1) / 12)} octaves` : 'Wide keyboard range'
    ];
    const reason = mostlySingle && comfortableRange
      ? 'Mostly single notes in a comfortable range—good for microphone practice.'
      : mostlySingle
        ? 'Mostly single notes, so it should work well for melody practice.'
        : 'Playable, but chords are simplified to their highest note when using the microphone.';

    return {
      playable: true, noteCount: notes.length, groupCount: groups.length, min, max, span, duration,
      density, chordRatio, maxPolyphony, medianJump, largeJumpRatio, averagePitch,
      role, difficulty, stars, score, recommendationScore, traits, reason
    };
  }

  function analyzeMidiTracks(tracks, tempo = 120) {
    const analyses = tracks.map(track => analyzeMidiTrack(track, tempo));
    const candidates = analyses.map((analysis, index) => ({analysis, index})).filter(item => item.analysis.playable);
    const recommendedIndex = candidates.sort((a, b) => b.analysis.recommendationScore - a.analysis.recommendationScore)[0]?.index ?? -1;
    return {analyses, recommendedIndex};
  }

  const api = {analyzeMidiTrack, analyzeMidiTracks, groupNotes};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FMQMidiAnalysis = api;
})(typeof window !== 'undefined' ? window : globalThis);
