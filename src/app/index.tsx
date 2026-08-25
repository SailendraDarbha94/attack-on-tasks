import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Path,
  RadialGradient,
  Skia,
  vec,
  Image as SkiaImage,
  useImage,
} from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSfx } from '@/audio/sfx';
import { AsteroidGlyph } from '@/components/AsteroidGlyph';
import { BodyGlyph } from '@/components/BodyGlyph';
import { BODY_SPRITES } from '@/components/bodyImages.gen';
import { CometGlyph } from '@/components/CometGlyph';
import { DustField } from '@/components/DustField';
import { FlareEffect } from '@/components/FlareEffect';
import { Starfield, useOrbitOcclusion } from '@/components/SkyAmbience';
import { useShake } from '@/components/useShake';
import { palette, spacing } from '@/constants/theme';
import { COMETS } from '@/content/comets';
import { reportLine } from '@/content/report';
import { asteroids, type AsteroidState } from '@/engine/asteroids';
import { BODY_BY_ID, EARTH, type BodyId } from '@/engine/bodies';
import { HOUR, nextSlot } from '@/engine/schedule';
import {
  HABITS,
  inboundFragments,
  LIGHT_RETURN,
  logbook,
  loggingStreak,
  MAX_MASS,
  POPULATION_PER_TASK,
  streakMultiplier,
} from '@/engine/system';
import type { Answer, HabitId } from '@/engine/types';
import { worlds as worldStates, type WorldState } from '@/engine/worlds';
import { useGame } from '@/state/game';

// The frame holds five worlds legibly. The rest are still in orbit — they are
// simply outside the crop, which is what a real plate says too.
const MAX_ON_PLANE = 5;

// Where the star sits in the measured scene: horizontally centred, low, so the
// plane opens away from the eye.
const STAR_Y = 0.55;

// Home never moves: Earth holds this anchor whatever else the plane shows.
const TILT = 0.42; // the plane seen from ~25 degrees above
const EARTH_PHASE = 2.35; // lower-left of the outermost ring, on the near side

const DAY = 24 * HOUR;

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatUntil(ms: number): string {
  if (ms <= 0) return 'now';
  const hours = ms / HOUR;
  if (hours < 1) return `in ${Math.max(1, Math.round(ms / 60_000))}m`;
  if (hours < 48) return `in ${Math.round(hours)}h`;
  return `in ${Math.round(hours / 24)}d`;
}

const formatHours = (ms: number) => `${Math.max(1, Math.round(ms / HOUR))}h`;

const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const periodText = (hours: number) =>
  hours <= 24 ? `${hours} hours` : `${Math.round(hours / 24)} days`;

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// "2d 4h" while days remain, then "4h 12m", then minutes.
function formatImpact(ms: number): string {
  const total = Math.max(0, ms);
  if (total === 0) return 'now';
  const d = Math.floor(total / DAY);
  const h = Math.floor((total % DAY) / HOUR);
  const m = Math.floor((total % HOUR) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });

// Deterministic per id, so an asteroid always falls in along the same line:
// a hashed angle picks where on the frame edge it first appeared.
function spawnPoint(id: number, ex: number, ey: number, w: number, h: number) {
  const s = Math.sin(id * 127.1 + 311.7) * 43758.5453;
  const ang = (s - Math.floor(s)) * Math.PI * 2;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const tx = dx > 0 ? (w - ex) / dx : dx < 0 ? ex / -dx : Infinity;
  const ty = dy > 0 ? (h - ey) / dy : dy < 0 ? ey / -dy : Infinity;
  const t = Math.min(tx, ty);
  return { x: ex + dx * t, y: ey + dy * t };
}

