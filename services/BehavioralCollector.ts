import * as Battery from "expo-battery";
import * as Cellular from "expo-cellular";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { AppState, Dimensions, Platform } from "react-native";
import { SigningService } from "./SigningService";

type Vec3 = { x: number; y: number; z: number };

type TouchKind = "tap" | "swipe" | "long";

type TouchEvent = {
  x: number;
  y: number;
  pressure: number; // 0 if unavailable
  t: number;
  phase: "start" | "end";
  eventType?: string;
};

type ScrollEvent = {
  dy: number; // signed pixels (positive = down)
  t: number;
  eventType?: string;
};

type KeystrokeEvent = {
  t: number;
  eventType?: string;
};

type DeviceInfo = {
  deviceId: string | null;
  brand: string | null;
  manufacturer: string | null;
  modelName: string | null;
  modelId: string | null;
  designName: string | null;
  productName: string | null;
  deviceYearClass: number | null;
  totalMemory: number | null;
  osName: string | null;
  osVersion: string | null;
  osBuildId: string | null;
  platformApiLevel: number | null;
  deviceType: number | null;
  isDevice: boolean;
  isRooted: boolean;
  
  // Network info
  networkType: string | null;
  networkState: string | null;
  isInternetReachable: boolean | null;
  ipAddress: string | null;
  
  // Cellular info
  carrier: string | null;
  isoCountryCode: string | null;
  mobileCountryCode: string | null;
  mobileNetworkCode: string | null;
  allowsVoip: boolean | null;
  
  // Location (coarse)
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  locationTimestamp: number | null;
};

export type EmittedBehavioralPayload = {
  payload: {
    timestamp: number;
    nonce: string;
    vector: number[];
    eventType?: string;
    deviceInfo: DeviceInfo;
  };
  signature: string;
};

export class BehavioralCollector {
  // ───── RAW BUFFERS ─────
  private accel: Vec3[] = [];
  private gyro: Vec3[] = [];

  private touches: TouchEvent[] = [];
  private scrolls: ScrollEvent[] = [];
  private keys: KeystrokeEvent[] = [];

  // For temporal feature stream (touch/scroll/key)
  private events: number[] = [];
  private lastEventType?: string;

  // ───── CONTEXT ─────
  private orientation: 0 | 1 = 0; // portrait=0 landscape=1
  private batteryLevel: number = 1; // 0..1
  private appState: 0 | 1 = 1; // foreground=1 background=0
  private deviceInfo: DeviceInfo | null = null;

  // ───── WINDOWING ─────
  private windowMs = 10000; // 1 second window
  private emissionTimer: any;
  private windowStartTs = Date.now();
  private lastEmitTs = Date.now();

  // ───── NONCE TRACKING ─────
  private getUserIdFn: (() => string) | null = null;
  private usedNonces = new Set<string>();
  private static readonly MAX_NONCE_CACHE = 10_000;

  // ───── LISTENERS ─────
  private accelSub: any = null;
  private gyroSub: any = null;
  private batterySub: any = null;
  private appStateSub: any = null;
  private dimSub: any = null;

  constructor(private onEmit?: (data: EmittedBehavioralPayload) => void, getUserId?: () => string) {
    this.getUserIdFn = getUserId ?? null;
    // Sensors
    console.log("Hello")
    Accelerometer.setUpdateInterval(50);
    Gyroscope.setUpdateInterval(50);

    this.accelSub = Accelerometer.addListener(d => {
      //console.log(d)
      this.accel.push(d)
    });
    this.gyroSub = Gyroscope.addListener(d => this.gyro.push(d));

    // Orientation
    this.updateOrientation();
    this.dimSub = Dimensions.addEventListener("change", () =>
      this.updateOrientation()
    );

    // App state (foreground/background)
    this.appState = AppState.currentState === "active" ? 1 : 0;
    this.appStateSub = AppState.addEventListener("change", state => {
      this.appState = state === "active" ? 1 : 0;
    });

    // Battery
    this.initBattery();
  }

  /* ───────────────────────── UI HOOKS ───────────────────────── */

