import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import {
  NodeViewWrapper,
  type NodeViewProps,
} from '@tiptap/react'

import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Mic,
  Pause,
  Play,
  Plus,
  Square,
  Trash2,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  deleteAudio,
  saveAudio,
  loadAudio,
  type StoredAudioTimestamp,
} from '../utils/audioStorage.ts'

const WAVEFORM_SAMPLE_INTERVAL =
  50

const WAVEFORM_BAR_WIDTH =
  2

const WAVEFORM_BAR_GAP =
  2

const WAVEFORM_STEP =
  WAVEFORM_BAR_WIDTH +
  WAVEFORM_BAR_GAP

const WAVEFORM_MAX_BAR_HEIGHT =
  52

const PLAYBACK_WAVEFORM_INTERVAL =
  WAVEFORM_SAMPLE_INTERVAL

const PLAYBACK_PIXELS_PER_SECOND =
  WAVEFORM_STEP /
  (WAVEFORM_SAMPLE_INTERVAL / 1000)

const PLAYBACK_PLAYHEAD_RATIO =
  0.3

const PLAYBACK_DRAG_THRESHOLD =
  4

const TIMESTAMP_MARKER_WIDTH =
  2

const TIMESTAMP_CURRENT_TIME_EPSILON =
  0.04

const TIMESTAMP_COLORS = [
  '#22c55e',
  '#38bdf8',
  '#a78bfa',
  '#f97316',
  '#f43f5e',
  '#eab308',
]

type RecorderState =
  | 'idle'
  | 'recording'

type AudioTimestamp =
  StoredAudioTimestamp & {
    recordingSampleIndex?: number
  }

type PlaybackWaveformData = {
  duration: number
  waveform: number[]
}

function getWaveformSampleTime(
  index: number,
  sampleCount: number,
  duration: number,
  fallbackIntervalSeconds: number,
) {
  if (
    duration > 0 &&
    sampleCount > 1
  ) {
    return (
      index /
      (sampleCount - 1)
    ) * duration
  }

  return (
    index *
    fallbackIntervalSeconds
  )
}

function snapCanvasCoordinate(
  value: number,
  dpr: number,
) {
  return (
    Math.round(
      value *
      dpr,
    ) / dpr
  )
}

function isNativeKeyboardTarget(
  target: EventTarget | null,
) {
  return (
    target instanceof HTMLElement &&
    target.closest(
      'button, input, textarea, select',
    ) !==
    null
  )
}

function getRecordingClockNow() {
  return performance.now()
}

function getTimestampColor() {
  const index =
    Math.floor(
      Math.random() *
      TIMESTAMP_COLORS.length,
    )

  return (
    TIMESTAMP_COLORS[
      index
    ] ??
    TIMESTAMP_COLORS[0]
  )
}

function sortAudioTimestamps(
  timestamps: AudioTimestamp[],
) {
  return [
    ...timestamps,
  ].sort(
    (
      first,
      second,
    ) =>
      first.time -
      second.time,
  )
}

function normalizeAudioTimestamps(
  timestamps:
    | StoredAudioTimestamp[]
    | undefined,
) {
  if (!timestamps) {
    return []
  }

  return sortAudioTimestamps(
    timestamps.filter(
      (timestamp) =>
        typeof timestamp.id ===
        'string' &&
        typeof timestamp.name ===
        'string' &&
        typeof timestamp.time ===
        'number' &&
        Number.isFinite(
          timestamp.time,
        ) &&
        timestamp.time >= 0 &&
        typeof timestamp.color ===
        'string',
    ),
  )
}

function getCurrentAudioTimestamp(
  timestamps: AudioTimestamp[],
  currentTime: number,
) {
  let current:
    AudioTimestamp | null =
    null

  for (
    const timestamp
    of timestamps
  ) {
    if (
      timestamp.time <=
      currentTime +
      TIMESTAMP_CURRENT_TIME_EPSILON
    ) {
      current =
        timestamp
    } else {
      break
    }
  }

  return current
}

function getAdjacentAudioTimestamp(
  timestamps: AudioTimestamp[],
  currentTime: number,
  direction: 'previous' | 'next',
) {
  const seekOffset =
    0.05

  if (
    direction ===
    'next'
  ) {
    return (
      timestamps.find(
        (timestamp) =>
          timestamp.time >
          currentTime +
          seekOffset,
      ) ??
      null
    )
  }

  for (
    let index =
      timestamps.length - 1;
    index >= 0;
    index--
  ) {
    const timestamp =
      timestamps[
        index
      ]

    if (
      timestamp &&
      timestamp.time <
      currentTime -
      seekOffset
    ) {
      return timestamp
    }
  }

  return null
}

function toStoredAudioTimestamps(
  timestamps: AudioTimestamp[],
  recordingDuration: number,
  recordingClockDuration: number,
): StoredAudioTimestamp[] {
  const recordingOffset =
    Math.max(
      0,
      recordingClockDuration -
      recordingDuration,
    )

  return timestamps
    .filter(
      (timestamp) =>
        timestamp.name
          .trim()
          .length > 0,
    )
    .map(
      (timestamp) => ({
        id:
        timestamp.id,

        name:
          timestamp.name.trim(),

        time:
          recordingDuration > 0
            ? Math.min(
              Math.max(
                timestamp.time -
                recordingOffset,
                0,
              ),
              recordingDuration,
            )
            : Math.max(
              timestamp.time -
              recordingOffset,
              0,
            ),

        color:
        timestamp.color,
      }),
    )
}

function getRecordingTimestampSampleIndex(
  timestamp: AudioTimestamp,
) {
  return (
    timestamp.recordingSampleIndex ??
    Math.round(
      timestamp.time /
      (
        PLAYBACK_WAVEFORM_INTERVAL /
        1000
      ),
    )
  )
}

function fillRoundedCanvasBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const radius =
    Math.min(
      width / 2,
      height / 2,
    )

  const right =
    x +
    width

  const bottom =
    y +
    height

  context.beginPath()
  context.moveTo(
    x + radius,
    y,
  )
  context.lineTo(
    right - radius,
    y,
  )
  context.quadraticCurveTo(
    right,
    y,
    right,
    y + radius,
  )
  context.lineTo(
    right,
    bottom - radius,
  )
  context.quadraticCurveTo(
    right,
    bottom,
    right - radius,
    bottom,
  )
  context.lineTo(
    x + radius,
    bottom,
  )
  context.quadraticCurveTo(
    x,
    bottom,
    x,
    bottom - radius,
  )
  context.lineTo(
    x,
    y + radius,
  )
  context.quadraticCurveTo(
    x,
    y,
    x + radius,
    y,
  )
  context.fill()
}

async function createPlaybackWaveformFromBlob(
  blob: Blob,
  interval: number,
): Promise<PlaybackWaveformData | null> {
  let audioContext:
    AudioContext | null =
    null

  try {
    audioContext =
      new AudioContext()

    const arrayBuffer =
      await blob.arrayBuffer()

    const audioBuffer =
      await audioContext
        .decodeAudioData(
          arrayBuffer,
        )

    const samplesPerFrame =
      Math.max(
        1,
        Math.round(
          audioBuffer.sampleRate *
          (interval / 1000),
        ),
      )

    const frameCount =
      Math.max(
        1,
        Math.ceil(
          audioBuffer.length /
          samplesPerFrame,
        ),
      )

    const channels =
      Array.from(
        {
          length:
          audioBuffer.numberOfChannels,
        },
        (
          _,
          index,
        ) =>
          audioBuffer
            .getChannelData(
              index,
            ),
      )

    const waveform:
      number[] =
      []

    for (
      let frameIndex = 0;
      frameIndex < frameCount;
      frameIndex++
    ) {
      const start =
        frameIndex *
        samplesPerFrame

      const end =
        Math.min(
          start +
          samplesPerFrame,
          audioBuffer.length,
        )

      let sum =
        0

      let sampleCount =
        0

      for (
        const channel
        of channels
      ) {
        for (
          let sampleIndex = start;
          sampleIndex < end;
          sampleIndex++
        ) {
          const value =
            channel[
              sampleIndex
            ] ?? 0

          sum +=
            value *
            value

          sampleCount++
        }
      }

      const rms =
        sampleCount > 0
          ? Math.sqrt(
            sum /
            sampleCount,
          )
          : 0

      waveform.push(
        Math.min(
          1,
          rms * 5,
        ),
      )
    }

    return {
      duration:
        audioBuffer.duration,

      waveform,
    }
  } catch (error) {
    console.warn(
      'Unable to decode recorded audio waveform:',
      error,
    )

    return null
  } finally {
    void audioContext
      ?.close()
  }
}