export default function OrreryScreen() {
  const { game, pending, settings, hydrated, worlds: worldList, events, asteroidsList } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [cardHabit, setCardHabit] = useState<HabitId | null>(null);
  const [cardWorldId, setCardWorldId] = useState<number | null>(null);
  const [cardAsteroidId, setCardAsteroidId] = useState<number | null>(null);
  const [homeOpen, setHomeOpen] = useState(false);
  const [cardBodyId, setCardBodyId] = useState<BodyId | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const upcoming = nextSlot(now, settings);
  const inbound = inboundFragments(events, now);
  const report = reportLine(loggingStreak(events, now));

  const states = worldStates(worldList, events, now);
  const due = states.filter((s) => s.due);
  // one planet per cadence: every world of a cadence rides the same body
  const dueGroups = groupByBody(due);
  const onPlane = dueGroups.slice(0, MAX_ON_PLANE);
  const beyond = dueGroups.length - onPlane.length;
  const ephemeris = groupByBody(states.filter((s) => !s.due));
  const incoming = asteroids(asteroidsList, events, now).filter((a) => a.inbound);

  // Proportional scene layout, measured — the plane must never push the
  // controls or the footer off-screen, whatever the device or the banner.
  const [planeH, setPlaneH] = useState(0);
  const [planeW, setPlaneW] = useState(0);
  const starX = planeW / 2;
  const starY = Math.round(planeH * STAR_Y);
  // Earth rides the outermost ring — the one that frames the whole orrery
  const earthRx = Math.max(60, planeW / 2 - 42);
  const earthRy = Math.min(
    earthRx * TILT,
    Math.max(24, planeH - starY - 64),
    Math.max(24, starY - 40),
  );
  const earthX = Math.round(starX + earthRx * Math.cos(EARTH_PHASE));
  const earthY = Math.round(starY + earthRy * Math.sin(EARTH_PHASE));
  // the corona is the only thing on screen that reads luminosity directly
  const coronaR = Math.min(
    Math.max(52, 44 + game.luminosity * 15),
    Math.max(52, Math.min(planeW * 0.42, planeH * 0.38)),
  );
  const rings = useMemo(
    () => orbitRings(onPlane.length, planeH, starY, earthRx),
    [onPlane.length, planeH, starY, earthRx],
  );

  return (
    <View style={styles.root}>
      <View
        pointerEvents="none"
        style={[styles.backdrop, { backgroundColor: skyTint(new Date(now).getHours()) }]}
      />
      <SafeAreaView style={styles.screen}>
        <Text style={styles.overline}>THE PLANE</Text>
        <Text style={styles.reportLine}>{report.line}</Text>
        <Text style={styles.reportAside}>{report.aside}</Text>

        {pending.length > 0 && (
          <Link href="/observation" asChild>
            <Pressable style={styles.cta}>
              <Text style={styles.ctaText}>
                {pending.length === 1
                  ? 'AN OBSERVATION IS DUE — LOG IT'
                  : `${pending.length} OBSERVATIONS DUE — LOG THEM`}
              </Text>
            </Pressable>
          </Link>
        )}

        {/* the plane: the star at the centre, the whole system inclined —
            worlds truly pass behind it on the far half of their rings */}
        <View
          style={styles.plane}
          onLayout={(e) => {
            setPlaneH(Math.round(e.nativeEvent.layout.height));
            setPlaneW(Math.round(e.nativeEvent.layout.width));
          }}
        >
          {planeH > 0 && (
            <>
              <View pointerEvents="none" style={styles.fill}>
                <Starfield />
              </View>
              <DustField width={planeW} height={planeH} />

              {HABITS.filter((habit) => settings.habitsEnabled[habit]).map((habit, i) => (
                <CrossingComet
                  key={habit}
                  habit={habit}
                  mass={game.comets[habit].mass}
                  bare={game.comets[habit].finisherReady}
                  forming={!game.comets[habit].alive}
                  etaMs={(() => {
                    const at = inbound.find((f) => f.habit === habit)?.at;
                    return at ? at - now : null;
                  })()}
                  planeW={planeW}
                  planeH={planeH}
                  slot={i}
                  onPress={() => setCardHabit(habit)}
                />
              ))}

              <Canvas
                pointerEvents="none"
                style={[styles.fill, { width: planeW, height: planeH }]}
              >
                <OrbitRing
                  cx={starX}
                  cy={starY}
                  rx={earthRx}
                  ry={earthRy}
                  color={EARTH.color}
                  drift={0}
                />
                {onPlane.map((group, i) => (
                  <OrbitRing
                    key={group[0].body.id}
                    cx={starX}
                    cy={starY}
                    rx={rings[i].rx}
                    ry={rings[i].ry}
                    color={group[0].body.color}
                    drift={Math.min(...group.map((g) => g.drift))}
                  />
                ))}
              </Canvas>

              <StarCore
                size={coronaR * 2}
                style={{ left: starX - coronaR, top: starY - coronaR }}
              />

              {incoming.length > 0 && (
                <Canvas
                  pointerEvents="none"
                  style={[styles.fill, { width: planeW, height: planeH }]}
                >
                  {incoming.map((a) => {
                    const spawn = spawnPoint(a.asteroid.id, earthX, earthY, planeW, planeH);
                    const x = spawn.x + (earthX - spawn.x) * a.progress;
                    const y = spawn.y + (earthY - spawn.y) * a.progress;
                    return (
                      <Line
                        key={a.asteroid.id}
                        p1={vec(x, y)}
                        p2={vec(earthX, earthY)}
                        color="rgba(217, 164, 65, 0.18)"
                        strokeWidth={1}
                      >
                        <DashPathEffect intervals={[3, 6]} />
                      </Line>
                    );
                  })}
                </Canvas>
              )}

              <HomeAnchor
                x={earthX}
                y={earthY}
                population={game.population}
                onPress={() => setHomeOpen(true)}
                onMoonPress={() => setCardBodyId('moon')}
              />

              {onPlane.map((group, i) => (
                <OrbitingWorld
                  key={group[0].body.id}
                  group={group}
                  rx={rings[i].rx}
                  ry={rings[i].ry}
                  slot={i}
                  cx={starX}
                  cy={starY}
                  onPress={() =>
                    group.length === 1
                      ? setCardWorldId(group[0].world.id)
                      : setCardBodyId(group[0].body.id)
                  }
                />
              ))}

              {incoming.map((a) => (
                <InboundAsteroid
                  key={a.asteroid.id}
                  state={a}
                  earthX={earthX}
                  earthY={earthY}
                  planeW={planeW}
                  planeH={planeH}
                  onPress={() => setCardAsteroidId(a.asteroid.id)}
                />
              ))}

              {beyond > 0 && <Text style={styles.beyond}>+{beyond} beyond the frame</Text>}
            </>
          )}
        </View>

        {ephemeris.length > 0 && (
          <View style={styles.strip}>
            <Text style={styles.stripLabel}>EPHEMERIS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stripRow}
            >
              {ephemeris.map((group) => (
                <Pressable
                  key={group[0].body.id}
                  style={styles.stripItem}
                  onPress={() =>
                    group.length === 1
                      ? setCardWorldId(group[0].world.id)
                      : setCardBodyId(group[0].body.id)
                  }
                  hitSlop={6}
                >
                  <BodyGlyph body={group[0].body} size={20} />
                  <Text style={styles.stripName} numberOfLines={1}>
                    {group.length === 1
                      ? group[0].world.name
                      : `${group[0].body.name} · ${group.length}`}
                  </Text>
                  <Text style={styles.stripDue}>
                    {formatUntil(Math.min(...group.map((g) => g.dueTs)) - now)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.controls}>
          <Pressable style={styles.controlBtn} hitSlop={8} onPress={() => setChooserOpen(true)}>
            <Text style={styles.controlGlyph}>＋</Text>
          </Pressable>
          <Link href="/observatory" asChild>
            <Pressable style={styles.controlBtn} hitSlop={8}>
              <Text style={styles.controlGlyph}>◎</Text>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable style={styles.controlBtn} hitSlop={8}>
              <Text style={styles.controlGlyph}>⚙</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerStats} numberOfLines={1}>
            LUMINOSITY {game.luminosity} · LIGHT {game.light} · POP{' '}
            {game.population.toLocaleString()}
          </Text>
          <Text style={styles.footerHint}>
            {!hydrated
              ? 'Warming the optics…'
              : upcoming
                ? `Next window in ${formatCountdown(upcoming - now)}`
                : 'No further windows scheduled.'}
          </Text>
          {inbound.map((fragment) => {
            const forming = game.comets[fragment.habit].mass;
            return (
              <Text key={fragment.habit} style={styles.inbound}>
                {forming > 0
                  ? `${COMETS[fragment.habit].name} fell — a fragment forms at mass ${Math.round(forming)}, inbound in ${formatHours(fragment.at - now)}. It eats what you do.`
                  : `${COMETS[fragment.habit].name} dispersed. Another fragment inbound in ${formatHours(fragment.at - now)}.`}
              </Text>
            );
          })}
        </View>

        <WorldCard worldId={cardWorldId} onClose={() => setCardWorldId(null)} />
        <CometCard habit={cardHabit} onClose={() => setCardHabit(null)} />
        <AsteroidCard asteroidId={cardAsteroidId} onClose={() => setCardAsteroidId(null)} />
        <HomeCard visible={homeOpen} onClose={() => setHomeOpen(false)} />
        <BodyCard
          bodyId={cardBodyId}
          states={states}
          now={now}
          onClose={() => setCardBodyId(null)}
          onOpenWorld={(id) => setCardWorldId(id)}
        />
        <TrackChooser visible={chooserOpen} onClose={() => setChooserOpen(false)} />
      </SafeAreaView>
      <Image
        source={require('../../assets/scenery/vignette.png')}
        style={styles.backdrop}
        contentFit="fill"
        pointerEvents="none"
      />
    </View>
  );
}

// The sky runs on your clock: cold before dawn, warm at dusk, deep at night.
function skyTint(hour: number): string {
  if (hour < 5) return 'rgba(7, 11, 30, 0.44)';
  if (hour < 8) return 'rgba(26, 50, 96, 0.24)';
  if (hour < 12) return 'rgba(36, 60, 102, 0.13)';
  if (hour < 16) return 'rgba(28, 44, 82, 0.09)';
  if (hour < 19) return 'rgba(120, 74, 34, 0.16)';
  if (hour < 22) return 'rgba(16, 24, 54, 0.3)';
  return 'rgba(7, 11, 30, 0.42)';
}

// Worlds sharing a cadence share a body; innermost (fastest) cadence first.
function groupByBody(list: WorldState[]): WorldState[][] {
  const byBody = new Map<BodyId, WorldState[]>();
  for (const state of list) {
    const group = byBody.get(state.body.id);
    if (group) group.push(state);
    else byBody.set(state.body.id, [state]);
  }
  return [...byBody.values()]
    .map((group) => group.sort((a, b) => a.dueTs - b.dueTs))
    .sort((a, b) => a[0].body.hours - b[0].body.hours);
}

interface Ring {
  rx: number;
  ry: number;
}

// Rings are spread inside Earth's, innermost first, all at the shared tilt;
// both halves of every ellipse must clear the frame's top and bottom.
function orbitRings(count: number, planeH: number, starY: number, earthRx: number): Ring[] {
  const maxRx = Math.max(44, earthRx * 0.78);
  const minRx = Math.max(40, maxRx * 0.42);
  const maxRy = Math.max(10, Math.min(starY - 30, planeH - starY - 40));
  return Array.from({ length: count }, (_, i) => {
    const rx = count === 1 ? (minRx + maxRx) / 2 : minRx + ((maxRx - minRx) * i) / (count - 1);
    return { rx, ry: Math.min(rx * TILT, maxRy) };
  });
}

// ── the star at the focus: a corona whose reach is your luminosity ────────
function StarCore({ size, style }: { size: number; style: { left: number; top: number } }) {
  const t = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 5400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    // the photograph turns once every ninety seconds — slow enough to feel
    spin.value = withRepeat(withTiming(1, { duration: 90_000, easing: Easing.linear }), -1, false);
    return () => {
      cancelAnimation(t);
      cancelAnimation(spin);
    };
  }, [t, spin]);

  const breathe = useAnimatedStyle(() => ({
    opacity: 0.86 + 0.14 * t.value,
    transform: [{ scale: 0.98 + 0.04 * t.value }],
  }));

  const c = size / 2;
  const disc = Math.max(14, size * 0.21); // the photosphere itself
  const sunImg = useImage(BODY_SPRITES.sun.source);
  // the sprite runs a little past the disc: its own faded coronal fringe
  const photoSide = (disc * 2) / BODY_SPRITES.sun.discFrac;
  const rotA = useDerivedValue(() => [{ rotate: spin.value * Math.PI * 2 }]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.star, { width: size, height: size }, style, breathe]}
    >
      <Canvas pointerEvents="none" style={{ width: size, height: size }}>
        {/* corona: wide falloff plus a tighter hot halo */}
        <Circle cx={c} cy={c} r={c}>
          <RadialGradient
            c={vec(c, c)}
            r={c}
            colors={[
              'rgba(255, 226, 160, 0.55)',
              'rgba(240, 156, 80, 0.26)',
              'rgba(228, 112, 58, 0.1)',
              'rgba(228, 112, 58, 0)',
            ]}
            positions={[0, 0.26, 0.5, 0.82]}
          />
        </Circle>
        <Circle cx={c} cy={c} r={disc * 1.45} color="rgba(244, 168, 84, 0.3)">
          <BlurMask blur={disc * 0.45} style="normal" />
        </Circle>

        {/* the photosphere: SDO's 171 channel run furnace-hot, white heart
            baked in offline — the sun as it actually was, burning harder */}
        <Group origin={vec(c, c)} transform={rotA}>
          {sunImg ? (
            <SkiaImage
              image={sunImg}
              x={c - photoSide / 2}
              y={c - photoSide / 2}
              width={photoSide}
              height={photoSide}
              fit="fill"
            />
          ) : (
            <Circle cx={c} cy={c} r={disc}>
              <RadialGradient
                c={vec(c - disc * 0.18, c - disc * 0.18)}
                r={disc * 1.5}
                colors={['#FFFCF0', '#FFE9B4', '#F6B65E', '#E4703A']}
                positions={[0, 0.34, 0.72, 1]}
              />
            </Circle>
          )}
        </Group>
      </Canvas>
    </Animated.View>
  );
}