  recordTouchStart(x: number, y: number, pressure: number = 0, eventType?: string) {
    console.log('recordTouchStart called with eventType:', eventType);
    const t = Date.now();
    this.touches.push({ x, y, pressure, t, phase: "start", eventType });
    this.events.push(t);
    this.lastEventType = eventType;
    console.log('lastEventType set to:', this.lastEventType);
    this.checkAndEmit();
  }

  recordTouchEnd(x: number, y: number, pressure: number = 0, eventType?: string) {
    const t = Date.now();
    this.touches.push({ x, y, pressure, t, phase: "end", eventType });
    this.events.push(t);
    this.lastEventType = eventType;
    this.checkAndEmit();
  }

  recordScroll(dy: number, eventType?: string) {
    const t = Date.now();
    this.scrolls.push({ dy, t, eventType });
    this.events.push(t);
    this.lastEventType = eventType;
    this.checkAndEmit();
  }

  recordKeystroke(eventType?: string) {
    const t = Date.now();
    this.keys.push({ t, eventType });
    this.events.push(t);
    this.lastEventType = eventType;
    this.checkAndEmit();
  }

  /* ───────────────────────── CONTROL ───────────────────────── */

  async start() {
    await SigningService.init();
    await this.collectDeviceInfo();
    this.windowStartTs = Date.now();
    this.lastEmitTs = Date.now();

    // Fallback timer: emit at least every 1 second even if no events
    this.emissionTimer = setInterval(() => {
      if (Date.now() - this.lastEmitTs >= this.windowMs) {
        this.emitAndReset();
      }
    }, 1000);
  }

  stop() {
    clearInterval(this.emissionTimer);

    this.accelSub?.remove?.();
    this.gyroSub?.remove?.();
    this.batterySub?.remove?.();
    this.appStateSub?.remove?.();
    this.dimSub?.remove?.();
  }

  /* ───────────────────────── FINAL EMISSION ───────────────────────── */

  /**
   * Check if we should emit based on event-driven trigger or timeout.
   * Emits immediately when event occurs OR every 1 second, whichever comes first.
   */
  private async checkAndEmit() {
    console.log("checkAndEmit")

    // Emit if 1 second has passed since last emission
    await this.emitAndReset();
  }

  /**
   * Perform emission and reset buffers.
   */
  private async generateNonce(): Promise<string> {
    const userId = this.getUserIdFn?.() ?? '';
    let nonce: string;
    do {
      const bytes = await Crypto.getRandomBytesAsync(16);
      const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      nonce = userId ? `${userId}_${hex}` : hex;
    } while (this.usedNonces.has(nonce));
    if (this.usedNonces.size >= BehavioralCollector.MAX_NONCE_CACHE) {
      this.usedNonces.clear();
    }
    this.usedNonces.add(nonce);
    return nonce;
  }

  private async emitAndReset() {
    console.log("RESET")
    const payload = await this.emitVector();
    this.onEmit?.(payload);
    this.reset();
  }

  private async emitVector(): Promise<EmittedBehavioralPayload> {
    const vector = this.extract48D();

    console.log(this.lastEventType)

    const payload = {
      timestamp: Date.now(),
      nonce: await this.generateNonce(),
      vector,
      eventType: this.lastEventType,
      deviceInfo: this.deviceInfo || await this.collectDeviceInfo(),
    };

    console.log('Emitting payload with eventType:', this.lastEventType);
    const signature = await SigningService.sign(payload);
    this.lastEmitTs = Date.now();

    return { payload, signature };
  }

  /* ───────────────────────── 48D EXTRACTION ───────────────────────── */

