# Audio pipeline review — v2.4.0

Both production detectors currently acquire analyser buffers and run amplitude/pitch work on the main thread. Guitar uses a 2,048-sample autocorrelation frame plus envelope-based onset gating about every 42 ms. Piano uses a 4,096-sample autocorrelation frame with confidence, stability, debounce and duplicate suppression about every 85 ms.

An AudioWorklet was investigated but is intentionally not shipped in this release. Moving buffer acquisition, RMS/noise-floor tracking and onset preprocessing is technically appropriate in current Chrome, but changing the production timing boundary before physical Chromebook baselines exist would make regressions harder to distinguish from hardware variability. The current analyser path remains the fallback design.

A later isolated experiment should move only RMS/envelope/onset preprocessing to a worklet, retain the existing pitch algorithms, use one AudioContext per active input, and compare dropped frames, CPU time and detection latency on Dell Chromebook 3100, Android Chrome and desktop Chrome. It must fall back when `audioWorklet` is unavailable and prove cleanup across pause, exit, restart, instrument switching and profile switching.