// A drifted world keeps its orbit — the line just goes dashed and faint.
function OrbitRing({
  cx,
  cy,
  rx,
  ry,
  color,
  drift,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  drift: number;
}) {
  const path = useMemo(
    () => Skia.Path.Make().addOval({ x: cx - rx, y: cy - ry, width: 2 * rx, height: 2 * ry }),
    [cx, cy, rx, ry],
  );

  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={1}
      color={withAlpha(color, 0.34 - 0.18 * drift)}
    >
      {drift > 0.15 ? <DashPathEffect intervals={[5, 8]} /> : null}
    </Path>
  );
}

// ── a due world carried around its arc; tap to open its card ──────────────
function OrbitingWorld({
  group,
  rx,
  ry,
  slot,
  cx,
  cy,
  onPress,
}: {
  group: WorldState[];
  rx: number;
  ry: number;
  slot: number;
  cx: number;
  cy: number;
  onPress: () => void;
}) {
  const body = group[0].body;
  const drift = Math.min(...group.map((g) => g.drift));
  const pt = Math.min(56, Math.max(20, body.glyphPt));
  const orbit = useOrbitOcclusion({
    periodMs: 20_000 + slot * 11_000,
    phase: slot * 2.1 + 0.6,
    radiusX: rx,
    radiusY: ry,
    depthScale: 0.24,
  });
  const box = { left: cx - pt / 2, top: cy - pt / 2, width: pt, height: pt };

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.orbiter, styles.farSide, box, orbit.orbit, orbit.back]}
      >
        <BodyGlyph body={body} drift={drift} />
      </Animated.View>
      <Animated.View style={[styles.orbiter, styles.nearSide, box, orbit.orbit, orbit.front]}>
        <Pressable onPress={onPress} hitSlop={12}>
          <BodyGlyph body={body} drift={drift} />
          {group.length > 1 && (
            <View style={styles.orbBadge}>
              <Text style={styles.orbBadgeText}>{group.length}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </>
  );
}