  private extract48D(): number[] {
    const v: number[] = [];

    // ───────── 1–6 Touch Raw ─────────
    const lastTouch = this.getLastTouch();
    const touchType = this.classifyLastTouch(); // 0/1/2

    v.push(
      lastTouch.x, // 1
      lastTouch.y, // 2
      lastTouch.pressure, // 3
      lastTouch.tRel, // 4 (ms relative to window)
      touchType, // 5
      this.touches.length // 6
    );

    // ───────── 7–9 Accel Raw ─────────
    const accelMean = this.meanVec(this.accel);
    v.push(accelMean[0], accelMean[1], accelMean[2]);

    // ───────── 10–12 Gyro Raw ─────────
    const gyroMean = this.meanVec(this.gyro);
    v.push(gyroMean[0], gyroMean[1], gyroMean[2]);

    // ───────── 13–16 Context ─────────
    // Screen_State is approximated: if app is foreground, screen is on.
    const screenState = this.appState;

    v.push(
      this.orientation, // 13
      screenState, // 14
      clamp01(this.batteryLevel), // 15
      this.appState // 16
    );

    // ───────── 17–24 Touch Derived ─────────
    const touchDerived = this.touchDerivedFeatures();
    v.push(
      touchDerived.dwellTime, // 17
      touchDerived.velocity, // 18
      touchDerived.direction, // 19
      touchDerived.jerk, // 20
      touchDerived.avgPressure, // 21
      touchDerived.frequency, // 22
      touchDerived.pathLength, // 23
      touchDerived.entropy // 24
    );

    // ───────── 25–30 Accel Dynamics ─────────
    const accelDyn = this.motionStats(this.accel);
    v.push(
      accelDyn.magnitude, // 25
      accelDyn.mean, // 26
      accelDyn.variance, // 27
      accelDyn.std, // 28
      accelDyn.energy, // 29
      accelDyn.peakCount // 30
    );

    // ───────── 31–36 Gyro Dynamics ─────────
    const gyroDyn = this.motionStats(this.gyro);
    v.push(
      gyroDyn.magnitude, // 31
      gyroDyn.mean, // 32
      gyroDyn.variance, // 33
      gyroDyn.std, // 34
      gyroDyn.energy, // 35
      gyroDyn.peakCount // 36
    );

    // ───────── 37–40 Scroll Derived ─────────
    const scroll = this.scrollDerivedFeatures();
    v.push(
      scroll.velocity, // 37
      scroll.direction, // 38
      scroll.acceleration, // 39
      scroll.pauseTime // 40
    );

    // ───────── 41–44 Temporal/Stat ─────────
    const temporal = this.temporalFeatures();
    v.push(
      temporal.interEventTime, // 41
      temporal.rhythm, // 42
      temporal.windowEntropy, // 43
      temporal.stabilityScore // 44
    );

    // ───────── 45–48 Not defined in your spec ─────────
    // Your spec ends at 44 but claims 48 total.
    // So we keep them as 0 unless you define them.
    while (v.length < 48) v.push(0);

    // ───────── Normalization ─────────
    // IMPORTANT: You did NOT specify normalization ranges.
    // So we do sane per-feature normalization below.
    return this.normalize48(v);
  }

  /* ───────────────────────── NORMALIZATION ───────────────────────── */