function formatDuration(
  seconds: number,
) {
  const totalSeconds =
    Math.floor(
      seconds,
    )

  const minutes =
    Math.floor(
      totalSeconds / 60,
    )

  const remainingSeconds =
    totalSeconds % 60

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(
      2,
      '0',
    )}`
}

function AudioBlockView({
                          node,
                          updateAttributes,
                        }: NodeViewProps) {

  const [
    recorderState,
    setRecorderState,
  ] =
    useState<RecorderState>(
      'idle',
    )

  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(false)

  const [
    playbackSeconds,
    setPlaybackSeconds,
  ] =
    useState(0)

  const [
    playbackWaveformVersion,
    setPlaybackWaveformVersion,
  ] =
    useState(0)

  const [
    isStatePanelVisible,
    setIsStatePanelVisible,
  ] =
    useState(true)

  const [
    recordingTimestamps,
    setRecordingTimestamps,
  ] =
    useState<AudioTimestamp[]>(
      [],
    )

  const [
    recordingSampleCount,
    setRecordingSampleCount,
  ] =
    useState(0)

  const [
    isTimestampEditorOpen,
    setIsTimestampEditorOpen,
  ] =
    useState(false)

  const [
    timestampDraftName,
    setTimestampDraftName,
  ] =
    useState('')

  const [
    timestampDraftTime,
    setTimestampDraftTime,
  ] =
    useState(0)

  const [
    timestampAnchorElement,
    setTimestampAnchorElement,
  ] =
    useState<HTMLButtonElement | null>(
      null,
    )

  const [
    timestampFloatingElement,
    setTimestampFloatingElement,
  ] =
    useState<HTMLFormElement | null>(
      null,
    )

  const [
    isTimestampListOpen,
    setIsTimestampListOpen,
  ] =
    useState(false)

  const [
    timestampListAnchorElement,
    setTimestampListAnchorElement,
  ] =
    useState<HTMLButtonElement | null>(
      null,
    )

  const [
    timestampListFloatingElement,
    setTimestampListFloatingElement,
  ] =
    useState<HTMLDivElement | null>(
      null,
    )

  const recordingDuration =
    typeof node.attrs.duration ===
    'number'
      ? node.attrs.duration
      : 0

  type WaveformSample = {
    id: number
    amplitude: number
  }

  const [
    waveform,
    setWaveform,
  ] =
    useState<WaveformSample[]>([])

  const waveformSampleIdRef =
    useRef(0)

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] =
    useState(0)

  const [
    audioUrl,
    setAudioUrl,
  ] =
    useState<string | null>(
      null,
    )

  const [
    microphoneError,
    setMicrophoneError,
  ] =
    useState<string | null>(
      null,
    )

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null,
    )

  const mediaStreamRef =
    useRef<MediaStream | null>(
      null,
    )

  const audioContextRef =
    useRef<AudioContext | null>(
      null,
    )

  const animationFrameRef =
    useRef<number | null>(
      null,
    )

  const chunksRef =
    useRef<Blob[]>([])

  const lastWaveformSampleRef =
    useRef(0)

  const audioElementRef =
    useRef<HTMLAudioElement | null>(
      null,
    )

  const elapsedSecondsRef =
    useRef(0)

  const recordingClockStartedAtRef =
    useRef<number | null>(
      null,
    )

  const recordingPausedDurationRef =
    useRef(0)

  const recordingPauseStartedAtRef =
    useRef<number | null>(
      null,
    )

  const waveformTrackRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const waveformViewportRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const playbackCanvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    )

  const audioBlockRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const timestampNameInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const timestampSubmitMomentRef =
    useRef<{
      time: number
      recordingSampleIndex: number
    } | null>(null)

  const playbackWaveformRef =
    useRef<number[]>([])

  const playbackWaveformIntervalRef =
    useRef(
      PLAYBACK_WAVEFORM_INTERVAL,
    )

  const playbackDurationSecondsRef =
    useRef(0)

  const playbackSeekDragRef =
    useRef<{
      pointerId: number
      startClientX: number
      startClientY: number
      startPlaybackTime: number
      clickedTime: number
      hasDragged: boolean
    } | null>(null)

  const waveformCapacityRef =
    useRef(120)

  const recordedWaveformRef =
    useRef<number[]>([])

  const recordingSampleCountRef =
    useRef(0)

  const recordingTimestampsRef =
    useRef<AudioTimestamp[]>([])

  const isRecordingPausedForTimestampRef =
    useRef(false)

  const hasMountedStatePanelRef =
    useRef(false)

  const timestampCollisionBoundary =
    timestampAnchorElement?.closest(
      '[data-note-scroll-viewport]',
    ) as HTMLElement | null

  const timestampListCollisionBoundary =
    timestampListAnchorElement?.closest(
      '[data-note-scroll-viewport]',
    ) as HTMLElement | null

  const timestampCollisionPadding = {
    top: 88,
    right: 12,
    bottom: 12,
    left: 12,
  }

  const {
    floatingStyles:
      timestampEditorFloatingStyles,
    isPositioned:
      isTimestampEditorPositioned,
  } = useFloating({
    open:
      isTimestampEditorOpen,

    elements: {
      reference:
        timestampAnchorElement,

      floating:
        timestampFloatingElement,
    },

    placement:
      'bottom-start',

    strategy:
      'fixed',

    whileElementsMounted:
      autoUpdate,

    middleware: [
      offset(8),

      flip({
        boundary:
          timestampCollisionBoundary ??
          'clippingAncestors',

        padding:
          timestampCollisionPadding,

        fallbackPlacements: [
          'top-start',
          'bottom-end',
          'top-end',
        ],
      }),

      shift({
        boundary:
          timestampCollisionBoundary ??
          'clippingAncestors',

        padding:
          timestampCollisionPadding,
      }),
    ],
  })

  const {
    floatingStyles:
      timestampListFloatingStyles,
    isPositioned:
      isTimestampListPositioned,
  } = useFloating({
    open:
      isTimestampListOpen,

    elements: {
      reference:
        timestampListAnchorElement,

      floating:
        timestampListFloatingElement,
    },

    placement:
      'bottom',

    strategy:
      'fixed',

    whileElementsMounted:
      autoUpdate,

    middleware: [
      offset(8),

      flip({
        boundary:
          timestampListCollisionBoundary ??
          'clippingAncestors',

        padding:
          timestampCollisionPadding,

        fallbackPlacements: [
          'top',
          'bottom-start',
          'top-start',
        ],
      }),

      shift({
        boundary:
          timestampListCollisionBoundary ??
          'clippingAncestors',

        padding:
          timestampCollisionPadding,
      }),
    ],
  })

  useEffect(() => {
    if (
      recorderState !==
      'recording'
    ) {
      return
    }

    const viewport =
      waveformViewportRef.current

    if (!viewport) {
      return
    }

    const viewportElement =
      viewport

    function updateCapacity() {
      waveformCapacityRef.current =
        Math.ceil(
          viewportElement.clientWidth /
          WAVEFORM_STEP,
        ) + 2
    }

    updateCapacity()

    const observer =
      new ResizeObserver(
        updateCapacity,
      )

    observer.observe(
      viewportElement,
    )

    return () => {
      observer.disconnect()
    }
  }, [recorderState])

  const latestWaveformSampleId =
    waveform[
    waveform.length - 1
      ]?.id ?? null

  useLayoutEffect(() => {
    const track =
      waveformTrackRef.current

    if (!track) {
      return
    }

    track.style.transform =
      'translate3d(0, 0, 0)'
  }, [
    latestWaveformSampleId,
  ])

  function getCurrentRecordingClockTime(
    now = getRecordingClockNow(),
  ) {
    const startedAt =
      recordingClockStartedAtRef.current

    if (
      startedAt ===
      null
    ) {
      return 0
    }

    const pauseStartedAt =
      recordingPauseStartedAtRef.current

    const activePauseDuration =
      pauseStartedAt === null
        ? 0
        : now - pauseStartedAt

    return Math.max(
      0,
      (
        now -
        startedAt -
        recordingPausedDurationRef.current -
        activePauseDuration
      ) / 1000,
    )
  }

  function setSortedRecordingTimestamps(
    timestamps: AudioTimestamp[],
  ) {
    const nextTimestamps =
      sortAudioTimestamps(
        timestamps,
      )

    recordingTimestampsRef.current =
      nextTimestamps

    setRecordingTimestamps(
      nextTimestamps,
    )

    return nextTimestamps
  }

  function captureTimestampSubmitMoment() {
    const time =
      getCurrentRecordingClockTime()

    const recordingSampleIndex =
      time /
      (
        PLAYBACK_WAVEFORM_INTERVAL /
        1000
      )

    const moment = {
      time,
      recordingSampleIndex,
    }

    timestampSubmitMomentRef.current =
      moment

    setTimestampDraftTime(
      time,
    )

    return moment
  }

  async function handleStartRecording() {
    try {
      setMicrophoneError(
        null,
      )

      recordedWaveformRef.current =
        []

      recordingClockStartedAtRef.current =
        null

      recordingPausedDurationRef.current =
        0

      recordingPauseStartedAtRef.current =
        null

      recordingSampleCountRef.current =
        0

      recordingTimestampsRef.current =
        []

      isRecordingPausedForTimestampRef.current =
        false

      waveformSampleIdRef.current =
        0

      timestampSubmitMomentRef.current =
        null

      lastWaveformSampleRef.current =
        0

      setWaveform([])

      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true,
          })

      mediaStreamRef.current =
        stream

      const recorder =
        new MediaRecorder(
          stream,
        )

      mediaRecorderRef.current =
        recorder

      chunksRef.current =
        []

      recorder.ondataavailable =
        (event) => {
          if (
            event.data.size >
            0
          ) {
            chunksRef.current.push(
              event.data,
            )
          }
        }

      recorder.onstop =
        async () => {
          const mimeType =
            recorder.mimeType ||
            'audio/webm'

          const blob =
            new Blob(
              chunksRef.current,
              {
                type:
                mimeType,
              },
            )

          const audioId =
            crypto.randomUUID()

          const decodedWaveform =
            await createPlaybackWaveformFromBlob(
              blob,
              PLAYBACK_WAVEFORM_INTERVAL,
            )

          const savedWaveform =
            decodedWaveform?.waveform
              .length
              ? decodedWaveform.waveform
              : recordedWaveformRef.current

          const duration =
            decodedWaveform?.duration
              ? decodedWaveform.duration
              : elapsedSecondsRef.current

          const savedTimestamps =
            toStoredAudioTimestamps(
              recordingTimestampsRef.current,
              duration,
              elapsedSecondsRef.current,
            )

          console.table(
            recordingTimestampsRef.current.map(
              (timestamp) => ({
                name:
                timestamp.name,

                recordingTime:
                timestamp.time,

                sampleIndex:
                timestamp.recordingSampleIndex,

                convertedTime:
                  duration > 0 &&
                  elapsedSecondsRef.current > 0
                    ? (
                      timestamp.time /
                      elapsedSecondsRef.current
                    ) *
                    duration
                    : timestamp.time,
              }),
            ),
          )

          console.log({
            recordingClockDuration:
            elapsedSecondsRef.current,

            decodedAudioDuration:
            duration,

            difference:
              elapsedSecondsRef.current -
              duration,
          })

          await saveAudio(
            audioId,
            blob,
            savedWaveform,
            PLAYBACK_WAVEFORM_INTERVAL,
            savedTimestamps,
          )

          recordingTimestampsRef.current =
            savedTimestamps

          setRecordingTimestamps(
            savedTimestamps,
          )

          updateAttributes({
            audioId,
            mimeType,
            duration,
          })

          setRecorderState(
            'idle',
          )
        }

      recorder.start()

      recordingClockStartedAtRef.current =
        getRecordingClockNow()

      elapsedSecondsRef.current =
        0

      setWaveform([])
      setElapsedSeconds(0)
      setRecordingSampleCount(0)
      setRecordingTimestamps([])
      setIsTimestampEditorOpen(false)
      setIsTimestampListOpen(false)
      setTimestampDraftName('')
      setTimestampDraftTime(0)

      setRecorderState(
        'recording',
      )

      startWaveform(
        stream,
      )
    } catch (error) {
      console.error(
        'Unable to start recording:',
        error,
      )

      setMicrophoneError(
        'Microphone access was not available.',
      )
    }
  }

  function handleStopRecording() {
    const recorder =
      mediaRecorderRef.current

    if (
      !recorder ||
      recorder.state ===
      'inactive'
    ) {
      return
    }

    setIsTimestampEditorOpen(false)
    setTimestampDraftName('')
    timestampSubmitMomentRef.current =
      null

    const stoppedAtTime =
      getCurrentRecordingClockTime()

    elapsedSecondsRef.current =
      stoppedAtTime

    setElapsedSeconds(
      stoppedAtTime,
    )

    isRecordingPausedForTimestampRef.current =
      false

    recordingPauseStartedAtRef.current =
      null

    recorder.stop()

    stopWaveform()
    stopMicrophoneStream()
  }

  function openTimestampEditor() {
    const recorder =
      mediaRecorderRef.current

    if (
      !recorder ||
      recorder.state !==
      'recording' ||
      isTimestampEditorOpen ||
      isRecordingPausedForTimestampRef.current
    ) {
      return
    }

    const timestampTime =
      getCurrentRecordingClockTime()

    try {
      recorder.pause()
    } catch (error) {
      console.warn(
        'Unable to pause recording for timestamp:',
        error,
      )

      return
    }

    isRecordingPausedForTimestampRef.current =
      true

    recordingPauseStartedAtRef.current =
      getRecordingClockNow()

    elapsedSecondsRef.current =
      timestampTime

    setElapsedSeconds(
      timestampTime,
    )

    const track =
      waveformTrackRef.current

    if (track) {
      track.style.transform =
        'translate3d(0, 0, 0)'
    }

    setTimestampDraftTime(
      timestampTime,
    )

    timestampSubmitMomentRef.current =
      null

    setTimestampDraftName('')
    setIsTimestampEditorOpen(true)
  }

  function closeTimestampEditor() {
    const recorder =
      mediaRecorderRef.current

    const pauseStartedAt =
      recordingPauseStartedAtRef.current

    if (
      isRecordingPausedForTimestampRef.current &&
      recorder?.state ===
      'paused'
    ) {
      try {
        recorder.resume()
      } catch (error) {
        console.warn(
          'Unable to resume recording after timestamp:',
          error,
        )
      }
    }

    if (
      pauseStartedAt !==
      null
    ) {
      recordingPausedDurationRef.current +=
        getRecordingClockNow() -
        pauseStartedAt
    }

    recordingPauseStartedAtRef.current =
      null

    isRecordingPausedForTimestampRef.current =
      false

    lastWaveformSampleRef.current =
      0

    setIsTimestampEditorOpen(false)
    setTimestampDraftName('')
  }

  function handleTimestampSubmit() {
    const name =
      timestampDraftName.trim()

    if (!name) {
      timestampSubmitMomentRef.current =
        null

      timestampNameInputRef.current
        ?.focus()

      return
    }

    const submitMoment =
      timestampSubmitMomentRef.current ??
      captureTimestampSubmitMoment()

    setSortedRecordingTimestamps([
      ...recordingTimestampsRef.current,
      {
        id:
          crypto.randomUUID(),

        name,

        time:
          submitMoment.time,

        color:
          getTimestampColor(),

        recordingSampleIndex:
          submitMoment.recordingSampleIndex,
      },
    ])

    timestampSubmitMomentRef.current =
      null

    closeTimestampEditor()
  }

  function handleTimestampCancel() {
    timestampSubmitMomentRef.current =
      null

    closeTimestampEditor()
  }

  function handleTimestampButtonPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (
      event.button !== 0
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    openTimestampEditor()
  }

  function handleTimestampButtonClick(
    event: ReactMouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()
    openTimestampEditor()
  }

  function stopMicrophoneStream() {
    mediaStreamRef.current
      ?.getTracks()
      .forEach(
        (track) => {
          track.stop()
        },
      )

    mediaStreamRef.current =
      null
  }

  function startWaveform(
    stream: MediaStream,
  ) {
    const audioContext =
      new AudioContext()

    audioContextRef.current =
      audioContext

    const source =
      audioContext
        .createMediaStreamSource(
          stream,
        )

    const analyser =
      audioContext
        .createAnalyser()

    analyser.fftSize =
      256

    source.connect(
      analyser,
    )

    const samples =
      new Uint8Array(
        analyser.frequencyBinCount,
      )

    function updateWaveform(
      timestamp: number,
    ) {
      const track =
        waveformTrackRef.current

      if (isRecordingPausedForTimestampRef.current) {
        lastWaveformSampleRef.current =
          0

        if (track) {
          track.style.transform =
            'translate3d(0, 0, 0)'
        }

        animationFrameRef.current =
          requestAnimationFrame(
            updateWaveform,
          )

        return
      }

      analyser
        .getByteTimeDomainData(
          samples,
        )

      elapsedSecondsRef.current =
        getCurrentRecordingClockTime(
          timestamp,
        )

      if (
        lastWaveformSampleRef.current ===
        0
      ) {
        lastWaveformSampleRef.current =
          timestamp
      }

      const timeSinceLastSample =
        timestamp -
        lastWaveformSampleRef.current

      const movementProgress =
        Math.min(
          1,
          timeSinceLastSample /
          WAVEFORM_SAMPLE_INTERVAL,
        )

      if (track) {
        track.style.transform =
          `translate3d(${
            -movementProgress *
            WAVEFORM_STEP
          }px, 0, 0)`
      }

      /*
       * About 20 visual samples
       * per second.
       */
      if (
        timeSinceLastSample >=
        WAVEFORM_SAMPLE_INTERVAL
      ) {
        const samplesToAdd =
          Math.max(
            1,
            Math.floor(
              timeSinceLastSample /
              WAVEFORM_SAMPLE_INTERVAL,
            ),
          )

        lastWaveformSampleRef.current +=
          samplesToAdd *
          WAVEFORM_SAMPLE_INTERVAL

        let sum =
          0

        for (
          const value
          of samples
          ) {
          const normalized =
            (
              value -
              128
            ) / 128

          sum +=
            normalized *
            normalized
        }

        const rms =
          Math.sqrt(
            sum /
            samples.length,
          )

        /*
         * Voice amplitude tends to
         * be fairly small, so amplify
         * it for visualization.
         */
        const amplitude =
          Math.min(
            1,
            rms * 5,
          )

        const newSamples:
          WaveformSample[] =
          []

        for (
          let sampleIndex =
            0;
          sampleIndex <
          samplesToAdd;
          sampleIndex++
        ) {
          recordedWaveformRef.current.push(
            amplitude,
          )

          newSamples.push(
            {
              id:
                waveformSampleIdRef.current++,

              amplitude,
            },
          )
        }

        recordingSampleCountRef.current =
          recordedWaveformRef.current
            .length

        setRecordingSampleCount(
          recordingSampleCountRef.current,
        )

        const capacity =
          waveformCapacityRef.current

        setWaveform(
          (current) => {
            const samplesToKeep =
              Math.max(
                0,
                capacity -
                newSamples.length,
              )

            return [
              ...(
                samplesToKeep > 0
                  ? current.slice(
                    -samplesToKeep,
                  )
                  : []
              ),
              ...newSamples,
            ]
          },
        )

        setElapsedSeconds(
          elapsedSecondsRef.current,
        )
      }

      animationFrameRef.current =
        requestAnimationFrame(
          updateWaveform,
        )
    }

    animationFrameRef.current =
      requestAnimationFrame(
        updateWaveform,
      )
  }

  function stopWaveform() {
    if (
      animationFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current,
      )

      animationFrameRef.current =
        null
    }

    void audioContextRef.current
      ?.close()

    audioContextRef.current =
      null
  }

  const audioId =
    typeof node.attrs.audioId ===
    'string'
      ? node.attrs.audioId
      : null

  const hasRecording =
    audioId !== null

  const statePanelMode =
    recorderState ===
    'recording'
      ? 'recording'
      : hasRecording
        ? 'playback'
        : 'empty'

  const statePanelStyle:
    CSSProperties = {
      opacity:
        isStatePanelVisible
          ? 1
          : 0,

      transform:
        isStatePanelVisible
          ? 'translate3d(0, 0, 0)'
          : 'translate3d(0, 4px, 0)',

      transition:
        'opacity 180ms ease, transform 180ms ease',
    }

  useLayoutEffect(() => {
    if (!hasMountedStatePanelRef.current) {
      hasMountedStatePanelRef.current =
        true

      return
    }

    setIsStatePanelVisible(
      false,
    )

    const frame =
      requestAnimationFrame(
        () => {
          setIsStatePanelVisible(
            true,
          )
        },
      )

    return () => {
      cancelAnimationFrame(
        frame,
      )
    }
  }, [
    statePanelMode,
  ])

  const getPlaybackTimeline =
    useCallback(() => {
      const waveform =
        playbackWaveformRef.current

      const fallbackIntervalSeconds =
        playbackWaveformIntervalRef.current /
        1000

      const waveformDuration =
        waveform.length > 1
          ? (
            waveform.length - 1
          ) * fallbackIntervalSeconds
          : 0

      const duration =
        playbackDurationSecondsRef.current > 0
          ? playbackDurationSecondsRef.current
          : recordingDuration > 0
            ? recordingDuration
            : waveformDuration

      const pixelsPerSecond =
        duration > 0 &&
        waveform.length > 1
          ? (
            (waveform.length - 1) *
            WAVEFORM_STEP
          ) / duration
          : PLAYBACK_PIXELS_PER_SECOND

      return {
        duration,
        pixelsPerSecond,
      }
    }, [
      recordingDuration,
    ])

  useEffect(() => {
    playbackDurationSecondsRef.current =
      0

    recordingTimestampsRef.current =
      []

    timestampSubmitMomentRef.current =
      null

    if (!audioId) {
      return
    }

    let cancelled =
      false

    let objectUrl:
      string | null =
      null

    void loadAudio(
      audioId,
    ).then(
      async (stored) => {
        if (
          cancelled
        ) {
          return
        }

        if (!stored) {
          timestampSubmitMomentRef.current =
            null

          setRecordingTimestamps([])

          return
        }

        playbackWaveformRef.current =
          stored.waveform

        playbackWaveformIntervalRef.current =
          stored.waveformInterval

        const storedTimestamps =
          normalizeAudioTimestamps(
            stored.timestamps,
          )

        recordingTimestampsRef.current =
          storedTimestamps

        setRecordingTimestamps(
          storedTimestamps,
        )

        setPlaybackWaveformVersion(
          (version) =>
            version + 1,
        )

        objectUrl =
          URL.createObjectURL(
            stored.blob
          )

        setAudioUrl(
          objectUrl,
        )

        const decodedWaveform =
          await createPlaybackWaveformFromBlob(
            stored.blob,
            PLAYBACK_WAVEFORM_INTERVAL,
          )

        if (
          cancelled ||
          !decodedWaveform?.waveform
            .length
        ) {
          return
        }

        playbackWaveformRef.current =
          decodedWaveform.waveform

        playbackWaveformIntervalRef.current =
          PLAYBACK_WAVEFORM_INTERVAL

        if (
          Number.isFinite(
            decodedWaveform.duration,
          ) &&
          decodedWaveform.duration > 0
        ) {
          playbackDurationSecondsRef.current =
            decodedWaveform.duration
        }

        setPlaybackWaveformVersion(
          (version) =>
            version + 1,
        )
      },
    )

    return () => {
      cancelled =
        true

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl,
        )
      }
    }
  }, [audioId])

  useEffect(() => {
    if (!isTimestampEditorOpen) {
      return
    }

    const frame =
      requestAnimationFrame(
        () => {
          timestampNameInputRef.current
            ?.focus()
        },
      )

    return () => {
      cancelAnimationFrame(
        frame,
      )
    }
  }, [
    isTimestampEditorOpen,
  ])

  useEffect(() => {
    if (!isTimestampListOpen) {
      return
    }

    function handlePointerDown(
      event: PointerEvent,
    ) {
      const target =
        event.target

      if (
        target instanceof Node &&
        (
          timestampListFloatingElement
            ?.contains(target) ||
          timestampListAnchorElement
            ?.contains(target)
        )
      ) {
        return
      }

      setIsTimestampListOpen(false)
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        setIsTimestampListOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    )

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    isTimestampListOpen,
    timestampListAnchorElement,
    timestampListFloatingElement,
  ])

  async function handleTogglePlayback() {
    const audio =
      audioElementRef.current

    if (!audio) {
      return
    }

    if (audio.paused) {
      await audio.play()
    } else {
      audio.pause()
    }
  }

  function focusAudioBlock() {
    audioBlockRef.current
      ?.focus({
        preventScroll:
          true,
      })
  }

  function handleAudioBlockMouseDownCapture(
    event: ReactMouseEvent<HTMLDivElement>,
  ) {
    if (
      event.target instanceof Node &&
      (
        timestampFloatingElement
          ?.contains(
            event.target,
          ) ||
        timestampListFloatingElement
          ?.contains(
            event.target,
          )
      )
    ) {
      return
    }

    focusAudioBlock()
  }

  function handleAudioBlockKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    if (
      (
        event.key !== ' ' &&
        event.code !== 'Space'
      ) ||
      event.repeat ||
      isNativeKeyboardTarget(
        event.target,
      ) ||
      recorderState === 'recording' ||
      !hasRecording ||
      !audioUrl
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    void handleTogglePlayback()
  }

  function handlePlaybackSeek(
    value: number,
  ) {
    const audio =
      audioElementRef.current

    const {
      duration,
    } =
      getPlaybackTimeline()

    const nextValue =
      Math.min(
        Math.max(
          value,
          0,
        ),
        duration,
      )

    if (audio) {
      audio.currentTime =
        nextValue
    }

    setPlaybackSeconds(
      nextValue,
    )

    drawPlaybackWaveform(
      nextValue,
    )
  }

  function handleTimestampNavigation(
    direction: 'previous' | 'next',
  ) {
    const audio =
      audioElementRef.current

    const currentTime =
      audio?.currentTime ??
      playbackSeconds

    const targetTimestamp =
      getAdjacentAudioTimestamp(
        recordingTimestampsRef.current,
        currentTime,
        direction,
      )

    if (!targetTimestamp) {
      return
    }

    handlePlaybackSeek(
      targetTimestamp.time,
    )
  }

  function handleTimestampListToggle(
    event: ReactMouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (
      recordingTimestamps.length ===
      0
    ) {
      return
    }

    setIsTimestampListOpen(
      (isOpen) =>
        !isOpen,
    )
  }

  function handleTimestampListSelect(
    timestamp: AudioTimestamp,
  ) {
    handlePlaybackSeek(
      timestamp.time,
    )

    setIsTimestampListOpen(false)
    focusAudioBlock()
  }

  function getPlaybackTimeAtPointer(
    clientX: number,
    baseTime: number,
  ) {
    const canvas =
      playbackCanvasRef.current

    if (!canvas) {
      return baseTime
    }

    const rect =
      canvas.getBoundingClientRect()

    const {
      pixelsPerSecond,
    } =
      getPlaybackTimeline()

    const playheadX =
      rect.width *
      PLAYBACK_PLAYHEAD_RATIO

    const pointerX =
      clientX -
      rect.left

    return (
      baseTime +
      (
        pointerX -
        playheadX
      ) /
      pixelsPerSecond
    )
  }

  function handlePlaybackSeekStart(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (!audioUrl) {
      return
    }

    focusAudioBlock()

    event.preventDefault()
    event.stopPropagation()

    event.currentTarget
      .setPointerCapture(
        event.pointerId,
      )

    const audio =
      audioElementRef.current

    const currentTime =
      audio?.currentTime ??
      playbackSeconds

    const clickedTime =
      getPlaybackTimeAtPointer(
        event.clientX,
        currentTime,
      )

    playbackSeekDragRef.current = {
      pointerId:
        event.pointerId,

      startClientX:
        event.clientX,

      startClientY:
        event.clientY,

      startPlaybackTime:
        currentTime,

      clickedTime,

      hasDragged:
        false,
    }
  }

  function handlePlaybackSeekMove(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    const drag =
      playbackSeekDragRef.current

    if (
      !drag ||
      drag.pointerId !==
      event.pointerId
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const deltaX =
      event.clientX -
      drag.startClientX

    const deltaY =
      event.clientY -
      drag.startClientY

    if (!drag.hasDragged) {
      const movement =
        Math.hypot(
          deltaX,
          deltaY,
        )

      if (
        movement <
        PLAYBACK_DRAG_THRESHOLD
      ) {
        return
      }

      drag.hasDragged =
        true
    }

    const {
      pixelsPerSecond,
    } =
      getPlaybackTimeline()

    handlePlaybackSeek(
      drag.startPlaybackTime -
      deltaX /
      pixelsPerSecond,
    )
  }

  function finishPlaybackSeekInteraction(
    event: ReactPointerEvent<HTMLDivElement>,
    shouldCommitClick: boolean,
  ) {
    const drag =
      playbackSeekDragRef.current

    if (
      !drag ||
      drag.pointerId !==
      event.pointerId
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const shouldSeek =
      shouldCommitClick &&
      !drag.hasDragged

    if (
      event.currentTarget
        .hasPointerCapture(
          drag.pointerId,
        )
    ) {
      event.currentTarget
        .releasePointerCapture(
          drag.pointerId,
        )
    }

    playbackSeekDragRef.current =
      null

    if (!shouldSeek) {
      return
    }

    handlePlaybackSeek(
      drag.clickedTime,
    )
  }

  function handlePlaybackSeekEnd(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    finishPlaybackSeekInteraction(
      event,
      true,
    )
  }

  function handlePlaybackSeekCancel(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    finishPlaybackSeekInteraction(
      event,
      false,
    )
  }

  async function handleDeleteRecording() {
    if (!audioId) {
      return
    }

    audioElementRef.current
      ?.pause()

    await deleteAudio(
      audioId,
    )

    setAudioUrl(
      null,
    )

    setIsPlaying(
      false,
    )

    setPlaybackSeconds(
      0,
    )

    playbackDurationSecondsRef.current =
      0

    playbackWaveformRef.current =
      []

    playbackWaveformIntervalRef.current =
      PLAYBACK_WAVEFORM_INTERVAL

    recordingTimestampsRef.current =
      []

    timestampSubmitMomentRef.current =
      null

    setRecordingTimestamps([])
    setIsTimestampEditorOpen(false)
    setIsTimestampListOpen(false)
    setTimestampDraftName('')

    setPlaybackWaveformVersion(
      (version) =>
        version + 1,
    )

    updateAttributes({
      audioId:
        null,

      duration:
        null,

      mimeType:
        null,
    })
  }

  const drawPlaybackWaveform =
    useCallback(
      (
        currentTime: number,
      ) => {
        const canvas =
          playbackCanvasRef.current

        if (!canvas) {
          return
        }

        const context =
          canvas.getContext(
            '2d',
          )

        if (!context) {
          return
        }

        const rect =
          canvas.getBoundingClientRect()

        const dpr =
          window.devicePixelRatio

        const width =
          rect.width

        const height =
          rect.height

        const canvasWidth =
          Math.round(
            width * dpr,
          )

        const canvasHeight =
          Math.round(
            height * dpr,
          )

        if (
          canvas.width !==
          canvasWidth ||
          canvas.height !==
          canvasHeight
        ) {
          canvas.width =
            canvasWidth

          canvas.height =
            canvasHeight
        }

        context.setTransform(
          dpr,
          0,
          0,
          dpr,
          0,
          0,
        )

        context.clearRect(
          0,
          0,
          width,
          height,
        )

        const waveform =
          playbackWaveformRef.current

        const playheadX =
          width *
          PLAYBACK_PLAYHEAD_RATIO

        const {
          duration:
          playbackDuration,

          pixelsPerSecond,
        } =
          getPlaybackTimeline()

        const computedStyle =
          window.getComputedStyle(
            canvas,
          )

        context.fillStyle =
          computedStyle.color

        context.globalAlpha =
          0.5

        const intervalSeconds =
          playbackWaveformIntervalRef
            .current / 1000

        waveform.forEach(
          (
            amplitude,
            index,
          ) => {
            const sampleTime =
              getWaveformSampleTime(
                index,
                waveform.length,
                playbackDuration,
                intervalSeconds,
              )

            const x =
              playheadX +
              (
                sampleTime -
                currentTime
              ) *
              pixelsPerSecond

            const snappedX =
              snapCanvasCoordinate(
                x,
                dpr,
              )

            if (
              snappedX <
              -WAVEFORM_STEP ||
              snappedX >
              width + WAVEFORM_STEP
            ) {
              return
            }

            const barHeight =
              snapCanvasCoordinate(
                Math.max(
                  4,
                  amplitude *
                  WAVEFORM_MAX_BAR_HEIGHT,
                ),
                dpr,
              )

            const barX =
              snapCanvasCoordinate(
                snappedX -
                WAVEFORM_BAR_WIDTH / 2,
                dpr,
              )

            const barY =
              snapCanvasCoordinate(
                height / 2 -
                barHeight / 2,
                dpr,
              )

            fillRoundedCanvasBar(
              context,
              barX,
              barY,
              WAVEFORM_BAR_WIDTH,
              barHeight,
            )
          },
        )

        recordingTimestampsRef.current
          .forEach(
            (timestamp) => {
              const x =
                playheadX +
                (
                  timestamp.time -
                  currentTime
                ) *
                pixelsPerSecond

              const snappedX =
                snapCanvasCoordinate(
                  x,
                  dpr,
                )

              if (
                snappedX <
                -WAVEFORM_STEP ||
                snappedX >
                width + WAVEFORM_STEP
              ) {
                return
              }

              context.fillStyle =
                timestamp.color

              context.globalAlpha =
                0.95

              fillRoundedCanvasBar(
                context,
                snapCanvasCoordinate(
                  snappedX -
                  TIMESTAMP_MARKER_WIDTH / 2,
                  dpr,
                ),
                snapCanvasCoordinate(
                  4,
                  dpr,
                ),
                TIMESTAMP_MARKER_WIDTH,
                snapCanvasCoordinate(
                  height - 8,
                  dpr,
                ),
              )
            },
          )

        context.globalAlpha =
          1
      },
      [
        getPlaybackTimeline,
      ],
    )

  const playbackAnimationFrameRef =
    useRef<number | null>(
      null,
    )

  function startPlaybackAnimation() {
    function update() {
      const audio =
        audioElementRef.current

      if (!audio) {
        return
      }

      drawPlaybackWaveform(
        audio.currentTime,
      )

      if (
        !audio.paused &&
        !audio.ended
      ) {
        playbackAnimationFrameRef.current =
          requestAnimationFrame(
            update,
          )
      }
    }

    playbackAnimationFrameRef.current =
      requestAnimationFrame(
        update,
      )
  }

  function stopPlaybackAnimation() {
    if (
      playbackAnimationFrameRef.current ===
      null
    ) {
      return
    }

    cancelAnimationFrame(
      playbackAnimationFrameRef.current,
    )

    playbackAnimationFrameRef.current =
      null
  }


  useEffect(() => {
    if (!audioUrl) {
      return
    }

    const frame =
      requestAnimationFrame(
        () => {
          const currentTime =
            audioElementRef.current
              ?.currentTime ??
            0

          drawPlaybackWaveform(
            currentTime,
          )
        },
      )

    return () => {
      cancelAnimationFrame(
        frame,
      )
    }
  }, [
    audioUrl,
    drawPlaybackWaveform,
    playbackWaveformVersion,
  ])

  useEffect(() => {
    const audio =
      audioElementRef.current

    return () => {
      audio?.pause()
    }
  }, [audioUrl])

  useEffect(() => {
    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current,
        )
      }

      if (
        playbackAnimationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          playbackAnimationFrameRef.current,
        )
      }

      const recorder =
        mediaRecorderRef.current

      if (
        recorder &&
        recorder.state !==
        'inactive'
      ) {
        /*
         * Don't save a recording after
         * the block itself has vanished.
         */
        recorder.onstop =
          null

        recorder.stop()
      }

      mediaStreamRef.current
        ?.getTracks()
        .forEach(
          (track) => {
            track.stop()
          },
        )

      void audioContextRef.current
        ?.close()
    }
  }, [])

  const currentPlaybackTimestamp =
    getCurrentAudioTimestamp(
      recordingTimestamps,
      playbackSeconds,
    )

  const previousPlaybackTimestamp =
    getAdjacentAudioTimestamp(
      recordingTimestamps,
      playbackSeconds,
      'previous',
    )

  const nextPlaybackTimestamp =
    getAdjacentAudioTimestamp(
      recordingTimestamps,
      playbackSeconds,
      'next',
    )

  const visibleRecordingTimestamps =
    recordingTimestamps

  const displayedTimestampDraftTime =
    isTimestampEditorOpen &&
    recorderState ===
    'recording'
      ? elapsedSeconds
      : timestampDraftTime

  const shouldShowTimestampList =
    isTimestampListOpen &&
    timestampListAnchorElement !==
    null &&
    recordingTimestamps.length > 0

  return (
    <NodeViewWrapper
      ref={audioBlockRef}

      tabIndex={
        hasRecording &&
        recorderState !==
        'recording'
          ? 0
          : -1
      }

	      onMouseDownCapture={
	        handleAudioBlockMouseDownCapture
	      }

      onKeyDown={
        handleAudioBlockKeyDown
      }

      className="
        dash-audio-block
        relative

        my-3
        overflow-hidden
        outline-none
        px-4

        glass-surface
      "
    >
      <div
        contentEditable={false}
      >
        {!hasRecording &&
          recorderState === 'idle' && (
            <div
              style={
                statePanelStyle
              }

              className="
              flex
              min-h-40
              flex-col
              items-center
              justify-center
              gap-4

              rounded-xl
            "
            >
              <div
                className="
                flex
                h-12
                w-12
                items-center
                justify-center

                rounded-full
                bg-surface-hover

                text-foreground-secondary
              "
              >
                <AudioLines
                  size={20}
                />
              </div>

              <div
                className="
                flex
                flex-col
                items-center
                gap-1
              "
              >
                <div
                  className="
                  text-sm
                  font-medium
                  text-foreground
                "
                >
                  Record audio
                </div>

                <div
                  className="
                  text-xs
                  text-muted
                "
                >
                  Capture a voice recording
                </div>
                {microphoneError && (
                  <div
                    className="
                      mt-1
                      text-xs
                      text-red-500
                    "
                  >
                    {microphoneError}
                  </div>
                )}
              </div>

              <button
                type="button"

                onMouseDown={(
                  event,
                ) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}

                onClick={handleStartRecording}

                className="
                  flex
                  cursor-pointer
                  items-center
                  gap-2

                  rounded-full
                  bg-surface-hover

                  px-4
                  py-2

                  text-xs
                  font-medium
                  text-foreground

                  transition-colors

                  hover:bg-surface-hover/70
                "
              >
                <Mic
                  size={14}
                />

                Start recording
              </button>
            </div>
          )}
        {recorderState ===
          'recording' && (
            <div
              style={
                statePanelStyle
              }

              className="
                relative
                flex
                min-h-40
                flex-col
                justify-center
                gap-5
                w-full

                px-5
                py-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <div
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-red-500
                    "
                  />

                  <span
                    className="
                      text-sm
                      font-medium
                      text-foreground
                    "
                  >
                    Recording
                  </span>

                  <button
                    ref={
                      setTimestampAnchorElement
                    }

                    type="button"

                    disabled={
                      isTimestampEditorOpen
                    }

                    onPointerDown={
                      handleTimestampButtonPointerDown
                    }

                    onClick={
                      handleTimestampButtonClick
                    }

                    className="
                      flex
                      h-6
                      w-6
                      cursor-pointer
                      items-center
                      justify-center

                      rounded-full
                      text-muted
                      transition-colors

                      hover:bg-surface-hover
                      hover:text-foreground

                      disabled:cursor-default
                      disabled:opacity-40
                    "
                  >
                    <Plus
                      size={14}
                    />
                  </button>
                </div>

                <span
                  className="
                    font-mono
                    text-xs
                    text-muted
                    h-8
                  "
                >
                  {formatDuration(
                    elapsedSeconds,
                  )}
                </span>
              </div>

	              <div
                className="
                flex
                w-full
                min-w-0
                items-center
                gap-4
                "
              >
                <button
                  type="button"

                  onMouseDown={(
                    event,
                  ) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}

                  onClick={
                    handleStopRecording
                  }

                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500/10

                    text-xs
                    font-medium
                    text-red-500

                    transition-colors

                    hover:bg-red-500/15
                  "
                >
                  <Square size={18}/>
                </button>

                <div
                  ref={waveformViewportRef}
                  className="
                  relative
                  flex
                  h-16
                  min-w-0
                  flex-1
                  items-center
                  overflow-hidden
                "
                >
                  <div
                    ref={waveformTrackRef}
                    className="
                    absolute
                    inset-y-0
                    right-0
                    flex
                    items-center
                    justify-end
                    gap-[2px]
                    will-change-transform
                  "
                  >
                    {visibleRecordingTimestamps.map(
                      (timestamp) => (
                        <div
                          key={
                            timestamp.id
                          }

                          title={
                            timestamp.name
                          }

                          className="
                            pointer-events-none
                            absolute
                            bottom-1
                            top-1
                            z-10

                            w-0.5
                            rounded-full
                          "

                          style={{
                            backgroundColor:
                              timestamp.color,

                            right:
                              `${Math.max(
                                0,
                                (
                                  recordingSampleCount -
                                  getRecordingTimestampSampleIndex(
                                    timestamp,
                                  )
                                ) *
                                WAVEFORM_STEP,
                              )}px`,
                          }}
                        />
                      ),
                    )}

                    {waveform.map(
                      ({
                         id,
                         amplitude}) =>
                        (
                          <div
                            key={id}

                            className="
                          w-[2px]
                          shrink-0
                          rounded-full

                          bg-foreground/50
                        "

                            style={{
                              height:
                                `${Math.max(
                                  4,
                                  amplitude *
                                  WAVEFORM_MAX_BAR_HEIGHT,
                                )}px`,
                            }}
                          />
                        ),
                    )}
                  </div>

                  <div
                    className="
                    absolute
                    right-0
                    top-1/2

                    h-14
                    w-px

                    -translate-y-1/2

                    bg-red-500
                  "
                  />
                </div>
              </div>
            </div>
          )}

        {hasRecording &&
          recorderState !==
          'recording' && (
            <div
              style={
                statePanelStyle
              }

              className="
                flex
                min-h-40
                flex-col
                justify-center
                gap-5
                w-full

                px-5
                py-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <AudioLines
                    size={16}
                    className="
                      text-foreground-secondary
                    "
                  />

                  <span
                    className="
                      text-sm
                      font-medium
                      text-foreground
                    "
                  >
                    Playback
                  </span>

                  {recordingTimestamps.length >
                    0 && (
                    <div
                      className="
                        ml-1
                        flex
                        h-7
                        min-w-0
                        items-center
                        gap-1

                        rounded-full
                        bg-surface-hover/60
                        px-1
                      "
                    >
                      <button
                        type="button"

                        disabled={
                          !previousPlaybackTimestamp
                        }

                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}

                        onClick={() => {
                          handleTimestampNavigation(
                            'previous',
                          )
                        }}

                        className="
                          flex
                          h-6
                          w-6
                          shrink-0
                          cursor-pointer
                          items-center
                          justify-center

                          rounded-full
                          text-muted
                          transition-colors

                          hover:bg-surface-hover
                          hover:text-foreground

                          disabled:cursor-default
                          disabled:opacity-35
                        "
                      >
                        <ChevronLeft
                          size={14}
                        />
                      </button>

	                      {currentPlaybackTimestamp && (
	                        <button
	                          ref={
	                            setTimestampListAnchorElement
	                          }

	                          type="button"

	                          aria-expanded={
	                            isTimestampListOpen
	                          }

	                          onMouseDown={(event) => {
	                            event.preventDefault()
	                            event.stopPropagation()
	                          }}

	                          onClick={
	                            handleTimestampListToggle
	                          }

	                          className="
	                            flex
	                            max-w-36
	                            min-w-0
	                            items-center
	                            gap-1.5
	                            rounded-full
	                            px-1.5
	                            py-0.5
	                            transition-colors

	                            hover:bg-surface-hover
	                          "
	                        >
                          <span
                            className="
                              h-2
                              w-2
                              shrink-0
                              rounded-full
                            "

                            style={{
                              backgroundColor:
                                currentPlaybackTimestamp
                                  .color,
                            }}
                          />

	                          <span
	                            className="
	                              truncate
	                              text-xs
	                              text-foreground
                            "
                          >
	                            {currentPlaybackTimestamp
	                              .name}
	                          </span>
	                        </button>
	                      )}

                      <button
                        type="button"

                        disabled={
                          !nextPlaybackTimestamp
                        }

                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}

                        onClick={() => {
                          handleTimestampNavigation(
                            'next',
                          )
                        }}

                        className="
                          flex
                          h-6
                          w-6
                          shrink-0
                          cursor-pointer
                          items-center
                          justify-center

                          rounded-full
                          text-muted
                          transition-colors

                          hover:bg-surface-hover
                          hover:text-foreground

                          disabled:cursor-default
                          disabled:opacity-35
                        "
                      >
                        <ChevronRight
                          size={14}
                        />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"

                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}

                  onClick={
                    handleDeleteRecording
                  }

                  className="
                    flex
                    h-8
                    w-8
                    cursor-pointer
                    items-center
                    justify-center

                    rounded-full

                    text-muted
                    transition-colors

                    hover:text-red-500
                  "
                >
                  <Trash2
                    size={15}
                  />
                </button>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-4
                "
              >
                <button
                  type="button"

                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}

                  onClick={
                    handleTogglePlayback
                  }

                  disabled={!audioUrl}

                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center

                    rounded-full
                    bg-surface-hover

                    text-foreground

                    transition-transform
                    duration-150

                    hover:scale-105
                    active:scale-95

                    disabled:cursor-default
                    disabled:opacity-40
                  "
                >
                  {isPlaying
                    ? (
                      <Pause
                        size={18}
                        fill="currentColor"
                      />
                    )
                    : (
                      <Play
                        size={18}
                        fill="currentColor"
                        className="
                          translate-x-px
                        "
                      />
                    )}
                </button>

                <div
                  className="
                    flex
                    min-w-0
                    flex-1
                    flex-col
                    gap-2
                  "
                >
                  <div
                    className="
                      relative
                      h-16
                      w-full
                    "
                  >
                    <div
                      onPointerDown={
                        handlePlaybackSeekStart
                      }

                      onPointerMove={
                        handlePlaybackSeekMove
                      }

                      onPointerUp={
                        handlePlaybackSeekEnd
                      }

                      onPointerCancel={
                        handlePlaybackSeekCancel
                      }

                      className="
                        relative
                        h-full
                        min-w-0
                        flex-1
                        cursor-ew-resize
                        overflow-hidden
                        touch-none
                      "
                    >
                      <canvas
                        ref={playbackCanvasRef}
                        className="
                          h-full
                          w-full
                          text-foreground
                        "
                      />

                      <div
                        className="
                          pointer-events-none
                          absolute
                          bottom-1
                          top-1

                          w-px
                          -translate-x-1/2

                          bg-red-500
                        "
                        style={{
                          left:
                            `${
                              PLAYBACK_PLAYHEAD_RATIO *
                              100
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {audioUrl && (
                <audio
                  ref={
                    audioElementRef
                  }

                  src={
                    audioUrl
                  }

                  onPlay={() => {
                    setIsPlaying(
                      true,
                    )

                    startPlaybackAnimation()
                  }}

                  onPause={(event) => {
                    setIsPlaying(
                      false,
                    )

                    stopPlaybackAnimation()

                    drawPlaybackWaveform(
                      event.currentTarget
                        .currentTime,
                    )
                  }}

                  onTimeUpdate={(event) => {
                    drawPlaybackWaveform(
                      event.currentTarget
                        .currentTime,
                    )

                    setPlaybackSeconds(
                      event.currentTarget
                        .currentTime,
                    )
                  }}

                  onLoadedMetadata={(event) => {
                    const duration =
                      event.currentTarget
                        .duration

                    if (
                      Number.isFinite(
                        duration,
                      ) &&
                      duration > 0
                    ) {
                      playbackDurationSecondsRef.current =
                        duration

                      drawPlaybackWaveform(
                        event.currentTarget
                          .currentTime,
                      )
                    }
                  }}

                  onEnded={() => {
                    stopPlaybackAnimation()

                    setIsPlaying(
                      false,
                    )

                    setPlaybackSeconds(
                      0,
                    )

                    drawPlaybackWaveform(
                      0,
                    )
                  }}
                />
              )}
            </div>
          )}
	      </div>

	      {isTimestampEditorOpen && (
	        <FloatingPortal>
	          <form
	            ref={
	              setTimestampFloatingElement
	            }

            style={
              {
                ...timestampEditorFloatingStyles,

                visibility:
                  isTimestampEditorPositioned
                    ? 'visible'
                    : 'hidden',
              }
            }

	            data-editor-popup

	            onMouseDown={(event) => {
	              event.stopPropagation()
	            }}

	            onSubmit={(event) => {
	              event.preventDefault()
	              event.stopPropagation()
	              handleTimestampSubmit()
	            }}

	            className="
	              glass-surface
	              z-120

	              flex
	              w-64
	              flex-col
	              gap-3

	              rounded-2xl
	              p-5
	              shadow-2xl
	            "
	          >
	            <div
	              className="
	                flex
	                items-center
	                justify-between
	                gap-3
	              "
	            >
	              <span
	                className="
	                  text-xs
	                  font-medium
	                  text-foreground
	                "
	              >
	                Timestamp
	              </span>

	              <span
	                className="
	                  font-mono
	                  text-[11px]
	                  text-muted
	                "
	              >
	                {formatDuration(
	                  displayedTimestampDraftTime,
	                )}
	              </span>
	            </div>

	            <input
	              ref={
	                timestampNameInputRef
	              }

	              value={
	                timestampDraftName
	              }

	              onChange={(event) => {
	                setTimestampDraftName(
	                  event.target.value,
	                )
	              }}

	              onKeyDown={(event) => {
	                if (
	                  event.key ===
	                  'Escape'
	                ) {
	                  event.preventDefault()
	                  event.stopPropagation()
	                  handleTimestampCancel()
	                }

	                if (
	                  event.key ===
	                  'Enter' &&
	                  timestampDraftName
	                    .trim()
	                    .length > 0
	                ) {
	                  captureTimestampSubmitMoment()
	                }
	              }}

	              maxLength={48}
	              placeholder="Name this point"

	              className="
	                h-9
	                rounded-lg
	                border
	                border-border
	                bg-surface/80
	                px-3

	                text-sm
	                text-foreground
	                outline-none

	                placeholder:text-muted
	              "
	            />

	            <div
	              className="
	                flex
	                justify-end
	                gap-2
	              "
	            >
	              <button
	                type="button"

	                onMouseDown={(event) => {
	                  event.preventDefault()
	                  event.stopPropagation()
	                }}

	                onClick={
	                  handleTimestampCancel
	                }

	                className="
	                  cursor-pointer
	                  rounded-full
	                  px-3
	                  py-1.5

	                  text-xs
	                  text-muted
	                  transition-colors

	                  hover:bg-surface-hover
	                  hover:text-foreground
	                "
	              >
	                Cancel
	              </button>

	              <button
	                type="submit"

	                onPointerDown={(event) => {
	                  if (
	                    event.button !==
	                    0
	                  ) {
	                    return
	                  }

	                  if (
	                    timestampDraftName
	                      .trim()
	                      .length === 0
	                  ) {
	                    return
	                  }

	                  captureTimestampSubmitMoment()
	                }}

	                className="
	                  cursor-pointer
	                  rounded-full
	                  bg-surface-hover
	                  px-3
	                  py-1.5

	                  text-xs
	                  font-medium
	                  text-foreground
	                  transition-colors

	                  hover:bg-surface-hover/70
	                "
	              >
	                Add
	              </button>
	            </div>
	          </form>
	        </FloatingPortal>
	      )}

	      {shouldShowTimestampList && (
	        <FloatingPortal>
	          <div
	            ref={
	              setTimestampListFloatingElement
	            }

	            style={{
	              ...timestampListFloatingStyles,

	              visibility:
	                isTimestampListPositioned
	                  ? 'visible'
	                  : 'hidden',
	            }}

	            data-editor-popup

	            onMouseDown={(event) => {
	              event.stopPropagation()
	            }}

	            className="
	              glass-surface
	              z-120

	              w-72
	              overflow-hidden

	              p-1.5
	              shadow-2xl
	            "
	          >
	            <div
	              className="
	                max-h-72
	                overflow-y-auto
	                pr-1
	                scrollbar-none
	              "
	            >
	              {recordingTimestamps.map(
	                (timestamp) => {
	                  const isCurrent =
	                    currentPlaybackTimestamp
	                      ?.id ===
	                    timestamp.id

	                  return (
	                    <button
	                      key={
	                        timestamp.id
	                      }

	                      type="button"

	                      onMouseDown={(event) => {
	                        event.preventDefault()
	                        event.stopPropagation()
	                      }}

	                      onClick={() => {
	                        handleTimestampListSelect(
	                          timestamp,
	                        )
	                      }}

	                      className={`
	                        flex
	                        w-full
	                        items-center
	                        gap-2.5

	                        rounded-lg
	                        px-2.5
	                        py-2

	                        text-left
	                        transition-colors

	                        hover:bg-surface-hover

	                        ${
	                          isCurrent
	                            ? 'bg-surface-hover/70'
	                            : ''
	                        }
	                      `}
	                    >
	                      <span
	                        className="
	                          h-2.5
	                          w-2.5
	                          shrink-0
	                          rounded-full
	                        "

	                        style={{
	                          backgroundColor:
	                            timestamp.color,
	                        }}
	                      />

	                      <span
	                        className="
	                          min-w-0
	                          flex-1
	                          truncate
	                          text-xs
	                          text-foreground
	                        "
	                      >
	                        {timestamp.name}
	                      </span>

	                      <span
	                        className="
	                          shrink-0
	                          font-mono
	                          text-[11px]
	                          text-muted
	                        "
	                      >
	                        {formatDuration(
	                          timestamp.time,
	                        )}
	                      </span>
	                    </button>
	                  )
	                },
	              )}
	            </div>
	          </div>
	        </FloatingPortal>
	      )}
	    </NodeViewWrapper>
  )
}

export default AudioBlockView