// ── the two sungrazers, crossing the plane well above the orbit band ──────
function CrossingComet({
  habit,
  mass,
  bare,
  forming = false,
  etaMs = null,
  planeW,
  planeH,
  slot,
  onPress,
}: {
  habit: HabitId;
  mass: number;
  bare: boolean;
  /** dispersed: what crosses here is the next fragment, still far out */
  forming?: boolean;
  etaMs?: number | null;
  planeW: number;
  planeH: number;
  slot: number;
  onPress: () => void;
}) {
  const width = Math.round(planeW * 0.52);
  const height = Math.round(planeH * 0.46);
  const lane =
    slot === 0
      ? { left: -Math.round(planeW * 0.04), top: -Math.round(planeH * 0.12), rotate: '-7deg' }
      : { left: Math.round(planeW * 0.46), top: -Math.round(planeH * 0.05), rotate: '9deg' };

  if (forming) {
    // the fragment is out there, small and far — the sky is never empty
    return (
      <Pressable
        style={[
          styles.cometLane,
          styles.formingLane,
          { left: lane.left, top: lane.top, width, height, transform: [{ rotate: lane.rotate }] },
        ]}
        onPress={onPress}
      >
        <CometGlyph
          habit={habit}
          mass={mass > 0 ? mass : 100}
          width={Math.round(width * 0.48)}
          height={Math.round(height * 0.48)}
          style={{ opacity: 0.5 }}
        />
        <Text style={styles.formingCaption}>
          {COMETS[habit].name.toUpperCase()} · FORMING
          {etaMs != null && etaMs > 0 ? ` · ${formatHours(etaMs)}` : ''}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        styles.cometLane,
        { left: lane.left, top: lane.top, width, height, transform: [{ rotate: lane.rotate }] },
      ]}
      onPress={onPress}
    >
      <CometGlyph habit={habit} mass={mass} bare={bare} width={width} height={height} />
    </Pressable>
  );
}

// ── home: Earth never leaves the plane; the Moon keeps its round beside it ─
const HOME_W = 120;
const MOON_PT = 14;