  private normalize48(v: number[]): number[] {
    // This is NOT “ML perfect”, it’s “consistent”.
    // You can refine later.

    const out = [...v];

    // Touch x/y: normalize to screen dims
    const { width, height } = Dimensions.get("window");
    out[0] = width ? clamp01(out[0] / width) : 0;
    out[1] = height ? clamp01(out[1] / height) : 0;

    // Pressure: already 0..1 typically
    out[2] = clamp01(out[2]);

    // Touch timestamp relative: 0..windowMs
    out[3] = clamp01(out[3] / this.windowMs);

    // Touch type: 0/1/2 -> 0..1
    out[4] = clamp01(out[4] / 2);

    // Touch count: normalize by a reasonable max (say 30 per 2s)
    out[5] = clamp01(out[5] / 30);

    // Accel raw: expo is roughly [-2,2] when normalized g
    out[6] = normRange(out[6], -2, 2);
    out[7] = normRange(out[7], -2, 2);
    out[8] = normRange(out[8], -2, 2);

    // Gyro raw: depends, use [-10,10] rad/s-ish
    out[9] = normRange(out[9], -10, 10);
    out[10] = normRange(out[10], -10, 10);
    out[11] = normRange(out[11], -10, 10);

    // Orientation, screen, app state already 0/1
    out[12] = clamp01(out[12]);
    out[13] = clamp01(out[13]);
    out[14] = clamp01(out[14]); // battery
    out[15] = clamp01(out[15]);

    // Touch derived:
    // dwellTime 0..2000ms
    out[16] = clamp01(out[16] / this.windowMs);

    // velocity px/s (cap at 5000)
    out[17] = clamp01(out[17] / 5000);

    // direction -180..180
    out[18] = normRange(out[18], -180, 180);

    // jerk cap
    out[19] = clamp01(out[19] / 500000);

    // avg pressure
    out[20] = clamp01(out[20]);

    // touch frequency touches/sec (cap 15)
    out[21] = clamp01(out[21] / 15);

    // path length px (cap 3000)
    out[22] = clamp01(out[22] / 3000);

    // touch entropy cap (0..~5)
    out[23] = clamp01(out[23] / 5);

    // Accel dynamics:
    // magnitude: typical 0..3
    out[24] = clamp01(out[24] / 3);
    out[25] = clamp01(out[25] / 3);
    out[26] = clamp01(out[26] / 2);
    out[27] = clamp01(out[27] / 2);
    out[28] = clamp01(out[28] / 10);
    out[29] = clamp01(out[29] / 50);

    // Gyro dynamics:
    out[30] = clamp01(out[30] / 15);
    out[31] = clamp01(out[31] / 15);
    out[32] = clamp01(out[32] / 50);
    out[33] = clamp01(out[33] / 10);
    out[34] = clamp01(out[34] / 500);
    out[35] = clamp01(out[35] / 50);

    // Scroll derived:
    out[36] = clamp01(out[36] / 5000); // velocity
    out[37] = normRange(out[37], -1, 1); // direction -1..1
    out[38] = clamp01(Math.abs(out[38]) / 20000); // acceleration magnitude
    out[39] = clamp01(out[39] / this.windowMs); // pause time

    // Temporal:
    out[40] = clamp01(out[40] / this.windowMs);
    out[41] = clamp01(out[41] / 500);
    out[42] = clamp01(out[42] / 5);
    out[43] = clamp01(out[43]); // already 0..1-ish

    // 45–48: remain 0..1
    out[44] = clamp01(out[44]);
    out[45] = clamp01(out[45]);
    out[46] = clamp01(out[46]);
    out[47] = clamp01(out[47]);

    return out;
  }

  /* ───────────────────────── TOUCH FEATURES ───────────────────────── */

  private getLastTouch() {
    const last = this.touches.at(-1);
    if (!last) return { x: 0, y: 0, pressure: 0, tRel: 0 };

    return {
      x: last.x,
      y: last.y,
      pressure: last.pressure || 0,
      tRel: Math.max(0, last.t - this.windowStartTs),
    };
  }

  private classifyLastTouch(): 0 | 1 | 2 {
    // Uses last start/end pair in window
    const pairs = this.getTouchPairs();
    if (!pairs.length) return 0;

    const p = pairs.at(-1)!;
    const dt = p.end.t - p.start.t;
    const dist = Math.hypot(p.end.x - p.start.x, p.end.y - p.start.y);

    // thresholds
    if (dt > 500 && dist < 10) return 2; // long press
    if (dist > 25) return 1; // swipe
    return 0; // tap
  }

  private getTouchPairs() {
    // Pair nearest start->end in order
    const pairs: {
      start: TouchEvent;
      end: TouchEvent;
    }[] = [];

    let pending: TouchEvent | null = null;

    for (const t of this.touches) {
      if (t.phase === "start") {
        pending = t;
      } else if (t.phase === "end" && pending) {
        pairs.push({ start: pending, end: t });
        pending = null;
      }
    }

    return pairs;
  }

