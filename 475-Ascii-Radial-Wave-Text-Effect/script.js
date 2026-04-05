import GUI from 'https://esm.sh/lil-gui@0.20';


  /**

    How this works basically :
    1. Fill the screen with a monospace text grid
    2. On cursor move, emit expanding ring "waves"
    3. Each frame, check every cell: if inside a wave's ring, scramble it
    4. Intensity (0->1) drives which char is picked from a light->heavy palette
    5. A per-cell hash threshold dithers the edges so they look textured
    6. One DOM write per frame
  */

  const cfg = {
    dur:       2050,
    speed:     670,
    bandWidth: 268,
    shrink:    2.5,
    trail:     2.2,
    noise:     4,
    chars:     '.,·-─~+:;=*π┐┌┘╔╝║╚!?1742&35$690#@8$▀▄■░▒▓',
    charSpeed: 76,
    density:   1.25,
    minDist:   69,
    maxWaves:  16,
    fontSize:  15,
    lineHeight: 1.35,
  };

  const EXCERPT = `Many people will probably judge us callous as well as mad for thinking about the northward tunnel and the abyss so soon after our somber discovery, and I am not prepared to say that we would have immediately revived such thoughts but for a specific circumstance which broke in upon us and set up a whole new train of speculations. We had replaced the tarpaulin over poor Gedney and were standing in a kind of mute bewilderment when the sounds finally reached our consciousness—the first sounds we had heard since descending out of the open where the mountain wind whined faintly from its unearthly heights. Well-known and mundane though they were, their presence in this remote world of death was more unexpected and unnerving than any grotesque or fabulous tones could possibly have been—since they gave a fresh upsetting to all our notions of cosmic harmony. Had it been some trace of that bizarre musical piping over a wide range which Lake's dissection report had led us to expect in those others—and which, indeed, our overwrought fancies had been reading into every wind howl we had heard since coming on the camp horror—it would have had a kind of hellish congruity with the aeon-dead region around us. A voice from other epochs belongs in a graveyard of other epochs. As it was, however, the noise shattered all our profoundly seated adjustments—all our tacit acceptance of the inner antarctic as a waste utterly and irrevocably void of every vestige of normal life. What we heard was not the fabulous note of any buried blasphemy of elder earth from whose supernal toughness an age-denied polar sun had evoked a monstrous response. Instead, it was a thing so mockingly normal and so unerringly familiarized by our sea days off Victoria Land and our camp days at McMurdo Sound that we shuddered to think of it here, where such things ought not to be. To be brief—it was simply the raucous squawking of a penguin. The muffled sound floated from subglacial recesses nearly opposite to the corridor whence we had come—regions manifestly in the direction of that other tunnel to the vast abyss. The presence of a living water bird in such a direction—in a world whose surface was one of age-long and uniform lifelessness—could lead to only one conclusion; hence our first thought was to verify the objective reality of the sound. It was, indeed, repeated, and seemed at times to come from more than one throat. Seeking its source, we entered an archway from which much debris had been cleared; resuming our trail blazing—with an added paper supply taken with curious repugnance from one of the tarpaulin bundles on the sledges—when we left daylight behind. As the glaciated floor gave place to a litter of detritus, we plainly discerned some curious, dragging tracks; and once Danforth found a distinct print of a sort whose description would be only too superfluous. The course indicated by the penguin cries was precisely what our map and compass prescribed as an approach to the more northerly tunnel mouth, and we were glad to find that a bridgeless thoroughfare on the ground and basement levels seemed open. The tunnel, according to the chart, ought to start from the basement of a large pyramidal structure which we seemed vaguely to recall from our aerial survey as remarkably well-preserved. Along our path the single torch showed a customary profusion of carvings, but we did not pause to examine any of these. Suddenly a bulky white shape loomed up ahead of us, and we flashed on the second torch. It is odd how wholly this new quest had turned our minds from earlier fears of what might lurk near. Those other ones, having left their supplies in the great circular place, must have planned to return after their scouting trip toward or into the abyss; yet we had now discarded all caution concerning them as completely as if they had never existed. This white, waddling thing was fully six feet high, yet we seemed to realize at once that it was not one of those others. They were larger and dark, and, according to the sculptures, their motion over land surfaces was a swift, assured matter despite the queerness of their sea-born tentacle equipment. But to say that the white thing did not profoundly frighten us would be vain. We were indeed clutched for an instant by primitive dread almost sharper than the worst of our reasoned fears regarding those others. Then came a flash of anticlimax as the white shape sidled into a lateral archway to our left to join two others of its kind which had summoned it in raucous tones. For it was only a penguin—albeit of a huge, unknown species larger than the greatest of the known king penguins, and monstrous in its combined albinism and virtual eyelessness. When we had followed the thing into the archway and turned both our torches on the indifferent and unheeding group of three, we saw that they were all eyeless albinos of the same unknown and gigantic species. Their size reminded us of some of the archaic penguins depicted in the Old Ones' sculptures, and it did not take us long to conclude that they were descended from the same stock—undoubtedly surviving through a retreat to some warmer inner region whose perpetual blackness had destroyed their pigmentation and atrophied their eyes to mere useless slits. That their present habitat was the vast abyss we sought, was not for a moment to be doubted; and this evidence of the gulf's continued warmth and habitability filled us with the most curious and subtly perturbing fancies. We wondered, too, what had caused these three birds to venture out of their usual domain. The state and silence of the great dead city made it clear that it had at no time been an habitual seasonal rookery, whilst the manifest indifference of the trio to our presence made it seem odd that any passing party of those others should have startled them. Was it possible that those others had taken some aggressive action or tried to increase their meat supply? We doubted whether that pungent odor which the dogs had hated could cause an equal antipathy in these penguins, since their ancestors had obviously lived on excellent terms with the Old Ones—an amicable relationship which must have survived in the abyss below as long as any of the Old Ones remained. Regretting—in a flare-up of the old spirit of pure science—that we could not photograph these anomalous creatures, we shortly left them to their squawking and pushed on toward the abyss whose openness was now so positively proved to us, and whose exact direction occasional penguin tracks made clear. Not long afterward a steep descent in a long, low, doorless, and peculiarly sculptureless corridor led us to believe that we were approaching the tunnel mouth at last. We had passed two more penguins, and heard others immediately ahead. Then the corridor ended in a prodigious open space which made us gasp involuntarily—a perfect inverted hemisphere, obviously deep underground; fully a hundred feet in diameter and fifty feet high, with low archways opening around all parts of the circumference but one, and that one yawning cavernously with a black, arched aperture which broke the symmetry of the vault to a height of nearly fifteen feet. It was the entrance to the great abyss. In this vast hemisphere, whose concave roof was impressively though decadently carved to a likeness of the primordial celestial dome, a few albino penguins waddled—aliens there, but indifferent and unseeing. The black tunnel yawned indefinitely off at a steep, descending grade, its aperture adorned with grotesquely chiseled jambs and lintel. From that cryptical mouth we fancied a current of slightly warmer air, and perhaps even a suspicion of vapor proceeded; and we wondered what living entities other than penguins the limitless void below, and the contiguous honeycombings of the land and the titan mountains, might conceal. We wondered, too, whether the trace of mountaintop smoke at first suspected by poor Lake, as well as the odd haze we had ourselves perceived around the rampart-crowned peak, might not be caused by the tortuous-channeled rising of some such vapor from the unfathomed regions of earth's core. Entering the tunnel, we saw that its outline was—at least at the start—about fifteen feet each way—sides, floor, and arched roof composed of the usual megalithic masonry. The sides were sparsely decorated with cartouches of conventional designs in a late, decadent style; and all the construction and carving were marvelously well-preserved. The floor was quite clear, except for a slight detritus bearing outgoing penguin tracks and the inward tracks of these others. The farther one advanced, the warmer it became; so that we were soon unbuttoning our heavy garments. We wondered whether there were any actually igneous manifestations below, and whether the waters of that sunless sea were hot. After a short distance the masonry gave place to solid rock, though the tunnel kept the same proportions and presented the same aspect of carved regularity. Occasionally its varying grade became so steep that grooves were cut in the floor. Several times we noted the mouths of small lateral galleries not recorded in our diagrams; none of them such as to complicate the problem of our return, and all of them welcome as possible refuges in case we met unwelcome entities on their way back from the abyss. The nameless scent of such things was very distinct. Doubtless it was suicidally foolish to venture into that tunnel under the known conditions, but the lure of the unplumbed is stronger in certain persons than most suspect—indeed, it was just such a lure which had brought us to this unearthly polar waste in the first place. We saw several penguins as we passed along, and speculated on the distance we would have to traverse. The carvings had led us to expect a steep downhill walk of about a mile to the abyss, but our previous wanderings had shown us that matters of scale were not wholly to be depended on. After about a quarter of a mile that nameless scent became greatly accentuated, and we kept very careful track of the various lateral openings we passed. There was no visible vapor as at the mouth, but this was doubtless due to the lack of contrasting cooler air. The temperature was rapidly ascending, and we were not surprised to come upon a careless heap of material shudderingly familiar to us. It was composed of furs and tent cloth taken from Lake's camp, and we did not pause to study the bizarre forms into which the fabrics had been slashed. Slightly beyond this point we noticed a decided increase in the size and number of the side galleries, and concluded that the densely honeycombed region beneath the higher foothills must now have been reached. The nameless scent was now curiously mixed with another and scarcely less offensive odor—of what nature we could not guess, though we thought of decaying organisms and perhaps unknown subterranean fungi. Then came a startling expansion of the tunnel for which the carvings had not prepared us—a broadening and rising into a lofty, natural-looking elliptical cavern with a level floor, some seventy-five feet long and fifty broad, and with many immense side passages leading away into cryptical darkness. Though this cavern was natural in appearance, an inspection with both torches suggested that it had been formed by the artificial destruction of several walls between adjacent honeycombings. The walls were rough, and the high, vaulted roof was thick with stalactites; but the solid rock floor had been smoothed off, and was free from all debris, detritus, or even dust to a positively abnormal extent. Except for the avenue through which we had come, this was true of the floors of all the great galleries opening off from it; and the singularity of the condition was such as to set us vainly puzzling. The curious new fetor which had supplemented the nameless scent was excessively pungent here; so much so that it destroyed all trace of the other. Something about this whole place, with its polished and almost glistening floor, struck us as more vaguely baffling and horrible than any of the monstrous things we had previously encountered. The regularity of the passage immediately ahead, as well as the larger proportion of penguin-droppings there, prevented all confusion as to the right course amidst this plethora of equally great cave mouths. Nevertheless we resolved to resume our paper trailblazing if any further complexity should develop; for dust tracks, of course, could no longer be expected. Upon resuming our direct progress we cast a beam of torchlight over the tunnel walls—and stopped short in amazement at the supremely radical change which had come over the carvings in this part of the passage. We realized, of course, the great decadence of the Old Ones' sculpture at the time of the tunneling, and had indeed noticed the inferior workmanship of the arabesques in the stretches behind us. But now, in this deeper section beyond the cavern, there was a sudden difference wholly transcending explanation—a difference in basic nature as well as in mere quality, and involving so profound and calamitous a degradation of skill that nothing in the hitherto observed rate of decline could have led one to expect it. This new and degenerate work was coarse, bold, and wholly lacking in delicacy of detail. It was countersunk with exaggerated depth in bands following the same general line as the sparse cartouches of the earlier sections, but the height of the reliefs did not reach the level of the general surface. Danforth had the idea that it was a second carving—a sort of palimpsest formed after the obliteration of a previous design. In nature it was wholly decorative and conventional, and consisted of crude spirals and angles roughly following the quintile mathematical tradition of the Old Ones, yet seemingly more like a parody than a perpetuation of that tradition. We could not get it out of our minds that some subtly but profoundly alien element had been added to the aesthetic feeling behind the technique—an alien element, Danforth guessed, that was responsible for the laborious substitution. It was like, yet disturbingly unlike, what we had come to recognize as the Old Ones' art; and I was persistently reminded of such hybrid things as the ungainly Palmyrene sculptures fashioned in the Roman manner. That others had recently noticed this belt of carving was hinted by the presence of a used flashlight battery on the floor in front of one of the most characteristic cartouches. Since we could not afford to spend any considerable time in study, we resumed our advance after a cursory look; though frequently casting beams over the walls to see if any further decorative changes developed. Nothing of the sort was perceived, though the carvings were in places rather sparse because of the numerous mouths of smooth-floored lateral tunnels. We saw and heard fewer penguins, but thought we caught a vague suspicion of an infinitely distant chorus of them somewhere deep within the earth. The new and inexplicable odor was abominably strong, and we could detect scarcely a sign of that other nameless scent. Puffs of visible vapor ahead bespoke increasing contrasts in temperature, and the relative nearness of the sunless sea cliffs of the great abyss. Then, quite unexpectedly, we saw certain obstructions on the polished floor ahead—obstructions which were quite definitely not penguins—and turned on our second torch after making sure that the objects were quite stationary.`;
  const WORDS = EXCERPT.split(/\s+/);

  /** Deterministic hash, yeah random nums */
  function hash(x, y, z) {
    const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  /** Returns 0–1 intensity for how strongly a wave affects pixel (px,py). Returns -1 if outside. */
  function getWaveIntensity(px, py, wave, now) {
    const age = now - wave.time;
    const life = 1 - age / cfg.dur;
    const bandHalf = (cfg.bandWidth / 2) * Math.pow(life, cfg.shrink);
    if (bandHalf < 0.5) return -1;

    const front = bandHalf;
    const wake = bandHalf * cfg.trail;
    const dx = px - wave.x;
    const dy = py - wave.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = (age / 1000) * cfg.speed;

    if (dist > radius + front + cfg.noise) return -1;
    if (dist < radius - wake - cfg.noise) return -1;

    // 3 layered sine waves make the ring wobble organically
    const angle = Math.atan2(dy, dx);
    const wobble = (
      Math.sin(angle * 5 + age * 0.004) * 0.45 +
      Math.sin(angle * 8 - age * 0.006) * 0.30 +
      Math.sin(angle * 13 + age * 0.002) * 0.18
    ) * cfg.noise;

    const gap = (radius + wobble) - dist;
    if (gap < -front || gap > wake) return -1;

    const t = gap < 0 ? 1 + gap / front : 1 - gap / wake;
    return smoothstep(t);
  }

  /** Maps intensity to a character in the palette. Higher intensity -> heavier glyphs. */
  function pickChar(col, row, intensity, age, waveId) {
    const len = cfg.chars.length;
    const target = intensity * (len - 1);
    const seed = Math.floor(age / cfg.charSpeed) + waveId;
    const jitter = (hash(col, row, seed) - 0.5) * len * 0.25;
    return cfg.chars[Math.max(0, Math.min(len - 1, Math.round(target + jitter)))];
  }

  // SETUP
  const field = document.getElementById('field');
  const pre = document.createElement('pre');
  pre.style.cssText = `margin:0;padding:0;font-family:inherit;font-size:${cfg.fontSize}px;line-height:${cfg.lineHeight};white-space:pre;overflow:hidden;width:100%;height:100%`;
  field.appendChild(pre);

  let charW, lineH, cols, rows, grid;

  /** Measures the pixel width of one monospace character. */
  function measure() {
    const span = document.createElement('span');
    span.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font-size:${cfg.fontSize}px;font-family:inherit`;
    span.textContent = 'M'; // usually M is cool for measures
    field.appendChild(span);
    charW = span.getBoundingClientRect().width;
    span.remove();
    lineH = cfg.fontSize * cfg.lineHeight;
  }

  /** Fills the viewport with words, building a 2D character grid. */
  function buildGrid() {
    measure();
    const rect = field.getBoundingClientRect();
    cols = Math.ceil(rect.width / charW) + 1;
    rows = Math.ceil(rect.height / lineH) + 1;
    grid = [];
    let wi = 0;
    for (let r = 0; r < rows; r++) {
      let line = '';
      while (line.length < cols) {
        if (line.length > 0) line += ' ';
        line += WORDS[wi % WORDS.length];
        wi++;
      }
      grid.push(line.substring(0, cols).split(''));
    }
    pre.textContent = grid.map(row => row.join('')).join('\n');
  }

  // WAVES
  let waves = [];
  let waveId = 0;
  let lastX = -9999, lastY = -9999;
  let running = false;

  /** Spawns a wave if cursor moved far enough since the last one. */
  function emitWave(x, y) {
    const dx = x - lastX, dy = y - lastY;
    if (dx * dx + dy * dy < cfg.minDist * cfg.minDist) return;
    lastX = x; lastY = y;
    waves.push({ x, y, time: performance.now(), id: waveId++ });
    if (waves.length > cfg.maxWaves) waves.shift();
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  field.addEventListener('mousemove', (e) => {
    const r = field.getBoundingClientRect();
    emitWave(e.clientX - r.left, e.clientY - r.top);
  });
  field.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    const r = field.getBoundingClientRect();
    emitWave(t.clientX - r.left, t.clientY - r.top);
  }, { passive: true });
  window.addEventListener('resize', buildGrid);

  // LOOP
  function loop() {
    const now = performance.now();
    waves = waves.filter(w => now - w.time < cfg.dur);

    if (waves.length === 0) {
      pre.textContent = grid.map(row => row.join('')).join('\n');
      running = false;
      return;
    }

    let text = '';
    for (let r = 0; r < rows; r++) {
      if (r > 0) text += '\n';
      const py = r * lineH + lineH / 2;
      const rowChars = grid[r];
      if (!rowChars) continue;

      for (let c = 0; c < rowChars.length; c++) {
        const ch = rowChars[c];
        if (ch === ' ') { text += ' '; continue; }

        const px = c * charW + charW / 2;
        // Fixed per-cell threshold for dithering
        const threshold = hash(c, r, 0);
        let scrambled = false;

        for (const wave of waves) {
          const age = now - wave.time;
          const intensity = getWaveIntensity(px, py, wave, now);
          if (intensity < 0) continue;
          // break (not continue): a cell either scrambles or stays original, consistently
          if (threshold > intensity * cfg.density) break;
          text += pickChar(c, r, intensity, age, wave.id);
          scrambled = true;
          break;
        }
        if (!scrambled) text += ch;
      }
    }
    pre.textContent = text; // seems perf but there might be a better way to do it
    requestAnimationFrame(loop);
  }

  // GUI
  function setupGUI() {
    const gui = new GUI({ title: 'ASCII Wave Config' });
    gui.add(cfg, 'speed', 100, 2000, 10).name('Speed');
    gui.add(cfg, 'bandWidth', 10, 300, 1).name('Band width');
    gui.add(cfg, 'trail', 1.0, 6.0, 0.1).name('Trail');
    gui.add(cfg, 'density', 0.1, 2.0, 0.01).name('Density');
    gui.add(cfg, 'dur', 200, 3000, 10).name('Duration');
    const r = (min, max, step = 1) => Math.round((min + Math.random() * (max - min)) / step) * step;
    gui.add({ randomise() {
      cfg.speed = r(150, 1600, 10); cfg.bandWidth = r(20, 280, 1);
      cfg.trail = r(1, 5, 0.1); cfg.density = r(0.3, 1.8, 0.01);
      cfg.dur = r(400, 2800, 10);
      gui.controllersRecursive().forEach(c => c.updateDisplay());
    }}, 'randomise').name('Randomise');
    gui.domElement.addEventListener('mouseenter', e => e.stopPropagation());
    gui.domElement.addEventListener('mousemove', e => e.stopPropagation());
  }

  // Wait for font to load before measuring characters
  function init() { buildGrid(); setupGUI(); }
  if (document.fonts?.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2000))]).then(init);
  } else {
    window.addEventListener('load', init);
  }