function HomeAnchor({
  x,
  y,
  population,
  onPress,
  onMoonPress,
}: {
  x: number;
  y: number;
  population: number;
  onPress: () => void;
  onMoonPress: () => void;
}) {
  const moon = useOrbitOcclusion({ periodMs: 19_000, phase: 1.3, radiusX: 26, radiusY: 10 });

  return (
    <View style={[styles.homeAnchor, { left: x - HOME_W / 2, top: y - 22 }]}>
      {/* far half of the orbit: drawn under the Earth, so the disc occludes it */}
      <Animated.View pointerEvents="none" style={[styles.homeMoon, moon.orbit, moon.back]}>
        <BodyGlyph body={BODY_BY_ID.moon} size={MOON_PT} />
      </Animated.View>
      <Pressable style={styles.homeTap} onPress={onPress} hitSlop={10}>
        <BodyGlyph body={EARTH} size={44} />
        <Text style={styles.homeCaption} numberOfLines={1}>
          EARTH · pop {population.toLocaleString()}
        </Text>
      </Pressable>
      {/* near half: over the Earth, and the only copy that takes the tap */}
      <Animated.View style={[styles.homeMoon, moon.orbit, moon.front]}>
        <Pressable onPress={onMoonPress} hitSlop={14}>
          <BodyGlyph body={BODY_BY_ID.moon} size={MOON_PT} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── the body card: every world of a cadence rides the same planet ────────
function BodyCard({
  bodyId,
  states,
  now,
  onClose,
  onOpenWorld,
}: {
  bodyId: BodyId | null;
  states: WorldState[];
  now: number;
  onClose: () => void;
  onOpenWorld: (id: number) => void;
}) {
  const router = useRouter();
  if (!bodyId) return null;
  const body = BODY_BY_ID[bodyId];
  const dailies = states
    .filter((s) => s.body.id === bodyId)
    .sort((a, b) => Number(b.due) - Number(a.due) || a.dueTs - b.dueTs);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.cardBackdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.cardOverline}>{body.name.toUpperCase()}</Text>
          <Text style={styles.cardName}>
            {bodyId === 'moon'
              ? 'The dailies ride here'
              : `${dailies.length === 1 ? 'One world rides' : `${dailies.length} worlds ride`} this orbit`}
          </Text>
          <Text style={styles.cardEpithet}>
            {bodyId === 'moon'
              ? 'Its phases were the first daily calendar anyone kept.'
              : `Every ${body.hours}-hour practice shares ${body.name}'s year.`}
          </Text>

          {dailies.length === 0 ? (
            <>
              <Text style={styles.notDue}>{bodyId === 'moon' ? 'No daily practices ride the Moon yet.' : 'Nothing rides this orbit yet.'}</Text>
              <Pressable
                style={styles.closeCta}
                onPress={() => {
                  onClose();
                  router.push('/add-world');
                }}
              >
                <Text style={styles.closeCtaText}>COMMISSION A WORLD</Text>
              </Pressable>
            </>
          ) : (
            <>
              {dailies.map((d) => (
                <Pressable
                  key={d.world.id}
                  style={styles.dailyRow}
                  onPress={() => {
                    onClose();
                    onOpenWorld(d.world.id);
                  }}
                >
                  <BodyGlyph body={d.body} size={20} drift={d.drift} />
                  <Text style={styles.dailyName} numberOfLines={1}>
                    {d.world.name}
                  </Text>
                  <Text style={[styles.dailyDue, d.due && { color: palette.amber }]}>
                    {d.due ? 'due now' : formatUntil(d.dueTs - now)}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={styles.closeCta} onPress={onClose}>
                <Text style={styles.closeCtaText}>BACK TO THE PLANE</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── an inbound asteroid, falling in along its approach line ────────────────
function InboundAsteroid({
  state,
  earthX,
  earthY,
  planeW,
  planeH,
  onPress,
}: {
  state: AsteroidState;
  earthX: number;
  earthY: number;
  planeW: number;
  planeH: number;
  onPress: () => void;
}) {
  const spawn = spawnPoint(state.asteroid.id, earthX, earthY, planeW, planeH);
  const x = spawn.x + (earthX - spawn.x) * state.progress;
  const y = spawn.y + (earthY - spawn.y) * state.progress;
  const size = Math.round(14 + 30 * state.progress);

  return (
    <Pressable
      style={[styles.asteroid, { left: x - 32, top: y - size / 2 }]}
      onPress={onPress}
      hitSlop={8}
    >
      <AsteroidGlyph size={size} urgency={state.progress} />
      <Text style={styles.asteroidEta}>{formatImpact(state.msToImpact)}</Text>
    </Pressable>
  );
}

// ── the world card: ⊗ not this pass · ⓘ details · ✓ observed ──────────────
function WorldCard({ worldId, onClose }: { worldId: number | null; onClose: () => void }) {
  const { worlds: worldList, events, returnWorld, skipWorld, releaseWorld } = useGame();
  const [showDetails, setShowDetails] = useState(false);
  const [verdict, setVerdict] = useState<'observed' | 'skipped' | null>(null);
  const shake = useShake();

  useEffect(() => {
    setShowDetails(false);
    setVerdict(null);
  }, [worldId]);

  if (worldId == null) return null;
  const state = worldStates(worldList, events, Date.now()).find((w) => w.world.id === worldId);
  if (!state) return null;
  const { world, body } = state;

  const onObserved = async () => {
    if (verdict || !state.due) return;
    await returnWorld(world.id);
    setVerdict('observed');
    playSfx('resolve');
    shake.trigger(7);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 130);
  };

  const onSkip = async () => {
    if (verdict || !state.due) return;
    await skipWorld(world.id);
    setVerdict('skipped');
    Haptics.selectionAsync();
  };

  const onRelease = async () => {
    await releaseWorld(world.id);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.cardBackdrop} onPress={onClose}>
        <Animated.View style={shake.style}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardOverline}>{body.name.toUpperCase()}</Text>
            <Text style={styles.cardName}>{world.name.toUpperCase()}</Text>
            <Text style={styles.cardCadence}>{body.cadence}</Text>

            <View style={styles.cardStage}>
              <BodyGlyph
                body={body}
                size={56}
                drift={verdict === 'observed' ? 0 : state.drift}
              />
              {verdict === 'observed' && <FlareEffect size={200} />}
            </View>

            {verdict === 'observed' ? (
              <>
                <Text style={[styles.verdict, { color: palette.ice }]}>
                  Observed. It goes back on its ephemeris and the light is gathered.
                </Text>
                <Text style={styles.gain}>+{LIGHT_RETURN} LIGHT</Text>
              </>
            ) : verdict === 'skipped' ? (
              <Text style={styles.cardEpithet}>
                Not this pass. It comes around again — that is what an orbit is for.
              </Text>
            ) : (
              <Text style={styles.cardEpithet}>
                It is at the top of its arc, waiting on one observation.
              </Text>
            )}

            {showDetails && !verdict && (
              <View style={styles.details}>
                <Text style={styles.detailMeta}>
                  Comes due every {periodText(world.frequencyHours)}.
                </Text>
                <Text style={styles.detailMeta}>
                  {body.name} carries it — {body.cadence}, {body.orbitYears} Earth years to go
                  around.
                </Text>
                {state.lateDays > 0 && (
                  <Text style={styles.detailMeta}>
                    Off-ephemeris by {state.lateDays}{' '}
                    {state.lateDays === 1 ? 'day' : 'days'} — take one observation to re-acquire
                    it.
                  </Text>
                )}
                <Pressable onPress={onRelease} hitSlop={6}>
                  <Text style={styles.release}>LET IT GO DARK (remove this world)</Text>
                </Pressable>
              </View>
            )}

            {!verdict && !state.due && (
              <Text style={styles.notDue}>
                On its ephemeris — nothing to log until {formatClock(state.dueTs)}.
              </Text>
            )}

            {!verdict ? (
              <View style={styles.reportRow}>
                <ReportButton
                  glyph="⊗"
                  label="NOT THIS PASS"
                  tone="dim"
                  disabled={!state.due}
                  onPress={onSkip}
                />
                <ReportButton
                  glyph="ⓘ"
                  label="DETAILS"
                  tone="dim"
                  disabled={false}
                  onPress={() => setShowDetails((v) => !v)}
                />
                <ReportButton
                  glyph="✓"
                  label="OBSERVED"
                  tone="ice"
                  disabled={!state.due}
                  onPress={onObserved}
                />
              </View>
            ) : (
              <Pressable style={styles.closeCta} onPress={onClose}>
                <Text style={styles.closeCtaText}>BACK TO THE PLANE</Text>
              </Pressable>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── the comet card: ⊗ it flared · ⓘ details · ✓ it faded ──────────────────
function CometCard({ habit, onClose }: { habit: HabitId | null; onClose: () => void }) {
  const { game, pending, settings, answer, disperseComet } = useGame();
  const [showDetails, setShowDetails] = useState(false);
  const [verdict, setVerdict] = useState<Answer | 'perihelion' | null>(null);
  const shake = useShake();

  useEffect(() => {
    setShowDetails(false);
    setVerdict(null);
  }, [habit]);

  if (!habit) return null;
  const comet = game.comets[habit];
  const def = COMETS[habit];
  const window = pending.find((p) => p.habit === habit);
  const massPct = Math.round((comet.mass / MAX_MASS) * 100);
  const upcoming = nextSlot(Date.now(), settings);

  const onReport = async (ans: Answer) => {
    if (!window) return;
    await answer(window, ans);
    setVerdict(ans);
    if (ans === 'no') {
      playSfx('pulse');
      shake.trigger(6);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 130);
    } else {
      playSfx('surge');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const onPerihelion = async () => {
    await disperseComet(habit);
    setVerdict('perihelion');
    playSfx('resolve');
    shake.trigger(11);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 320);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.cardBackdrop} onPress={onClose}>
        <Animated.View style={shake.style}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardOverline}>{def.designation}</Text>
            <Text style={styles.cardName}>{def.name.toUpperCase()}</Text>

            <View style={styles.cometStage}>
              <CometGlyph
                habit={habit}
                mass={comet.mass}
                bare={comet.finisherReady || !comet.alive}
                width={252}
                height={158}
              />
              {(verdict === 'no' || verdict === 'perihelion') && <FlareEffect size={220} />}
            </View>

            {verdict === 'perihelion' ? (
              <Text style={[styles.verdict, { color: palette.ice }]}>
                It comes apart at perihelion. Another fragment of the same parent is inbound.
              </Text>
            ) : verdict ? (
              <>
                <Text
                  style={[
                    styles.verdict,
                    { color: verdict === 'yes' ? palette.flare : palette.ice },
                  ]}
                >
                  {verdict === 'yes' ? def.onYes : def.onNo}
                </Text>
                {verdict === 'yes' && (
                  <Text style={styles.detailMeta}>
                    {upcoming
                      ? `Next window at ${formatClock(upcoming)}.`
                      : 'Next window opens tomorrow.'}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.cardEpithet}>{def.epithet}</Text>
            )}

            <View style={styles.massTrack}>
              <View style={[styles.massFill, { width: `${massPct}%` as `${number}%` }]} />
            </View>
            <Text style={styles.massLabel}>
              MASS {comet.mass} / {MAX_MASS}
              {comet.finisherReady ? '  ·  NUCLEUS BARE' : ''}
            </Text>

            {showDetails && !verdict && (
              <View style={styles.details}>
                <Text style={styles.detailLine}>“{def.taunt}”</Text>
                <Text style={styles.detailMeta}>
                  {window
                    ? `Window open since ${formatClock(window.slotTs)} — it is waiting on your answer.`
                    : upcoming
                      ? `Nothing open right now. The next window is at ${formatClock(upcoming)}.`
                      : 'Nothing open right now.'}
                </Text>
                <Text style={styles.detailMeta}>
                  An honest answer gathers light whichever way it went. A window you never got to
                  simply passes.
                </Text>
              </View>
            )}

            {!verdict && comet.finisherReady && (
              <Pressable style={styles.finisher} onPress={onPerihelion}>
                <Text style={styles.finisherText}>☄ LET IT MAKE PERIHELION</Text>
              </Pressable>
            )}

            {!verdict && (
              <View style={styles.reportRow}>
                <ReportButton
                  glyph="⊗"
                  label="IT FLARED"
                  tone="flare"
                  disabled={!window}
                  onPress={() => onReport('yes')}
                />
                <ReportButton
                  glyph="ⓘ"
                  label="DETAILS"
                  tone="dim"
                  disabled={false}
                  onPress={() => setShowDetails((v) => !v)}
                />
                <ReportButton
                  glyph="✓"
                  label="IT FADED"
                  tone="ice"
                  disabled={!window}
                  onPress={() => onReport('no')}
                />
              </View>
            )}

            {!verdict && !window && (
              <Text style={styles.noWindow}>Nothing to report — no window open.</Text>
            )}

            {verdict && (
              <Pressable style={styles.closeCta} onPress={onClose}>
                <Text style={styles.closeCtaText}>BACK TO THE PLANE</Text>
              </Pressable>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── the asteroid card: ✓ deflected, or stand down a mistake ────────────────
function AsteroidCard({ asteroidId, onClose }: { asteroidId: number | null; onClose: () => void }) {
  const { game, events, asteroidsList, deflectAsteroid, standDownAsteroid } = useGame();
  const [showDetails, setShowDetails] = useState(false);
  const [verdict, setVerdict] = useState<'deflected' | null>(null);
  const shake = useShake();

  useEffect(() => {
    setShowDetails(false);
    setVerdict(null);
  }, [asteroidId]);

  if (asteroidId == null) return null;
  const state = asteroids(asteroidsList, events, Date.now()).find(
    (a) => a.asteroid.id === asteroidId,
  );
  if (!state) return null;
  const { asteroid } = state;
  const urgent = state.msToImpact < 6 * HOUR;
  const mult = streakMultiplier(game.observationStreak);

  const onDeflected = async () => {
    await deflectAsteroid(asteroid.id);
    setVerdict('deflected');
    playSfx('resolve');
    shake.trigger(8);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 130);
  };

  const onStandDown = async () => {
    await standDownAsteroid(asteroid.id);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.cardBackdrop} onPress={onClose}>
        <Animated.View style={shake.style}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardOverline}>NEAR-EARTH OBJECT</Text>
            <Text style={styles.cardName}>{asteroid.name.toUpperCase()}</Text>
            {!verdict && (
              <Text style={[styles.impactLine, { color: urgent ? palette.flare : palette.amber }]}>
                IMPACT IN {formatImpact(state.msToImpact)}
              </Text>
            )}
            <Text style={styles.cardCadence}>
              due {formatDate(asteroid.dueTs)} · {formatClock(asteroid.dueTs)}
            </Text>

            <View style={styles.cardStage}>
              <AsteroidGlyph size={80} urgency={verdict ? 0 : state.progress} />
              {verdict === 'deflected' && <FlareEffect size={200} />}
            </View>

            {verdict === 'deflected' ? (
              <>
                <Text style={[styles.verdict, { color: palette.ice }]}>
                  Deflected. It passes wide of home, and home grows.
                </Text>
                <Text style={styles.gain}>
                  +{POPULATION_PER_TASK.toLocaleString()} × {mult} SOULS
                </Text>
              </>
            ) : (
              <Text style={styles.cardEpithet}>
                One push before it arrives, and home never notices.
              </Text>
            )}

            {showDetails && !verdict && (
              <View style={styles.details}>
                <Text style={styles.detailMeta}>
                  Tracked {formatDate(asteroid.createdTs)} — it has crossed{' '}
                  {Math.round(state.progress * 100)}% of its approach.
                </Text>
                <Pressable onPress={onStandDown} hitSlop={6}>
                  <Text style={styles.release}>
                    ⊗ STAND DOWN (remove — for mistakes, not for mercy)
                  </Text>
                </Pressable>
              </View>
            )}

            {!verdict ? (
              <View style={styles.reportRow}>
                <ReportButton
                  glyph="ⓘ"
                  label="DETAILS"
                  tone="dim"
                  disabled={false}
                  onPress={() => setShowDetails((v) => !v)}
                />
                <ReportButton
                  glyph="✓"
                  label="DEFLECTED"
                  tone="ice"
                  disabled={false}
                  onPress={onDeflected}
                />
              </View>
            ) : (
              <Pressable style={styles.closeCta} onPress={onClose}>
                <Text style={styles.closeCtaText}>BACK TO THE PLANE</Text>
              </Pressable>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── the home card: population, the ledger, and the craters kept as record ──
function HomeCard({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { game, events, asteroidsList } = useGame();

  if (!visible) return null;
  const now = Date.now();
  const log = logbook(events);
  const streak = loggingStreak(events, now);
  const mult = streakMultiplier(streak);
  const craters = events.flatMap((e) =>
    e.type === 'asteroid_struck'
      ? [
          {
            ts: e.ts,
            name: asteroidsList.find((a) => a.id === e.asteroidId)?.name ?? 'an uncatalogued rock',
          },
        ]
      : [],
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.cardBackdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.cardOverline}>EARTH — HOME</Text>
          <BodyGlyph body={EARTH} size={44} />
          <Text style={styles.popLabel}>POPULATION</Text>
          <Text style={styles.popValue}>{game.population.toLocaleString()}</Text>
          <Text style={styles.streakLine}>
            observation streak: {streak} {streak === 1 ? 'day' : 'days'} — growth x{mult}
          </Text>

          <ScrollView style={styles.homeScroll} contentContainerStyle={styles.homeScrollInner}>
            <LedgerRow label="LUMINOSITY" value={game.luminosity} />
            <LedgerRow label="LIGHT" value={game.light} />
            <LedgerRow label="OBSERVATIONS" value={log.observations} />
            <LedgerRow label="RETURNS" value={log.returns} />
            <LedgerRow label="DEFLECTIONS" value={log.deflected} />

            <Text style={styles.craterHeader}>CRATERS</Text>
            {craters.length === 0 ? (
              <Text style={styles.craterLine}>—</Text>
            ) : (
              craters.map((c, i) => (
                <Text key={i} style={styles.craterLine}>
                  {c.name} — {formatDate(c.ts)}
                </Text>
              ))
            )}
            <Text style={styles.craterAside}>Craters are records, not verdicts.</Text>
          </ScrollView>

          <Pressable style={styles.closeCta} onPress={onClose}>
            <Text style={styles.closeCtaText}>BACK TO THE PLANE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function LedgerRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.ledgerRow}>
      <Text style={styles.ledgerLabel}>{label}</Text>
      <Text style={styles.ledgerValue}>{value.toLocaleString()}</Text>
    </View>
  );
}

// ── the ＋ chooser: a recurring practice, or a one-off with a deadline ─────
function TrackChooser({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();

  if (!visible) return null;

  const go = (asteroid: boolean) => {
    onClose();
    if (asteroid) router.push({ pathname: '/add-world', params: { mode: 'asteroid' } });
    else router.push('/add-world');
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>NEW TRACKING</Text>
          <Pressable style={styles.sheetRow} onPress={() => go(false)}>
            <Text style={styles.sheetGlyph}>◉</Text>
            <View style={styles.sheetCopy}>
              <Text style={styles.sheetLabel}>COMMISSION A WORLD</Text>
              <Text style={styles.sheetMeta}>a practice that comes back around</Text>
            </View>
          </Pressable>
          <Pressable style={styles.sheetRow} onPress={() => go(true)}>
            <Text style={styles.sheetGlyph}>✦</Text>
            <View style={styles.sheetCopy}>
              <Text style={styles.sheetLabel}>TRACK AN ASTEROID</Text>
              <Text style={styles.sheetMeta}>a one-off with a deadline</Text>
            </View>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ReportButton({
  glyph,
  label,
  tone,
  disabled,
  onPress,
}: {
  glyph: string;
  label: string;
  tone: 'flare' | 'ice' | 'dim';
  disabled: boolean;
  onPress: () => void;
}) {
  const color = tone === 'flare' ? palette.flare : tone === 'ice' ? palette.ice : palette.textDim;
  return (
    <Pressable
      style={[styles.reportBtn, { borderColor: color }, disabled && styles.reportBtnDisabled]}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
    >
      <Text style={[styles.reportGlyph, { color }]}>{glyph}</Text>
      <Text style={[styles.reportLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
  },
  overline: {
    color: palette.textDim,
    fontSize: 12,
    letterSpacing: 3,
    marginTop: spacing.lg,
  },
  reportLine: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  reportAside: {
    color: palette.textDim,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: palette.ice,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    color: palette.bg,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  plane: {
    flex: 1,
    minHeight: 200,
    marginTop: spacing.sm,
    // comets now ride in from beyond the top edge; the plane clips them
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    zIndex: 2,
  },
  farSide: {
    zIndex: 1,
  },
  orbBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: palette.raised,
    borderColor: palette.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  orbBadgeText: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '700',
  },
  nearSide: {
    zIndex: 3,
  },
  orbiter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formingLane: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  formingCaption: {
    color: palette.textDim,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  cometLane: {
    position: 'absolute',
    opacity: 0.35,
  },
  beyond: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    color: palette.textDim,
    fontSize: 11,
    letterSpacing: 1,
  },
  strip: {
    marginTop: spacing.sm,
  },
  stripLabel: {
    color: palette.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  stripRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  stripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    paddingVertical: 3,
  },
  stripName: {
    color: palette.text,
    fontSize: 12,
    maxWidth: 110,
  },
  stripDue: {
    color: palette.textDim,
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.raised,
    borderColor: palette.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlGlyph: {
    color: palette.ice,
    fontSize: 18,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  footerStats: {
    color: palette.ice,
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '600',
  },
  footerHint: {
    color: palette.textDim,
    fontSize: 12,
  },
  inbound: {
    color: palette.amber,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cardBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 5, 12, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  notDue: {
    color: palette.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
  dailyRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
  },
  dailyName: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
  },
  dailyDue: {
    color: palette.textDim,
    fontSize: 12,
  },
  cardOverline: {
    color: palette.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  cardName: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardCadence: {
    color: palette.textDim,
    fontSize: 12,
  },
  cardStage: {
    width: 200,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  cometStage: {
    width: 252,
    height: 158,
    marginVertical: spacing.xs,
  },
  cardEpithet: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  verdict: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  gain: {
    color: palette.amber,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  massTrack: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.raised,
    overflow: 'hidden',
  },
  massFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.flare,
  },
  massLabel: {
    color: palette.textDim,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  details: {
    alignSelf: 'stretch',
    borderTopColor: palette.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  detailLine: {
    color: palette.textDim,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  detailMeta: {
    color: palette.textDim,
    fontSize: 12,
    lineHeight: 17,
  },
  release: {
    color: palette.flare,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  reportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  reportBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  reportBtnDisabled: {
    opacity: 0.35,
  },
  reportGlyph: {
    fontSize: 20,
    fontWeight: '700',
  },
  reportLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  noWindow: {
    color: palette.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
  finisher: {
    alignSelf: 'stretch',
    backgroundColor: palette.flare,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  finisherText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  closeCta: {
    alignSelf: 'stretch',
    backgroundColor: palette.ice,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  closeCtaText: {
    color: palette.bg,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  homeAnchor: {
    position: 'absolute',
    zIndex: 3,
    width: HOME_W,
    alignItems: 'center',
  },
  homeTap: {
    alignItems: 'center',
    gap: 2,
  },
  homeCaption: {
    color: palette.textDim,
    fontSize: 9,
    letterSpacing: 1,
  },
  // BodyGlyph clamps small sizes up to its own minimum, so the moon sits in a
  // fixed centred box rather than trusting the requested pt.
  homeMoon: {
    position: 'absolute',
    left: HOME_W / 2 - 10,
    top: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asteroid: {
    position: 'absolute',
    zIndex: 3,
    width: 64,
    alignItems: 'center',
    gap: 1,
  },
  asteroidEta: {
    color: palette.textDim,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  impactLine: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  popLabel: {
    color: palette.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  popValue: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  streakLine: {
    color: palette.textDim,
    fontSize: 12,
  },
  homeScroll: {
    alignSelf: 'stretch',
    maxHeight: 280,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    marginTop: spacing.xs,
  },
  homeScrollInner: {
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ledgerLabel: {
    color: palette.textDim,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  ledgerValue: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
  },
  craterHeader: {
    color: palette.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  craterLine: {
    color: palette.text,
    fontSize: 12,
  },
  craterAside: {
    color: palette.textDim,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 5, 12, 0.7)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sheetTitle: {
    color: palette.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.raised,
    borderRadius: 12,
    padding: spacing.md,
  },
  sheetGlyph: {
    color: palette.ice,
    fontSize: 18,
  },
  sheetCopy: {
    flex: 1,
    gap: 2,
  },
  sheetLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sheetMeta: {
    color: palette.textDim,
    fontSize: 11,
  },
});