  private touchDerivedFeatures() {
    const pairs = this.getTouchPairs();

    // Defaults
    if (!pairs.length) {
      return {
        dwellTime: 0,
        velocity: 0,
        direction: 0,
        jerk: 0,
        avgPressure: this.mean(this.touches.map(t => t.pressure || 0)),
        frequency: 0,
        pathLength: 0,
        entropy: 0,
      };
    }

    // Dwell time: mean dt
    const dwellTimes = pairs.map(p => p.end.t - p.start.t);
    const dwellTime = this.mean(dwellTimes);

    // Velocity + direction from last pair
    const last = pairs.at(-1)!;
    const dt = Math.max(1, last.end.t - last.start.t);
    const dx = last.end.x - last.start.x;
    const dy = last.end.y - last.start.y;
    const dist = Math.hypot(dx, dy);

    const velocity = (dist / dt) * 1000; // px/s
    const direction = Math.atan2(dy, dx) * (180 / Math.PI); // degrees

    // Touch jerk: based on velocities of all pairs
    const velocities = pairs.map(p => {
      const d = Math.hypot(p.end.x - p.start.x, p.end.y - p.start.y);
      const dt = Math.max(1, p.end.t - p.start.t);
      return (d / dt) * 1000; // px/s
    });

    // jerk approx: mean |dv/dt| using pair timestamps
    const jerks: number[] = [];
    for (let i = 1; i < pairs.length; i++) {
      const dv = velocities[i] - velocities[i - 1];
      const dtPairs = Math.max(1, pairs[i].start.t - pairs[i - 1].start.t);
      jerks.push(Math.abs(dv) / (dtPairs / 1000)); // px/s^2
    }
    const jerk = this.mean(jerks);

    // Avg pressure
    const avgPressure = this.mean(this.touches.map(t => t.pressure || 0));

    // Frequency touches/sec
    const windowSec = this.windowMs / 1000;
    const frequency = windowSec > 0 ? this.touches.length / windowSec : 0;

    // Path length: sum of consecutive touch points
    const pathLength = this.pathLengthFromTouchPoints();

    // Entropy of step lengths
    const steps = this.touchStepLengths();
    const entropy = this.entropy(steps);

    return {
      dwellTime,
      velocity,
      direction,
      jerk,
      avgPressure,
      frequency,
      pathLength,
      entropy,
    };
  }

  private touchStepLengths() {
    const pts = this.touches;
    const steps: number[] = [];

    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      steps.push(Math.hypot(b.x - a.x, b.y - a.y));
    }
    return steps;
  }

  private pathLengthFromTouchPoints() {
    const steps = this.touchStepLengths();
    return steps.reduce((s, x) => s + x, 0);
  }

  /* ───────────────────────── SCROLL FEATURES ───────────────────────── */

  private scrollDerivedFeatures() {
    if (this.scrolls.length < 2) {
      return {
        velocity: 0,
        direction: 0,
        acceleration: 0,
        pauseTime: 0,
      };
    }

    // velocity: mean |dy/dt|
    const velocities: number[] = [];
    for (let i = 1; i < this.scrolls.length; i++) {
      const a = this.scrolls[i - 1];
      const b = this.scrolls[i];
      const dt = Math.max(1, b.t - a.t);
      const dy = b.dy;
      velocities.push((dy / dt) * 1000); // px/s signed
    }

    const meanVel = this.mean(velocities);
    const velocity = Math.abs(meanVel);

    // direction: based on mean velocity sign
    const direction: -1 | 0 | 1 =
      meanVel > 0 ? 1 : meanVel < 0 ? -1 : 0;

    // acceleration: mean dv/dt
    const accels: number[] = [];
    for (let i = 1; i < velocities.length; i++) {
      const dv = velocities[i] - velocities[i - 1];
      const dt = Math.max(1, this.scrolls[i + 1].t - this.scrolls[i].t);
      accels.push((dv / dt) * 1000); // px/s^2
    }
    const acceleration = this.mean(accels);

    // pause time: gap between last two scroll events
    const pauseTime =
      this.scrolls.at(-1)!.t - this.scrolls.at(-2)!.t;

    return { velocity, direction, acceleration, pauseTime };
  }

  /* ───────────────────────── TEMPORAL FEATURES ───────────────────────── */

  private temporalFeatures() {
    // events includes touch+scroll+key timestamps
    const e = [...this.events].sort((a, b) => a - b);

    if (e.length < 2) {
      return {
        interEventTime: 0,
        rhythm: 0,
        windowEntropy: 0,
        stabilityScore: 1,
      };
    }

    const gaps: number[] = [];
    for (let i = 1; i < e.length; i++) gaps.push(e[i] - e[i - 1]);

    const interEventTime = this.mean(gaps);
    const rhythm = this.std(gaps);
    const windowEntropy = this.entropy(gaps);
    const stabilityScore = 1 / (1 + this.variance(gaps));

    return { interEventTime, rhythm, windowEntropy, stabilityScore };
  }

  /* ───────────────────────── MOTION FEATURES ───────────────────────── */

  private motionStats(v: Vec3[]) {
    const mags = this.magnitudes(v);

    if (!mags.length) {
      return {
        magnitude: 0,
        mean: 0,
        variance: 0,
        std: 0,
        energy: 0,
        peakCount: 0,
      };
    }

    const magnitude = mags.at(-1)!;
    const mean = this.mean(mags);
    const variance = this.variance(mags);
    const std = Math.sqrt(variance);
    const energy = this.energy(mags);
    const peakCount = this.peaks(mags);

    return { magnitude, mean, variance, std, energy, peakCount };
  }

  private magnitudes(v: Vec3[]) {
    return v.map(x => Math.sqrt(x.x ** 2 + x.y ** 2 + x.z ** 2));
  }

  /* ───────────────────────── CONTEXT HELPERS ───────────────────────── */

  private async collectDeviceInfo(): Promise<DeviceInfo> {
    try {
      // Device basic info
      const deviceId = Device.modelId || null; // Use modelId as device identifier
      const brand = Device.brand;
      const manufacturer = Device.manufacturer;
      const modelName = Device.modelName;
      const modelId = Device.modelId;
      const designName = Device.designName;
      const productName = Device.productName;
      const deviceYearClass = Device.deviceYearClass;
      const totalMemory = Device.totalMemory;
      const osName = Device.osName;
      const osVersion = Device.osVersion;
      const osBuildId = Device.osBuildId;
      const platformApiLevel = Device.platformApiLevel;
      const deviceType = Device.deviceType;
      const isDevice = Device.isDevice;

      // Check for root/jailbreak
      let isRooted = false;
      try {
        if (Platform.OS === 'android') {
          // Check for common root indicators
          isRooted = await Device.isRootedExperimentalAsync();
        } else if (Platform.OS === 'ios') {
          // iOS jailbreak detection
          isRooted = await Device.isRootedExperimentalAsync();
        }
      } catch {
        isRooted = false;
      }

      // Network info
      let networkType: string | null = null;
      let networkState: string | null = null;
      let isInternetReachable: boolean | null = null;
      let ipAddress: string | null = null;

      try {
        const netState = await Network.getNetworkStateAsync();
        networkType = netState.type || null;
        networkState = netState.isConnected ? 'connected' : 'disconnected';
        isInternetReachable = netState.isInternetReachable ?? null;
        ipAddress = await Network.getIpAddressAsync();
      } catch (e) {
        console.warn('Network info error:', e);
      }

      // Cellular info
      let carrier: string | null = null;
      let isoCountryCode: string | null = null;
      let mobileCountryCode: string | null = null;
      let mobileNetworkCode: string | null = null;
      let allowsVoip: boolean | null = null;

      try {
        carrier = await Cellular.getCarrierNameAsync();
        isoCountryCode = await Cellular.getIsoCountryCodeAsync();
        mobileCountryCode = await Cellular.getMobileCountryCodeAsync();
        mobileNetworkCode = await Cellular.getMobileNetworkCodeAsync();
        allowsVoip = await Cellular.allowsVoipAsync();
      } catch (e) {
        console.warn('Cellular info error:', e);
      }

      // Location (coarse)
      let latitude: number | null = null;
      let longitude: number | null = null;
      let locationAccuracy: number | null = null;
      let locationTimestamp: number | null = null;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
          locationAccuracy = location.coords.accuracy;
          locationTimestamp = location.timestamp;
        }
      } catch (e) {
        console.warn('Location error:', e);
      }

      const deviceInfo: DeviceInfo = {
        deviceId,
        brand,
        manufacturer,
        modelName,
        modelId,
        designName,
        productName,
        deviceYearClass,
        totalMemory,
        osName,
        osVersion,
        osBuildId,
        platformApiLevel,
        deviceType,
        isDevice,
        isRooted,
        networkType,
        networkState,
        isInternetReachable,
        ipAddress,
        carrier,
        isoCountryCode,
        mobileCountryCode,
        mobileNetworkCode,
        allowsVoip,
        latitude,
        longitude,
        locationAccuracy,
        locationTimestamp,
      };

      this.deviceInfo = deviceInfo;
      return deviceInfo;
    } catch (error) {
      console.error('Error collecting device info:', error);
      
      // Return minimal device info on error
      const fallbackInfo: DeviceInfo = {
        deviceId: null,
        brand: null,
        manufacturer: null,
        modelName: null,
        modelId: null,
        designName: null,
        productName: null,
        deviceYearClass: null,
        totalMemory: null,
        osName: Platform.OS,
        osVersion: Platform.Version?.toString() || null,
        osBuildId: null,
        platformApiLevel: null,
        deviceType: null,
        isDevice: Device.isDevice,
        isRooted: false,
        networkType: null,
        networkState: null,
        isInternetReachable: null,
        ipAddress: null,
        carrier: null,
        isoCountryCode: null,
        mobileCountryCode: null,
        mobileNetworkCode: null,
        allowsVoip: null,
        latitude: null,
        longitude: null,
        locationAccuracy: null,
        locationTimestamp: null,
      };
      
      this.deviceInfo = fallbackInfo;
      return fallbackInfo;
    }
  }

  private updateOrientation() {
    const dim = Dimensions.get("window");
    this.orientation = dim.height >= dim.width ? 0 : 1;
  }

  private async initBattery() {
    try {
      const lvl = await Battery.getBatteryLevelAsync();
      this.batteryLevel = lvl ?? 1;

      this.batterySub = Battery.addBatteryLevelListener(e => {
        this.batteryLevel = e.batteryLevel ?? this.batteryLevel;
      });
    } catch {
      // battery not available
      this.batteryLevel = 1;
    }
  }

  /* ───────────────────────── MATH HELPERS ───────────────────────── */

  private mean(a: number[]) {
    return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
  }

  private variance(a: number[]) {
    if (!a.length) return 0;
    const m = this.mean(a);
    return this.mean(a.map(v => (v - m) ** 2));
  }

  private std(a: number[]) {
    return Math.sqrt(this.variance(a));
  }

  private meanVec(v: Vec3[]) {
    return [
      this.mean(v.map(x => x.x)),
      this.mean(v.map(x => x.y)),
      this.mean(v.map(x => x.z)),
    ];
  }

  private energy(a: number[]) {
    // average energy
    return a.length ? a.reduce((s, v) => s + v * v, 0) / a.length : 0;
  }

  private peaks(a: number[], threshold: number = 0.5) {
    if (!a.length) return 0;
    const m = this.mean(a);
    return a.filter(v => Math.abs(v - m) > threshold).length;
  }

  private entropy(a: number[]) {
    if (!a.length) return 0;

    // bin gaps/steps into coarse bins
    const bins: Record<number, number> = {};
    for (const v of a) {
      const b = Math.floor(v / 50); // 50ms bins for gaps, 50px bins for steps
      bins[b] = (bins[b] || 0) + 1;
    }

    const n = a.length;
    let ent = 0;
    for (const c of Object.values(bins)) {
      const p = c / n;
      ent -= p * Math.log2(p);
    }
    return ent;
  }

  /* ───────────────────────── RESET ───────────────────────── */

  private reset() {
    this.accel = [];
    this.gyro = [];
    this.touches = [];
    this.scrolls = [];
    this.keys = [];
    this.events = [];
    this.windowStartTs = Date.now();
    this.lastEventType = "";
  }
}

/* ───────────────────────── UTIL ───────────────────────── */

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normRange(x: number, min: number, max: number) {
  if (!Number.isFinite(x)) return 0;
  if (max === min) return 0;
  return clamp01((x - min) / (max - min));
}
