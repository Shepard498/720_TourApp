const TILE_SIZE = 512;
const FALLBACK_TILE_SIZE = 256;
const FALLBACK_SIZE = 256;
const PREVIEW_FACE_ORDER = ['b', 'd', 'f', 'l', 'r', 'u'];
const CUBE_FACE_IDS = ['f', 'r', 'b', 'l', 'u', 'd'];
const DEFAULT_MIN_FOV_DEG = 30;
const DEFAULT_MAX_FOV_DEG = 120;
const INITIAL_FOV = Math.PI / 2;
const MAX_RENDER_FACE_SIZE = 2048;
const LINK_MARKER_CENTER_TRANSITION_MS = 420;
const DEFAULT_LINK_MARKER_TRANSITION_MS = 1000;
const NODE_MAP_GRID_COLUMNS = 3;
const NODE_MAP_NODE_WIDTH = 168;
const NODE_MAP_NODE_HEIGHT = 82;
const NODE_MAP_HORIZONTAL_GAP = 220;
const NODE_MAP_VERTICAL_GAP = 160;
const NODE_MAP_PADDING = 56;
const NODE_MAP_WORLD_WIDTH = 9600;
const NODE_MAP_WORLD_HEIGHT = 7200;
const NODE_MAP_WORLD_ORIGIN_X = 4600;
const NODE_MAP_WORLD_ORIGIN_Y = 3400;
const NODE_MAP_ELASTIC_INNER_MARGIN = 150;
const NODE_MAP_ELASTIC_MIN_DRAG_FACTOR = 0.08;
const NODE_MAP_ELASTIC_RETURN_MAX_MS = 220;
const NODE_MAP_ELASTIC_RETURN_MIN_MS = 92;
const NODE_MAP_DRAG_AUTOPAN_MARGIN = 72;
const NODE_MAP_DRAG_AUTOPAN_MAX_STEP = 12;
const NODE_MAP_DRAG_CATCHUP_MAX_STEP = 18;
const NODE_MAP_DRAG_CURSOR_EPSILON = 2.5;
const NODE_MAP_HOME_PAN_MS = 360;
const NODE_MAP_ZOOM_MIN = 0.45;
const NODE_MAP_ZOOM_MAX = 1.8;
const LIGHT_MARKER_DEFAULT_COLOR = '#ffd26a';
const LIGHT_MARKER_DEFAULT_RADIUS = 84;
const LIGHT_MARKER_DEFAULT_INTENSITY = 1;
const LIGHT_MARKER_DEFAULT_GHOST_INTENSITY = 0.6;
const SOUND_MARKER_DEFAULT_VOLUME = 0.72;
const SOUND_MARKER_DEFAULT_PAN = 0.85;
const SOUND_MARKER_DEFAULT_FOCUS_DEG = 96;
const SOUND_MARKER_SCENE_TRANSITION_MS = 1000;
const DEFAULT_AMBIENT_AUDIO_VOLUME = 0.55;
const DEFAULT_AMBIENT_AUDIO_TRANSITION_MS = 900;
const DEFAULT_AMBIENT_AUDIO_OFFSET = 0;
const VIEWER_MAX_AUTO_EXPAND_ASPECT_RATIO = 16 / 9;

const state = {
  activeTab: 'comandos',
  project: {
    name: '',
    minFovDeg: DEFAULT_MIN_FOV_DEG,
    maxFovDeg: DEFAULT_MAX_FOV_DEG,
    ambientAudio: null,
    ambientAudioTransitionMs: DEFAULT_AMBIENT_AUDIO_TRANSITION_MS,
    ambientAudioOffset: DEFAULT_AMBIENT_AUDIO_OFFSET,
    ambientAudioBackground: false
  },
  scenes: [],
  markers: [],
  selectedMarkerId: null,
  activeSceneId: null,
  startSceneId: null,
  processingCount: 0
};

const runtime = {
  viewer: null,
  activeSceneInstance: null,
  activeViewListenerCleanup: null,
  activeMarkerDrag: null,
  editingInfoMarkerContentId: null,
  draggedSceneId: null,
  dragClientY: null,
  dragAutoScrollFrame: null,
  pendingSceneTransition: 'fade',
  pendingSceneTransitionDurationMs: DEFAULT_LINK_MARKER_TRANSITION_MS,
  hoveredInfoMarkerId: null,
  pinnedInfoMarkerId: null,
  hoveredInfoMarkerDisplay: false,
  infoDisplayHideTimeout: null,
  infoDisplayPlacement: 'top',
  infoDisplayPlacementShiftTimer: null,
  infoDisplayLastLeft: null,
  infoDisplayLastTop: null,
  infoDisplayRenderedMarkerId: null,
  infoDisplayRenderedContentKey: '',
  scenePointerDown: null,
  infoMarkerContentDraft: null,
  pendingMarkerFocus: null,
  alignmentViewer: null,
  activeAlignmentSceneInstance: null,
  linkAlignmentMarkerId: null,
  pendingSceneTargetViewParameters: null,
  nodeMapDrag: null,
  nodeMapPan: null,
  nodeMapPointers: new Map(),
  nodeMapPinch: null,
  nodeMapZoom: 1,
  nodeMapSuppressUntil: 0,
  infoMarkerContentEditor: null,
  lightOpticsFrame: 0,
  markerInteractionSuppressUntil: 0,
  nodeMapExpandedSceneIds: new Set(),
  nodeMapLinkCreation: null,
  nodeMapSceneSelectionActive: false,
  pendingMarkerPlacement: null,
  confirmDialog: null,
  transientStatus: null,
  transientStatusTimer: null,
  statusSheenLastAt: 0,
  statusSheenResetTimer: null,
  ambientAudioElement: null,
  ambientAudioKey: '',
  ambientAudioBaseVolume: DEFAULT_AMBIENT_AUDIO_VOLUME,
  ambientAudioTransition: null,
  projectBackgroundAudioElement: null,
  projectBackgroundAudioKey: '',
  projectAudioTimelineStartedAt: null,
  ambientAudioUnlockBound: false,
  viewerSettingsOpen: false,
  ambientAudioDebugTimelineTimer: null,
  forceInstantAmbientSceneSwitch: false,
  viewerAmbientVolume: 1,
  viewerAmbientMuted: false,
  tutorial: null,
  tutorialDemo: null,
  infoMarkerContentOverlayResizeObserver: null,
  infoMarkerContentOverlayPositionFrame: 0,
  mapPanelResize: null,
  mapPanelPreferredWidth: null,
  nodeMapRenderOffsetX: 0,
  nodeMapRenderOffsetY: 0,
  nodeMapElasticReturnFrame: 0,
  nodeMapNeedsStableScroll: false,
  nodeMapDragAutoPanFrame: 0,
  nodeMapHomePanFrame: 0,
  mobileHubOpen: false,
  mobilePanelOpen: false,
  mobileConfigHidden: false,
  wasCompactLayout: window.matchMedia('(max-width: 980px)').matches,
  viewerSettingsAutoExpandMap: true,
  viewerSettingsSafeDelete: true,
  soundMarkerAudioContext: null,
  soundMarkerAudioEntries: new Map(),
  soundMarkerRetiringAudioEntries: new Set(),
  soundMarkerSceneTransition: null,
  soundMarkerFreezeSceneId: null,
  soundMarkerAudioUnlockBound: false
};

const elements = {
  appShell: document.querySelector('.app-shell'),
  hub: document.querySelector('.hub'),
  tabs: [...document.querySelectorAll('.hub-tab')],
  panels: [...document.querySelectorAll('.panel-view')],
  panelHelpButtons: [...document.querySelectorAll('[data-help-panel]')],
  mobileDrawerBackdrop: document.getElementById('mobile-drawer-backdrop'),
  mobileHubToggle: document.getElementById('mobile-hub-toggle'),
  mobilePanelToggle: document.getElementById('mobile-panel-toggle'),
  mobileConfigToggle: document.getElementById('mobile-config-toggle'),
  mobileHubClose: document.getElementById('mobile-hub-close'),
  mobilePanelClose: document.getElementById('mobile-panel-close'),
  tutorialStartWorkflow: document.getElementById('start-workflow-tutorial'),
  tutorialStartProjectConfig: document.getElementById('start-project-config-tutorial'),
  tutorialStartImportScenes: document.getElementById('start-import-scenes-tutorial'),
  tutorialStartMarkers: document.getElementById('start-markers-tutorial'),
  tutorialStartEffects: document.getElementById('start-effects-tutorial'),
  tutorialStartSaveLoad: document.getElementById('start-save-load-tutorial'),
  tutorialStartNodeMap: document.getElementById('start-nodemap-tutorial'),
  instructionsList: document.querySelector('[data-panel="instrucciones"] .command-grid'),
  projectName: document.getElementById('project-name'),
  projectFovMin: document.getElementById('project-fov-min'),
  projectFovMax: document.getElementById('project-fov-max'),
  projectAmbientAudioSummary: document.getElementById('project-ambient-audio-summary'),
  projectAmbientAudioVolume: document.getElementById('project-ambient-audio-volume'),
  projectAmbientAudioTransition: document.getElementById('project-ambient-audio-transition'),
  projectAmbientAudioOffset: document.getElementById('project-ambient-audio-offset'),
  projectAmbientAudioOffsetSlider: document.getElementById('project-ambient-audio-offset-slider'),
  projectAmbientAudioBackground: document.getElementById('project-ambient-audio-background'),
  projectAmbientAudioSelect: document.getElementById('project-ambient-audio-select'),
  projectAmbientAudioClear: document.getElementById('project-ambient-audio-clear'),
  projectSummaryName: document.getElementById('project-summary-name'),
  projectSummaryCard: document.getElementById('project-summary-card'),
  projectSummaryCopy: document.getElementById('project-summary-copy'),
  sceneCounter: document.getElementById('scene-counter'),
  sceneList: document.getElementById('scene-list'),
  markerList: document.getElementById('marker-list'),
  effectList: document.getElementById('effect-list'),
  importScenes: document.getElementById('import-scenes'),
  createLinkMarker: document.getElementById('create-link-marker'),
  createInfoMarker: document.getElementById('create-info-marker'),
  createLightMarker: document.getElementById('create-light-marker'),
  createSoundMarker: document.getElementById('create-sound-marker'),
  nodeMapCreateScene: document.getElementById('node-map-create-scene'),
  nodeMapCreateLink: document.getElementById('node-map-create-link'),
  nodeMapCreateInfo: document.getElementById('node-map-create-info'),
  nodeMapCreateLight: document.getElementById('node-map-create-light'),
  nodeMapCreateSound: document.getElementById('node-map-create-sound'),
  nodeMapHome: document.getElementById('node-map-home'),
  nodeMap: document.getElementById('node-map'),
  nodeMapViewport: document.getElementById('node-map-viewport'),
  nodeMapSurface: document.getElementById('node-map-surface'),
  nodeMapEdges: document.getElementById('node-map-edges'),
  nodeMapDraftEdges: document.getElementById('node-map-draft-edges'),
  sceneFileInput: document.getElementById('scene-file-input'),
  projectFileInput: document.getElementById('project-file-input'),
  projectAudioInput: document.getElementById('project-audio-input'),
  sceneAudioInput: document.getElementById('scene-audio-input'),
  soundMarkerAudioInput: document.getElementById('sound-marker-audio-input'),
  saveProject: document.getElementById('save-project'),
  loadProject: document.getElementById('load-project'),
  exportProject: document.getElementById('export-project'),
  resetProject: document.getElementById('reset-project'),
  workspace: document.querySelector('.workspace'),
  sidePanel: document.querySelector('.side-panel'),
  workspaceSplitter: document.getElementById('workspace-splitter'),
  viewerShell: document.querySelector('.viewer-shell'),
  viewerFrame: document.querySelector('.viewer-frame'),
  viewerStage: document.getElementById('viewer-stage'),
  pano: document.getElementById('pano'),
  alignmentPano: document.getElementById('alignment-pano'),
  lightOverlay: document.getElementById('light-overlay'),
  markerOverlay: document.getElementById('marker-overlay'),
  infoMarkerDisplay: document.getElementById('info-marker-display'),
  infoMarkerDisplayBody: document.getElementById('info-marker-display-body'),
  emptyState: document.getElementById('empty-state'),
  infoMarkerConfigOverlay: document.getElementById('info-marker-config-overlay'),
  infoMarkerConfigTitle: document.getElementById('info-marker-config-title'),
  infoMarkerConfigName: document.getElementById('info-marker-config-name'),
  infoMarkerConfigYaw: document.getElementById('info-marker-config-yaw'),
  infoMarkerConfigPitch: document.getElementById('info-marker-config-pitch'),
  infoMarkerConfigContent: document.getElementById('info-marker-config-content'),
  infoMarkerConfigPreviewBody: document.getElementById('info-marker-config-preview-body'),
  infoMarkerConfigPreviewInTab: document.getElementById('info-marker-config-preview-in-tab'),
  infoMarkerContentOverlay: document.getElementById('info-marker-content-overlay'),
  infoMarkerContentTitle: document.getElementById('info-marker-content-title'),
  infoMarkerContentToolbar: document.getElementById('info-marker-content-toolbar'),
  infoMarkerContentInput: document.getElementById('info-marker-content-input'),
  infoMarkerContentImage: document.getElementById('info-marker-content-image'),
  infoMarkerContentImageSelect: document.getElementById('info-marker-content-image-select'),
  infoMarkerContentImageAlign: document.getElementById('info-marker-content-image-align'),
  infoMarkerContentTextAlign: document.getElementById('info-marker-content-text-align'),
  infoMarkerContentTextVerticalAlign: document.getElementById('info-marker-content-text-vertical-align'),
  infoMarkerContentWidth: document.getElementById('info-marker-content-width'),
    infoMarkerContentMediaSplit: document.getElementById('info-marker-content-media-split'),
    infoMarkerContentMediaSplitSlider: document.getElementById('info-marker-content-media-split-slider'),
  infoMarkerContentImageClear: document.getElementById('info-marker-content-image-clear'),
  infoMarkerContentPreviewBody: document.getElementById('info-marker-content-preview-body'),
  infoMarkerContentCancel: document.getElementById('info-marker-content-cancel'),
  infoMarkerContentSave: document.getElementById('info-marker-content-save'),
  linkMarkerConfigOverlay: document.getElementById('link-marker-config-overlay'),
  linkMarkerConfigTitle: document.getElementById('link-marker-config-title'),
  linkMarkerConfigName: document.getElementById('link-marker-config-name'),
  linkMarkerConfigYaw: document.getElementById('link-marker-config-yaw'),
  linkMarkerConfigPitch: document.getElementById('link-marker-config-pitch'),
  linkMarkerConfigTargetScene: document.getElementById('link-marker-config-target-scene'),
  linkMarkerConfigTransition: document.getElementById('link-marker-config-transition'),
  linkMarkerConfigTransitionDuration: document.getElementById('link-marker-config-transition-duration'),
  linkMarkerConfigCenterBeforeTransition: document.getElementById('link-marker-config-center-before-transition'),
  linkMarkerConfigAlignmentHint: document.getElementById('link-marker-config-alignment-hint'),
  linkMarkerConfigAlignView: document.getElementById('link-marker-config-align-view'),
  linkMarkerConfigTest: document.getElementById('link-marker-config-test'),
  lightMarkerConfigOverlay: document.getElementById('light-marker-config-overlay'),
  lightMarkerConfigTitle: document.getElementById('light-marker-config-title'),
  lightMarkerConfigName: document.getElementById('light-marker-config-name'),
  lightMarkerConfigYaw: document.getElementById('light-marker-config-yaw'),
  lightMarkerConfigPitch: document.getElementById('light-marker-config-pitch'),
  lightMarkerConfigColor: document.getElementById('light-marker-config-color'),
  lightMarkerConfigRadius: document.getElementById('light-marker-config-radius'),
  lightMarkerConfigIntensity: document.getElementById('light-marker-config-intensity'),
  lightMarkerConfigGhostIntensity: document.getElementById('light-marker-config-ghost-intensity'),
  soundMarkerConfigOverlay: document.getElementById('sound-marker-config-overlay'),
  soundMarkerConfigTitle: document.getElementById('sound-marker-config-title'),
  soundMarkerConfigName: document.getElementById('sound-marker-config-name'),
  soundMarkerConfigYaw: document.getElementById('sound-marker-config-yaw'),
  soundMarkerConfigPitch: document.getElementById('sound-marker-config-pitch'),
  soundMarkerConfigAudioSummary: document.getElementById('sound-marker-config-audio-summary'),
  soundMarkerConfigSelect: document.getElementById('sound-marker-config-select'),
  soundMarkerConfigClear: document.getElementById('sound-marker-config-clear'),
  soundMarkerConfigVolume: document.getElementById('sound-marker-config-volume'),
  soundMarkerConfigPan: document.getElementById('sound-marker-config-pan'),
  soundMarkerConfigFocus: document.getElementById('sound-marker-config-focus'),
  soundMarkerConfigLoop: document.getElementById('sound-marker-config-loop'),
  viewerTitle: document.getElementById('viewer-title'),
  viewerDetail: document.getElementById('viewer-detail'),
  viewerMode: document.getElementById('viewer-mode'),
  viewerCoordinates: document.getElementById('viewer-coordinates'),
  editorFullscreenToggle: document.getElementById('editor-fullscreen-toggle'),
  viewerSettingsToggle: document.getElementById('viewer-settings-toggle'),
  viewerSettingsPanel: document.getElementById('viewer-settings-panel'),
  viewerSettingsVolume: document.getElementById('viewer-settings-volume'),
  viewerSettingsMute: document.getElementById('viewer-settings-mute'),
  viewerSettingsAutoExpandMap: document.getElementById('viewer-settings-auto-expand-map'),
  viewerSettingsSafeDelete: document.getElementById('viewer-settings-safe-delete'),
  viewerSettingsAudioStatus: document.getElementById('viewer-settings-audio-status'),
  projectSummaryAudioTimeline: document.getElementById('project-summary-audio-timeline'),
  sceneConfigOverlay: document.getElementById('scene-config-overlay'),
  sceneConfigTitle: document.getElementById('scene-config-title'),
  sceneConfigName: document.getElementById('scene-config-name'),
  sceneConfigYaw: document.getElementById('scene-config-yaw'),
  sceneConfigPitch: document.getElementById('scene-config-pitch'),
  sceneConfigFov: document.getElementById('scene-config-fov'),
  sceneConfigCurrentView: document.getElementById('scene-config-current-view'),
  sceneConfigStart: document.getElementById('scene-config-start'),
  sceneAmbientAudioSummary: document.getElementById('scene-ambient-audio-summary'),
  sceneAmbientAudioVolume: document.getElementById('scene-ambient-audio-volume'),
  sceneAmbientAudioSyncTimeline: document.getElementById('scene-ambient-audio-sync-timeline'),
  sceneAmbientAudioSelect: document.getElementById('scene-ambient-audio-select'),
  sceneAmbientAudioClear: document.getElementById('scene-ambient-audio-clear'),
  tutorialOverlay: document.getElementById('tutorial-overlay'),
  tutorialSpotlight: document.getElementById('tutorial-spotlight'),
  tutorialCard: document.getElementById('tutorial-card'),
  tutorialTitle: document.getElementById('tutorial-title'),
  tutorialStep: document.getElementById('tutorial-step'),
  tutorialText: document.getElementById('tutorial-text'),
  tutorialClose: document.getElementById('tutorial-close'),
  tutorialNext: document.getElementById('tutorial-next'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmModalBackdrop: document.getElementById('confirm-modal-backdrop'),
  confirmModalTitle: document.getElementById('confirm-modal-title'),
  confirmModalMessage: document.getElementById('confirm-modal-message'),
  confirmModalCancel: document.getElementById('confirm-modal-cancel'),
  confirmModalConfirm: document.getElementById('confirm-modal-confirm'),
  sceneConfigDelete: document.getElementById('scene-config-delete'),
  infoMarkerConfigDelete: document.getElementById('info-marker-config-delete'),
  linkMarkerConfigDelete: document.getElementById('link-marker-config-delete'),
  lightMarkerConfigDelete: document.getElementById('light-marker-config-delete'),
  soundMarkerConfigDelete: document.getElementById('sound-marker-config-delete'),
};

function init() {
  initInfoMarkerContentEditor();
  bindEvents();
  bindScrollablePanelFades();
  bindInfoMarkerContentOverlayPositioning();
  startAmbientAudioDebugTimelineTicker();
  render();
}

function initInfoMarkerContentEditor() {
  if (!elements.infoMarkerContentInput) {
    return;
  }

  if (window.Quill && elements.infoMarkerContentToolbar) {
    runtime.infoMarkerContentEditor = new window.Quill(elements.infoMarkerContentInput, {
      modules: {
        toolbar: elements.infoMarkerContentToolbar
      },
      placeholder: 'Escribe aqui el contenido del hotspot.',
      theme: 'snow'
    });

    runtime.infoMarkerContentEditor.root.setAttribute('aria-labelledby', 'info-marker-content-input-label');
    runtime.infoMarkerContentEditor.on('text-change', () => {
      if (runtime.editingInfoMarkerContentId) {
        updateSelectedInfoMarkerContent();
      }
    });
    return;
  }

  elements.infoMarkerContentInput.contentEditable = 'true';
  elements.infoMarkerContentInput.addEventListener('input', updateSelectedInfoMarkerContent);
}

function syncInfoMarkerContentEditorTutorialLock() {
  const isTutorialActive = runtime.tutorial !== null;
  const editorRoot = runtime.infoMarkerContentEditor?.root || elements.infoMarkerContentInput;

  if (!editorRoot) {
    return;
  }

  if (runtime.infoMarkerContentEditor && typeof runtime.infoMarkerContentEditor.enable === 'function') {
    runtime.infoMarkerContentEditor.enable(!isTutorialActive);
  } else {
    editorRoot.contentEditable = isTutorialActive ? 'false' : 'true';
  }

  editorRoot.setAttribute('aria-readonly', isTutorialActive ? 'true' : 'false');
  editorRoot.classList.toggle('is-tutorial-readonly', isTutorialActive);
  if (isTutorialActive && editorRoot.contains(document.activeElement)) {
    document.activeElement.blur();
  }
}

function getSelectedMarker() {
  return state.markers.find((marker) => marker.id === state.selectedMarkerId) || null;
}

function scheduleInfoMarkerContentOverlayPosition() {
  if (runtime.infoMarkerContentOverlayPositionFrame) {
    window.cancelAnimationFrame(runtime.infoMarkerContentOverlayPositionFrame);
  }

  runtime.infoMarkerContentOverlayPositionFrame = window.requestAnimationFrame(() => {
    runtime.infoMarkerContentOverlayPositionFrame = 0;
    positionInfoMarkerContentOverlay();
  });
}

function bindInfoMarkerContentOverlayPositioning() {
  if (!elements.infoMarkerContentOverlay || !window.ResizeObserver) {
    return;
  }

  runtime.infoMarkerContentOverlayResizeObserver = new window.ResizeObserver(() => {
    positionSceneConfigOverlay();
  positionInfoMarkerConfigOverlay();
  positionLinkMarkerConfigOverlay();
  positionLightMarkerConfigOverlay();
  positionSoundMarkerConfigOverlay();
  scheduleInfoMarkerContentOverlayPosition();
  });
  runtime.infoMarkerContentOverlayResizeObserver.observe(elements.infoMarkerContentOverlay);
}

function isMarkerConfigTarget(target) {
  return Boolean(
    target && (
      elements.infoMarkerConfigOverlay?.contains(target) ||
      elements.linkMarkerConfigOverlay?.contains(target) ||
      elements.lightMarkerConfigOverlay?.contains(target) ||
      elements.soundMarkerConfigOverlay?.contains(target) ||
      elements.infoMarkerContentOverlay?.contains(target)
    )
  );
}

function isEditableInteractionTarget(target) {
  if (!target || !(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], .ql-editor, .ql-toolbar'));
}

function openConfirmDialog(options = {}) {
  const { title = 'Confirmar accion', message = 'Esta accion no se puede deshacer.', confirmLabel = 'Confirmar', onConfirm = null } = options;
  runtime.confirmDialog = { title, message, confirmLabel, onConfirm };
  if (elements.confirmModalTitle) { elements.confirmModalTitle.textContent = title; }
  if (elements.confirmModalMessage) { elements.confirmModalMessage.textContent = message; }
  if (elements.confirmModalConfirm) { elements.confirmModalConfirm.textContent = confirmLabel; }
  if (elements.confirmModal) { elements.confirmModal.hidden = false; }
}

function closeConfirmDialog() {
  runtime.confirmDialog = null;
  if (elements.confirmModal) { elements.confirmModal.hidden = true; }
}

function getProjectConfigTutorialSteps() {
  return [
    {
      targetSelectors: ['.hub-tab[data-tab="proyecto"]'],
      text: 'La pestaña "Proyecto" contiene la configuración general que afecta a todo el tour.'
    },
    {
      beforeShow: () => {
        setActiveTab('proyecto');
      },
      targetSelectors: ['#project-name'],
      text: 'Aquí puedes darle un nombre a tu proyecto para identificarlo y organizarlo mejor.'
    },
    {
      targetSelectors: ['#project-fov-min'],
      text: 'Este valor define el campo de visión o field of view (FOV) mínimo, es decir el zoom máximo permitido dentro del tour.'
    },
    {
      targetSelectors: ['#project-fov-max'],
      text: 'Este valor define el FOV máximo o zoom mínimo permitido. Junto al FOV mínimo, controla cuán cerca o lejos puede ver el usuario. Ten en cuenta que valores extremos pueden distorsionar la imagen.'
    },
    {
      targetSelectors: ['#project-ambient-audio-summary', '#project-ambient-audio-select', '#project-ambient-audio-clear'],
      text: 'Desde aquí puedes cargar un MP3 como audio global del proyecto, cambiar su volumen inicial o quitarlo cuando quieras.'
    },
    {
      targetSelectors: ['#project-ambient-audio-transition', '#project-ambient-audio-offset', '#project-ambient-audio-offset-slider'],
      text: 'Los controles de transición y offset definen cómo se mezclan dos audios al pasar de una escena con audio a otra. Puedes ajustarlos con precisión escribiendo el valor o usando el slider.'
    },
    {
      targetSelectors: ['#project-ambient-audio-background'],
      text: 'Si activas "Superponer audio de fondo", el audio del proyecto seguirá sonando siempre como base. Si la escena tiene su propio audio, ambos sonarán al mismo tiempo.'
    },
    {
      targetSelectors: ['[data-panel="proyecto"].is-active'],
      text: 'En esta pestaña irán apareciendo más configuraciones globales a medida que el editor crezca.'
    },
    {
      beforeShow: () => {
        setActiveTab('instrucciones');
      },
      targetSelectors: ['#start-project-config-tutorial'],
      text: 'Cuando quieras repasar la configuración general del tour, podrás volver a este tutorial desde la pestaña "Instrucciones" o desde el botón de ayuda de Proyecto.'
    }
  ];
}

async function loadImageBitmapFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se pudieron cargar las escenas demo del tutorial.');
  }
  const blob = await response.blob();
  return createImageBitmap(blob);
}

async function buildTutorialPreviewStrip(sceneFolderPath) {
  const previewCanvas = createCanvas(FALLBACK_SIZE, FALLBACK_SIZE * PREVIEW_FACE_ORDER.length);
  const previewContext = previewCanvas.getContext('2d');
  const faceBitmaps = [];

  try {
    for (let index = 0; index < PREVIEW_FACE_ORDER.length; index += 1) {
      const faceId = PREVIEW_FACE_ORDER[index];
      const bitmap = await loadImageBitmapFromUrl(sceneFolderPath + '/0/' + faceId + '/0/0.jpg');
      faceBitmaps.push(bitmap);
      previewContext.drawImage(bitmap, 0, index * FALLBACK_SIZE, FALLBACK_SIZE, FALLBACK_SIZE);
    }

    return canvasToObjectUrl(previewCanvas, 0.76);
  } finally {
    faceBitmaps.forEach((bitmap) => bitmap.close());
  }
}

async function createPreprocessedTutorialScene(index) {
  const sceneFolderPath = './tutorial-assets/' + index;
  const previewUrl = await buildTutorialPreviewStrip(sceneFolderPath);
  const tiles = {};

  for (const faceId of CUBE_FACE_IDS) {
    tiles['0/' + faceId + '/0/0'] = sceneFolderPath + '/0/' + faceId + '/0/0.jpg';
    tiles['1/' + faceId + '/0/0'] = sceneFolderPath + '/1/' + faceId + '/0/0.jpg';
  }

  return {
    id: crypto.randomUUID(),
    name: 'Escena demo ' + (index + 1),
    fileName: 'demo-scene-' + (index + 1) + '.jpg',
    mimeType: 'image/jpeg',
    importKey: 'tutorial-demo-scene-' + index,
    width: 11904,
    height: 5952,
    createdAt: new Date().toISOString(),
    sourceImageDataUrl: null,
    mapNodePosition: null,
    tutorialDemo: true,
    initialViewParameters: {
      yaw: 0,
      pitch: 0,
      fov: INITIAL_FOV
    },
    processed: {
      mode: 'multires-listo',
      levels: [
        { tileSize: FALLBACK_TILE_SIZE, size: FALLBACK_SIZE, fallbackOnly: true },
        { tileSize: TILE_SIZE, size: TILE_SIZE }
      ],
      faceSize: TILE_SIZE,
      previewUrl,
      posterUrl: sceneFolderPath + '/1/f/0/0.jpg',
      tiles,
      assetUrls: [previewUrl],
      error: null,
      progress: 1,
      progressLabel: 'Escena demo lista'
    }
  };
}

async function ensureImportScenesTutorialDemo() {
  if (state.scenes.length > 0) {
    return;
  }

  if (runtime.tutorialDemo?.type === 'import-scenes') {
    return;
  }

  const previousState = {
    activeSceneId: state.activeSceneId,
    startSceneId: state.startSceneId,
    selectedMarkerId: state.selectedMarkerId,
    activeTab: state.activeTab
  };

  const demoScenes = await Promise.all([
    createPreprocessedTutorialScene(0),
    createPreprocessedTutorialScene(1)
  ]);

  runtime.tutorialDemo = {
    type: 'import-scenes',
    sceneIds: demoScenes.map((scene) => scene.id),
    previousState
  };

  state.scenes.push(...demoScenes);
  state.activeSceneId = demoScenes[0]?.id || state.activeSceneId;
  state.startSceneId = demoScenes[0]?.id || state.startSceneId;
  render();
}

function createTutorialMarker(type, sceneId, options = {}) {
  const markerType = normalizeMarkerType(type);
  const yawDeg = Number.isFinite(options.yawDeg) ? options.yawDeg : 0;
  const pitchDeg = Number.isFinite(options.pitchDeg) ? options.pitchDeg : 0;

  return {
    id: crypto.randomUUID(),
    type: markerType,
    name: options.name || getMarkerTypeDefaultName(markerType, state.markers.length + 1),
    sceneId,
    yaw: yawDeg * Math.PI / 180,
    pitch: clamp(pitchDeg * Math.PI / 180, -90 * Math.PI / 180, 90 * Math.PI / 180),
    fov: INITIAL_FOV,
    content: options.content || '',
    contentHtml: options.contentHtml || '',
    imageSrc: '',
    mediaKind: '',
    mediaSrc: '',
    mediaMimeType: '',
    mediaFileName: '',
    mediaFile: null,
    imageAlign: 'top',
    textAlign: 'left',
    textVerticalAlign: 'top',
    popupWidth: 320,
      mediaSplit: 0.38,
    previewInMarkerTab: Boolean(options.previewInMarkerTab),
    soundSrc: '',
    soundMimeType: '',
    soundFileName: '',
    soundFile: null,
    soundVolume: SOUND_MARKER_DEFAULT_VOLUME,
    soundPan: SOUND_MARKER_DEFAULT_PAN,
    soundFocusDeg: SOUND_MARKER_DEFAULT_FOCUS_DEG,
    soundLoop: true,
    targetSceneId: markerType === 'link' ? (options.targetSceneId || getDefaultLinkTargetSceneId(sceneId)) : null,
    targetViewParameters: null,
    transition: 'fade',
    transitionDurationMs: DEFAULT_LINK_MARKER_TRANSITION_MS,
    centerBeforeTransition: markerType === 'link',
    flareColor: LIGHT_MARKER_DEFAULT_COLOR,
    flareRadius: LIGHT_MARKER_DEFAULT_RADIUS,
    flareIntensity: LIGHT_MARKER_DEFAULT_INTENSITY,
    ghostIntensity: LIGHT_MARKER_DEFAULT_GHOST_INTENSITY,
    createdAt: new Date().toISOString(),
    tutorialDemo: true
  };
}

async function ensureMarkersTutorialDemo() {
  if (runtime.tutorialDemo?.type === 'markers') {
    return runtime.tutorialDemo.references || null;
  }

  const previousState = {
    activeSceneId: state.activeSceneId,
    startSceneId: state.startSceneId,
    selectedMarkerId: state.selectedMarkerId,
    activeTab: state.activeTab
  };

  const sceneIds = [];
  const markerIds = [];
  const requiredDemoSceneCount = Math.max(0, 2 - state.scenes.length);

  if (requiredDemoSceneCount > 0) {
    const demoScenes = await Promise.all(
      Array.from({ length: requiredDemoSceneCount }, (_, index) => createPreprocessedTutorialScene(index))
    );
    sceneIds.push(...demoScenes.map((scene) => scene.id));
    state.scenes.push(...demoScenes);
    if (!state.startSceneId && demoScenes[0]) {
      state.startSceneId = demoScenes[0].id;
    }
  }

  const availableScenes = state.scenes.filter((scene) => Boolean(scene));
  const sourceScene = availableScenes[0] || null;
  const targetScene = availableScenes.find((scene) => scene.id !== sourceScene?.id) || null;
  if (!sourceScene || !targetScene) {
    throw new Error('No hay suficientes escenas disponibles para mostrar el tutorial de marcadores.');
  }

  let linkMarker = state.markers.find((marker) => {
    return normalizeMarkerType(marker.type) === 'link'
      && state.scenes.some((scene) => scene.id === marker.sceneId)
      && state.scenes.some((scene) => scene.id === marker.targetSceneId);
  }) || null;

  if (!linkMarker) {
    linkMarker = createTutorialMarker('link', sourceScene.id, {
      name: 'Puerta demo',
      yawDeg: 18,
      pitchDeg: -6,
      targetSceneId: targetScene.id
    });
    state.markers.push(linkMarker);
    markerIds.push(linkMarker.id);
  }

  let infoMarker = state.markers.find((marker) => {
    return normalizeMarkerType(marker.type) === 'info'
      && state.scenes.some((scene) => scene.id === marker.sceneId);
  }) || null;

  if (!infoMarker) {
    infoMarker = createTutorialMarker('info', sourceScene.id, {
      name: 'Dato demo',
      yawDeg: -24,
      pitchDeg: 10,
      previewInMarkerTab: true,
      content: 'Este marcador permite agregar informacion contextual dentro del tour.',
      contentHtml: '<p>Este marcador permite agregar <strong>informacion contextual</strong> dentro del tour.</p>'
    });
    state.markers.push(infoMarker);
    markerIds.push(infoMarker.id);
  }

  runtime.tutorialDemo = {
    type: 'markers',
    sceneIds,
    markerIds,
    previousState,
    references: {
      sourceSceneId: sourceScene.id,
      targetSceneId: targetScene.id,
      linkMarkerId: linkMarker.id,
      infoMarkerId: infoMarker.id
    }
  };

  state.activeSceneId = linkMarker.sceneId;
  state.selectedMarkerId = linkMarker.id;
  runtime.pendingSceneTransition = 'instant';
  runtime.pendingMarkerFocus = { markerId: linkMarker.id, animate: false };
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  render();

  return runtime.tutorialDemo.references;
}

function getMarkersTutorialSteps() {
  const references = runtime.tutorialDemo?.references || {};
  const linkMarkerId = references.linkMarkerId || '';
  const infoMarkerId = references.infoMarkerId || '';
  const linkMarker = state.markers.find((marker) => marker.id === linkMarkerId) || null;
  const infoMarker = state.markers.find((marker) => marker.id === infoMarkerId) || null;
  const steps = [
    {
      targetSelectors: ['.hub-tab[data-tab="marcadores"]'],
      text: 'Los marcadores o hotspots permiten construir la interactividad principal del tour.'
    },
    {
      beforeShow: () => {
        setActiveTab('marcadores');
        state.selectedMarkerId = null;
        closeInfoMarkerContentEditor({ discardChanges: true });
      },
      targetSelectors: ['[data-panel="marcadores"].is-active'],
      text: 'Desde esta pestaña puedes crear y editar hotspots sobre la escena activa.'
    },
    {
      targetSelectors: ['#create-link-marker'],
      text: 'Los link hotspots sirven para navegar entre escenas. Estos son creados presionando este botón y luego haciendo click en la vista para colocar el hotspot en la posición deseada.'
    },
    {
      targetSelectors: ['#create-info-marker'],
      text: 'Los media hotspots sirven para mostrar información, texto o contenido visual adicional. Estos se crean de la misma manera que los link hotspots.'
    },
    {
      targetSelectors: ['#marker-list'],
      text: 'Aquí se listan todos los hotspots link y media del proyecto.'
    }
  ];

  if (linkMarker) {
    steps.push(
      {
        beforeShow: () => {
          setActiveTab('marcadores');
          closeInfoMarkerContentEditor({ discardChanges: true });
          state.activeSceneId = linkMarker.sceneId;
          state.selectedMarkerId = linkMarker.id;
          runtime.pendingSceneTransition = 'instant';
        },
        targetSelectors: ['[data-marker-select="' + linkMarker.id + '"]'],
        text: 'Cada marcador puede seleccionarse desde la lista para editarlo con más precisión.'
      },
      {
        targetSelectors: ['#link-marker-config-overlay'],
        text: 'En la configuración de un link hotspot puedes ajustar su nombre, posición, escena destino y comportamiento de transición.'
      },
      {
        targetSelectors: ['#link-marker-config-center-before-transition', '#link-marker-config-align-view'],
        text: 'La opción "Centrar" hace que primero la vista se centre en el hotspot antes de una transición. El botón "Definir vista inicial" te permite guardar exactamente la orientación con la que quieres que se abra la escena destino. Esto se logra presionando este botón y paneando la vista hasta encontrar el encuadre deseado, para luego volver a presionar el botón y guardar esa orientación como vista inicial de la escena destino al navegar desde este hotspot.'
      }
    );
  }

  if (infoMarker) {
    steps.push(
      {
        beforeShow: () => {
          setActiveTab('marcadores');
          closeInfoMarkerContentEditor({ discardChanges: true });
          state.activeSceneId = infoMarker.sceneId;
          state.selectedMarkerId = infoMarker.id;
          runtime.pendingSceneTransition = 'instant';
        },
        targetSelectors: ['[data-marker-select="' + infoMarker.id + '"]'],
        text: 'Los media hotspots se administran desde la misma lista, aunque su función sea distinta.'
      },
      {
        targetSelectors: ['#info-marker-config-overlay'],
        text: 'Aquí puedes editar el nombre, la posición y la vista previa del contenido de un marcador media.'
      },
      {
        beforeShow: () => {
          setActiveTab('marcadores');
          state.activeSceneId = infoMarker.sceneId;
          state.selectedMarkerId = infoMarker.id;
          runtime.pendingSceneTransition = 'instant';
          closeInfoMarkerContentEditor({ discardChanges: true });
        },
        targetSelectors: ['#info-marker-config-content'],
        text: 'Desde este botón puedes abrir el editor de contenido para escribir texto, agregar imágenes y ajustar el popup.'
      },
      {
        beforeShow: () => {
          setActiveTab('marcadores');
          state.activeSceneId = infoMarker.sceneId;
          state.selectedMarkerId = infoMarker.id;
          runtime.pendingSceneTransition = 'instant';
          openSelectedInfoMarkerContentEditor();
        },
        targetSelectors: ['.quill-shell', '#info-marker-content-input'],
        text: 'Dentro de "Editar contenido" puedes escribir el texto del popup.'
      },
      {
        targetSelectors: ['.info-marker-content-preview-field', '#info-marker-content-image-select'],
        text: 'Tambien puedes elegir el contenido multimedia que deseas mostrar.'
      },
      {
        targetSelectors: ['#info-marker-content-text-align', '#info-marker-content-text-vertical-align', '#info-marker-content-image-align', '#info-marker-content-width', '#info-marker-content-media-split'],
        text: 'Y puedes ajustar alineaciones, definir el ancho y revisar una preview antes de guardar.'
      }
    );
  }

  steps.push({
    beforeShow: () => {
      closeInfoMarkerContentEditor({ discardChanges: true });
      setActiveTab('instrucciones');
    },
    targetSelectors: ['#start-markers-tutorial'],
    text: 'Cuando quieras repasar cómo crear y editar hotspots, podrás volver a este tutorial desde la pestaña "Instrucciones" o desde el botón de ayuda de Marcadores.'
  });

  return steps;
}

async function ensureEffectsTutorialDemo() {
  if (runtime.tutorialDemo?.type === 'effects') {
    return runtime.tutorialDemo.references || null;
  }

  const previousState = {
    activeSceneId: state.activeSceneId,
    startSceneId: state.startSceneId,
    selectedMarkerId: state.selectedMarkerId,
    activeTab: state.activeTab
  };

  const sceneIds = [];
  const markerIds = [];

  if (!state.scenes.length) {
    const demoScene = await createPreprocessedTutorialScene(0);
    sceneIds.push(demoScene.id);
    state.scenes.push(demoScene);
    if (!state.startSceneId) {
      state.startSceneId = demoScene.id;
    }
  }

  const sourceScene = state.scenes[0] || null;
  if (!sourceScene) {
    throw new Error('No hay escenas disponibles para mostrar el tutorial de efectos.');
  }

  let lightMarker = state.markers.find((marker) => {
    return normalizeMarkerType(marker.type) === 'light'
      && state.scenes.some((scene) => scene.id === marker.sceneId);
  }) || null;

  if (!lightMarker) {
    lightMarker = createTutorialMarker('light', sourceScene.id, {
      name: 'Luz demo',
      yawDeg: 30,
      pitchDeg: -8
    });
    state.markers.push(lightMarker);
    markerIds.push(lightMarker.id);
  }

  let soundMarker = state.markers.find((marker) => {
    return normalizeMarkerType(marker.type) === 'sound'
      && state.scenes.some((scene) => scene.id === marker.sceneId);
  }) || null;

  if (!soundMarker) {
    soundMarker = createTutorialMarker('sound', sourceScene.id, {
      name: 'Sonido demo',
      yawDeg: -28,
      pitchDeg: -4
    });
    state.markers.push(soundMarker);
    markerIds.push(soundMarker.id);
  }

  runtime.tutorialDemo = {
    type: 'effects',
    sceneIds,
    markerIds,
    previousState,
    references: {
      sourceSceneId: sourceScene.id,
      lightMarkerId: lightMarker.id,
      soundMarkerId: soundMarker.id
    }
  };

  state.activeSceneId = lightMarker.sceneId;
  state.selectedMarkerId = lightMarker.id;
  runtime.pendingSceneTransition = 'instant';
  runtime.pendingMarkerFocus = { markerId: lightMarker.id, animate: false };
  render();

  return runtime.tutorialDemo.references;
}

function getEffectsTutorialSteps() {
  const references = runtime.tutorialDemo?.references || {};
  const lightMarkerId = references.lightMarkerId || '';
  const soundMarkerId = references.soundMarkerId || '';
  const lightMarker = state.markers.find((marker) => marker.id === lightMarkerId) || null;
  const soundMarker = state.markers.find((marker) => marker.id === soundMarkerId) || null;
  const steps = [
    {
      targetSelectors: ['.hub-tab[data-tab="efectos"]'],
      text: 'La pestaña "Efectos" permite agregar luces y detalles visuales para pulir la experiencia del tour.'
    },
    {
      beforeShow: () => {
        setActiveTab('efectos');
        state.selectedMarkerId = null;
      },
      targetSelectors: ['[data-panel="efectos"].is-active'],
      text: 'Desde esta pestaña puedes crear y editar efectos light sobre la escena activa.'
    },
    {
      targetSelectors: ['#create-light-marker', '#create-sound-marker'],
      text: 'Los efectos light y sound se crean presionando su botón correspondiente y luego haciendo click en la vista para colocarlos en la posición deseada.'
    },
    {
      targetSelectors: ['#effect-list'],
      text: 'Aquí se listan todos los efectos light y sound del proyecto.'
    }
  ];

  if (lightMarker) {
    steps.push(
      {
        beforeShow: () => {
          setActiveTab('efectos');
          state.activeSceneId = lightMarker.sceneId;
          state.selectedMarkerId = lightMarker.id;
          runtime.pendingSceneTransition = 'instant';
        },
        targetSelectors: ['[data-marker-select="' + lightMarker.id + '"]'],
        text: 'Cada efecto puede seleccionarse desde la lista para editarlo con más precisión.'
      },
      {
        targetSelectors: ['#light-marker-config-overlay'],
        text: 'En la configuración del efecto puedes ajustar su nombre, posición y comportamiento visual.'
      },
      {
        targetSelectors: ['#light-marker-config-color', '#light-marker-config-radius', '#light-marker-config-intensity', '#light-marker-config-ghost-intensity'],
        text: 'Aquí controlas el color del flare, su radio, el brillo principal y la intensidad del reflejo secundario.'
      }
    );
  }

  if (soundMarker) {
    steps.push(
      {
        beforeShow: () => {
          setActiveTab('efectos');
          state.activeSceneId = soundMarker.sceneId;
          state.selectedMarkerId = soundMarker.id;
          runtime.pendingSceneTransition = 'instant';
        },
        targetSelectors: ['[data-marker-select="' + soundMarker.id + '"]'],
        text: 'Los efectos sound también aparecen en esta lista y se seleccionan igual que una luz para editar su configuración.'
      },
      {
        targetSelectors: ['#sound-marker-config-overlay'],
        text: 'En la configuración de un efecto sound puedes cambiar su nombre, posición y cargar el audio que se reproducirá desde ese punto.'
      },
      {
        targetSelectors: ['#sound-marker-config-select', '#sound-marker-config-volume', '#sound-marker-config-pan', '#sound-marker-config-focus', '#sound-marker-config-loop'],
        text: 'Estos controles permiten elegir el archivo de audio, ajustar volumen, paneo, apertura direccional y si el sonido se repite en bucle.'
      }
    );
  }

  steps.push({
    beforeShow: () => {
      setActiveTab('instrucciones');
    },
    targetSelectors: ['#start-effects-tutorial'],
    text: 'Cuando quieras repasar cómo crear y editar luces, podrás volver a este tutorial desde la pestaña "Instrucciones" o desde el botón de ayuda de Efectos.'
  });

  return steps;
}
function getSaveLoadTutorialSteps() {
  return [
    {
      targetSelectors: ['.hub-tab[data-tab="comandos"]'],
      text: 'La pestaña "Comandos" agrupa acciones generales del proyecto, como guardar, importar, exportar o borrar el estado actual.'
    },
    {
      beforeShow: () => {
        setActiveTab('comandos');
      },
      targetSelectors: ['[data-panel="comandos"].is-active'],
      text: 'Desde aquí puedes gestionar archivos del proyecto sin afectar directamente la edición de escenas, hotspots o efectos.'
    },
    {
      targetSelectors: ['#save-project'],
      text: 'El botón "Guardar" descarga un paquete del proyecto con la configuración y los archivos necesarios para retomarlo más adelante exactamente como estaba.'
    },
    {
      targetSelectors: ['#load-project'],
      text: 'El botón "Importar" carga un paquete del proyecto o un JSON anterior y restaura el proyecto completo dentro del editor.'
    },
    {
      targetSelectors: ['#export-project'],
      text: 'El botón "Exportar" genera la salida final del tour con el player standalone y los archivos procesados necesarios para compartirlo o publicarlo.'
    },
    {
      targetSelectors: ['#reset-project'],
      text: 'El botón "Borrar" limpia el proyecto actual y deja el editor en blanco. Como es una acción delicada, la app pide confirmación antes de continuar.'
    },
    {
      beforeShow: () => {
        setActiveTab('instrucciones');
      },
      targetSelectors: ['#start-save-load-tutorial'],
      text: 'Cuando quieras repasar cómo guardar, recuperar, exportar o reiniciar el proyecto, podrás volver a este tutorial desde la pestaña "Instrucciones" o desde el botón de ayuda de Comandos.'
    }
  ];
}

async function ensureNodeMapTutorialDemo() {
  if (runtime.tutorialDemo?.type === 'nodemap') {
    return runtime.tutorialDemo.references || null;
  }

  const previousState = {
    activeSceneId: state.activeSceneId,
    startSceneId: state.startSceneId,
    selectedMarkerId: state.selectedMarkerId,
    activeTab: state.activeTab,
    expandedSceneIds: [...runtime.nodeMapExpandedSceneIds]
  };

  const sceneIds = [];
  const markerIds = [];
  const requiredDemoSceneCount = Math.max(0, 2 - state.scenes.length);

  if (requiredDemoSceneCount > 0) {
    const demoScenes = await Promise.all(
      Array.from({ length: requiredDemoSceneCount }, (_, index) => createPreprocessedTutorialScene(index))
    );
    sceneIds.push(...demoScenes.map((scene) => scene.id));
    state.scenes.push(...demoScenes);
    if (!state.startSceneId && demoScenes[0]) {
      state.startSceneId = demoScenes[0].id;
    }
  }

  const sourceScene = state.scenes[0] || null;
  const targetScene = state.scenes.find((scene) => scene.id !== sourceScene?.id) || null;
  if (!sourceScene || !targetScene) {
    throw new Error('No hay suficientes escenas disponibles para mostrar el tutorial del nodemap.');
  }

  let linkMarker = state.markers.find((marker) => {
    return normalizeMarkerType(marker.type) === 'link'
      && marker.sceneId === sourceScene.id
      && marker.targetSceneId === targetScene.id;
  }) || null;

  if (!linkMarker) {
    linkMarker = createTutorialMarker('link', sourceScene.id, {
      name: 'Camino demo',
      yawDeg: 12,
      pitchDeg: -4,
      targetSceneId: targetScene.id
    });
    state.markers.push(linkMarker);
    markerIds.push(linkMarker.id);
  }

  let infoMarker = state.markers.find((marker) => {
    return normalizeMarkerType(marker.type) === 'info' && marker.sceneId === sourceScene.id;
  }) || null;

  if (!infoMarker) {
    infoMarker = createTutorialMarker('info', sourceScene.id, {
      name: 'Media demo',
      yawDeg: -22,
      pitchDeg: 11,
      previewInMarkerTab: true,
      content: 'Media demo del nodemap.',
      contentHtml: '<p>Media demo del nodemap.</p>'
    });
    state.markers.push(infoMarker);
    markerIds.push(infoMarker.id);
  }

  let lightMarker = state.markers.find((marker) => {
    return normalizeMarkerType(marker.type) === 'light' && marker.sceneId === sourceScene.id;
  }) || null;

  if (!lightMarker) {
    lightMarker = createTutorialMarker('light', sourceScene.id, {
      name: 'Light demo',
      yawDeg: 28,
      pitchDeg: -10
    });
    state.markers.push(lightMarker);
    markerIds.push(lightMarker.id);
  }

  runtime.tutorialDemo = {
    type: 'nodemap',
    sceneIds,
    markerIds,
    previousState,
    references: {
      sourceSceneId: sourceScene.id,
      targetSceneId: targetScene.id,
      linkMarkerId: linkMarker.id,
      infoMarkerId: infoMarker.id,
      lightMarkerId: lightMarker.id
    }
  };

  runtime.nodeMapExpandedSceneIds = new Set([sourceScene.id]);
  state.activeSceneId = sourceScene.id;
  state.selectedMarkerId = null;
  runtime.pendingSceneTransition = 'instant';
  render();

  return runtime.tutorialDemo.references;
}

function getNodeMapTutorialSteps() {
  const references = runtime.tutorialDemo?.references || {};
  const sourceSceneId = references.sourceSceneId || '';
  const linkMarkerId = references.linkMarkerId || '';
  const infoMarkerId = references.infoMarkerId || '';
  const lightMarkerId = references.lightMarkerId || '';

  const focusCompactMapNodesToRight = () => scheduleCompactNodeMapTutorialPan(sourceSceneId);

  return [
    {
      targetSelectors: ['.hub-tab[data-tab="mapa"]'],
      text: 'La pestaña "Mapa" ofrece una forma rápida de entender y editar la estructura del tour como un grafo visual.'
    },
    {
      beforeShow: () => {
        setActiveTab('mapa');
        runtime.nodeMapExpandedSceneIds = new Set([sourceSceneId]);
        state.activeSceneId = sourceSceneId;
        state.selectedMarkerId = null;
        focusCompactMapNodesToRight();
      },
      targetSelectors: ['[data-panel="mapa"].is-active'],
      text: 'Desde aquí puedes ver escenas y conexiones sin perder de vista el visor, lo que lo vuelve muy útil para edición rápida.'
    },
    {
      targetSelectors: ['#node-map-create-scene', '#node-map-create-link', '#node-map-create-info', '#node-map-create-light', '#node-map-create-sound'],
      text: 'Estas acciones rápidas permiten importar escenas y crear links, media hotspots o efectos directamente desde el mapa.'
    },
    {
      targetSelectors: ['#node-map-create-link'],
      text: 'La creación de links desde el mapa se hace en tres pasos: elegir escena origen, elegir escena destino y luego colocar el hotspot en el visor.'
    },
    {
      beforeShow: focusCompactMapNodesToRight,
      targetSelectors: ['[data-map-scene-card="' + sourceSceneId + '"]'],
      text: 'Cada nodo representa una escena del tour y puede seleccionarse para mostrarla inmediatamente en el visor.'
    },
    {
      beforeShow: focusCompactMapNodesToRight,
      targetSelectors: ['[data-map-scene-first="' + sourceSceneId + '"]'],
      text: 'El botón "1º" define cuál será la escena inicial del tour y puede cambiarse directamente desde el mapa.'
    },
    {
      beforeShow: focusCompactMapNodesToRight,
      targetSelectors: ['[data-map-marker-id="' + linkMarkerId + '"]'],
      text: 'Las líneas entre nodos representan hotspots link entre escenas. También puedes seleccionarlas para editar esa conexión.'
    },
    {
      beforeShow: () => {
        setActiveTab('mapa');
        runtime.nodeMapExpandedSceneIds = new Set([sourceSceneId]);
        state.activeSceneId = sourceSceneId;
        state.selectedMarkerId = null;
        focusCompactMapNodesToRight();
      },
      targetSelectors: ['[data-map-scene-toggle="' + sourceSceneId + '"]'],
      text: 'Este contador despliega accesos rápidos a los media hotspots y efectos que pertenecen a esa escena.'
    },
    {
      beforeShow: focusCompactMapNodesToRight,
      targetSelectors: ['[data-map-scene-card="' + sourceSceneId + '"] .node-map__quick-list'],
      text: 'Cuando el nodo está expandido, aquí aparecen los accesos directos a media hotspots y efectos para seleccionarlos sin salir del mapa.'
    },
    {
      beforeShow: () => {
        setActiveTab('mapa');
        runtime.nodeMapExpandedSceneIds = new Set([sourceSceneId]);
        state.activeSceneId = sourceSceneId;
        state.selectedMarkerId = infoMarkerId;
        runtime.pendingSceneTransition = 'instant';
        if (isCompactLayout()) {
          setActiveTab('marcadores');
        }
      },
      mobileDrawerState: { hubOpen: false, panelOpen: false },
      targetSelectors: ['[data-map-quick-marker-id="' + infoMarkerId + '"]', '#info-marker-config-overlay'],
      text: 'Al seleccionar un media hotspot desde el mapa, su configuración aparece enseguida sobre el visor para editarlo con rapidez.'
    },
    {
      beforeShow: () => {
        setActiveTab('mapa');
        runtime.nodeMapExpandedSceneIds = new Set([sourceSceneId]);
        state.activeSceneId = sourceSceneId;
        state.selectedMarkerId = lightMarkerId;
        runtime.pendingSceneTransition = 'instant';
        if (isCompactLayout()) {
          setActiveTab('efectos');
        }
      },
      mobileDrawerState: { hubOpen: false, panelOpen: false },
      targetSelectors: ['[data-map-quick-marker-id="' + lightMarkerId + '"]', '#light-marker-config-overlay'],
      text: 'Lo mismo ocurre con los efectos: puedes saltar desde el nodo a su configuración sin cambiar de contexto.'
    },
    {
      beforeShow: () => {
        setActiveTab('mapa');
        runtime.nodeMapExpandedSceneIds = new Set([sourceSceneId]);
        state.activeSceneId = sourceSceneId;
        state.selectedMarkerId = null;
      },
      targetSelectors: ['#scene-config-overlay'],
      text: 'Y si no hay un marcador seleccionado, el mapa sigue conviviendo con la configuración de la escena activa para editar el tour de forma muy fluida.'
    },
    {
      beforeShow: () => {
        setActiveTab('instrucciones');
      },
      targetSelectors: ['#start-nodemap-tutorial'],
      text: 'Cuando quieras repasar el flujo rápido del nodemap, podrás volver a este tutorial desde la pestaña "Instrucciones" o desde el botón de ayuda de Mapa.'
    }
  ];
}

function cleanupTutorialDemo() {
  if (!runtime.tutorialDemo) {
    return;
  }

  const { sceneIds = [], markerIds = [], previousState = {} } = runtime.tutorialDemo;
  const sceneIdSet = new Set(sceneIds);
  const markerIdSet = new Set(markerIds);

  state.markers = state.markers.filter((marker) => {
    const shouldKeep = !markerIdSet.has(marker.id) && !sceneIdSet.has(marker.sceneId) && !sceneIdSet.has(marker.targetSceneId);
    if (!shouldKeep) {
      releaseMarkerAssets(marker);
    }
    return shouldKeep;
  });
  state.scenes = state.scenes.filter((scene) => {
    if (!sceneIdSet.has(scene.id)) {
      return true;
    }
    releaseSceneAssets(scene);
    return false;
  });

  state.selectedMarkerId = previousState.selectedMarkerId || null;
  state.activeSceneId = state.scenes.some((scene) => scene.id === previousState.activeSceneId)
    ? previousState.activeSceneId
    : (state.scenes[0]?.id || null);
  state.startSceneId = state.scenes.some((scene) => scene.id === previousState.startSceneId)
    ? previousState.startSceneId
    : (state.scenes[0]?.id || null);
  state.activeTab = previousState.activeTab || state.activeTab;
  runtime.nodeMapExpandedSceneIds = new Set(Array.isArray(previousState.expandedSceneIds) ? previousState.expandedSceneIds : [...runtime.nodeMapExpandedSceneIds]);
  runtime.tutorialDemo = null;
  render();
}

function getImportScenesTutorialSteps() {
  const steps = [
    {
      targetSelectors: ['.hub-tab[data-tab="escenas"]'],
      text: 'Las escenas son la base del tour. Cada panorama equirectangular (2:1) importado se convierte en una escena.'
    },
    {
      beforeShow: () => {
        setActiveTab('escenas');
      },
      targetSelectors: ['[data-panel="escenas"].is-active'],
      text: 'En esta pestaña podrás importar, ordenar, editar y borrar escenas.'
    },
    {
      targetSelectors: ['#import-scenes'],
      text: 'Con este botón puedes importar una o varias escenas simultáneamente.'
    },
    {
      targetSelectors: ['#scene-list'],
      text: 'Aquí aparecerán todas las escenas cargadas en el proyecto.'
    }
  ];

  if (state.scenes.length > 0) {
    const firstSceneId = state.scenes[0].id;
    steps.push(
      {
        targetSelectors: ['[data-scene-id="' + firstSceneId + '"]'],
        text: 'Cada escena aparece como una tarjeta con preview, nombre, estado y acciones rápidas.'
      },
      {
        targetSelectors: ['[data-scene-first="' + firstSceneId + '"]'],
        text: 'Este botón define cuál será la escena inicial del tour.'
      },
      {
        targetSelectors: ['[data-scene-delete="' + firstSceneId + '"]'],
        text: 'También puedes borrar escenas desde su tarjeta individual.'
      },
      {
        beforeShow: () => {
          setActiveTab('escenas');
          state.activeSceneId = firstSceneId;
          state.selectedMarkerId = null;
        },
        targetSelectors: ['#scene-config-overlay'],
        text: 'Cuando seleccionas una escena, puedes editar su configuración directamente desde el overlay del visor.'
      },
      {
        targetSelectors: ['#scene-ambient-audio-summary', '#scene-ambient-audio-select', '#scene-ambient-audio-clear'],
        text: 'Cada escena también puede tener su propio audio ambiente. Desde aquí puedes cargar un MP3 específico para esta escena, ajustar su volumen inicial o quitarlo para que vuelva a usar el audio del proyecto.'
      }
    );
  }

  steps.push({
    beforeShow: () => {
      setActiveTab('instrucciones');
    },
    targetSelectors: ['#start-import-scenes-tutorial'],
    text: 'Cuando quieras repasar cómo se importan y administran las escenas, podrás volver a este tutorial desde la pestaña "Instrucciones" o desde el botón de ayuda de Escenas.'
  });

  return steps;
}

function getWorkflowTutorialSteps() {
  return [
    {
      targetSelectors: ['.hub-tab[data-tab="proyecto"]'],
      text: 'Bienvenido a 720 TourApp. Para comenzar a crear tu propio tour 360, lo primero que debes hacer es ir a la pestaña "Proyecto".'
    },
    {
      beforeShow: () => {
        setActiveTab('proyecto');
      },
      targetSelectors: ['#project-name'],
      text: 'Aquí podrás darle nombre a tu proyecto y cambiar configuraciones generales que aplican a todo tu proyecto, pero aún no tienes ninguna escena cargada.'
    },
    {
      targetSelectors: ['.hub-tab[data-tab="escenas"]'],
      text: 'Para comenzar debes importar al menos un panorama equirectangular (2:1), al que llamaremos "escena". La manera más fácil de importar una escena es en la pestaña llamada "Escenas".'
    },
    {
      beforeShow: () => {
        setActiveTab('escenas');
      },
      targetSelectors: ['[data-panel="escenas"].is-active .panel-view__header'],
      text: 'Dentro de la pestaña "Escenas" podrás importar, borrar y modificar todas las características de cada escena.'
    },
    {
      targetSelectors: ['#import-scenes'],
      text: 'Con el botón "Importar escenas" podrás importar una o múltiples escenas simultáneamente en cualquier etapa de creación de tu tour.'
    },
    {
      targetSelectors: ['[data-panel="escenas"].is-active [data-help-panel="escenas"]'],
      text: 'Si tienes dudas sobre cualquier elemento de la interfaz puedes recurrir al botón de ayuda.'
    },
    {
      targetSelectors: ['.hub-tab[data-tab="marcadores"]'],
      text: 'Ahora necesitamos una herramienta que nos permita navegar a través del tour de manera fluida. Para esto están los marcadores o hotspots tipo link, accesibles desde la pestaña "Marcadores".'
    },
    {
      beforeShow: () => {
        setActiveTab('marcadores');
      },
      targetSelectors: ['#create-link-marker'],
      text: 'Los marcadores de enlace o link hotspots básicamente son botones interactivos visibles durante el tour que conectan 2 escenas y, al presionarlos, inicia la transición entre la escena actual y la escena de destino.'
    },
    {
      targetSelectors: ['.hub-tab[data-tab="marcadores"]', '.hub-tab[data-tab="efectos"]'],
      text: 'También existen marcadores media y efectos. Estos agregan contenido y pulido al tour, pero no son obligatorios para poder navegarlo.'
    },
    {
      targetSelectors: ['.hub-tab[data-tab="comandos"]'],
      text: 'Cuando ya hayas importado todas tus escenas y colocado todos tus marcadores y efectos, podrás ir a la pestaña de "Comandos" para guardar o exportar tu proyecto.'
    },
    {
      beforeShow: () => {
        setActiveTab('comandos');
      },
      targetSelectors: ['#save-project', '#export-project'],
      text: 'Desde aquí podrás guardar tu progreso, importar un proyecto previamente guardado o exportar la versión final de tu tour.'
    },
    {
      beforeShow: () => {
        setActiveTab('instrucciones');
      },
      targetSelectors: ['#start-workflow-tutorial'],
      text: 'Y cuando quieras volver a repasar el recorrido o explorar futuras ayudas guiadas, podrás regresar a la pestaña "Instrucciones".'
    }
  ];
}

function getInstructionsTutorialSteps() {
  return [
    {
      targetSelectors: ['.hub-tab[data-tab="instrucciones"]'],
      text: 'La pestaña "Instrucciones" reúne todos los recorridos guiados del editor en un solo lugar.'
    },
    {
      beforeShow: () => {
        setActiveTab('instrucciones');
      },
      targetSelectors: ['[data-panel="instrucciones"].is-active'],
      text: 'Desde este panel puedes acceder rápidamente a tutoriales sobre cada parte importante de la app.'
    },
    {
      targetSelectors: ['[data-panel="instrucciones"].is-active .command-grid'],
      text: 'Cada botón abre una guía paso a paso sobre un flujo específico, como importar escenas, añadir marcadores, usar efectos o trabajar con el nodemap.'
    },
    {
      targetSelectors: ['[data-panel="instrucciones"].is-active [data-help-panel="instrucciones"]'],
      text: 'Los botones de ayuda de cada pestaña te llevan al mismo tutorial correspondiente, para que puedas pedir ayuda sin salir del contexto en el que estás trabajando.'
    },
    {
      targetSelectors: ['#start-workflow-tutorial'],
      text: 'Puedes volver a este panel siempre que quieras repasar una función o descubrir otra parte del editor.'
    }
  ];
}
function getTutorialTargets(step) {
  const selectors = Array.isArray(step?.targetSelectors) ? step.targetSelectors : [];
  return selectors
    .map((selector) => document.querySelector(selector))
    .filter((target) => target instanceof Element && target.getBoundingClientRect().width > 0 && target.getBoundingClientRect().height > 0);
}

function syncMobileDrawersForTutorialStep(step) {
  if (!isCompactLayout() || !step) {
    return false;
  }

  if (step.mobileDrawerState) {
    const nextState = {
      hubOpen: Boolean(step.mobileDrawerState.hubOpen),
      panelOpen: Boolean(step.mobileDrawerState.panelOpen)
    };
    const changed = runtime.mobileHubOpen !== nextState.hubOpen || runtime.mobilePanelOpen !== nextState.panelOpen;
    setMobileDrawersState(nextState);
    return changed;
  }

  const selectors = Array.isArray(step.targetSelectors) ? step.targetSelectors : [];
  let nextState = null;
  for (const selector of selectors) {
    const target = document.querySelector(selector);
    if (!(target instanceof Element)) {
      continue;
    }

    if (target.closest('.hub')) {
      nextState = { hubOpen: true, panelOpen: false };
      break;
    }

    if (target.closest('.side-panel')) {
      nextState = { hubOpen: false, panelOpen: true };
      break;
    }

    nextState = { hubOpen: false, panelOpen: false };
    break;
  }

  if (!nextState) {
    return false;
  }

  const changed = runtime.mobileHubOpen !== nextState.hubOpen || runtime.mobilePanelOpen !== nextState.panelOpen;
  setMobileDrawersState(nextState);
  return changed;
}

function updateTutorialPresentation() {
  if (!runtime.tutorial || !elements.tutorialOverlay || !elements.tutorialSpotlight || !elements.tutorialCard) {
    return;
  }

  const step = runtime.tutorial.steps[runtime.tutorial.stepIndex];
  const targets = getTutorialTargets(step);
  if (!targets.length) {
    return;
  }

  const padding = 12;
  const bounds = targets.reduce((acc, target) => {
    const rect = target.getBoundingClientRect();
    return {
      left: Math.min(acc.left, rect.left),
      top: Math.min(acc.top, rect.top),
      right: Math.max(acc.right, rect.right),
      bottom: Math.max(acc.bottom, rect.bottom)
    };
  }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });

  const spotlightLeft = Math.max(8, bounds.left - padding);
  const spotlightTop = Math.max(8, bounds.top - padding);
  const spotlightWidth = Math.min(window.innerWidth - spotlightLeft - 8, (bounds.right - bounds.left) + (padding * 2));
  const spotlightHeight = Math.min(window.innerHeight - spotlightTop - 8, (bounds.bottom - bounds.top) + (padding * 2));

  elements.tutorialSpotlight.style.left = spotlightLeft + 'px';
  elements.tutorialSpotlight.style.top = spotlightTop + 'px';
  elements.tutorialSpotlight.style.width = Math.max(spotlightWidth, 48) + 'px';
  elements.tutorialSpotlight.style.height = Math.max(spotlightHeight, 36) + 'px';

  const cardWidth = elements.tutorialCard.offsetWidth || 360;
  const cardHeight = elements.tutorialCard.offsetHeight || 240;
  const viewportPadding = 24;
  let cardLeft = spotlightLeft + Math.max(spotlightWidth, 48) + 24;
  if (cardLeft + cardWidth + viewportPadding > window.innerWidth) {
    cardLeft = spotlightLeft - cardWidth - 24;
  }
  if (cardLeft < viewportPadding) {
    cardLeft = Math.min(Math.max(viewportPadding, spotlightLeft), window.innerWidth - cardWidth - viewportPadding);
  }

  let cardTop = spotlightTop;
  if (cardTop + cardHeight + viewportPadding > window.innerHeight) {
    cardTop = window.innerHeight - cardHeight - viewportPadding;
  }
  if (cardTop < viewportPadding) {
    cardTop = viewportPadding;
  }

  elements.tutorialCard.style.left = cardLeft + 'px';
  elements.tutorialCard.style.top = cardTop + 'px';
}

function showTutorialStep(stepIndex) {
  if (!runtime.tutorial) {
    return;
  }

  if (stepIndex < 0 || stepIndex >= runtime.tutorial.steps.length) {
    closeTutorial();
    return;
  }

  runtime.tutorial.stepIndex = stepIndex;
  const step = runtime.tutorial.steps[stepIndex];

  if (typeof step.beforeShow === 'function') {
    step.beforeShow();
  }
  const didSyncMobileDrawers = syncMobileDrawersForTutorialStep(step);

  if (elements.tutorialTitle) { elements.tutorialTitle.textContent = runtime.tutorial.title; }
  if (elements.tutorialStep) { elements.tutorialStep.textContent = (stepIndex + 1) + ' / ' + runtime.tutorial.steps.length; }
  if (elements.tutorialText) { elements.tutorialText.textContent = step.text; }
  if (elements.tutorialNext) { elements.tutorialNext.textContent = stepIndex === runtime.tutorial.steps.length - 1 ? 'Finalizar' : 'Siguiente'; }

  render();
  if (didSyncMobileDrawers) {
    renderTabs();
  }
  const targets = getTutorialTargets(step);
  targets.forEach((target) => {
    target.scrollIntoView({ block: 'center', inline: 'center' });
  });

  window.requestAnimationFrame(() => {
    updateTutorialPresentation();
    if (didSyncMobileDrawers) {
      window.setTimeout(updateTutorialPresentation, 210);
    }
  });
}

function startTutorial(title, steps) {
  if (!Array.isArray(steps) || !steps.length || !elements.tutorialOverlay) {
    return;
  }

  if (runtime.confirmDialog !== null) {
    closeConfirmDialog();
  }
  if (runtime.pendingMarkerPlacement !== null) {
    cancelPendingMarkerPlacement();
  }
  if (runtime.nodeMapLinkCreation !== null) {
    cancelNodeMapLinkCreation();
  }
  stopLinkMarkerAlignmentPreview();
  closeInfoMarkerContentEditor({ discardChanges: true });

  runtime.tutorial = { title, steps, stepIndex: 0 };
  document.body.classList.add('tutorial-active');
  elements.tutorialOverlay.hidden = false;
  syncInfoMarkerContentEditorTutorialLock();
  showTutorialStep(0);
}

function startWorkflowTutorial() {
  startTutorial('Cómo comenzar', getWorkflowTutorialSteps());
}

function startInstructionsTutorial() {
  startTutorial('Instrucciones', getInstructionsTutorialSteps());
}

function startProjectConfigTutorial() {
  startTutorial('Configurar proyecto', getProjectConfigTutorialSteps());
}

async function startImportScenesTutorial() {
  try {
    await ensureImportScenesTutorialDemo();
    startTutorial('Importar escenas', getImportScenesTutorialSteps());
  } catch (error) {
    console.error(error);
    window.alert(error && error.message ? error.message : 'No se pudo iniciar el tutorial de escenas.');
  }
}

async function startMarkersTutorial() {
  try {
    await ensureMarkersTutorialDemo();
    startTutorial('Añadir marcadores', getMarkersTutorialSteps());
  } catch (error) {
    console.error(error);
    window.alert(error && error.message ? error.message : 'No se pudo iniciar el tutorial de marcadores.');
  }
}

async function startEffectsTutorial() {
  try {
    await ensureEffectsTutorialDemo();
    startTutorial('Añadir efectos', getEffectsTutorialSteps());
  } catch (error) {
    console.error(error);
    window.alert(error && error.message ? error.message : 'No se pudo iniciar el tutorial de efectos.');
  }
}

function startSaveLoadTutorial() {
  startTutorial('Guardar/Importar/Exportar proyecto', getSaveLoadTutorialSteps());
}

async function startNodeMapTutorial() {
  try {
    await ensureNodeMapTutorialDemo();
    startTutorial('Editor rápido (Nodemap)', getNodeMapTutorialSteps());
  } catch (error) {
    console.error(error);
    window.alert(error && error.message ? error.message : 'No se pudo iniciar el tutorial del nodemap.');
  }
}
function advanceTutorial() {
  if (!runtime.tutorial) {
    return;
  }
  showTutorialStep(runtime.tutorial.stepIndex + 1);
}

function closeTutorial() {
  runtime.tutorial = null;
  document.body.classList.remove('tutorial-active');
  if (elements.tutorialOverlay) {
    elements.tutorialOverlay.hidden = true;
  }
  syncInfoMarkerContentEditorTutorialLock();
  closeInfoMarkerContentEditor({ discardChanges: true });
  cleanupTutorialDemo();
}

function confirmDialogAction() {
  const action = runtime.confirmDialog?.onConfirm;
  closeConfirmDialog();
  if (typeof action === 'function') {
    action();
  }
}

function handleGlobalDeleteShortcut(event) {
  if (runtime.tutorial !== null) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeTutorial();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      advanceTutorial();
      return;
    }
  }

  if (runtime.confirmDialog !== null) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeConfirmDialog();
      return;
    }
    if (event.key === 'Enter' && !isEditableInteractionTarget(event.target)) {
      event.preventDefault();
      confirmDialogAction();
      return;
    }
  }

  if (event.key === 'Escape' && runtime.viewerSettingsOpen) {
    event.preventDefault();
    toggleViewerSettingsPanel(false);
    return;
  }

  if (event.key === 'Escape' && isCompactLayout() && (runtime.mobileHubOpen || runtime.mobilePanelOpen)) {
    event.preventDefault();
    closeMobileDrawers();
    renderTabs();
    return;
  }

  if (event.key === 'Escape' && runtime.nodeMapLinkCreation !== null) {
    event.preventDefault();
    cancelNodeMapLinkCreation();
    return;
  }

  if (event.key === 'Escape' && runtime.pendingMarkerPlacement !== null) {
    event.preventDefault();
    cancelPendingMarkerPlacement();
    return;
  }

  if (event.key !== 'Delete' || event.defaultPrevented || isEditableInteractionTarget(event.target)) {
    return;
  }

  if (state.activeTab === 'escenas' && state.activeSceneId) {
    event.preventDefault();
    requestDeleteScene(state.activeSceneId);
    return;
  }

  const marker = getSelectedMarker();
  const markerType = normalizeMarkerType(marker?.type);
  const canDeleteMarker = Boolean(marker && state.activeTab === 'marcadores' && !isEffectMarkerType(markerType));
  const canDeleteEffect = Boolean(marker && state.activeTab === 'efectos' && isEffectMarkerType(markerType));
  const canDeleteFromMap = Boolean(marker && state.activeTab === 'mapa');

  if (canDeleteMarker || canDeleteEffect || canDeleteFromMap) {
    event.preventDefault();
    requestDeleteMarker(marker.id);
    return;
  }

  if (state.activeTab === 'mapa' && runtime.nodeMapSceneSelectionActive && state.activeSceneId) {
    event.preventDefault();
    requestDeleteScene(state.activeSceneId);
  }
}

function renderNodeMapActions() {
  syncMapPanelWidthToLayout();
  const pendingPlacementType = getPendingMarkerPlacementType();
  elements.nodeMapCreateLink?.classList.toggle('is-active', state.activeTab === 'mapa' && runtime.nodeMapLinkCreation !== null);
  elements.nodeMapCreateInfo?.classList.toggle('is-active', pendingPlacementType === 'info');
  elements.nodeMapCreateLight?.classList.toggle('is-active', pendingPlacementType === 'light');
  elements.nodeMapCreateSound?.classList.toggle('is-active', pendingPlacementType === 'sound');
  elements.createLinkMarker?.classList.toggle('is-active', pendingPlacementType === 'link');
  elements.createInfoMarker?.classList.toggle('is-active', pendingPlacementType === 'info');
  elements.createLightMarker?.classList.toggle('is-active', pendingPlacementType === 'light');
  elements.createSoundMarker?.classList.toggle('is-active', pendingPlacementType === 'sound');
}

function getPendingMarkerPlacementType() {
  return runtime.pendingMarkerPlacement?.type || null;
}

function isNodeMapAwaitingSceneSelection() {
  if (runtime.pendingMarkerPlacement?.originTab === 'mapa') {
    return true;
  }

  const linkStage = getNodeMapLinkCreationStage();
  return linkStage === 'source' || linkStage === 'target';
}

function startPendingMarkerPlacement(type) {
  const markerType = normalizeMarkerType(type);
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  if (!activeScene) {
    window.alert('Primero selecciona una escena para crear un marcador.');
    return;
  }

  if (runtime.nodeMapLinkCreation !== null) {
    cancelNodeMapLinkCreation();
  }

  if (runtime.pendingMarkerPlacement?.type === markerType) {
    cancelPendingMarkerPlacement();
    return;
  }

  runtime.pendingMarkerPlacement = { type: markerType, originTab: state.activeTab };
  if (isCompactLayout() && state.activeTab !== 'mapa') {
    setMobileDrawersState({ hubOpen: false, panelOpen: false });
    renderTabs();
  }
  renderNodeMap();
  renderNodeMapActions();
  renderStatus();
}

function cancelPendingMarkerPlacement() {
  runtime.pendingMarkerPlacement = null;
  renderNodeMap();
  renderNodeMapActions();
  renderStatus();
}

function handlePendingMarkerPlacementSceneSelection(sceneId) {
  if (!runtime.pendingMarkerPlacement) {
    return false;
  }

  selectSceneFromNodeMap(sceneId);
  revealMobileViewerForMarkerPlacement();
  renderNodeMapActions();
  renderStatus();
  return true;
}

function getNodeMapLinkCreationStage() {
  const draft = runtime.nodeMapLinkCreation;
  if (!draft) {
    return null;
  }
  if (!draft.sourceSceneId) {
    return 'source';
  }
  if (!draft.targetSceneId) {
    return 'target';
  }
  return 'placement';
}

function removeNodeMapPendingLinkMarker(markerId = runtime.nodeMapLinkCreation?.markerId) {
  if (!markerId) {
    return;
  }

  const markerIndex = state.markers.findIndex((marker) => marker.id === markerId);
  if (markerIndex === -1) {
    return;
  }

  state.markers.splice(markerIndex, 1);
  if (state.selectedMarkerId === markerId) {
    state.selectedMarkerId = null;
  }
  if (runtime.linkAlignmentMarkerId === markerId) {
    stopLinkMarkerAlignmentPreview();
  }
}

function startNodeMapLinkCreation() {
  if (runtime.pendingMarkerPlacement !== null) {
    cancelPendingMarkerPlacement();
  }

  if (state.scenes.length < 2) {
    window.alert('Necesitas al menos dos escenas para crear un hotspot link desde el mapa.');
    return;
  }

  runtime.nodeMapLinkCreation = {
    sourceSceneId: null,
    targetSceneId: null,
    markerId: null,
    cursorMapPosition: null
  };
  renderNodeMap();
  renderNodeMapActions();
  renderStatus();
}

function cancelNodeMapLinkCreation() {
  removeNodeMapPendingLinkMarker();
  runtime.nodeMapLinkCreation = null;
  renderNodeMap();
  renderNodeMapActions();
  renderStatus();
}

function updateNodeMapLinkCreationCursor(event) {
  if (!elements.nodeMap || !runtime.nodeMapLinkCreation || getNodeMapLinkCreationStage() !== 'target') {
    return;
  }

  const worldPoint = getNodeMapWorldPointFromClient(event.clientX, event.clientY);
  if (!worldPoint) {
    return;
  }
  runtime.nodeMapLinkCreation.cursorMapPosition = worldPoint;
  updateNodeMapEdges();
}

function handleNodeMapLinkSceneSelection(sceneId, options = {}) {
  const draft = runtime.nodeMapLinkCreation;
  if (draft === null) {
    return false;
  }

  if (draft.markerId) {
    setStatusText('Creación de hotspot link: usa el tercer click en el visor para ubicar el hotspot.');
    return true;
  }

  if (!draft.sourceSceneId) {
    draft.sourceSceneId = sceneId;
    if (options.clientX != null && options.clientY != null) {
      updateNodeMapLinkCreationCursor({ clientX: options.clientX, clientY: options.clientY });
    }
    selectSceneFromNodeMap(sceneId);
    renderNodeMap();
    renderNodeMapActions();
    renderStatus();
    return true;
  }

  if (draft.sourceSceneId === sceneId) {
    setStatusText('Creación de hotspot link: selecciona una segunda escena distinta como destino.');
    return true;
  }

  draft.targetSceneId = sceneId;
  revealMobileViewerForMarkerPlacement();
  renderNodeMap();
  renderNodeMapActions();
  renderStatus();
  return true;
}

function updateScrollFadeState(container) {
  if (!container) {
    return;
  }

  const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
  const scrollTop = Math.max(0, container.scrollTop);
  const threshold = 6;
  container.classList.add('scroll-fade');
  container.classList.toggle('has-top-fade', scrollTop > threshold);
  container.classList.toggle('has-bottom-fade', maxScrollTop - scrollTop > threshold);
}

function updateScrollablePanelFades() {
  updateScrollFadeState(elements.instructionsList);
  updateScrollFadeState(elements.sceneList);
  updateScrollFadeState(elements.markerList);
  updateScrollFadeState(elements.effectList);
}

function bindScrollablePanelFades() {
  [elements.instructionsList, elements.sceneList, elements.markerList, elements.effectList].forEach((container) => {
    if (!container || container.dataset.scrollFadeBound === 'true') {
      return;
    }

    container.dataset.scrollFadeBound = 'true';
    container.classList.add('scroll-fade');
    container.addEventListener('scroll', () => updateScrollFadeState(container), { passive: true });
  });
}

function getNodeMapZoom() {
  return clamp(Number(runtime.nodeMapZoom) || 1, NODE_MAP_ZOOM_MIN, NODE_MAP_ZOOM_MAX);
}

function getNodeMapWorldPointFromClient(clientX, clientY) {
  if (!elements.nodeMap) {
    return null;
  }

  const rect = elements.nodeMap.getBoundingClientRect();
  const zoom = getNodeMapZoom();
  return {
    x: ((clientX - rect.left + elements.nodeMap.scrollLeft) / zoom) - (runtime.nodeMapRenderOffsetX || 0),
    y: ((clientY - rect.top + elements.nodeMap.scrollTop) / zoom) - (runtime.nodeMapRenderOffsetY || 0)
  };
}

function setNodeMapZoomAtClientPoint(nextZoom, clientX, clientY) {
  if (!elements.nodeMap) {
    return false;
  }

  const currentZoom = getNodeMapZoom();
  const normalizedZoom = clamp(nextZoom, NODE_MAP_ZOOM_MIN, NODE_MAP_ZOOM_MAX);
  if (Math.abs(normalizedZoom - currentZoom) < 0.001) {
    return false;
  }

  const rect = elements.nodeMap.getBoundingClientRect();
  const offsetX = clientX - rect.left;
  const offsetY = clientY - rect.top;
  const worldX = (elements.nodeMap.scrollLeft + offsetX) / currentZoom;
  const worldY = (elements.nodeMap.scrollTop + offsetY) / currentZoom;

  runtime.nodeMapZoom = normalizedZoom;
  updateNodeMapEdges();
  elements.nodeMap.scrollLeft = Math.max(0, (worldX * normalizedZoom) - offsetX);
  elements.nodeMap.scrollTop = Math.max(0, (worldY * normalizedZoom) - offsetY);
  return true;
}

function handleNodeMapWheel(event) {
  if (!elements.nodeMap || !state.scenes.length) {
    return;
  }

  event.preventDefault();
  stopNodeMapHomePan();
  stopNodeMapElasticReturn();

  const currentZoom = getNodeMapZoom();
  const nextZoom = clamp(currentZoom * Math.exp((-event.deltaY || 0) * 0.0015), NODE_MAP_ZOOM_MIN, NODE_MAP_ZOOM_MAX);
  if (setNodeMapZoomAtClientPoint(nextZoom, event.clientX, event.clientY)) {
    startNodeMapElasticReturn();
  }
}


function getMapPanelResizeMetrics(options = {}) {
  if (!elements.appShell || !elements.sidePanel || !elements.workspaceSplitter) {
    return null;
  }

  const shellRect = elements.appShell.getBoundingClientRect();
  const sidePanelRect = elements.sidePanel.getBoundingClientRect();
  const splitterRect = elements.workspaceSplitter.getBoundingClientRect();
  const shellStyles = window.getComputedStyle(elements.appShell);
  const columnGap = parseFloat(shellStyles.columnGap || shellStyles.gap || '18') || 18;
  const splitterWidth = splitterRect.width || 12;
  const baseMinWidth = Number.isFinite(options.minWidth) ? options.minWidth : 320;
  const minWorkspaceWidth = Number.isFinite(options.minWorkspaceWidth) ? options.minWorkspaceWidth : 420;
  const viewerFrameHeight = elements.viewerFrame?.getBoundingClientRect().height || 0;
  const maxViewerWidth = viewerFrameHeight * VIEWER_MAX_AUTO_EXPAND_ASPECT_RATIO;
  const aspectRatioMinWidth = maxViewerWidth > 0
    ? shellRect.right - sidePanelRect.left - (columnGap * 2) - splitterWidth - maxViewerWidth
    : baseMinWidth;
  const minWidth = Math.max(baseMinWidth, aspectRatioMinWidth);
  const maxWidth = Math.max(minWidth, shellRect.right - sidePanelRect.left - columnGap - splitterWidth - minWorkspaceWidth);

  return {
    shellWidth: shellRect.width,
    sidePanelLeft: sidePanelRect.left,
    sidePanelWidth: sidePanelRect.width,
    columnGap,
    splitterWidth,
    minWidth,
    maxWidth
  };
}

function clampMapPanelWidth(width, options = {}) {
  const metrics = getMapPanelResizeMetrics(options);
  if (!metrics) {
    return width;
  }
  return clamp(width, metrics.minWidth, metrics.maxWidth);
}

function shouldAutoExpandMapViewer() {
  if (state.activeTab !== 'mapa' || !runtime.viewerSettingsAutoExpandMap) {
    return false;
  }

  if (runtime.pendingMarkerPlacement?.originTab === 'mapa') {
    return true;
  }

  return getNodeMapLinkCreationStage() === 'placement';
}

function getPreferredMapPanelWidth() {
  if (Number.isFinite(runtime.mapPanelPreferredWidth)) {
    return runtime.mapPanelPreferredWidth;
  }

  const metrics = getMapPanelResizeMetrics();
  if (!metrics) {
    return null;
  }

  runtime.mapPanelPreferredWidth = clampMapPanelWidth(metrics.sidePanelWidth);
  return runtime.mapPanelPreferredWidth;
}

function getAutoExpandedMapPanelWidth() {
  const metrics = getMapPanelResizeMetrics({ minWidth: 240 });
  if (!metrics) {
    return null;
  }

  return metrics.minWidth;
}

function getEffectiveMapPanelWidth() {
  const preferredWidth = getPreferredMapPanelWidth();
  if (!Number.isFinite(preferredWidth)) {
    return preferredWidth;
  }

  if (!shouldAutoExpandMapViewer()) {
    return preferredWidth;
  }

  const autoExpandedWidth = getAutoExpandedMapPanelWidth();
  return Number.isFinite(autoExpandedWidth) ? autoExpandedWidth : preferredWidth;
}

function applyMapPanelWidth(width, options = {}) {
  if (!elements.appShell) {
    return;
  }
  const nextWidth = clampMapPanelWidth(width, options);
  if (!Number.isFinite(nextWidth)) {
    return;
  }
  elements.appShell.style.setProperty('--map-panel-width', `${nextWidth}px`);
}

function syncMapPanelWidthToLayout() {
  if (state.activeTab !== 'mapa' || !elements.appShell) {
    return;
  }

  const effectiveWidth = getEffectiveMapPanelWidth();
  if (Number.isFinite(effectiveWidth)) {
    applyMapPanelWidth(effectiveWidth, shouldAutoExpandMapViewer() ? { minWidth: 240 } : {});
    return;
  }

  const explicitWidth = parseFloat(elements.appShell.style.getPropertyValue('--map-panel-width'));
  if (Number.isFinite(explicitWidth)) {
    applyMapPanelWidth(explicitWidth);
  }
}

function stopMapPanelResize() {
  if (!runtime.mapPanelResize) {
    return;
  }

  const { pointerId, move, up, cancel } = runtime.mapPanelResize;
  window.removeEventListener('pointermove', move);
  window.removeEventListener('pointerup', up);
  window.removeEventListener('pointercancel', cancel);
  try {
    elements.workspaceSplitter?.releasePointerCapture?.(pointerId);
  } catch {}
  runtime.mapPanelResize = null;
  elements.appShell?.classList.remove('is-resizing-map-panel');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}


function handleMapPanelResizePointerDown(event) {
  if (state.activeTab !== 'mapa' || !elements.workspaceSplitter || elements.workspaceSplitter.offsetParent === null) {
    return;
  }

  const metrics = getMapPanelResizeMetrics();
  if (!metrics) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  stopMapPanelResize();
  elements.appShell?.classList.add('is-resizing-map-panel');
  elements.workspaceSplitter.setPointerCapture?.(event.pointerId);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';

  const updateWidth = (clientX) => {
    const rawWidth = clientX - metrics.sidePanelLeft - metrics.columnGap - (metrics.splitterWidth / 2);
    runtime.mapPanelPreferredWidth = clampMapPanelWidth(rawWidth);
    syncMapPanelWidthToLayout();
  };

  updateWidth(event.clientX);

  const handlePointerMove = (moveEvent) => {
    updateWidth(moveEvent.clientX);
  };
  const finishResize = () => {
    stopMapPanelResize();
  };

  runtime.mapPanelResize = {
    pointerId: event.pointerId,
    move: handlePointerMove,
    up: finishResize,
    cancel: finishResize
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', finishResize);
  window.addEventListener('pointercancel', finishResize);
}

function handleWindowResize() {
  syncMobileLayoutState();
  updateScrollablePanelFades();
  if (runtime.viewer && typeof runtime.viewer.updateSize === 'function') {
    runtime.viewer.updateSize();
  }
  if (runtime.alignmentViewer && typeof runtime.alignmentViewer.updateSize === 'function') {
    runtime.alignmentViewer.updateSize();
  }
  updateInfoMarkerDisplayPosition(runtime.activeSceneInstance?.view);
  if (runtime.linkAlignmentMarkerId && runtime.activeAlignmentSceneInstance?.view) {
    updateViewerCoordinates(runtime.activeAlignmentSceneInstance.view.parameters());
  }
  positionSceneConfigOverlay();
  positionInfoMarkerConfigOverlay();
  positionLinkMarkerConfigOverlay();
  positionLightMarkerConfigOverlay();
  positionSoundMarkerConfigOverlay();
  updateMobileViewerMetaLayout();
  updateNodeMapElasticGuide();
  scheduleInfoMarkerContentOverlayPosition();
  syncMapPanelWidthToLayout();
  if (runtime.tutorial !== null) {
    window.requestAnimationFrame(() => {
      updateTutorialPresentation();
    });
  }
}

function getVisibleViewerFrameRect() {
  const frame = elements.viewerFrame;
  const shell = elements.viewerShell;
  if (!frame) {
    return null;
  }

  const frameRect = frame.getBoundingClientRect();
  if (!shell) {
    return frameRect;
  }

  const shellRect = shell.getBoundingClientRect();
  const left = Math.max(frameRect.left, shellRect.left);
  const top = Math.max(frameRect.top, shellRect.top);
  const right = Math.min(frameRect.right, shellRect.right);
  const bottom = Math.min(frameRect.bottom, shellRect.bottom);
  if (right <= left || bottom <= top) {
    return frameRect;
  }

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  };
}

function getConfigOverlayAnchorRect() {
  if (isCompactLayout() && state.activeTab === 'mapa' && runtime.mobilePanelOpen && !runtime.mobileHubOpen && elements.nodeMap) {
    const rect = elements.nodeMap.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return rect;
    }
  }

  return getVisibleViewerFrameRect();
}

function positionTopRightViewerOverlay(overlay, options = {}) {
  const visibleFrameRect = getConfigOverlayAnchorRect();
  if (!overlay || overlay.hidden || !visibleFrameRect) {
    return;
  }

  const inset = options.inset ?? 14;
  const preferredWidth = options.preferredWidth ?? 360;
  const minWidth = options.minWidth ?? 260;
  const minHeight = options.minHeight ?? 180;
  const availableWidth = Math.max(minWidth, visibleFrameRect.width - (inset * 2));
  const availableHeight = Math.max(minHeight, visibleFrameRect.height - (inset * 2));

  overlay.style.position = 'fixed';
  overlay.style.top = `${visibleFrameRect.top + inset}px`;
  overlay.style.width = `${Math.min(preferredWidth, availableWidth)}px`;
  overlay.style.maxWidth = `${availableWidth}px`;
  overlay.style.maxHeight = `${availableHeight}px`;

  const overlayWidth = overlay.getBoundingClientRect().width || Math.min(preferredWidth, availableWidth);
  const left = Math.max(visibleFrameRect.left + inset, visibleFrameRect.right - inset - overlayWidth);
  overlay.style.left = `${left}px`;
  overlay.style.right = 'auto';
}

function positionCenteredViewerOverlay(overlay, options = {}) {
  const visibleFrameRect = getVisibleViewerFrameRect();
  if (!overlay || overlay.hidden || !visibleFrameRect) {
    return;
  }

  const inset = options.inset ?? 20;
  const preferredWidth = options.preferredWidth ?? 1040;
  const minWidth = options.minWidth ?? 320;
  const minHeight = options.minHeight ?? 240;
  const verticalBias = options.verticalBias ?? Math.min(40, Math.max(18, visibleFrameRect.height * 0.035));
  const useCssResponsiveSizing = overlay.dataset.responsiveSizing === 'css';
  const availableWidth = Math.max(minWidth, visibleFrameRect.width - (inset * 2));
  const availableHeight = Math.max(minHeight, visibleFrameRect.height - (inset * 2));

  overlay.style.position = 'fixed';
  overlay.style.setProperty('--overlay-available-width', `${availableWidth}px`);
  overlay.style.setProperty('--overlay-available-height', `${availableHeight}px`);
  if (useCssResponsiveSizing) {
    overlay.style.removeProperty('width');
  } else {
    overlay.style.width = `${Math.min(preferredWidth, availableWidth)}px`;
  }
  overlay.style.maxWidth = `${availableWidth}px`;
  overlay.style.maxHeight = `${availableHeight}px`;

  const overlayRect = overlay.getBoundingClientRect();
  const overlayWidth = overlayRect.width || overlay.offsetWidth || 0;
  const overlayHeight = overlayRect.height || overlay.offsetHeight || 0;
  if (!overlayWidth || !overlayHeight) {
    return;
  }

  const left = clamp(visibleFrameRect.left + ((visibleFrameRect.width - overlayWidth) / 2), visibleFrameRect.left + inset, visibleFrameRect.right - overlayWidth - inset);
  const top = clamp(visibleFrameRect.top + ((visibleFrameRect.height - overlayHeight) / 2) - verticalBias, visibleFrameRect.top + inset, visibleFrameRect.bottom - overlayHeight - inset);
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.right = 'auto';
}

function positionSceneConfigOverlay() {
  positionTopRightViewerOverlay(elements.sceneConfigOverlay);
}

function positionInfoMarkerConfigOverlay() {
  positionTopRightViewerOverlay(elements.infoMarkerConfigOverlay);
}

function positionLinkMarkerConfigOverlay() {
  positionTopRightViewerOverlay(elements.linkMarkerConfigOverlay);
}

function positionLightMarkerConfigOverlay() {
  positionTopRightViewerOverlay(elements.lightMarkerConfigOverlay);
}

function positionSoundMarkerConfigOverlay() {
  positionTopRightViewerOverlay(elements.soundMarkerConfigOverlay);
}

function updateMobileViewerMetaLayout() {
  if (!elements.viewerShell || !elements.workspace) {
    return;
  }

  if (!isCompactLayout()) {
    elements.workspace.style.removeProperty('--viewer-meta-right-offset');
    elements.workspace.style.removeProperty('--viewer-status-width');
    return;
  }

  const visibleFrameRect = getVisibleViewerFrameRect();
  if (!visibleFrameRect) {
    elements.workspace.style.removeProperty('--viewer-meta-right-offset');
    elements.workspace.style.removeProperty('--viewer-status-width');
    return;
  }

  const topRightOverlays = [
    elements.sceneConfigOverlay,
    elements.infoMarkerConfigOverlay,
    elements.linkMarkerConfigOverlay,
    elements.lightMarkerConfigOverlay,
    elements.soundMarkerConfigOverlay
  ];

  const visibleOverlay = topRightOverlays.find((overlay) => {
    if (!overlay || overlay.hidden) {
      return false;
    }

    const rect = overlay.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  const fallbackOffset = 108;
  if (!visibleOverlay) {
    elements.workspace.style.setProperty('--viewer-meta-right-offset', `${fallbackOffset}px`);
    elements.workspace.style.setProperty('--viewer-status-width', 'calc(100% - 20px)');
    return;
  }

  const overlayRect = visibleOverlay.getBoundingClientRect();
  const offset = Math.max(
    fallbackOffset,
    Math.round((visibleFrameRect.right - overlayRect.left) + 12)
  );

  elements.workspace.style.setProperty('--viewer-meta-right-offset', `${offset}px`);

  const statusWidth = Math.max(
    260,
    Math.round((overlayRect.left - visibleFrameRect.left) - 22)
  );
  elements.workspace.style.setProperty('--viewer-status-width', `${statusWidth}px`);
}

function clearInfoMarkerPlacementShift() {
  if (runtime.infoDisplayPlacementShiftTimer) {
    window.clearTimeout(runtime.infoDisplayPlacementShiftTimer);
    runtime.infoDisplayPlacementShiftTimer = null;
  }
  elements.infoMarkerDisplay?.classList.remove('is-placement-shifting');
  elements.infoMarkerDisplay?.style.setProperty('--info-placement-shift-x', '0px');
  elements.infoMarkerDisplay?.style.setProperty('--info-placement-shift-y', '0px');
}

function animateInfoMarkerPlacementShift(previousPlacement, nextPlacement, previousLeft, previousTop, nextLeft, nextTop) {
  if (!elements.infoMarkerDisplay || previousPlacement === nextPlacement || elements.infoMarkerDisplay.hidden) {
    return;
  }

  if (!Number.isFinite(previousLeft) || !Number.isFinite(previousTop) || !Number.isFinite(nextLeft) || !Number.isFinite(nextTop)) {
    return;
  }

  const shiftX = previousLeft - nextLeft;
  const shiftY = previousTop - nextTop;
  if (Math.abs(shiftX) < 0.5 && Math.abs(shiftY) < 0.5) {
    return;
  }

  clearInfoMarkerPlacementShift();
  elements.infoMarkerDisplay.style.setProperty('--info-placement-shift-x', `${shiftX}px`);
  elements.infoMarkerDisplay.style.setProperty('--info-placement-shift-y', `${shiftY}px`);
  void elements.infoMarkerDisplay.offsetWidth;
  elements.infoMarkerDisplay.classList.add('is-placement-shifting');
  requestAnimationFrame(() => {
    elements.infoMarkerDisplay.style.setProperty('--info-placement-shift-x', '0px');
    elements.infoMarkerDisplay.style.setProperty('--info-placement-shift-y', '0px');
  });
  runtime.infoDisplayPlacementShiftTimer = window.setTimeout(() => {
    clearInfoMarkerPlacementShift();
  }, 340);
}

function showInfoMarkerDisplay() {
  if (runtime.infoDisplayHideTimeout) {
    window.clearTimeout(runtime.infoDisplayHideTimeout);
    runtime.infoDisplayHideTimeout = null;
  }

  elements.infoMarkerDisplay.hidden = false;
  requestAnimationFrame(() => {
    elements.infoMarkerDisplay.classList.add('is-visible');
  });
}

function hideInfoMarkerDisplay(immediate = false) {
  if (runtime.infoDisplayHideTimeout) {
    window.clearTimeout(runtime.infoDisplayHideTimeout);
    runtime.infoDisplayHideTimeout = null;
  }

  clearInfoMarkerPlacementShift();
  elements.infoMarkerDisplay.classList.remove('is-visible');
  if (immediate) {
    elements.infoMarkerDisplay.hidden = true;
    return;
  }

  runtime.infoDisplayHideTimeout = window.setTimeout(() => {
    elements.infoMarkerDisplay.hidden = true;
    runtime.infoDisplayHideTimeout = null;
  }, 170);
}

function closeInfoHotspots() {
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  runtime.hoveredInfoMarkerDisplay = false;
  hideInfoMarkerDisplay();
}

function isCompactLayout() {
  return window.matchMedia('(max-width: 980px)').matches;
}

function setMobileDrawersState({ hubOpen = runtime.mobileHubOpen, panelOpen = runtime.mobilePanelOpen } = {}) {
  runtime.mobileHubOpen = Boolean(hubOpen);
  runtime.mobilePanelOpen = Boolean(panelOpen);
}

function closeMobileDrawers() {
  setMobileDrawersState({ hubOpen: false, panelOpen: false });
}

function revealMobileViewerForMarkerPlacement() {
  if (!isCompactLayout()) {
    return;
  }

  closeMobileDrawers();
  renderTabs();
  window.requestAnimationFrame(() => {
    if (runtime.viewer && typeof runtime.viewer.updateSize === 'function') {
      runtime.viewer.updateSize();
    }
  });
}

function syncMobileLayoutState() {
  const compactLayout = isCompactLayout();

  if (!compactLayout || !runtime.wasCompactLayout) {
    closeMobileDrawers();
  }

  runtime.wasCompactLayout = compactLayout;
}

function handleDocumentPointerDown(event) {
  const target = event.target;

  if (runtime.viewerSettingsOpen && elements.viewerSettingsPanel && elements.viewerSettingsToggle) {
    const clickedInsideSettings = elements.viewerSettingsPanel.contains(target) || elements.viewerSettingsToggle.contains(target);
    if (!clickedInsideSettings) {
      toggleViewerSettingsPanel(false);
    }
  }

  if (elements.infoMarkerContentOverlay.hidden) {
    return;
  }

  if (runtime.tutorial !== null) {
    return;
  }

  if (elements.infoMarkerContentOverlay.contains(target)) {
    return;
  }

  closeInfoMarkerContentEditor({ discardChanges: true });
}

function setActiveTab(tabId, options = {}) {
  const { showHint = false } = options;
  const previousTab = state.activeTab;
  state.activeTab = tabId;
  if (tabId === 'mapa' && previousTab !== 'mapa') {
    runtime.nodeMapNeedsStableScroll = true;
  }
  if (tabId !== 'mapa') {
    runtime.nodeMapSceneSelectionActive = false;
  }

  if (isCompactLayout()) {
    setMobileDrawersState({ hubOpen: false, panelOpen: true });
  }

  if (showHint) {
    showTransientStatus(getTabStatusMessage(tabId));
  }

  if (tabId !== 'marcadores') {
    stopLinkMarkerAlignmentPreview();
    closeInfoMarkerContentEditor({ discardChanges: true });
  }

  if (tabId !== 'marcadores' && tabId !== 'efectos') {
    state.selectedMarkerId = null;
    if (previousTab === 'efectos' && runtime.activeSceneInstance?.view) {
      renderActiveSceneMarkers();
    }
    return;
  }

  const selectedMarker = getSelectedMarker();
  const selectedType = normalizeMarkerType(selectedMarker?.type);

  if (tabId === 'marcadores') {
    const firstSceneMarker = state.markers.find((marker) => marker.sceneId === state.activeSceneId && !isEffectMarkerType(marker.type));
    state.selectedMarkerId = !isEffectMarkerType(selectedType) ? (selectedMarker?.id || firstSceneMarker?.id || null) : (firstSceneMarker?.id || null);
  } else {
    const firstSceneEffect = state.markers.find((marker) => marker.sceneId === state.activeSceneId && isEffectMarkerType(marker.type));
    state.selectedMarkerId = isEffectMarkerType(selectedType) ? selectedMarker.id : (firstSceneEffect?.id || null);
  }

  if (runtime.activeSceneInstance?.view) {
    renderActiveSceneMarkers();
  }
}

function ensureViewer() {
  if (runtime.viewer || !window.Marzipano || !elements.pano) {
    return;
  }

  runtime.viewer = new window.Marzipano.Viewer(elements.pano, {
    controls: {
      mouseViewMode: 'drag'
    }
  });
}

function ensureAlignmentViewer() {
  if (runtime.alignmentViewer || !window.Marzipano || !elements.alignmentPano) {
    return;
  }

  runtime.alignmentViewer = new window.Marzipano.Viewer(elements.alignmentPano, {
    controls: {
      mouseViewMode: 'drag'
    }
  });
}

function bindEvents() {

  elements.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveTab(tab.dataset.tab, { showHint: true });
      render();
    });
  });

  elements.mobileHubToggle?.addEventListener('click', () => {
    const nextHubOpen = !runtime.mobileHubOpen;
    setMobileDrawersState({
      hubOpen: nextHubOpen,
      panelOpen: nextHubOpen ? false : runtime.mobilePanelOpen
    });
    renderTabs();
  });

  elements.mobilePanelToggle?.addEventListener('click', () => {
    const nextPanelOpen = !runtime.mobilePanelOpen;
    setMobileDrawersState({
      hubOpen: nextPanelOpen ? false : runtime.mobileHubOpen,
      panelOpen: nextPanelOpen
    });
    renderTabs();
  });

  elements.mobileConfigToggle?.addEventListener('click', () => {
    runtime.mobileConfigHidden = !runtime.mobileConfigHidden;
    renderTabs();
    renderMarkerConfigOverlays();
  });

  elements.mobileHubClose?.addEventListener('click', () => {
    closeMobileDrawers();
    renderTabs();
  });

  elements.mobilePanelClose?.addEventListener('click', () => {
    closeMobileDrawers();
    renderTabs();
  });

  elements.mobileDrawerBackdrop?.addEventListener('click', () => {
    closeMobileDrawers();
    renderTabs();
  });

  elements.panelHelpButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.helpPanel === 'instrucciones') {
        startInstructionsTutorial();
        return;
      }
      if (button.dataset.helpPanel === 'proyecto') {
        startProjectConfigTutorial();
        return;
      }
      if (button.dataset.helpPanel === 'escenas') {
        startImportScenesTutorial();
        return;
      }
      if (button.dataset.helpPanel === 'marcadores') {
        startMarkersTutorial();
        return;
      }
      if (button.dataset.helpPanel === 'efectos') {
        startEffectsTutorial();
        return;
      }
      if (button.dataset.helpPanel === 'comandos') {
        startSaveLoadTutorial();
        return;
      }
      if (button.dataset.helpPanel === 'mapa') {
        startNodeMapTutorial();
        return;
      }
      showTransientStatus(getPanelHelpStatusMessage(button.dataset.helpPanel), 2600);
    });
  });

  elements.tutorialStartWorkflow?.addEventListener('click', startWorkflowTutorial);
  elements.tutorialStartProjectConfig?.addEventListener('click', startProjectConfigTutorial);
  elements.tutorialStartImportScenes?.addEventListener('click', startImportScenesTutorial);
  elements.tutorialStartMarkers?.addEventListener('click', startMarkersTutorial);
  elements.tutorialStartEffects?.addEventListener('click', startEffectsTutorial);
  elements.tutorialStartSaveLoad?.addEventListener('click', startSaveLoadTutorial);
  elements.tutorialStartNodeMap?.addEventListener('click', startNodeMapTutorial);
  elements.tutorialCard?.addEventListener('click', (event) => { event.stopPropagation(); });
  elements.tutorialClose?.addEventListener('click', (event) => { event.stopPropagation(); closeTutorial(); });
  elements.tutorialNext?.addEventListener('click', (event) => { event.stopPropagation(); advanceTutorial(); });
  elements.infoMarkerDisplay?.addEventListener('mouseenter', handleInfoMarkerDisplayEnter);
  elements.infoMarkerDisplay?.addEventListener('mouseleave', handleInfoMarkerDisplayLeave);
  elements.infoMarkerDisplay?.addEventListener('focusin', handleInfoMarkerDisplayEnter);
  elements.infoMarkerDisplay?.addEventListener('focusout', handleInfoMarkerDisplayLeave);
  elements.infoMarkerDisplay?.addEventListener('pointerdown', (event) => { event.stopPropagation(); });
  elements.infoMarkerDisplay?.addEventListener('pointerup', (event) => { event.stopPropagation(); });
  elements.infoMarkerDisplay?.addEventListener('click', (event) => { event.stopPropagation(); });

  elements.projectName.addEventListener('input', (event) => {
    state.project.name = event.target.value.trimStart();
    renderProjectSummary();
  });

  const commitProjectFovConfig = () => {
    updateProjectFovConfig(elements.projectFovMin.value, elements.projectFovMax.value);
  };

  elements.projectFovMin.addEventListener('change', commitProjectFovConfig);
  elements.projectFovMax.addEventListener('change', commitProjectFovConfig);
  elements.projectFovMin.addEventListener('blur', commitProjectFovConfig);
  elements.projectFovMax.addEventListener('blur', commitProjectFovConfig);

  elements.projectAmbientAudioSelect?.addEventListener('click', () => elements.projectAudioInput?.click());
  elements.projectAmbientAudioClear?.addEventListener('click', clearProjectAmbientAudio);
  elements.projectAmbientAudioVolume?.addEventListener('input', updateProjectAmbientAudioVolume);
  elements.projectAmbientAudioVolume?.addEventListener('change', updateProjectAmbientAudioVolume);
  elements.projectAmbientAudioTransition?.addEventListener('input', updateProjectAmbientAudioTiming);
  elements.projectAmbientAudioTransition?.addEventListener('change', updateProjectAmbientAudioTiming);
  elements.projectAmbientAudioTransition?.addEventListener('blur', updateProjectAmbientAudioTiming);
  elements.projectAmbientAudioOffset?.addEventListener('input', () => updateProjectAmbientAudioTiming('number-live'));
  elements.projectAmbientAudioOffset?.addEventListener('change', () => updateProjectAmbientAudioTiming('number-commit'));
  elements.projectAmbientAudioOffset?.addEventListener('blur', () => updateProjectAmbientAudioTiming('number-commit'));
  elements.projectAmbientAudioOffsetSlider?.addEventListener('input', () => updateProjectAmbientAudioTiming('slider'));
  elements.projectAmbientAudioOffsetSlider?.addEventListener('change', () => updateProjectAmbientAudioTiming('slider'));
  elements.projectAmbientAudioBackground?.addEventListener('change', updateProjectAmbientAudioMode);
  elements.projectAudioInput?.addEventListener('change', () => importAmbientAudioForTarget('project'));

  elements.viewerSettingsToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleViewerSettingsPanel();
  });
  elements.editorFullscreenToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleEditorFullscreen();
  });
  document.addEventListener('fullscreenchange', refreshEditorViewportLayout);
  document.addEventListener('webkitfullscreenchange', refreshEditorViewportLayout);
  elements.viewerSettingsPanel?.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  elements.viewerSettingsVolume?.addEventListener('input', () => {
    runtime.viewerAmbientVolume = clamp((Number(elements.viewerSettingsVolume.value) || 0) / 100, 0, 1);
    syncAmbientAudioPlayback();
    syncActiveSceneSoundPlayback();
    renderViewerSettingsPanel();
  });
  elements.viewerSettingsMute?.addEventListener('change', () => {
    runtime.viewerAmbientMuted = Boolean(elements.viewerSettingsMute.checked);
    syncAmbientAudioPlayback();
    syncActiveSceneSoundPlayback();
    renderViewerSettingsPanel();
  });
  elements.viewerSettingsAutoExpandMap?.addEventListener('change', () => {
    runtime.viewerSettingsAutoExpandMap = Boolean(elements.viewerSettingsAutoExpandMap.checked);
    syncMapPanelWidthToLayout();
    renderViewerSettingsPanel();
  });
  elements.viewerSettingsSafeDelete?.addEventListener('change', () => {
    runtime.viewerSettingsSafeDelete = Boolean(elements.viewerSettingsSafeDelete.checked);
    renderViewerSettingsPanel();
  });

  elements.workspaceSplitter?.addEventListener('pointerdown', handleMapPanelResizePointerDown);

  elements.sceneConfigName.addEventListener('input', () => {
    const scene = state.scenes.find((item) => item.id === state.activeSceneId);
    if (!scene) {
      return;
    }
    scene.name = elements.sceneConfigName.value.trimStart();
    renderViewer();
    renderSceneList();
    renderSceneConfigOverlay();
  });

  const commitSceneViewConfig = () => {
    applySceneConfigInputs();
  };

  elements.sceneConfigYaw.addEventListener('change', commitSceneViewConfig);
  elements.sceneConfigPitch.addEventListener('change', commitSceneViewConfig);
  elements.sceneConfigFov.addEventListener('change', commitSceneViewConfig);
  elements.sceneConfigYaw.addEventListener('blur', commitSceneViewConfig);
  elements.sceneConfigPitch.addEventListener('blur', commitSceneViewConfig);
  elements.sceneConfigFov.addEventListener('blur', commitSceneViewConfig);


  elements.sceneConfigCurrentView.addEventListener('click', () => {
    captureCurrentViewForSceneConfig();
  });
  elements.sceneAmbientAudioSelect?.addEventListener('click', () => elements.sceneAudioInput?.click());
  elements.sceneAmbientAudioClear?.addEventListener('click', clearSceneAmbientAudio);
  elements.sceneAmbientAudioVolume?.addEventListener('input', updateSceneAmbientAudioVolume);
  elements.sceneAmbientAudioVolume?.addEventListener('change', updateSceneAmbientAudioVolume);
  elements.sceneAmbientAudioSyncTimeline?.addEventListener('change', updateSceneAmbientAudioSyncTimeline);
  elements.sceneAudioInput?.addEventListener('change', () => importAmbientAudioForTarget('scene'));
  elements.sceneConfigStart?.addEventListener('click', () => { if (state.activeSceneId) setStartScene(state.activeSceneId); });
  elements.sceneConfigDelete?.addEventListener('click', () => { if (state.activeSceneId) requestDeleteScene(state.activeSceneId); });
  elements.infoMarkerConfigDelete?.addEventListener('click', () => { const marker = getSelectedMarker(); if (marker && normalizeMarkerType(marker.type) === 'info') requestDeleteMarker(marker.id); });
  elements.linkMarkerConfigDelete?.addEventListener('click', () => { const marker = getSelectedMarker(); if (marker && normalizeMarkerType(marker.type) === 'link') requestDeleteMarker(marker.id); });
  elements.lightMarkerConfigDelete?.addEventListener('click', () => { const marker = getSelectedMarker(); if (marker && normalizeMarkerType(marker.type) === 'light') requestDeleteMarker(marker.id); });
  elements.soundMarkerConfigDelete?.addEventListener('click', () => { const marker = getSelectedMarker(); if (marker && normalizeMarkerType(marker.type) === 'sound') requestDeleteMarker(marker.id); });
  elements.confirmModalCancel?.addEventListener('click', closeConfirmDialog);
  elements.confirmModalConfirm?.addEventListener('click', confirmDialogAction);
  elements.confirmModalBackdrop?.addEventListener('click', closeConfirmDialog);

  elements.infoMarkerConfigName.addEventListener('input', updateSelectedInfoMarkerName);
  elements.infoMarkerConfigYaw.addEventListener('change', applySelectedInfoMarkerCoordinates);
  elements.infoMarkerConfigPitch.addEventListener('change', applySelectedInfoMarkerCoordinates);
  elements.infoMarkerConfigYaw.addEventListener('blur', applySelectedInfoMarkerCoordinates);
  elements.infoMarkerConfigPitch.addEventListener('blur', applySelectedInfoMarkerCoordinates);
  elements.infoMarkerConfigContent.addEventListener('click', openSelectedInfoMarkerContentEditor);
  elements.infoMarkerConfigPreviewInTab.addEventListener('change', updateSelectedInfoMarkerPreviewInTab);

  elements.infoMarkerContentImageSelect.addEventListener('click', () => elements.infoMarkerContentImage.click());
  elements.infoMarkerContentImage.addEventListener('change', updateSelectedInfoMarkerImage);
  elements.infoMarkerContentImageAlign.addEventListener('click', handleInfoMarkerContentAlignmentSelection);
  elements.infoMarkerContentTextAlign.addEventListener('click', handleInfoMarkerContentAlignmentSelection);
  elements.infoMarkerContentTextVerticalAlign.addEventListener('click', handleInfoMarkerContentAlignmentSelection);
  elements.infoMarkerContentWidth.addEventListener('input', updateSelectedInfoMarkerPopupWidth);
  elements.infoMarkerContentWidth.addEventListener('change', () => updateSelectedInfoMarkerPopupWidth({ commit: true }));
  elements.infoMarkerContentWidth.addEventListener('blur', () => updateSelectedInfoMarkerPopupWidth({ commit: true }));
  elements.infoMarkerContentWidth.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    updateSelectedInfoMarkerPopupWidth({ commit: true });
    elements.infoMarkerContentWidth.blur();
  });
  elements.infoMarkerContentMediaSplit.addEventListener('input', updateSelectedInfoMarkerMediaSplit);
  elements.infoMarkerContentMediaSplit.addEventListener('change', updateSelectedInfoMarkerMediaSplit);
  elements.infoMarkerContentMediaSplitSlider.addEventListener('input', updateSelectedInfoMarkerMediaSplitFromSlider);
  elements.infoMarkerContentMediaSplitSlider.addEventListener('change', updateSelectedInfoMarkerMediaSplitFromSlider);
  elements.infoMarkerContentImageClear.addEventListener('click', clearSelectedInfoMarkerImage);
  elements.infoMarkerContentCancel.addEventListener('click', () => closeInfoMarkerContentEditor({ discardChanges: true }));
  elements.infoMarkerContentSave.addEventListener('click', saveInfoMarkerContentEditor);

  elements.linkMarkerConfigName.addEventListener('input', updateSelectedLinkMarkerName);
  elements.linkMarkerConfigYaw.addEventListener('change', applySelectedLinkMarkerCoordinates);
  elements.linkMarkerConfigPitch.addEventListener('change', applySelectedLinkMarkerCoordinates);
  elements.linkMarkerConfigYaw.addEventListener('blur', applySelectedLinkMarkerCoordinates);
  elements.linkMarkerConfigPitch.addEventListener('blur', applySelectedLinkMarkerCoordinates);
  elements.linkMarkerConfigTargetScene.addEventListener('change', applySelectedLinkMarkerSettings);
  elements.linkMarkerConfigTransition.addEventListener('change', applySelectedLinkMarkerSettings);
  elements.linkMarkerConfigTransitionDuration.addEventListener('change', applySelectedLinkMarkerSettings);
  elements.linkMarkerConfigTransitionDuration.addEventListener('blur', applySelectedLinkMarkerSettings);
  elements.linkMarkerConfigCenterBeforeTransition.addEventListener('change', applySelectedLinkMarkerSettings);
  elements.linkMarkerConfigAlignView.addEventListener('click', toggleSelectedLinkMarkerAlignmentPreview);
  elements.linkMarkerConfigTest.addEventListener('click', testSelectedLinkMarkerTransition);

  if (elements.lightMarkerConfigName) {
    elements.lightMarkerConfigName.addEventListener('input', updateSelectedLightMarkerName);
    elements.lightMarkerConfigYaw.addEventListener('change', applySelectedLightMarkerCoordinates);
    elements.lightMarkerConfigPitch.addEventListener('change', applySelectedLightMarkerCoordinates);
    elements.lightMarkerConfigYaw.addEventListener('blur', applySelectedLightMarkerCoordinates);
    elements.lightMarkerConfigPitch.addEventListener('blur', applySelectedLightMarkerCoordinates);
    elements.lightMarkerConfigColor.addEventListener('input', updateSelectedLightMarkerAppearance);
    elements.lightMarkerConfigRadius.addEventListener('input', updateSelectedLightMarkerAppearance);
    elements.lightMarkerConfigRadius.addEventListener('change', updateSelectedLightMarkerAppearance);
    elements.lightMarkerConfigIntensity.addEventListener('input', updateSelectedLightMarkerAppearance);
    elements.lightMarkerConfigIntensity.addEventListener('change', updateSelectedLightMarkerAppearance);
    elements.lightMarkerConfigGhostIntensity.addEventListener('input', updateSelectedLightMarkerAppearance);
    elements.lightMarkerConfigGhostIntensity.addEventListener('change', updateSelectedLightMarkerAppearance);
  }

  if (elements.soundMarkerConfigName) {
    elements.soundMarkerConfigName.addEventListener('input', updateSelectedSoundMarkerName);
    elements.soundMarkerConfigYaw.addEventListener('change', applySelectedSoundMarkerCoordinates);
    elements.soundMarkerConfigPitch.addEventListener('change', applySelectedSoundMarkerCoordinates);
    elements.soundMarkerConfigYaw.addEventListener('blur', applySelectedSoundMarkerCoordinates);
    elements.soundMarkerConfigPitch.addEventListener('blur', applySelectedSoundMarkerCoordinates);
    elements.soundMarkerConfigSelect.addEventListener('click', () => elements.soundMarkerAudioInput?.click());
    elements.soundMarkerConfigClear.addEventListener('click', clearSelectedSoundMarkerAudio);
    elements.soundMarkerConfigVolume.addEventListener('input', updateSelectedSoundMarkerSettings);
    elements.soundMarkerConfigVolume.addEventListener('change', updateSelectedSoundMarkerSettings);
    elements.soundMarkerConfigPan.addEventListener('input', updateSelectedSoundMarkerSettings);
    elements.soundMarkerConfigPan.addEventListener('change', updateSelectedSoundMarkerSettings);
    elements.soundMarkerConfigFocus.addEventListener('input', updateSelectedSoundMarkerSettings);
    elements.soundMarkerConfigFocus.addEventListener('change', updateSelectedSoundMarkerSettings);
    elements.soundMarkerConfigLoop.addEventListener('change', updateSelectedSoundMarkerSettings);
  }

  elements.soundMarkerAudioInput?.addEventListener('change', updateSelectedSoundMarkerAudio);

  elements.pano.addEventListener('pointerdown', (event) => {
    runtime.scenePointerDown = { x: event.clientX, y: event.clientY };
  });

  elements.pano.addEventListener('pointerup', (event) => {
    if (!runtime.scenePointerDown) {
      return;
    }

    const distance = Math.hypot(event.clientX - runtime.scenePointerDown.x, event.clientY - runtime.scenePointerDown.y);
    runtime.scenePointerDown = null;

    if (Date.now() < runtime.markerInteractionSuppressUntil) {
      return;
    }

    if (event.target?.closest?.('.viewer-marker') || event.target?.closest?.('.info-marker-display')) {
      return;
    }

    if (distance <= 6) {
      if (tryPlacePendingNodeMapLinkMarker(event)) {
        return;
      }
      if (tryPlacePendingMarker(event)) {
        return;
      }
      closeInfoHotspots();
      if (state.activeTab === 'mapa' && selectActiveSceneForMapConfig({ revealConfig: !isCompactLayout() || !runtime.mobileConfigHidden })) {
        return;
      }
      if ((state.activeTab === 'marcadores' || state.activeTab === 'efectos') && state.selectedMarkerId && !isMarkerConfigTarget(event.target)) {
        clearSelectedMarker();
      }
    }
  });

  elements.pano.addEventListener('pointercancel', () => {
    runtime.scenePointerDown = null;
  });

  elements.importScenes.addEventListener('click', () => {
    elements.sceneFileInput.click();
  });

  elements.nodeMapCreateScene?.addEventListener('click', () => {
    elements.sceneFileInput.click();
  });

  elements.nodeMapCreateLink?.addEventListener('click', () => {
    if (runtime.nodeMapLinkCreation !== null) {
      cancelNodeMapLinkCreation();
      return;
    }
    startNodeMapLinkCreation();
  });

  elements.nodeMapCreateInfo?.addEventListener('click', () => startPendingMarkerPlacement('info')); 
  elements.nodeMapCreateLight?.addEventListener('click', () => startPendingMarkerPlacement('light')); 
  elements.nodeMapCreateSound?.addEventListener('click', () => startPendingMarkerPlacement('sound')); 
  elements.nodeMapHome?.addEventListener('click', centerNodeMapOnNodeMass);

  elements.createLinkMarker.addEventListener('click', () => startPendingMarkerPlacement('link')); 
  elements.createInfoMarker.addEventListener('click', () => startPendingMarkerPlacement('info')); 
  elements.createLightMarker.addEventListener('click', () => startPendingMarkerPlacement('light')); 
  elements.createSoundMarker?.addEventListener('click', () => startPendingMarkerPlacement('sound')); 
  elements.nodeMap?.addEventListener('pointerdown', handleNodeMapPanPointerDown);
  elements.nodeMap?.addEventListener('pointermove', updateNodeMapLinkCreationCursor);
  elements.nodeMap?.addEventListener('wheel', handleNodeMapWheel, { passive: false });

  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
  window.addEventListener('keydown', handleGlobalDeleteShortcut, true);

  elements.sceneFileInput.addEventListener('change', async (event) => {
    const files = [...event.target.files];
    if (!files.length) {
      return;
    }

    const existingImportKeys = new Set(state.scenes.map(getSceneImportKeyFromScene).filter(Boolean));
    const nextFiles = files.filter((file) => !existingImportKeys.has(getSceneImportKey(file)));
    const skippedCount = files.length - nextFiles.length;

    if (!nextFiles.length) {
      window.alert('Esas escenas ya fueron importadas.');
      elements.sceneFileInput.value = '';
      return;
    }

    if (skippedCount > 0) {
      window.alert(`Se omitieron ${skippedCount} escena(s) porque ya estaban importadas.`);
    }

    const pendingScenes = nextFiles.map(createPendingScene);
    state.scenes.push(...pendingScenes);
    state.processingCount += pendingScenes.length;

    if (!state.activeSceneId && pendingScenes[0]) {
      state.activeSceneId = pendingScenes[0].id;
    }

    if (!state.startSceneId && pendingScenes[0]) {
      state.startSceneId = pendingScenes[0].id;
    }

    render();

    for (let index = 0; index < nextFiles.length; index += 1) {
      const file = nextFiles[index];
      const pendingScene = pendingScenes[index];

      try {
        const scene = await processSceneFile(pendingScene, file);
        replaceScene(scene);
      } catch (error) {
        console.error(error);
        replaceScene({
          ...pendingScene,
          processed: {
            ...pendingScene.processed,
            mode: 'error',
            error: 'No se pudo generar el multires para esta imagen.'
          }
        });
      } finally {
        state.processingCount = Math.max(0, state.processingCount - 1);
        render();
      }
    }


    elements.sceneFileInput.value = '';
  });

  elements.saveProject.addEventListener('click', saveProjectToJson);
  elements.loadProject.addEventListener('click', () => elements.projectFileInput.click());
  elements.exportProject.addEventListener('click', exportStandalonePlayer);
  elements.resetProject.addEventListener('click', resetProject);

  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('pointermove', handleNodeMapPointerMove);
  window.addEventListener('pointerup', endNodeMapDrag);
  window.addEventListener('pointercancel', endNodeMapDrag);

  elements.projectFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    try {
      await importProjectFile(file);
    } catch (error) {
      window.alert('No se pudo importar el proyecto.');
      console.error(error);
    } finally {
      elements.projectFileInput.value = '';
    }
  });
}

function parseLocalizedDecimal(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value !== 'string') {
    return NaN;
  }

  const normalized = value.trim().replace(',', '.');
  if (!normalized || /^[-+]?$/u.test(normalized) || /[.]$/u.test(normalized)) {
    return NaN;
  }

  return Number(normalized);
}

function formatLocalizedDecimal(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }

  return numeric
    .toFixed(digits)
    .replace(/0+$/, '')
    .replace(/\.$/, '')
    .replace('.', ',') || '0';
}

function normalizeProjectConfig(project = {}) {
  const minRaw = Number(project.minFovDeg);
  const maxRaw = Number(project.maxFovDeg);
  const transitionRaw = Number(project.ambientAudioTransitionMs);
  const offsetRaw = parseLocalizedDecimal(project.ambientAudioOffset);
  const fadeOutRaw = Number(project.ambientAudioFadeOutRatio);
  const fadeInRaw = Number(project.ambientAudioFadeInRatio);
  const legacyFadeRaw = Number(project.ambientAudioFadeMs);
  const minFovDeg = clamp(Number.isFinite(minRaw) ? minRaw : DEFAULT_MIN_FOV_DEG, 1, 179);
  const maxFovDeg = clamp(Number.isFinite(maxRaw) ? maxRaw : DEFAULT_MAX_FOV_DEG, minFovDeg, 179);
  const transitionMs = clamp(Number.isFinite(transitionRaw) ? transitionRaw : DEFAULT_AMBIENT_AUDIO_TRANSITION_MS, 0, 10000);

  let legacyOffset = DEFAULT_AMBIENT_AUDIO_OFFSET;
  if (Number.isFinite(offsetRaw)) {
    legacyOffset = clamp(offsetRaw, -1, 1);
  } else if (Number.isFinite(fadeOutRaw) || Number.isFinite(fadeInRaw) || Number.isFinite(legacyFadeRaw)) {
    const legacyFadeOutRatio = clamp(Number.isFinite(fadeOutRaw) ? fadeOutRaw : (transitionMs > 0 ? clamp((Number.isFinite(legacyFadeRaw) ? legacyFadeRaw : transitionMs) / transitionMs, 0, 1) : 1), 0, 1);
    const legacyFadeInRatio = clamp(Number.isFinite(fadeInRaw) ? fadeInRaw : (transitionMs > 0 ? clamp((Number.isFinite(legacyFadeRaw) ? legacyFadeRaw : transitionMs) / transitionMs, 0, 1) : 1), 0, 1);
    const legacyInStart = 1 - legacyFadeInRatio;
    const averageDuration = (legacyFadeOutRatio + legacyFadeInRatio) * 0.5;
    legacyOffset = averageDuration > 0 ? clamp(legacyInStart / averageDuration, -1, 1) : DEFAULT_AMBIENT_AUDIO_OFFSET;
  }

  return {
    name: project.name || '',
    minFovDeg,
    maxFovDeg,
    ambientAudio: normalizeAmbientAudioConfig(project.ambientAudio),
    ambientAudioTransitionMs: transitionMs,
    ambientAudioOffset: legacyOffset,
    ambientAudioBackground: Boolean(project.ambientAudioBackground)
  };
}

function getProjectAmbientAudioTimingConfig(project = state.project) {
  const normalized = normalizeProjectConfig(project);
  state.project.ambientAudioTransitionMs = normalized.ambientAudioTransitionMs;
  state.project.ambientAudioOffset = normalized.ambientAudioOffset;
  return {
    transitionMs: normalized.ambientAudioTransitionMs,
    offset: normalized.ambientAudioOffset
  };
}

function getProjectFovConfig() {
  const project = normalizeProjectConfig(state.project);
  state.project.minFovDeg = project.minFovDeg;
  state.project.maxFovDeg = project.maxFovDeg;
  return {
    minDeg: project.minFovDeg,
    maxDeg: project.maxFovDeg,
    minRad: project.minFovDeg * Math.PI / 180,
    maxRad: project.maxFovDeg * Math.PI / 180
  };
}

function updateProjectFovConfig(minValue, maxValue) {
  const nextProject = normalizeProjectConfig({
    ...state.project,
    minFovDeg: minValue,
    maxFovDeg: maxValue
  });

  state.project.minFovDeg = nextProject.minFovDeg;
  state.project.maxFovDeg = nextProject.maxFovDeg;
  elements.projectFovMin.value = String(nextProject.minFovDeg);
  elements.projectFovMax.value = String(nextProject.maxFovDeg);
  applyProjectFovLimits();
  renderProjectSummary();
}

function normalizeAmbientAudioConfig(audio = null) {
  const src = typeof audio?.src === 'string' ? audio.src : '';
  if (!src) {
    return null;
  }

  const volumeRaw = Number(audio?.volume);
  return {
    src,
    fileName: audio?.fileName || 'audio-ambiente.mp3',
    mimeType: audio?.mimeType || 'audio/mpeg',
    volume: clamp(Number.isFinite(volumeRaw) ? volumeRaw : DEFAULT_AMBIENT_AUDIO_VOLUME, 0, 1)
  };
}

function serializeAmbientAudioConfig(audio = null) {
  const normalized = normalizeAmbientAudioConfig(audio);
  return normalized ? { ...normalized } : null;
}

function getAmbientAudioFileName(audio = null) {
  return normalizeAmbientAudioConfig(audio)?.fileName || 'audio-ambiente.mp3';
}

function getAmbientAudioMimeType(audio = null) {
  return normalizeAmbientAudioConfig(audio)?.mimeType || 'audio/mpeg';
}

function getAmbientAudioFileExtension(audio = null) {
  const fileName = getAmbientAudioFileName(audio);
  const fileNameMatch = fileName.match(/\.([a-z0-9]+)$/i);
  if (fileNameMatch) {
    return fileNameMatch[1].toLowerCase();
  }

  const mimeType = getAmbientAudioMimeType(audio).toLowerCase();
  if (mimeType === 'audio/mp4') { return 'm4a'; }
  if (mimeType === 'audio/ogg') { return 'ogg'; }
  if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') { return 'wav'; }
  return 'mp3';
}

function releaseAmbientAudioConfigAsset(audio = null) {
  const src = typeof audio?.src === 'string' ? audio.src : '';
  if (src.startsWith('blob:')) {
    URL.revokeObjectURL(src);
  }
}

function getAmbientAudioLabel(audio = null) {
  const normalized = normalizeAmbientAudioConfig(audio);
  return normalized ? (normalized.fileName || 'audio-ambiente.mp3') : 'Sin audio';
}

function getActiveScene() {
  return state.scenes.find((scene) => scene.id === state.activeSceneId) || null;
}

function isProjectAmbientAudioBackgroundEnabled() {
  return Boolean(normalizeProjectConfig(state.project).ambientAudioBackground);
}

function getProjectAmbientAudioConfig() {
  return normalizeAmbientAudioConfig(state.project.ambientAudio);
}

function getSceneAmbientAudioConfig(scene = null) {
  const activeScene = scene || getActiveScene();
  return normalizeAmbientAudioConfig(activeScene?.ambientAudio);
}
function isSceneAmbientAudioTimelineSynced(scene = null) {
  const activeScene = scene || getActiveScene();
  return Boolean(activeScene?.ambientAudioSyncTimeline);
}
function ensureProjectAudioTimelineClock() {
  if (!Number.isFinite(runtime.projectAudioTimelineStartedAt)) {
    runtime.projectAudioTimelineStartedAt = performance.now();
  }
  return runtime.projectAudioTimelineStartedAt;
}
function resetProjectAudioTimelineClock() {
  runtime.projectAudioTimelineStartedAt = null;
}
function getProjectAudioTimelinePosition(durationSeconds) {
  const duration = Number(durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  const anchor = ensureProjectAudioTimelineClock();
  const elapsedSeconds = Math.max(0, (performance.now() - anchor) / 1000);
  return elapsedSeconds % duration;
}
function primeAmbientAudioForTimeline(audio, options = {}) {
  if (!audio || !options.syncTimeline) {
    return Promise.resolve();
  }
  ensureProjectAudioTimelineClock();
  const applyTimelinePosition = () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }
    try {
      audio.currentTime = getProjectAudioTimelinePosition(audio.duration);
    } catch (error) {
      console.warn('No se pudo sincronizar el audio con el tiempo del proyecto.', error);
    }
  };
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    applyTimelinePosition();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', handleReady);
      audio.removeEventListener('canplay', handleReady);
      audio.removeEventListener('error', handleDone);
    };
    const handleReady = () => {
      cleanup();
      applyTimelinePosition();
      resolve();
    };
    const handleDone = () => {
      cleanup();
      resolve();
    };
    audio.addEventListener('loadedmetadata', handleReady, { once: true });
    audio.addEventListener('canplay', handleReady, { once: true });
    audio.addEventListener('error', handleDone, { once: true });
  });
}
function getEffectiveAmbientAudio(scene = null) {
  const activeScene = scene || getActiveScene();
  const sceneAudio = getSceneAmbientAudioConfig(activeScene);
  if (sceneAudio) {
    return { scope: 'scene', config: sceneAudio, scene: activeScene, syncTimeline: isSceneAmbientAudioTimelineSynced(activeScene) };
  }
  const projectAudio = getProjectAmbientAudioConfig();
  if (projectAudio) {
    return { scope: 'project', config: projectAudio, scene: activeScene, syncTimeline: false };
  }
  return null;
}

function createAmbientAudioElement() {
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  return audio;
}

function ensureAmbientAudioUnlockBinding() {
  if (!runtime.ambientAudioUnlockBound) {
    window.addEventListener('pointerdown', tryResumeAmbientAudioPlayback, true);
    runtime.ambientAudioUnlockBound = true;
  }
}

function stopAmbientAudioElement(audio) {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.removeAttribute('src');
  audio.load();
}

function getAmbientTargetVolume(baseVolume) {
  if (runtime.viewerAmbientMuted) {
    return 0;
  }
  return clamp((Number(baseVolume) || 0) * runtime.viewerAmbientVolume, 0, 1);
}

function stopProjectBackgroundAmbientAudio() {
  if (!runtime.projectBackgroundAudioElement) {
    runtime.projectBackgroundAudioKey = '';
    return;
  }

  stopAmbientAudioElement(runtime.projectBackgroundAudioElement);
  runtime.projectBackgroundAudioElement = null;
  runtime.projectBackgroundAudioKey = '';
}

function syncProjectBackgroundAmbientAudio() {
  if (!isProjectAmbientAudioBackgroundEnabled()) {
    stopProjectBackgroundAmbientAudio();
    return null;
  }

  const projectAudio = getProjectAmbientAudioConfig();
  if (!projectAudio) {
    stopProjectBackgroundAmbientAudio();
    return null;
  }

  ensureAmbientAudioUnlockBinding();
  const nextKey = projectAudio.src;
  let audio = runtime.projectBackgroundAudioElement;
  if (!audio || runtime.projectBackgroundAudioKey !== nextKey) {
    if (audio) {
      stopAmbientAudioElement(audio);
    }
    audio = createAmbientAudioElement();
    audio.src = projectAudio.src;
    audio.currentTime = 0;
    runtime.projectBackgroundAudioElement = audio;
    runtime.projectBackgroundAudioKey = nextKey;
  }

  audio.loop = true;
  audio.muted = Boolean(runtime.viewerAmbientMuted);
  audio.volume = getAmbientTargetVolume(projectAudio.volume);
  if (!audio.muted && audio.volume > 0 && audio.paused) {
    const playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }
  }

  return projectAudio;
}

function cancelAmbientAudioTransition(options = {}) {
  const transition = runtime.ambientAudioTransition;
  if (!transition) {
    return;
  }

  cancelAnimationFrame(transition.frameId);
  const preserveCurrent = Boolean(options.preserveCurrent);
  if (transition.fromAudio && transition.fromAudio !== runtime.ambientAudioElement) {
    stopAmbientAudioElement(transition.fromAudio);
  }
  if (transition.toAudio && (!preserveCurrent || transition.toAudio !== runtime.ambientAudioElement)) {
    stopAmbientAudioElement(transition.toAudio);
  }
  runtime.ambientAudioTransition = null;
}

function stopAmbientAudioPlayback() {
  stopProjectBackgroundAmbientAudio();
  cancelAmbientAudioTransition();
  const audio = runtime.ambientAudioElement;
  if (!audio) {
    runtime.ambientAudioKey = '';
    runtime.ambientAudioBaseVolume = DEFAULT_AMBIENT_AUDIO_VOLUME;
    return;
  }

  stopAmbientAudioElement(audio);
  runtime.ambientAudioElement = null;
  runtime.ambientAudioKey = '';
  runtime.ambientAudioBaseVolume = DEFAULT_AMBIENT_AUDIO_VOLUME;
}

function tryResumeAmbientAudioPlayback() {
  const backgroundAudio = runtime.projectBackgroundAudioElement;
  if (backgroundAudio && !runtime.viewerAmbientMuted && backgroundAudio.volume > 0 && backgroundAudio.paused) {
    const playAttempt = backgroundAudio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }
  }

  const activeAudio = runtime.ambientAudioElement;
  if (activeAudio && !runtime.viewerAmbientMuted && activeAudio.volume > 0 && activeAudio.paused) {
    const playAttempt = activeAudio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }
  }

  const transitionAudio = runtime.ambientAudioTransition?.toAudio;
  if (transitionAudio && transitionAudio !== activeAudio && !runtime.viewerAmbientMuted && transitionAudio.volume > 0 && transitionAudio.paused) {
    const playAttempt = transitionAudio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }
  }
}

function getAmbientTransitionProfile() {
  const timing = getProjectAmbientAudioTimingConfig();
  const transitionMs = Math.max(0, timing.transitionMs);
  const offset = clamp(timing.offset, -1, 1);

  if (transitionMs <= 0) {
    return {
      transitionMs: 0,
      offset,
      fadeDuration: 0,
      fadeOutStart: 0,
      fadeInStart: 0
    };
  }

  const fadeDuration = transitionMs / (1 + Math.abs(offset));
  const fadeOutStart = offset < 0 ? Math.abs(offset) * fadeDuration : 0;
  const fadeInStart = offset > 0 ? offset * fadeDuration : 0;
  return {
    transitionMs,
    offset,
    fadeDuration,
    fadeOutStart,
    fadeInStart
  };
}

function startAmbientAudioTransition(nextAudio, nextBaseVolume, options = {}) {
  cancelAmbientAudioTransition();
  ensureAmbientAudioUnlockBinding();

  const previousAudio = runtime.ambientAudioElement && runtime.ambientAudioElement !== nextAudio ? runtime.ambientAudioElement : null;
  const previousVolume = previousAudio ? previousAudio.volume : 0;
  const profile = getAmbientTransitionProfile();
  const targetVolume = getAmbientTargetVolume(nextBaseVolume);
  const forceInstant = Boolean(options.forceInstant);
  let nextStartRequested = false;

  runtime.ambientAudioElement = nextAudio;
  runtime.ambientAudioBaseVolume = nextBaseVolume;

  const startNextAudio = () => {
    if (nextStartRequested) {
      return;
    }
    nextStartRequested = true;

    const beginPlayback = () => {
      if (runtime.ambientAudioElement !== nextAudio) {
        return;
      }
      nextAudio.muted = Boolean(runtime.viewerAmbientMuted);
      nextAudio.volume = forceInstant || profile.transitionMs <= 0 || profile.fadeDuration <= 0 ? targetVolume : 0;
      const playAttempt = nextAudio.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {});
      }
    };

    primeAmbientAudioForTimeline(nextAudio, options).finally(beginPlayback);
  };

  if (forceInstant || profile.transitionMs <= 0) {
    if (previousAudio) {
      stopAmbientAudioElement(previousAudio);
    }
    startNextAudio();
    nextAudio.volume = targetVolume;
    return;
  }

  const start = performance.now();
  let nextStarted = false;

  const step = (now) => {
    const elapsed = Math.max(0, now - start);

    if (previousAudio) {
      const fadeOutElapsed = Math.max(0, elapsed - profile.fadeOutStart);
      const fadeOutProgress = profile.fadeDuration <= 0 ? 1 : Math.min(1, fadeOutElapsed / profile.fadeDuration);
      const fadeOutEased = 1 - Math.pow(1 - fadeOutProgress, 3);
      previousAudio.volume = previousVolume * (1 - fadeOutEased);
      previousAudio.muted = Boolean(runtime.viewerAmbientMuted);
    }

    if (!nextStarted && elapsed >= profile.fadeInStart) {
      nextStarted = true;
      startNextAudio();
    }

    if (nextStarted) {
      const fadeInElapsed = Math.max(0, elapsed - profile.fadeInStart);
      const fadeInProgress = profile.fadeDuration <= 0 ? 1 : Math.min(1, fadeInElapsed / profile.fadeDuration);
      const fadeInEased = 1 - Math.pow(1 - fadeInProgress, 3);
      nextAudio.volume = targetVolume * fadeInEased;
      nextAudio.muted = Boolean(runtime.viewerAmbientMuted);
    }

    if (elapsed < profile.transitionMs) {
      runtime.ambientAudioTransition.frameId = requestAnimationFrame(step);
      return;
    }

    nextAudio.volume = targetVolume;
    nextAudio.muted = Boolean(runtime.viewerAmbientMuted);
    if (previousAudio) {
      stopAmbientAudioElement(previousAudio);
    }
    runtime.ambientAudioTransition = null;
  };

  runtime.ambientAudioTransition = {
    fromAudio: previousAudio,
    toAudio: nextAudio,
    frameId: requestAnimationFrame(step)
  };
}

function fadeOutAmbientAudio(options = {}) {
  if (!runtime.ambientAudioElement) {
    runtime.ambientAudioKey = '';
    runtime.ambientAudioBaseVolume = DEFAULT_AMBIENT_AUDIO_VOLUME;
    cancelAmbientAudioTransition();
    return;
  }

  cancelAmbientAudioTransition();
  const audio = runtime.ambientAudioElement;
  const startVolume = audio.volume;
  const profile = getAmbientTransitionProfile();
  const forceInstant = Boolean(options.forceInstant);

  if (forceInstant || profile.transitionMs <= 0 || profile.fadeDuration <= 0) {
    stopAmbientAudioElement(audio);
    runtime.ambientAudioElement = null;
    runtime.ambientAudioKey = '';
    runtime.ambientAudioBaseVolume = DEFAULT_AMBIENT_AUDIO_VOLUME;
    return;
  }

  const start = performance.now();

  runtime.ambientAudioTransition = {
    fromAudio: audio,
    toAudio: null,
    frameId: requestAnimationFrame(function step(now) {
      const elapsed = Math.max(0, now - start);
      const progress = Math.min(1, elapsed / profile.fadeDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      audio.volume = startVolume * (1 - eased);
      audio.muted = Boolean(runtime.viewerAmbientMuted);
      if (progress < 1) {
        runtime.ambientAudioTransition.frameId = requestAnimationFrame(step);
        return;
      }
      stopAmbientAudioElement(audio);
      runtime.ambientAudioTransition = null;
    })
  };

  runtime.ambientAudioElement = null;
  runtime.ambientAudioKey = '';
  runtime.ambientAudioBaseVolume = DEFAULT_AMBIENT_AUDIO_VOLUME;
}

function formatAmbientAudioDebugTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) {
    return '--:--.-';
  }

  const minutes = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  const tenths = Math.floor((value - Math.floor(value)) * 10);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

function getAmbientAudioDebugEntries() {
  const entries = [];
  if (runtime.projectBackgroundAudioElement && runtime.projectBackgroundAudioKey) {
    entries.push({ label: 'Proyecto', audio: runtime.projectBackgroundAudioElement });
  }
  if (runtime.ambientAudioElement && runtime.ambientAudioKey) {
    entries.push({ label: isProjectAmbientAudioBackgroundEnabled() ? 'Escena' : 'Activo', audio: runtime.ambientAudioElement });
  }
  return entries;
}

function renderAmbientAudioDebugTimeline() {
  if (!elements.projectSummaryAudioTimeline) {
    return;
  }

  const entries = getAmbientAudioDebugEntries();
  if (!entries.length) {
    elements.projectSummaryAudioTimeline.textContent = 'Linea temporal: sin clip activo.';
    return;
  }

  elements.projectSummaryAudioTimeline.textContent = 'Linea temporal: ' + entries
    .map(({ label, audio }) => `${label} ${formatAmbientAudioDebugTime(audio.currentTime)} / ${formatAmbientAudioDebugTime(audio.duration)}`)
    .join(' | ');
}

function startAmbientAudioDebugTimelineTicker() {
  if (runtime.ambientAudioDebugTimelineTimer !== null) {
    window.clearInterval(runtime.ambientAudioDebugTimelineTimer);
  }

  renderAmbientAudioDebugTimeline();
  runtime.ambientAudioDebugTimelineTimer = window.setInterval(renderAmbientAudioDebugTimeline, 150);
}

function syncAmbientAudioPlayback() {
  const activeScene = getActiveScene();
  const forceInstantTransition = Boolean(runtime.forceInstantAmbientSceneSwitch);
  runtime.forceInstantAmbientSceneSwitch = false;
  syncProjectBackgroundAmbientAudio();
  const effective = isProjectAmbientAudioBackgroundEnabled()
    ? (activeScene && getSceneAmbientAudioConfig(activeScene) ? { scope: 'scene', config: getSceneAmbientAudioConfig(activeScene), scene: activeScene, syncTimeline: isSceneAmbientAudioTimelineSynced(activeScene) } : null)
    : (activeScene ? getEffectiveAmbientAudio(activeScene) : getProjectAmbientAudioConfig() ? { scope: 'project', config: getProjectAmbientAudioConfig(), scene: null, syncTimeline: false } : null);

  if (!effective) {
    fadeOutAmbientAudio({ forceInstant: forceInstantTransition });
    return;
  }

  const config = effective.config;
  const nextKey = `${config.src}::${effective.syncTimeline ? 'sync' : 'local'}`;
  if (runtime.ambientAudioKey === nextKey && runtime.ambientAudioElement) {
    cancelAmbientAudioTransition({ preserveCurrent: true });
    runtime.ambientAudioBaseVolume = config.volume;
    runtime.ambientAudioElement.loop = true;
    runtime.ambientAudioElement.muted = Boolean(runtime.viewerAmbientMuted);
    runtime.ambientAudioElement.volume = getAmbientTargetVolume(config.volume);
    if (!runtime.ambientAudioElement.muted && runtime.ambientAudioElement.volume > 0 && runtime.ambientAudioElement.paused) {
      const resumedPlay = runtime.ambientAudioElement.play();
      if (resumedPlay && typeof resumedPlay.catch === 'function') {
        resumedPlay.catch(() => {});
      }
    }
    return;
  }

  const nextAudio = createAmbientAudioElement();
  nextAudio.src = config.src;
  nextAudio.currentTime = 0;
  nextAudio.loop = true;
  nextAudio.muted = Boolean(runtime.viewerAmbientMuted);
  nextAudio.volume = 0;

  runtime.ambientAudioKey = nextKey;
  startAmbientAudioTransition(nextAudio, config.volume, {
    syncTimeline: Boolean(effective.syncTimeline),
    forceInstant: forceInstantTransition
  });
}

function renderViewerSettingsPanel() {
  renderEditorFullscreenToggle();

  if (elements.viewerSettingsToggle) {
    elements.viewerSettingsToggle.setAttribute('aria-expanded', runtime.viewerSettingsOpen ? 'true' : 'false');
    elements.viewerSettingsToggle.classList.toggle('scene-action--active', runtime.viewerSettingsOpen);
  }

  if (!elements.viewerSettingsPanel) {
    return;
  }

  elements.viewerSettingsPanel.hidden = !runtime.viewerSettingsOpen;
  if (elements.viewerSettingsVolume) {
    elements.viewerSettingsVolume.value = String(Math.round(runtime.viewerAmbientVolume * 100));
  }
  if (elements.viewerSettingsMute) {
    elements.viewerSettingsMute.checked = Boolean(runtime.viewerAmbientMuted);
  }
  if (elements.viewerSettingsAutoExpandMap) {
    elements.viewerSettingsAutoExpandMap.checked = Boolean(runtime.viewerSettingsAutoExpandMap);
  }
  if (elements.viewerSettingsSafeDelete) {
    elements.viewerSettingsSafeDelete.checked = Boolean(runtime.viewerSettingsSafeDelete);
  }
  if (elements.viewerSettingsAudioStatus) {
    const projectAudio = getProjectAmbientAudioConfig();
    const sceneAudio = getSceneAmbientAudioConfig();
    if (isProjectAmbientAudioBackgroundEnabled() && projectAudio && sceneAudio) {
      elements.viewerSettingsAudioStatus.textContent = `Audio activo: proyecto + escena | base ${Math.round(projectAudio.volume * 100)}% + ${Math.round(sceneAudio.volume * 100)}%`;
    } else {
      const effective = getEffectiveAmbientAudio();
      elements.viewerSettingsAudioStatus.textContent = effective
        ? `Audio activo: ${effective.scope === 'scene' ? 'escena' : 'proyecto'} | ${getAmbientAudioLabel(effective.config)} | volumen base ${Math.round(effective.config.volume * 100)}%`
        : 'Sin audio ambiente activo en esta vista.';
    }
  }
  renderAmbientAudioDebugTimeline();
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function getEditorFullscreenTarget() {
  return document.documentElement || elements.appShell;
}

function isEditorFullscreenActive() {
  const fullscreenElement = getFullscreenElement();
  return fullscreenElement === getEditorFullscreenTarget() || fullscreenElement === elements.appShell;
}

function isFullscreenSupported() {
  const fullscreenTarget = getEditorFullscreenTarget();
  return Boolean(
    fullscreenTarget &&
    (document.fullscreenEnabled || document.webkitFullscreenEnabled || fullscreenTarget.requestFullscreen || fullscreenTarget.webkitRequestFullscreen)
  );
}

function renderEditorFullscreenToggle() {
  if (!elements.editorFullscreenToggle) {
    return;
  }

  const supported = isFullscreenSupported();
  const active = isEditorFullscreenActive();
  elements.editorFullscreenToggle.hidden = !supported;
  elements.editorFullscreenToggle.disabled = !supported;
  elements.editorFullscreenToggle.classList.toggle('scene-action--active', active);
  elements.editorFullscreenToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
  elements.editorFullscreenToggle.setAttribute('aria-label', active ? 'Salir de pantalla completa del editor' : 'Pantalla completa del editor');
  elements.editorFullscreenToggle.title = active ? 'Salir de pantalla completa' : 'Pantalla completa';
}

function refreshEditorViewportLayout() {
  renderEditorFullscreenToggle();
  if (runtime.viewer && typeof runtime.viewer.updateSize === 'function') {
    runtime.viewer.updateSize();
  }
  if (runtime.alignmentViewer && typeof runtime.alignmentViewer.updateSize === 'function') {
    runtime.alignmentViewer.updateSize();
  }
  updateMobileViewerMetaLayout();
  scheduleInfoMarkerContentOverlayPosition();
  if (runtime.tutorial !== null) {
    window.requestAnimationFrame(updateTutorialPresentation);
  }
}

async function toggleEditorFullscreen() {
  if (!isFullscreenSupported()) {
    showTransientStatus('Pantalla completa no disponible en este navegador.');
    return;
  }

  try {
    if (isEditorFullscreenActive()) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      const fullscreenTarget = getEditorFullscreenTarget();
      if (fullscreenTarget.requestFullscreen) {
        await fullscreenTarget.requestFullscreen();
      } else if (fullscreenTarget.webkitRequestFullscreen) {
        fullscreenTarget.webkitRequestFullscreen();
      }
    }
  } catch (error) {
    console.warn('No se pudo alternar pantalla completa del editor.', error);
    showTransientStatus('No se pudo activar pantalla completa.');
  }

  refreshEditorViewportLayout();
}

function renderProjectAmbientAudioControls() {
  if (!elements.projectAmbientAudioSummary || !elements.projectAmbientAudioVolume) {
    return;
  }

  const audio = normalizeAmbientAudioConfig(state.project.ambientAudio);
  const timing = getProjectAmbientAudioTimingConfig();
  elements.projectAmbientAudioSummary.textContent = audio
    ? `Archivo cargado: ${audio.fileName}`
    : 'No hay audio ambiente cargado para el proyecto.';
  elements.projectAmbientAudioVolume.value = String(Math.round((audio?.volume ?? DEFAULT_AMBIENT_AUDIO_VOLUME) * 100));
  if (elements.projectAmbientAudioTransition) {
    elements.projectAmbientAudioTransition.value = String(Math.round(timing.transitionMs));
  }
  const offsetSliderValue = timing.offset.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') || '0';
  if (elements.projectAmbientAudioOffset) {
    elements.projectAmbientAudioOffset.value = formatLocalizedDecimal(timing.offset);
  }
  if (elements.projectAmbientAudioOffsetSlider) {
    elements.projectAmbientAudioOffsetSlider.value = offsetSliderValue;
  }
  if (elements.projectAmbientAudioBackground) {
    elements.projectAmbientAudioBackground.checked = Boolean(state.project.ambientAudioBackground);
  }
  elements.projectAmbientAudioVolume.disabled = !audio;
  elements.projectAmbientAudioClear.disabled = !audio;
}

function renderSceneAmbientAudioControls(scene = null) {
  if (!elements.sceneAmbientAudioSummary || !elements.sceneAmbientAudioVolume) {
    return;
  }

  const activeScene = scene || getActiveScene();
  const audio = normalizeAmbientAudioConfig(activeScene?.ambientAudio);
  const projectAudio = normalizeAmbientAudioConfig(state.project.ambientAudio);
  const syncTimeline = isSceneAmbientAudioTimelineSynced(activeScene);

  if (audio) {
    elements.sceneAmbientAudioSummary.textContent = syncTimeline
      ? `Archivo cargado: ${audio.fileName}. Se reproducira sincronizado con el tiempo del proyecto.`
      : `Archivo cargado: ${audio.fileName}`;
  } else if (syncTimeline) {
    elements.sceneAmbientAudioSummary.textContent = projectAudio
      ? 'Esta escena heredara el audio ambiente del proyecto. Si luego cargas audio propio, se sincronizara con el tiempo del proyecto.'
      : 'Esta escena no tiene audio propio. Si cargas uno y mantienes esta opcion activa, se sincronizara con el tiempo del proyecto.';
  } else {
    elements.sceneAmbientAudioSummary.textContent = projectAudio
      ? 'Esta escena heredara el audio ambiente del proyecto.'
      : 'Esta escena no tiene audio propio y el proyecto tampoco tiene uno global.';
  }

  elements.sceneAmbientAudioVolume.value = String(Math.round((audio?.volume ?? DEFAULT_AMBIENT_AUDIO_VOLUME) * 100));
  elements.sceneAmbientAudioVolume.disabled = !audio;
  if (elements.sceneAmbientAudioSyncTimeline) {
    elements.sceneAmbientAudioSyncTimeline.checked = syncTimeline;
    elements.sceneAmbientAudioSyncTimeline.disabled = !activeScene;
  }
  elements.sceneAmbientAudioClear.disabled = !audio;
  elements.sceneAmbientAudioSelect.disabled = !activeScene;
}

async function importAmbientAudioForTarget(target) {
  const input = target === 'project' ? elements.projectAudioInput : elements.sceneAudioInput;
  const file = input?.files?.[0];
  if (!file) {
    return;
  }

  const isMp3 = /\.mp3$/i.test(file.name) || /mpeg|mp3/i.test(file.type || '');
  if (!isMp3) {
    window.alert('Por ahora el audio ambiente debe importarse como archivo MP3.');
    input.value = '';
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const ambientAudio = {
      src: dataUrl,
      fileName: file.name,
      mimeType: file.type || 'audio/mpeg',
      volume: DEFAULT_AMBIENT_AUDIO_VOLUME
    };

    if (target === 'project') {
      releaseAmbientAudioConfigAsset(state.project.ambientAudio);
      state.project.ambientAudio = ambientAudio;
      renderProjectSummary();
      renderSceneConfigOverlay();
    } else {
      const scene = getActiveScene();
      if (!scene) {
        window.alert('Primero selecciona una escena para asignarle audio ambiente.');
        return;
      }
      releaseAmbientAudioConfigAsset(scene.ambientAudio);
      scene.ambientAudio = ambientAudio;
      renderSceneConfigOverlay();
    }

    syncAmbientAudioPlayback();
    renderViewerSettingsPanel();
  } catch (error) {
    console.error(error);
    window.alert('No se pudo leer el archivo de audio.');
  } finally {
    if (input) {
      input.value = '';
    }
  }
}

function updateProjectAmbientAudioVolume() {
  const audio = normalizeAmbientAudioConfig(state.project.ambientAudio);
  if (!audio) {
    renderProjectAmbientAudioControls();
    return;
  }

  audio.volume = clamp((Number(elements.projectAmbientAudioVolume?.value) || 0) / 100, 0, 1);
  state.project.ambientAudio = audio;
  renderProjectAmbientAudioControls();
  renderSceneConfigOverlay();
  syncAmbientAudioPlayback();
  renderViewerSettingsPanel();
}

function clearProjectAmbientAudio() {
  releaseAmbientAudioConfigAsset(state.project.ambientAudio);
  state.project.ambientAudio = null;
  state.project.ambientAudioBackground = false;
  renderProjectSummary();
  renderSceneConfigOverlay();
  syncAmbientAudioPlayback();
  renderViewerSettingsPanel();
}

function updateProjectAmbientAudioMode() {
  state.project.ambientAudioBackground = Boolean(elements.projectAmbientAudioBackground?.checked);
  renderProjectAmbientAudioControls();
  syncAmbientAudioPlayback();
  renderViewerSettingsPanel();
}

function updateProjectAmbientAudioTiming(source = 'number-commit') {
  const isSliderSource = source === 'slider';
  const isLiveNumberSource = source === 'number-live';
  const offsetValue = isSliderSource
    ? elements.projectAmbientAudioOffsetSlider?.value
    : elements.projectAmbientAudioOffset?.value;

  if (isLiveNumberSource && !Number.isFinite(parseLocalizedDecimal(offsetValue))) {
    return;
  }

  const timing = getProjectAmbientAudioTimingConfig({
    ...state.project,
    ambientAudioTransitionMs: elements.projectAmbientAudioTransition?.value,
    ambientAudioOffset: offsetValue
  });

  state.project.ambientAudioTransitionMs = timing.transitionMs;
  state.project.ambientAudioOffset = timing.offset;

  if (isLiveNumberSource) {
    if (elements.projectAmbientAudioOffsetSlider) {
      elements.projectAmbientAudioOffsetSlider.value = timing.offset.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') || '0';
    }
  } else {
    renderProjectAmbientAudioControls();
  }

  syncAmbientAudioPlayback();
}

function updateSceneAmbientAudioVolume() {
  const scene = getActiveScene();
  const audio = normalizeAmbientAudioConfig(scene?.ambientAudio);
  if (!scene || !audio) {
    renderSceneAmbientAudioControls(scene);
    return;
  }

  audio.volume = clamp((Number(elements.sceneAmbientAudioVolume?.value) || 0) / 100, 0, 1);
  scene.ambientAudio = audio;
  renderSceneAmbientAudioControls(scene);
  syncAmbientAudioPlayback();
  renderViewerSettingsPanel();
}

function clearSceneAmbientAudio() {
  const scene = getActiveScene();
  if (!scene) {
    return;
  }

  releaseAmbientAudioConfigAsset(scene.ambientAudio);
  scene.ambientAudio = null;
  renderSceneConfigOverlay();
  syncAmbientAudioPlayback();
  renderViewerSettingsPanel();
}

function updateSceneAmbientAudioSyncTimeline() {
  const scene = getActiveScene();
  if (!scene) {
    return;
  }

  scene.ambientAudioSyncTimeline = Boolean(elements.sceneAmbientAudioSyncTimeline?.checked);
  renderSceneAmbientAudioControls(scene);
  syncAmbientAudioPlayback();
  renderViewerSettingsPanel();
}

function toggleViewerSettingsPanel(forceOpen = null) {
  runtime.viewerSettingsOpen = typeof forceOpen === 'boolean' ? forceOpen : !runtime.viewerSettingsOpen;
  renderViewerSettingsPanel();
}

function createSceneViewLimiter(scene) {
  const limits = window.Marzipano.RectilinearView.limit;
  const { minRad, maxRad } = getProjectFovConfig();
  const resolutionLimiter = limits.resolution(scene.processed.faceSize);
  const verticalLimiter = limits.vfov(minRad, maxRad);
  const horizontalLimiter = limits.hfov(minRad, maxRad);
  const pitchLimiter = limits.pitch(-Math.PI / 2, Math.PI / 2);

  return (params) => {
    let next = resolutionLimiter({ ...params });
    next = verticalLimiter(next);
    next = horizontalLimiter(next);
    next = pitchLimiter(next);
    return next;
  };
}

function applyProjectFovLimits() {
  state.scenes.forEach((scene) => {
    if (scene.processed.mode === 'multires-listo' && scene.runtimeScene?.view) {
      scene.runtimeScene.view.setLimiter(createSceneViewLimiter(scene));
      scene.runtimeScene.view.setParameters(scene.initialViewParameters);
      scene.initialViewParameters = scene.runtimeScene.view.parameters();
    }
  });

  if (state.activeSceneId) {
    renderViewer();
  }
}
function getSceneImportKey(file) {
  return [file.name, file.size, file.lastModified, file.type || 'image/jpeg'].join('::');
}

function getSceneImportKeyFromScene(scene) {
  return scene.importKey || null;
}

function createPendingScene(file) {
  return {
    id: crypto.randomUUID(),
    name: file.name.replace(/\.[^.]+$/, ''),
    fileName: file.name,
    mimeType: file.type || 'image/jpeg',
    importKey: getSceneImportKey(file),
    width: null,
    height: null,
    createdAt: new Date().toISOString(),
    sourceImageDataUrl: null,
    mapNodePosition: null,
    ambientAudio: null,
    ambientAudioSyncTimeline: false,
    initialViewParameters: {
      yaw: 0,
      pitch: 0,
      fov: INITIAL_FOV
    },
    processed: {
      mode: 'procesando',
      levels: [],
      faceSize: null,
      previewUrl: null,
      posterUrl: null,
      tiles: {},
      assetUrls: [],
      error: null,
      progress: 0,
      progressLabel: 'Preparando panorama'
    }
  };
}

async function processSceneFile(scene, file) {
  const imageBitmap = await createImageBitmap(file);

  try {
    const sourceImageDataUrl = scene.sourceImageDataUrl || await readFileAsDataUrl(file);
    const multires = await buildMultiresAssets(imageBitmap, (update) => {
      setSceneProcessingState(scene.id, update);
    });
    return {
      ...scene,
      mimeType: file.type || scene.mimeType || 'image/jpeg',
      sourceImageDataUrl,
      width: imageBitmap.width,
      height: imageBitmap.height,
      processed: {
        mode: 'multires-listo',
        levels: multires.levels,
        faceSize: multires.faceSize,
        previewUrl: multires.previewUrl,
        posterUrl: multires.posterUrl,
        tiles: multires.tiles,
        assetUrls: multires.assetUrls,
        error: null,
        progress: 1,
        progressLabel: 'Escena lista'
      }
    };
  } finally {
    imageBitmap.close();
  }
}

async function buildMultiresAssets(imageBitmap, onProgress = () => {}) {
  const sourceCanvas = createCanvas(imageBitmap.width, imageBitmap.height);
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(imageBitmap, 0, 0);
  const sourcePixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

  onProgress({ progress: 0.04, label: 'Leyendo panorama fuente' });

  const faceSize = Math.max(FALLBACK_SIZE, Math.min(
    Math.floor(sourceCanvas.width / 4),
    Math.floor(sourceCanvas.height / 2)
  ));
  const renderFaceSize = nextPowerOfTwo(Math.min(MAX_RENDER_FACE_SIZE, Math.max(TILE_SIZE, faceSize)));
  const levels = buildLevels(renderFaceSize);
  const assetUrls = [];
  const tiles = {};
  const totalTileCount = levels.reduce((sum, level) => {
    const tilesPerAxis = level.size / level.tileSize;
    return sum + (CUBE_FACE_IDS.length * tilesPerAxis * tilesPerAxis);
  }, 0);
  let completedTileCount = 0;

  const highResFaces = {};
  for (let faceIndex = 0; faceIndex < CUBE_FACE_IDS.length; faceIndex += 1) {
    const faceId = CUBE_FACE_IDS[faceIndex];
    onProgress({
      progress: 0.08 + ((faceIndex / CUBE_FACE_IDS.length) * 0.32),
      label: `Proyectando cubo ${faceIndex + 1}/${CUBE_FACE_IDS.length}`
    });
    highResFaces[faceId] = renderCubeFace(faceId, renderFaceSize, sourcePixels, sourceCanvas.width, sourceCanvas.height);
    await pauseForFrame();
  }

  const smallestFaceCanvases = {};

  for (let levelIndex = 0; levelIndex < levels.length; levelIndex += 1) {
    const level = levels[levelIndex];
    const faceCanvases = {};

    for (const faceId of CUBE_FACE_IDS) {
      faceCanvases[faceId] = level.size === renderFaceSize
        ? highResFaces[faceId]
        : scaleCanvas(highResFaces[faceId], level.size, level.size);

      if (level.size === FALLBACK_SIZE) {
        smallestFaceCanvases[faceId] = faceCanvases[faceId];
      }
    }

    for (const faceId of CUBE_FACE_IDS) {
      const tilesPerAxis = level.size / level.tileSize;
      for (let y = 0; y < tilesPerAxis; y += 1) {
        for (let x = 0; x < tilesPerAxis; x += 1) {
          const tileCanvas = createCanvas(level.tileSize, level.tileSize);
          const tileContext = tileCanvas.getContext('2d');
          tileContext.drawImage(
            faceCanvases[faceId],
            x * level.tileSize,
            y * level.tileSize,
            level.tileSize,
            level.tileSize,
            0,
            0,
            level.tileSize,
            level.tileSize
          );

          const tileUrl = await canvasToObjectUrl(tileCanvas, 0.82);
          const tileKey = `${levelIndex}/${faceId}/${y}/${x}`;
          tiles[tileKey] = tileUrl;
          assetUrls.push(tileUrl);
          completedTileCount += 1;
          onProgress({
            progress: 0.42 + ((completedTileCount / totalTileCount) * 0.54),
            label: `Generando tiles ${completedTileCount}/${totalTileCount}`
          });
          if ((x + 1) === tilesPerAxis) {
            await pauseForFrame();
          }
        }
      }
    }

    await pauseForFrame();
  }

  onProgress({ progress: 0.98, label: 'Armando preview de escena' });
  const previewCanvas = createCanvas(FALLBACK_SIZE, FALLBACK_SIZE * PREVIEW_FACE_ORDER.length);
  const previewContext = previewCanvas.getContext('2d');
  PREVIEW_FACE_ORDER.forEach((faceId, index) => {
    previewContext.drawImage(smallestFaceCanvases[faceId], 0, index * FALLBACK_SIZE, FALLBACK_SIZE, FALLBACK_SIZE);
  });

  const previewUrl = await canvasToObjectUrl(previewCanvas, 0.76);
  assetUrls.push(previewUrl);
  onProgress({ progress: 1, label: 'Escena lista' });

  return {
    faceSize,
    levels,
    previewUrl,
    posterUrl: tiles['0/f/0/0'] || previewUrl,
    tiles,
    assetUrls
  };
}

function buildLevels(maxFaceSize) {
  const levels = [
    {
      tileSize: FALLBACK_TILE_SIZE,
      size: FALLBACK_SIZE,
      fallbackOnly: true
    }
  ];

  for (let size = TILE_SIZE; size <= maxFaceSize; size *= 2) {
    levels.push({ tileSize: TILE_SIZE, size });
  }

  return levels;
}

function renderCubeFace(faceId, size, sourcePixels, sourceWidth, sourceHeight) {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = context.createImageData(size, size);
  const target = imageData.data;

  for (let y = 0; y < size; y += 1) {
    const v = 1 - (2 * (y + 0.5) / size);
    for (let x = 0; x < size; x += 1) {
      const u = (2 * (x + 0.5) / size) - 1;
      const direction = cubeDirection(faceId, u, v);
      const normalized = normalize(direction);
      const yaw = Math.atan2(normalized.x, -normalized.z);
      const pitch = Math.asin(clamp(normalized.y, -1, 1));
      const sampleX = ((yaw / (2 * Math.PI)) + 0.5) * (sourceWidth - 1);
      const sampleY = (0.5 - (pitch / Math.PI)) * (sourceHeight - 1);
      writeSample(target, (y * size + x) * 4, sourcePixels.data, sourceWidth, sourceHeight, sampleX, sampleY);
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function cubeDirection(faceId, u, v) {
  switch (faceId) {
    case 'f':
      return { x: u, y: v, z: -1 };
    case 'r':
      return { x: 1, y: v, z: u };
    case 'b':
      return { x: -u, y: v, z: 1 };
    case 'l':
      return { x: -1, y: v, z: -u };
    case 'u':
      return { x: u, y: 1, z: v };
    case 'd':
      return { x: u, y: -1, z: -v };
    default:
      return { x: u, y: v, z: -1 };
  }
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
}

function writeSample(target, targetIndex, source, sourceWidth, sourceHeight, x, y) {
  const x0 = mod(Math.floor(x), sourceWidth);
  const x1 = mod(x0 + 1, sourceWidth);
  const y0 = clamp(Math.floor(y), 0, sourceHeight - 1);
  const y1 = clamp(y0 + 1, 0, sourceHeight - 1);
  const tx = x - Math.floor(x);
  const ty = y - Math.floor(y);

  for (let channel = 0; channel < 4; channel += 1) {
    const topLeft = source[(y0 * sourceWidth + x0) * 4 + channel];
    const topRight = source[(y0 * sourceWidth + x1) * 4 + channel];
    const bottomLeft = source[(y1 * sourceWidth + x0) * 4 + channel];
    const bottomRight = source[(y1 * sourceWidth + x1) * 4 + channel];
    const top = topLeft + ((topRight - topLeft) * tx);
    const bottom = bottomLeft + ((bottomRight - bottomLeft) * tx);
    target[targetIndex + channel] = Math.round(top + ((bottom - top) * ty));
  }
}

function scaleCanvas(sourceCanvas, width, height) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, width, height);
  return canvas;
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToObjectUrl(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo generar el blob del tile.'));
        return;
      }

      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg', quality);
  });
}

function replaceScene(nextScene) {
  const index = state.scenes.findIndex((scene) => scene.id === nextScene.id);
  if (index === -1) {
    return;
  }

  releaseSceneAssets(state.scenes[index]);
  state.scenes[index] = nextScene;
  render();
}

function setSceneProcessingState(sceneId, update) {
  const scene = state.scenes.find((item) => item.id === sceneId);
  if (!scene || scene.processed.mode !== 'procesando') {
    return;
  }

  const nextProgress = clamp(update.progress ?? scene.processed.progress ?? 0, 0, 1);
  const nextLabel = update.label || scene.processed.progressLabel || 'Procesando escena';
  const previousProgress = scene.processed.progress ?? 0;
  const previousLabel = scene.processed.progressLabel || '';

  if (Math.abs(nextProgress - previousProgress) < 0.01 && nextLabel === previousLabel) {
    return;
  }

  scene.processed.progress = nextProgress;
  scene.processed.progressLabel = nextLabel;
  updateSceneProgressUI(scene);
}

function render() {
  renderTabs();
  renderProjectSummary();
  renderSceneList();
  renderMarkerPanels();
  renderNodeMap();
  renderNodeMapActions();
  renderViewer();
  renderViewerSettingsPanel();
  syncAmbientAudioPlayback();
  renderSceneConfigOverlay();
  renderMarkerConfigOverlays();
  renderStatus();
  bindScrollablePanelFades();
  updateScrollablePanelFades();
  if (runtime.tutorial !== null) {
    window.requestAnimationFrame(() => {
      updateTutorialPresentation();
    });
  }
}

function renderTabs() {
  syncMobileLayoutState();
  elements.appShell?.classList.toggle('is-map-tab', state.activeTab === 'mapa');
  elements.appShell?.classList.toggle('is-mobile-map-view', isCompactLayout() && state.activeTab === 'mapa');
  elements.appShell?.classList.toggle('is-effect-editing', state.activeTab === 'efectos' || state.activeTab === 'mapa');
  elements.appShell?.classList.toggle('is-mobile-hub-open', isCompactLayout() && runtime.mobileHubOpen);
  elements.appShell?.classList.toggle('is-mobile-panel-open', isCompactLayout() && runtime.mobilePanelOpen);
  elements.appShell?.classList.toggle('is-config-hidden', runtime.mobileConfigHidden);
  elements.appShell?.classList.toggle('is-mobile-config-hidden', isCompactLayout() && runtime.mobileConfigHidden);
  syncMapPanelWidthToLayout();

  if (elements.mobileDrawerBackdrop) {
    const drawersOpen = isCompactLayout() && (runtime.mobileHubOpen || runtime.mobilePanelOpen);
    elements.mobileDrawerBackdrop.hidden = !drawersOpen;
  }

  if (elements.mobileHubToggle) {
    elements.mobileHubToggle.setAttribute('aria-expanded', String(isCompactLayout() && runtime.mobileHubOpen));
  }

  if (elements.mobilePanelToggle) {
    elements.mobilePanelToggle.setAttribute('aria-expanded', String(isCompactLayout() && runtime.mobilePanelOpen));
    const activeTabLabel = elements.tabs.find((tab) => tab.dataset.tab === state.activeTab)?.textContent?.trim() || 'Panel';
    elements.mobilePanelToggle.textContent = activeTabLabel;
  }

  if (elements.mobileConfigToggle) {
    const hasMapConfigSelection = state.activeTab === 'mapa' && (runtime.nodeMapSceneSelectionActive || Boolean(state.selectedMarkerId));
    const canShowViewerConfigToggle = ['escenas', 'marcadores', 'efectos'].includes(state.activeTab) || hasMapConfigSelection;
    const configHidden = runtime.mobileConfigHidden;
    elements.mobileConfigToggle.hidden = !canShowViewerConfigToggle;
    elements.mobileConfigToggle.classList.toggle('is-active', !configHidden);
    elements.mobileConfigToggle.setAttribute('aria-pressed', configHidden ? 'true' : 'false');
    elements.mobileConfigToggle.setAttribute('aria-label', configHidden ? 'Mostrar configuracion del visor' : 'Ocultar configuracion del visor');
    elements.mobileConfigToggle.textContent = 'Config';
  }

  elements.tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.tab === state.activeTab);
  });

  elements.panels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.panel === state.activeTab);
  });

  updateMobileViewerMetaLayout();
}

function renderProjectSummary() {
  const name = state.project.name.trim() || 'Proyecto sin nombre';
  elements.projectName.value = state.project.name;
  elements.projectFovMin.value = String(state.project.minFovDeg);
  elements.projectFovMax.value = String(state.project.maxFovDeg);
  elements.projectSummaryName.textContent = name;
  renderProjectAmbientAudioControls();
}

function normalizeSceneMapNodePosition(position) {
  const x = Number(position?.x);
  const y = Number(position?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return clampNodeMapNodePosition({
    x: Math.round(x),
    y: Math.round(y)
  });
}

function getSceneMapNodePosition(scene, index) {
  const savedPosition = normalizeSceneMapNodePosition(scene?.mapNodePosition);
  if (savedPosition) {
    return savedPosition;
  }

  const column = index % NODE_MAP_GRID_COLUMNS;
  const row = Math.floor(index / NODE_MAP_GRID_COLUMNS);
  return {
    x: NODE_MAP_PADDING + (column * NODE_MAP_HORIZONTAL_GAP),
    y: NODE_MAP_PADDING + (row * NODE_MAP_VERTICAL_GAP)
  };
}

function getNodeMapSceneBounds(scene, index) {
  const position = getSceneMapNodePosition(scene, index);
  const nodeElement = elements.nodeMapSurface?.querySelector(`[data-map-scene-card="${scene.id}"]`);
  return {
    x: position.x,
    y: position.y,
    width: nodeElement?.offsetWidth || NODE_MAP_NODE_WIDTH,
    height: nodeElement?.offsetHeight || NODE_MAP_NODE_HEIGHT
  };
}

function clampNodeMapNodePosition(position, width = NODE_MAP_NODE_WIDTH, height = NODE_MAP_NODE_HEIGHT) {
  const minX = NODE_MAP_PADDING - NODE_MAP_WORLD_ORIGIN_X;
  const minY = NODE_MAP_PADDING - NODE_MAP_WORLD_ORIGIN_Y;
  const maxX = NODE_MAP_WORLD_WIDTH - NODE_MAP_WORLD_ORIGIN_X - NODE_MAP_PADDING - width;
  const maxY = NODE_MAP_WORLD_HEIGHT - NODE_MAP_WORLD_ORIGIN_Y - NODE_MAP_PADDING - height;

  return {
    x: Math.round(clamp(Number(position?.x) || 0, minX, Math.max(minX, maxX))),
    y: Math.round(clamp(Number(position?.y) || 0, minY, Math.max(minY, maxY)))
  };
}

function syncNodeMapNodePositions() {
  const offsetX = runtime.nodeMapRenderOffsetX || 0;
  const offsetY = runtime.nodeMapRenderOffsetY || 0;

  state.scenes.forEach((scene, index) => {
    const node = elements.nodeMapSurface?.querySelector(`[data-map-scene-card="${scene.id}"]`);
    if (!node) {
      return;
    }

    const position = getSceneMapNodePosition(scene, index);
    node.style.left = `${position.x + offsetX}px`;
    node.style.top = `${position.y + offsetY}px`;
  });
}

function getNodeMapDragAutoPanStep(clientX, clientY) {
  if (!elements.nodeMap) {
    return { x: 0, y: 0 };
  }

  const rect = elements.nodeMap.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const margin = Math.min(NODE_MAP_DRAG_AUTOPAN_MARGIN, rect.width / 2, rect.height / 2);
  const getAxisStep = (position, size) => {
    if (margin <= 0) {
      return 0;
    }
    if (position < margin) {
      return clamp(-NODE_MAP_DRAG_AUTOPAN_MAX_STEP * Math.pow((margin - position) / margin, 1.4), -NODE_MAP_DRAG_AUTOPAN_MAX_STEP, 0);
    }
    if (position > size - margin) {
      return clamp(NODE_MAP_DRAG_AUTOPAN_MAX_STEP * Math.pow((position - (size - margin)) / margin, 1.4), 0, NODE_MAP_DRAG_AUTOPAN_MAX_STEP);
    }
    return 0;
  };

  return {
    x: getAxisStep(localX, rect.width),
    y: getAxisStep(localY, rect.height)
  };
}

function getNodeMapGrabPointDelta(scene, drag, clientX, clientY) {
  if (!elements.nodeMap || !scene || !drag) {
    return { x: 0, y: 0, distance: 0 };
  }

  const position = getSceneMapNodePosition(scene, state.scenes.findIndex((entry) => entry.id === scene.id));
  const rect = elements.nodeMap.getBoundingClientRect();
  const zoom = getNodeMapZoom();
  const grabClientX = rect.left + (((position.x + drag.pointerOffsetX + (runtime.nodeMapRenderOffsetX || 0)) * zoom) - elements.nodeMap.scrollLeft);
  const grabClientY = rect.top + (((position.y + drag.pointerOffsetY + (runtime.nodeMapRenderOffsetY || 0)) * zoom) - elements.nodeMap.scrollTop);
  const deltaX = clientX - grabClientX;
  const deltaY = clientY - grabClientY;

  return {
    x: deltaX,
    y: deltaY,
    distance: Math.hypot(deltaX, deltaY)
  };
}

function moveNodeMapDragTowardCursor(scene, drag, clientX, clientY) {
  if (!elements.nodeMap || !scene || !drag) {
    return false;
  }

  const delta = getNodeMapGrabPointDelta(scene, drag, clientX, clientY);
  if (delta.distance <= NODE_MAP_DRAG_CURSOR_EPSILON) {
    return false;
  }

  const zoom = getNodeMapZoom();
  const step = Math.min(NODE_MAP_DRAG_CATCHUP_MAX_STEP, delta.distance);
  const stepX = (delta.x / delta.distance) * step;
  const stepY = (delta.y / delta.distance) * step;
  const currentPosition = getSceneMapNodePosition(scene, state.scenes.findIndex((entry) => entry.id === scene.id));
  const nextPosition = clampNodeMapNodePosition({
    x: Math.round(currentPosition.x + (stepX / zoom)),
    y: Math.round(currentPosition.y + (stepY / zoom))
  });

  if (nextPosition.x === currentPosition.x && nextPosition.y === currentPosition.y) {
    return false;
  }

  scene.mapNodePosition = nextPosition;
  updateNodeMapEdges();
  return true;
}

function advanceNodeMapDragAutoPan(scene, drag, clientX, clientY) {
  if (!elements.nodeMap || !scene || !drag) {
    return false;
  }

  const cursorDelta = getNodeMapGrabPointDelta(scene, drag, clientX, clientY);
  if (cursorDelta.distance <= NODE_MAP_DRAG_CURSOR_EPSILON) {
    return false;
  }

  const step = getNodeMapDragAutoPanStep(clientX, clientY);
  const maxScrollLeft = Math.max(0, elements.nodeMap.scrollWidth - elements.nodeMap.clientWidth);
  const maxScrollTop = Math.max(0, elements.nodeMap.scrollHeight - elements.nodeMap.clientHeight);
  const previousScrollLeft = elements.nodeMap.scrollLeft;
  const previousScrollTop = elements.nodeMap.scrollTop;

  if (Math.abs(step.x) >= 0.1 || Math.abs(step.y) >= 0.1) {
    elements.nodeMap.scrollLeft = clamp(previousScrollLeft + step.x, 0, maxScrollLeft);
    elements.nodeMap.scrollTop = clamp(previousScrollTop + step.y, 0, maxScrollTop);
  }

  const appliedX = elements.nodeMap.scrollLeft - previousScrollLeft;
  const appliedY = elements.nodeMap.scrollTop - previousScrollTop;
  const didMoveNode = moveNodeMapDragTowardCursor(scene, drag, clientX, clientY);

  return didMoveNode || Math.abs(appliedX) >= 0.1 || Math.abs(appliedY) >= 0.1;
}

function stopNodeMapDragAutoPan() {
  if (runtime.nodeMapDragAutoPanFrame) {
    cancelAnimationFrame(runtime.nodeMapDragAutoPanFrame);
    runtime.nodeMapDragAutoPanFrame = 0;
  }
}

function scheduleNodeMapDragAutoPan() {
  if (runtime.nodeMapDragAutoPanFrame) {
    return;
  }

  const tick = () => {
    runtime.nodeMapDragAutoPanFrame = 0;

    const drag = runtime.nodeMapDrag;
    if (!drag || drag.currentClientX == null || drag.currentClientY == null) {
      return;
    }

    const scene = state.scenes.find((entry) => entry.id === drag.sceneId);
    const shouldContinue = advanceNodeMapDragAutoPan(scene, drag, drag.currentClientX, drag.currentClientY);
    if (shouldContinue) {
      runtime.nodeMapDragAutoPanFrame = requestAnimationFrame(tick);
    } else {
      drag.autoPanActive = false;
    }
  };

  runtime.nodeMapDragAutoPanFrame = requestAnimationFrame(tick);
}

function getNodeMapLinkMarkers() {
  const sceneIds = new Set(state.scenes.map((scene) => scene.id));
  return state.markers.filter((marker) => (
    normalizeMarkerType(marker.type) === 'link'
    && sceneIds.has(marker.sceneId)
    && sceneIds.has(marker.targetSceneId)
  ));
}

function getNodeMapSceneQuickItems(sceneId) {
  const items = state.markers.filter((marker) => marker.sceneId === sceneId);
  return {
    info: items.filter((marker) => normalizeMarkerType(marker.type) === 'info'),
    effects: items.filter((marker) => isEffectMarkerType(marker.type))
  };
}

function toggleNodeMapSceneQuickList(sceneId) {
  if (!sceneId) {
    return;
  }

  if (runtime.nodeMapExpandedSceneIds.has(sceneId)) {
    runtime.nodeMapExpandedSceneIds.delete(sceneId);
  } else {
    runtime.nodeMapExpandedSceneIds.add(sceneId);
  }

  renderNodeMap();
}

function buildNodeMapEdgeGeometry(sourceCenter, targetCenter, offset = 0) {
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const length = Math.hypot(dx, dy) || 1;
  const unitX = dx / length;
  const unitY = dy / length;
  const normalX = -unitY;
  const normalY = unitX;
  const edgeInset = 0;
  const startX = sourceCenter.x + (unitX * edgeInset) + (normalX * offset);
  const startY = sourceCenter.y + (unitY * edgeInset) + (normalY * offset);
  const endX = targetCenter.x - (unitX * edgeInset) + (normalX * offset);
  const endY = targetCenter.y - (unitY * edgeInset) + (normalY * offset);
  const middleX = (startX + endX) / 2;
  const middleY = (startY + endY) / 2;

  return {
    line: `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`,
    polyline: `${startX.toFixed(1)},${startY.toFixed(1)} ${middleX.toFixed(1)},${middleY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
  };
}

function updateNodeMapEdges() {
  if (!elements.nodeMapViewport || !elements.nodeMapSurface || !elements.nodeMapEdges || !elements.nodeMapDraftEdges) {
    return;
  }

  const sceneIndexById = new Map(state.scenes.map((scene, index) => [scene.id, index]));
  const offsetX = NODE_MAP_WORLD_ORIGIN_X;
  const offsetY = NODE_MAP_WORLD_ORIGIN_Y;
  const renderedWidth = NODE_MAP_WORLD_WIDTH;
  const renderedHeight = NODE_MAP_WORLD_HEIGHT;
  runtime.nodeMapRenderOffsetX = offsetX;
  runtime.nodeMapRenderOffsetY = offsetY;

  const zoom = getNodeMapZoom();
  elements.nodeMapViewport.style.width = `${renderedWidth * zoom}px`;
  elements.nodeMapViewport.style.height = `${renderedHeight * zoom}px`;
  elements.nodeMapViewport.style.setProperty('--node-map-grid-size', `${28 * zoom}px`);
  elements.nodeMapSurface.style.width = `${renderedWidth}px`;
  elements.nodeMapSurface.style.height = `${renderedHeight}px`;
  elements.nodeMapEdges.style.width = `${renderedWidth}px`;
  elements.nodeMapEdges.style.height = `${renderedHeight}px`;
  elements.nodeMapDraftEdges.style.width = `${renderedWidth}px`;
  elements.nodeMapDraftEdges.style.height = `${renderedHeight}px`;
  elements.nodeMapSurface.style.transform = `scale(${zoom})`;
  elements.nodeMapEdges.style.transform = `scale(${zoom})`;
  elements.nodeMapDraftEdges.style.transform = `scale(${zoom})`;
  elements.nodeMapEdges.setAttribute('viewBox', `0 0 ${renderedWidth} ${renderedHeight}`);
  elements.nodeMapDraftEdges.setAttribute('viewBox', `0 0 ${renderedWidth} ${renderedHeight}`);
  updateNodeMapElasticGuide();
  syncNodeMapNodePositions();

  const edgeEntries = getNodeMapLinkMarkers()

    .map((marker) => ({
      marker,
      sourceScene: state.scenes.find((scene) => scene.id === marker.sceneId),
      targetScene: state.scenes.find((scene) => scene.id === marker.targetSceneId)
    }))
    .filter((entry) => entry.sourceScene && entry.targetScene);

  const groupedEdges = new Map();
  edgeEntries.forEach((entry) => {
    const key = [entry.sourceScene.id, entry.targetScene.id].sort().join('::');
    if (!groupedEdges.has(key)) {
      groupedEdges.set(key, []);
    }
    groupedEdges.get(key).push(entry);
  });

  groupedEdges.forEach((group) => {
    group.sort((a, b) => String(a.marker.createdAt || a.marker.id).localeCompare(String(b.marker.createdAt || b.marker.id)));
    group.forEach((entry, index) => {
      entry.offset = (index - ((group.length - 1) / 2)) * 34;
    });
  });

  const edgeMarkup = edgeEntries.map((entry) => {
    const sourceIndex = sceneIndexById.get(entry.sourceScene.id);
    const targetIndex = sceneIndexById.get(entry.targetScene.id);
    const sourceBounds = getNodeMapSceneBounds(entry.sourceScene, sourceIndex);
    const targetBounds = getNodeMapSceneBounds(entry.targetScene, targetIndex);
    const signedOffset = String(entry.sourceScene.id).localeCompare(String(entry.targetScene.id)) > 0
      ? -(entry.offset || 0)
      : (entry.offset || 0);
    const geometry = buildNodeMapEdgeGeometry({
      x: sourceBounds.x + offsetX + (sourceBounds.width / 2),
      y: sourceBounds.y + offsetY + (sourceBounds.height / 2)
    }, {
      x: targetBounds.x + offsetX + (targetBounds.width / 2),
      y: targetBounds.y + offsetY + (targetBounds.height / 2)
    }, signedOffset);
    const isPlacementPreview = runtime.nodeMapLinkCreation?.markerId === entry.marker.id;
    const selectedClass = state.selectedMarkerId === entry.marker.id ? " is-selected" : "";
    const placementClass = isPlacementPreview ? " is-placing" : "";
    return `
      <g class="node-map__edge${selectedClass}${placementClass}" data-map-edge-group="${escapeText(entry.marker.id)}">
        <polyline class="node-map__edge-curve" points="${geometry.polyline}"></polyline>
        <path class="node-map__edge-hit" d="${geometry.line}" data-map-marker-id="${escapeText(entry.marker.id)}"></path>
      </g>
    `;
  }).join('');

  let draftEdgeMarkup = "";
  if (runtime.nodeMapLinkCreation?.sourceSceneId && !runtime.nodeMapLinkCreation?.targetSceneId) {
    const sourceIndex = sceneIndexById.get(runtime.nodeMapLinkCreation.sourceSceneId);
    const sourceScene = state.scenes[sourceIndex];
    const cursorMapPosition = runtime.nodeMapLinkCreation.cursorMapPosition;
    if (sourceScene && cursorMapPosition) {
      const sourceBounds = getNodeMapSceneBounds(sourceScene, sourceIndex);
      const geometry = buildNodeMapEdgeGeometry({
        x: sourceBounds.x + offsetX + (sourceBounds.width / 2),
        y: sourceBounds.y + offsetY + (sourceBounds.height / 2)
      }, {
        x: cursorMapPosition.x + offsetX,
        y: cursorMapPosition.y + offsetY
      }, 0);
      draftEdgeMarkup = `
        <polyline class="node-map__draft-edge-curve" points="${geometry.polyline}"></polyline>
      `;
    }
  } else if (runtime.nodeMapLinkCreation?.sourceSceneId && runtime.nodeMapLinkCreation?.targetSceneId) {
    const sourceIndex = sceneIndexById.get(runtime.nodeMapLinkCreation.sourceSceneId);
    const targetIndex = sceneIndexById.get(runtime.nodeMapLinkCreation.targetSceneId);
    const sourceScene = state.scenes[sourceIndex];
    const targetScene = state.scenes[targetIndex];
    if (sourceScene && targetScene) {
      const sourceBounds = getNodeMapSceneBounds(sourceScene, sourceIndex);
      const targetBounds = getNodeMapSceneBounds(targetScene, targetIndex);
      const geometry = buildNodeMapEdgeGeometry({
        x: sourceBounds.x + offsetX + (sourceBounds.width / 2),
        y: sourceBounds.y + offsetY + (sourceBounds.height / 2)
      }, {
        x: targetBounds.x + offsetX + (targetBounds.width / 2),
        y: targetBounds.y + offsetY + (targetBounds.height / 2)
      }, 0);
      draftEdgeMarkup = `
        <polyline class="node-map__draft-edge-curve is-placing" points="${geometry.polyline}"></polyline>
      `;
    }
  }

  elements.nodeMapEdges.innerHTML = `
    <defs>
      <marker id="node-map-arrowhead" markerWidth="9" markerHeight="6" refX="4.5" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M 0 0 L 9 3 L 0 6 z" fill="rgba(100, 245, 193, 0.92)"></path>
      </marker>
    </defs>
    ${edgeMarkup}
  `;
  elements.nodeMapDraftEdges.innerHTML = `
    <defs>
      <marker id="node-map-arrowhead-draft" markerWidth="9" markerHeight="6" refX="4.5" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M 0 0 L 9 3 L 0 6 z" fill="rgba(100, 245, 193, 0.98)"></path>
      </marker>
    </defs>
    ${draftEdgeMarkup}
  `;

  [...elements.nodeMapEdges.querySelectorAll('[data-map-marker-id]')].forEach((edgePath) => {
    edgePath.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectMarkerFromNodeMap(edgePath.dataset.mapMarkerId);
    });
  });
}

function renderNodeMap() {
  if (!elements.nodeMapViewport || !elements.nodeMapSurface || !elements.nodeMapEdges || !elements.nodeMapDraftEdges) {
    return;
  }

  if (!state.scenes.length) {
    stopNodeMapElasticReturn();
    elements.nodeMapViewport.style.width = '100%';
    elements.nodeMapViewport.style.height = '100%';
    elements.nodeMapViewport.style.setProperty('--node-map-grid-size', '28px');
    elements.nodeMapViewport.style.setProperty('--node-map-elastic-left', '0px');
    elements.nodeMapViewport.style.setProperty('--node-map-elastic-right', '0px');
    elements.nodeMapViewport.style.setProperty('--node-map-elastic-top', '0px');
    elements.nodeMapViewport.style.setProperty('--node-map-elastic-bottom', '0px');
    elements.nodeMapSurface.innerHTML = '<div class="node-map__empty">Importa escenas para construir el mapa de nodos.</div>';
    elements.nodeMapSurface.style.width = '100%';
    elements.nodeMapSurface.style.height = '100%';
    elements.nodeMapSurface.style.transform = 'scale(1)';
    elements.nodeMapEdges.innerHTML = '';
    elements.nodeMapEdges.style.transform = 'scale(1)';
    elements.nodeMapDraftEdges.innerHTML = '';
    elements.nodeMapDraftEdges.style.transform = 'scale(1)';
    elements.nodeMapEdges.removeAttribute('viewBox');
    elements.nodeMapDraftEdges.removeAttribute('viewBox');
    return;
  }

  const linkMarkers = getNodeMapLinkMarkers();
  const isAwaitingSceneSelection = isNodeMapAwaitingSceneSelection();
  elements.nodeMapSurface.innerHTML = state.scenes.map((scene, index) => {
    const position = getSceneMapNodePosition(scene, index);
    const isActive = scene.id === state.activeSceneId;
    const isStartScene = scene.id === state.startSceneId;
    const quickItems = getNodeMapSceneQuickItems(scene.id);
    const infoCount = quickItems.info.length;
    const effectCount = quickItems.effects.length;
    const isExpanded = runtime.nodeMapExpandedSceneIds.has(scene.id);
    const isLinkSource = runtime.nodeMapLinkCreation?.sourceSceneId === scene.id && !runtime.nodeMapLinkCreation?.markerId;
    const nodeClasses = [
      'node-map__node',
      isActive ? 'is-active' : '',
      isStartScene ? 'is-start' : '',
      isExpanded ? 'is-expanded' : '',
      isAwaitingSceneSelection ? 'is-awaiting-selection' : '',
      isLinkSource ? 'is-link-source' : ''
    ].filter(Boolean).join(' ');
    const quickListMarkup = (infoCount || effectCount) ? `
      <div class="node-map__quick-list" ${isExpanded ? '' : 'hidden'}>
        ${quickItems.info.map((marker) => `
          <button class="node-map__quick-item${state.selectedMarkerId === marker.id ? ' is-selected' : ''}" type="button" data-map-quick-marker-id="${escapeText(marker.id)}">
            <span class="node-map__quick-item-type">&#9436;</span>
            <span class="node-map__quick-item-label">${escapeText(marker.name || 'Media')}</span>
          </button>
        `).join('')}
        ${quickItems.effects.map((marker) => `
          <button class="node-map__quick-item${state.selectedMarkerId === marker.id ? ' is-selected' : ''}" type="button" data-map-quick-marker-id="${escapeText(marker.id)}">
            <span class="node-map__quick-item-type">${escapeText(getMarkerTypeBadge(marker.type))}</span>
            <span class="node-map__quick-item-label">${escapeText(marker.name || getMarkerTypeDefaultName(marker.type, 1))}</span>
          </button>
        `).join('')}
      </div>
    ` : '';

    return `
      <article
        class="${nodeClasses}"
        data-map-scene-card="${scene.id}"
        style="left: ${position.x + (runtime.nodeMapRenderOffsetX || 0)}px; top: ${position.y + (runtime.nodeMapRenderOffsetY || 0)}px;"
      >
        <button class="node-map__start-badge${isStartScene ? ' is-active' : ''}" type="button" data-map-scene-first="${scene.id}" aria-label="Definir como escena inicial">1&ordm;</button>
        <button
          class="node-map__scene-button"
          data-map-scene-id="${scene.id}"
          type="button"
          draggable="false"
        >
          <strong class="node-map__node-title">${escapeText(scene.name || scene.fileName || `Escena ${index + 1}`)}</strong>
        </button>
        <div class="node-map__node-meta">
          <button class="node-map__node-badge node-map__node-badge--toggle" type="button" data-map-scene-toggle="${scene.id}" ${!(infoCount || effectCount) ? 'disabled' : ''} aria-expanded="${isExpanded ? 'true' : 'false'}">
            <span>${infoCount}&#9436;</span>
            <span>${effectCount}&#10022;</span>
          </button>
        </div>
        ${quickListMarkup}
      </article>
    `;
  }).join('');

  [...elements.nodeMapSurface.querySelectorAll('[data-map-scene-card]')].forEach((sceneCard) => {
    sceneCard.addEventListener('pointerdown', (event) => beginNodeMapDrag(event, sceneCard.dataset.mapSceneCard));
  });

  [...elements.nodeMapSurface.querySelectorAll('[data-map-scene-id]')].forEach((nodeButton) => {
    nodeButton.addEventListener('click', (event) => {
      if (performance.now() < runtime.nodeMapSuppressUntil) {
        event.preventDefault();
        return;
      }

      if (event.detail === 0 || event.detail > 0) {
        event.preventDefault();
        if (handleNodeMapLinkSceneSelection(nodeButton.dataset.mapSceneId, { clientX: event.clientX, clientY: event.clientY })) {
          return;
        }
        if (handlePendingMarkerPlacementSceneSelection(nodeButton.dataset.mapSceneId)) {
          return;
        }
        selectSceneFromNodeMap(nodeButton.dataset.mapSceneId);
      }
    });
  });

  [...elements.nodeMapSurface.querySelectorAll('[data-map-scene-toggle]')].forEach((toggleButton) => {
    toggleButton.addEventListener('click', (event) => {
      if (performance.now() < runtime.nodeMapSuppressUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      toggleNodeMapSceneQuickList(toggleButton.dataset.mapSceneToggle);
    });
  });

  [...elements.nodeMapSurface.querySelectorAll('[data-map-scene-first]')].forEach((firstButton) => {
    firstButton.addEventListener('click', (event) => {
      if (performance.now() < runtime.nodeMapSuppressUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setStartScene(firstButton.dataset.mapSceneFirst);
    });
  });

  [...elements.nodeMapSurface.querySelectorAll('[data-map-quick-marker-id]')].forEach((itemButton) => {
    itemButton.addEventListener('click', (event) => {
      if (performance.now() < runtime.nodeMapSuppressUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      selectMarkerFromNodeMap(itemButton.dataset.mapQuickMarkerId);
    });
  });

  updateNodeMapEdges();
  maybeAlignNodeMapToStableBounds();
}

function selectSceneFromNodeMap(sceneId) {
  selectSceneFromSceneList(sceneId, {
    updateNodeMap: true,
    updateTabs: true,
    nodeMapSceneSelectionActive: true,
    mobileConfigHidden: false
  });
}

function clearNodeMapSelection() {
  if (!runtime.nodeMapSceneSelectionActive && !state.selectedMarkerId && runtime.mobileConfigHidden) {
    return;
  }

  runtime.nodeMapSceneSelectionActive = false;
  state.selectedMarkerId = null;
  runtime.mobileConfigHidden = true;
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  hideInfoMarkerDisplay(true);
  closeInfoMarkerContentEditor({ discardChanges: true });
  stopLinkMarkerAlignmentPreview();
  render();
}

function hideNodeMapConfigOverlay() {
  if (!isCompactLayout() || state.activeTab !== 'mapa' || runtime.mobileConfigHidden) {
    return;
  }

  runtime.mobileConfigHidden = true;
  renderTabs();
  renderMarkerConfigOverlays();
}

function isNodeMapUiInteractionTarget(target) {
  return Boolean(target?.closest?.([
    '[data-map-scene-card]',
    '[data-map-scene-id]',
    '[data-map-marker-id]',
    '[data-map-scene-first]',
    '[data-map-scene-toggle]',
    '[data-map-quick-marker-id]',
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
    '[role="button"]'
  ].join(', ')));
}

function selectMarkerFromNodeMap(markerId) {
  const marker = state.markers.find((entry) => entry.id === markerId);
  if (!marker) {
    return;
  }

  runtime.nodeMapSceneSelectionActive = false;
  runtime.mobileConfigHidden = false;
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  hideInfoMarkerDisplay(true);

  if (marker.sceneId === state.activeSceneId && runtime.activeSceneInstance?.view) {
    state.selectedMarkerId = marker.id;
    renderNodeMap();
    renderMarkerConfigOverlays();
    renderActiveSceneMarkers();
    renderTabs();
    centerViewOnMarker(marker, { animate: true });
    return;
  }

  state.activeSceneId = marker.sceneId;
  state.selectedMarkerId = marker.id;
  runtime.pendingSceneTransition = 'instant';
  runtime.pendingMarkerFocus = { markerId: marker.id, animate: false };
  render();
}

function getNodeMapPinchPoints() {
  return [...runtime.nodeMapPointers.values()].slice(0, 2);
}

function getNodeMapPinchMetrics(points = getNodeMapPinchPoints()) {
  if (points.length < 2) {
    return null;
  }

  const [first, second] = points;
  return {
    centerX: (first.clientX + second.clientX) / 2,
    centerY: (first.clientY + second.clientY) / 2,
    distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
  };
}

function cancelNodeMapSinglePointerInteractionsForPinch() {
  if (runtime.nodeMapPan) {
    runtime.nodeMapPan = null;
    elements.nodeMap?.classList.remove('is-panning');
  }

  if (runtime.nodeMapDrag) {
    runtime.nodeMapDrag = null;
    stopNodeMapDragAutoPan();
  }
}

function beginNodeMapPinchIfReady() {
  if (!elements.nodeMap || runtime.nodeMapPinch || runtime.nodeMapPointers.size < 2) {
    return Boolean(runtime.nodeMapPinch);
  }

  const metrics = getNodeMapPinchMetrics();
  if (!metrics || metrics.distance < 8) {
    return false;
  }

  stopNodeMapHomePan();
  stopNodeMapElasticReturn();
  cancelNodeMapSinglePointerInteractionsForPinch();
  runtime.nodeMapPinch = {
    startDistance: metrics.distance,
    startZoom: getNodeMapZoom(),
    moved: false
  };
  elements.nodeMap.classList.add('is-pinching');
  runtime.nodeMapSuppressUntil = performance.now() + 220;
  return true;
}

function updateNodeMapGesturePointer(event) {
  if (!elements.nodeMap || event.pointerId == null) {
    return false;
  }

  runtime.nodeMapPointers.set(event.pointerId, {
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY
  });
  return beginNodeMapPinchIfReady();
}

function updateNodeMapPinch(event) {
  if (!runtime.nodeMapPointers.has(event.pointerId)) {
    return false;
  }

  runtime.nodeMapPointers.set(event.pointerId, {
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY
  });

  const pinch = runtime.nodeMapPinch;
  if (!pinch && !beginNodeMapPinchIfReady()) {
    return false;
  }

  const activePinch = runtime.nodeMapPinch;
  const metrics = getNodeMapPinchMetrics();
  if (!activePinch || !metrics || metrics.distance < 8) {
    return Boolean(activePinch);
  }

  const nextZoom = activePinch.startZoom * (metrics.distance / activePinch.startDistance);
  if (setNodeMapZoomAtClientPoint(nextZoom, metrics.centerX, metrics.centerY)) {
    activePinch.moved = true;
  }

  event.preventDefault();
  return true;
}

function endNodeMapPinchPointer(event) {
  if (event.pointerId != null) {
    runtime.nodeMapPointers.delete(event.pointerId);
  }

  if (!runtime.nodeMapPinch) {
    return false;
  }

  if (runtime.nodeMapPointers.size >= 2) {
    const metrics = getNodeMapPinchMetrics();
    if (metrics) {
      runtime.nodeMapPinch.startDistance = metrics.distance;
      runtime.nodeMapPinch.startZoom = getNodeMapZoom();
    }
    return true;
  }

  const didMove = runtime.nodeMapPinch.moved;
  runtime.nodeMapPinch = null;
  elements.nodeMap?.classList.remove('is-pinching');
  if (didMove) {
    runtime.nodeMapSuppressUntil = performance.now() + 220;
  }
  if (event.type !== 'pointercancel') {
    startNodeMapElasticReturn();
  }
  return true;
}

function beginNodeMapDrag(event, sceneId) {
  if (event.button !== 0) {
    return;
  }

  if (updateNodeMapGesturePointer(event)) {
    event.preventDefault();
    return;
  }

  const controlTarget = event.target?.closest?.('[data-map-scene-first], [data-map-scene-toggle], [data-map-quick-marker-id]');
  if (controlTarget) {
    return;
  }
  event.preventDefault();
  stopNodeMapHomePan();
  stopNodeMapElasticReturn();

  const sceneIndex = state.scenes.findIndex((scene) => scene.id === sceneId);
  const scene = state.scenes[sceneIndex];
  if (!scene) {
    return;
  }

  const position = getSceneMapNodePosition(scene, sceneIndex);
  const pointerWorldPoint = getNodeMapWorldPointFromClient(event.clientX, event.clientY) || position;
  runtime.nodeMapDrag = {
    sceneId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    currentClientX: event.clientX,
    currentClientY: event.clientY,
    pointerOffsetX: pointerWorldPoint.x - position.x,
    pointerOffsetY: pointerWorldPoint.y - position.y,
    moved: false,
    autoPanActive: false,
    startedFromControl: false,
    controlAction: null
  };

  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function handleNodeMapPanPointerDown(event) {
  if (!elements.nodeMap || event.button !== 0) {
    return;
  }

  if (updateNodeMapGesturePointer(event)) {
    event.preventDefault();
    return;
  }

  const target = event.target;
  if (isNodeMapUiInteractionTarget(target)) {
    return;
  }

  stopNodeMapHomePan();
  stopNodeMapElasticReturn();
  const bounds = getNodeMapElasticBounds();
  runtime.nodeMapPan = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    lastClientX: event.clientX,
    lastClientY: event.clientY,
    virtualScrollLeft: getNodeMapElasticVirtualFromScroll(elements.nodeMap.scrollLeft, bounds.x),
    virtualScrollTop: getNodeMapElasticVirtualFromScroll(elements.nodeMap.scrollTop, bounds.y),
    moved: false,
    backgroundTapEligible: state.activeTab === 'mapa'
  };
  elements.nodeMap.setPointerCapture?.(event.pointerId);
  elements.nodeMap.classList.add('is-panning');
  event.preventDefault();
}

function handleNodeMapPointerMove(event) {
  if (updateNodeMapPinch(event)) {
    return;
  }

  const drag = runtime.nodeMapDrag;
  if (drag && event.pointerId === drag.pointerId) {
    const scene = state.scenes.find((entry) => entry.id === drag.sceneId);
    if (!scene) {
      return;
    }

    drag.currentClientX = event.clientX;
    drag.currentClientY = event.clientY;
    if (!drag.moved && Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) > 4) {
      drag.moved = true;
    }

    const step = getNodeMapDragAutoPanStep(event.clientX, event.clientY);
    const shouldUseAutoPan = drag.autoPanActive || Math.abs(step.x) >= 0.1 || Math.abs(step.y) >= 0.1;
    if (shouldUseAutoPan) {
      drag.autoPanActive = true;
      advanceNodeMapDragAutoPan(scene, drag, event.clientX, event.clientY);
      if (getNodeMapGrabPointDelta(scene, drag, event.clientX, event.clientY).distance > NODE_MAP_DRAG_CURSOR_EPSILON) {
        scheduleNodeMapDragAutoPan();
      } else {
        drag.autoPanActive = false;
      }
      return;
    }

    const pointerWorldPoint = getNodeMapWorldPointFromClient(event.clientX, event.clientY);
    if (pointerWorldPoint) {
      scene.mapNodePosition = clampNodeMapNodePosition({
        x: Math.round(pointerWorldPoint.x - drag.pointerOffsetX),
        y: Math.round(pointerWorldPoint.y - drag.pointerOffsetY)
      });
      updateNodeMapEdges();
    }
    return;
  }

  const pan = runtime.nodeMapPan;
  if (!pan || event.pointerId !== pan.pointerId || !elements.nodeMap) {
    return;
  }

  const deltaX = event.clientX - pan.startClientX;
  const deltaY = event.clientY - pan.startClientY;
  if (!pan.moved && Math.hypot(deltaX, deltaY) > 4) {
    pan.moved = true;
  }

  const stepDeltaX = event.clientX - pan.lastClientX;
  const stepDeltaY = event.clientY - pan.lastClientY;
  const bounds = getNodeMapElasticBounds();

  pan.virtualScrollLeft -= stepDeltaX;
  pan.virtualScrollTop -= stepDeltaY;
  pan.virtualScrollLeft = clampNodeMapElasticVirtual(pan.virtualScrollLeft, bounds.x);
  pan.virtualScrollTop = clampNodeMapElasticVirtual(pan.virtualScrollTop, bounds.y);
  elements.nodeMap.scrollLeft = getNodeMapElasticScrollFromVirtual(pan.virtualScrollLeft, bounds.x);
  elements.nodeMap.scrollTop = getNodeMapElasticScrollFromVirtual(pan.virtualScrollTop, bounds.y);
  pan.lastClientX = event.clientX;
  pan.lastClientY = event.clientY;
}

function endNodeMapDrag(event) {
  if (endNodeMapPinchPointer(event)) {
    return;
  }

  const pan = runtime.nodeMapPan;
  if (pan && (event.pointerId == null || event.pointerId === pan.pointerId)) {
    runtime.nodeMapPan = null;
    elements.nodeMap?.classList.remove('is-panning');
    if (event.pointerId != null && typeof elements.nodeMap?.releasePointerCapture === 'function') {
      try {
        elements.nodeMap.releasePointerCapture(event.pointerId);
      } catch (error) {
        // The browser may release capture automatically on pointercancel.
      }
    }
    if (pan.moved) {
      runtime.nodeMapSuppressUntil = performance.now() + 120;
    }
    if (!pan.moved && pan.backgroundTapEligible) {
      if (isCompactLayout()) {
        hideNodeMapConfigOverlay();
      } else {
        clearNodeMapSelection();
      }
      return;
    }
    if (event.type !== 'pointercancel') {
      startNodeMapElasticReturn();
    }
  }

  const drag = runtime.nodeMapDrag;
  if (!drag || (event.pointerId != null && event.pointerId !== drag.pointerId)) {
    return;
  }

  runtime.nodeMapDrag = null;
  stopNodeMapDragAutoPan();

  if (drag.moved) {
    runtime.nodeMapSuppressUntil = performance.now() + 220;
    renderNodeMap();
    if (event.type !== 'pointercancel') {
      startNodeMapElasticReturn();
    }
    return;
  }

  if (drag.startedFromControl) {
    if (drag.controlAction?.type === 'start-scene') {
      setStartScene(drag.controlAction.value);
      return;
    }
    if (drag.controlAction?.type === 'toggle-quick-list') {
      toggleNodeMapSceneQuickList(drag.controlAction.value);
      return;
    }
    if (drag.controlAction?.type === 'select-marker') {
      selectMarkerFromNodeMap(drag.controlAction.value);
      return;
    }
    return;
  }

  if (handleNodeMapLinkSceneSelection(drag.sceneId, { clientX: event.clientX, clientY: event.clientY })) {
    return;
  }

  if (handlePendingMarkerPlacementSceneSelection(drag.sceneId)) {
    return;
  }

  selectSceneFromNodeMap(drag.sceneId);
}

function tryPlacePendingNodeMapLinkMarker(event) {
  const draft = runtime.nodeMapLinkCreation;
  if (!draft?.sourceSceneId || !draft?.targetSceneId || !runtime.activeSceneInstance?.view) {
    return false;
  }

  const coordinates = getMarkerCoordinatesFromPointerEvent(event, runtime.activeSceneInstance.view);
  if (!coordinates) {
    return true;
  }

  const marker = createNodeMapLinkMarker(draft.sourceSceneId, draft.targetSceneId, {
    coordinates,
    renderAfter: false
  });

  runtime.nodeMapLinkCreation = null;
  if (!marker) {
    renderNodeMap();
    renderNodeMapActions();
    renderStatus();
    return true;
  }

  renderNodeMap();
  renderNodeMapActions();
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
  renderStatus();
  return true;
}

function placePendingMarker(type, coordinates, scene = state.scenes.find((entry) => entry.id === state.activeSceneId), options = {}) {
  const { originTab = state.activeTab } = options;
  if (!scene || !coordinates) {
    return null;
  }

  const currentView = runtime.activeSceneInstance?.view?.parameters?.() || scene.initialViewParameters;
  const markerCount = state.markers.length + 1;
  const markerType = normalizeMarkerType(type);
  const marker = {
    id: crypto.randomUUID(),
    type: markerType,
    name: getMarkerTypeDefaultName(markerType, markerCount),
    sceneId: scene.id,
    yaw: coordinates.yaw,
    pitch: coordinates.pitch,
    fov: currentView?.fov ?? INITIAL_FOV,
    content: '',
    contentHtml: '',
    imageSrc: '',
    mediaKind: '',
    mediaSrc: '',
    mediaMimeType: '',
    mediaFileName: '',
    mediaFile: null,
    imageAlign: 'top',
    textAlign: 'left',
    textVerticalAlign: 'top',
    popupWidth: 320,
      mediaSplit: 0.38,
    previewInMarkerTab: false,
    soundSrc: '',
    soundMimeType: '',
    soundFileName: '',
    soundFile: null,
    soundVolume: SOUND_MARKER_DEFAULT_VOLUME,
    soundPan: SOUND_MARKER_DEFAULT_PAN,
    soundFocusDeg: SOUND_MARKER_DEFAULT_FOCUS_DEG,
    soundLoop: true,
    targetSceneId: markerType === 'link' ? getDefaultLinkTargetSceneId(scene.id) : null,
    targetViewParameters: null,
    transition: 'fade',
    transitionDurationMs: DEFAULT_LINK_MARKER_TRANSITION_MS,
    centerBeforeTransition: true,
    flareColor: LIGHT_MARKER_DEFAULT_COLOR,
    flareRadius: LIGHT_MARKER_DEFAULT_RADIUS,
    flareIntensity: LIGHT_MARKER_DEFAULT_INTENSITY,
    ghostIntensity: LIGHT_MARKER_DEFAULT_GHOST_INTENSITY,
    createdAt: new Date().toISOString()
  };

  state.markers.push(marker);
  state.selectedMarkerId = marker.id;
  if (originTab === 'mapa') {
    state.activeTab = 'mapa';
  } else if (isEffectMarkerType(markerType)) {
    state.activeTab = 'efectos';
  } else if (markerType === 'info') {
    state.activeTab = 'marcadores';
  }
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  return marker;
}

function tryPlacePendingMarker(event) {
  const pendingPlacementType = getPendingMarkerPlacementType();
  const scene = state.scenes.find((entry) => entry.id === state.activeSceneId);
  if (!pendingPlacementType || !scene || !runtime.activeSceneInstance?.view) {
    return false;
  }

  const coordinates = getMarkerCoordinatesFromPointerEvent(event, runtime.activeSceneInstance.view);
  if (!coordinates) {
    return true;
  }

  placePendingMarker(pendingPlacementType, coordinates, scene, { originTab: runtime.pendingMarkerPlacement?.originTab });
  runtime.pendingMarkerPlacement = null;
  renderMarkerPanels();
  renderNodeMap();
  renderNodeMapActions();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
  renderStatus();
  return true;
}

function renderSceneList() {
  elements.sceneCounter.textContent = `${state.scenes.length} escena${state.scenes.length === 1 ? '' : 's'} cargada${state.scenes.length === 1 ? '' : 's'}`;

  if (!state.scenes.length) {
    elements.sceneList.innerHTML = '<div class="empty-list">Todavia no hay escenas importadas.</div>';
    return;
  }

  elements.sceneList.innerHTML = state.scenes.map((scene, index) => {
    const isActive = scene.id === state.activeSceneId;
    const isStartScene = scene.id === state.startSceneId;
    const previewUrl = scene.processed.posterUrl || scene.processed.previewUrl || '';
    const previewStyle = previewUrl
      ? `style="background-image: linear-gradient(rgba(2, 6, 12, 0.18), rgba(2, 6, 12, 0.48)), url('${previewUrl}')"`
      : '';
    const progressText = getSceneProgressText(scene);
    const previewContent = previewUrl
      ? ''
      : `<div class="scene-item__preview-placeholder">
          <strong>Escena importada</strong>
          <span>Esperando preview multires</span>
        </div>`;
    const previewClass = previewUrl
      ? 'scene-item__preview'
      : 'scene-item__preview scene-item__preview--placeholder';

    return `
      <article class="scene-item ${isActive ? 'is-active' : ''}" data-scene-id="${scene.id}" draggable="true">
        <div class="scene-item__surface">
          <button class="scene-item__select" type="button" data-scene-select="${scene.id}">
            <div class="${previewClass}" ${previewStyle}>
              ${previewContent}
              <div class="scene-item__overlay">
                <div class="scene-item__overlay-top">
                  <strong class="scene-item__title">${escapeText(scene.name || `Escena ${index + 1}`)}</strong>
                </div>
                <div class="scene-item__meta">
                  <span>${escapeText(scene.fileName)}</span>
                  <span data-scene-progress>${escapeText(progressText)}</span>
                </div>
              </div>
            </div>
          </button>
          <div class="scene-item__actions">
            <button class="scene-action ${isStartScene ? 'scene-action--active' : ''}" type="button" data-scene-first="${scene.id}">1&ordm;</button>
            <button class="scene-action scene-action--danger" type="button" data-scene-delete="${scene.id}">&#128465;</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  [...elements.sceneList.querySelectorAll('[data-scene-id]')].forEach((item) => {
    const sceneId = item.dataset.sceneId;
    const selectButton = item.querySelector('[data-scene-select]');
    const firstButton = item.querySelector('[data-scene-first]');
    const deleteButton = item.querySelector('[data-scene-delete]');

    selectButton?.addEventListener('click', () => {
      selectSceneFromSceneList(sceneId);
    });

    firstButton?.addEventListener('click', () => {
      setStartScene(sceneId);
    });

    deleteButton?.addEventListener('click', () => {
      requestDeleteScene(sceneId);
    });

    item.addEventListener('dragstart', (event) => {
      runtime.draggedSceneId = sceneId;
      runtime.dragClientY = event.clientY;
      item.classList.add('is-dragging');
      startSceneListAutoScroll();
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', sceneId);
      }
    });

    item.addEventListener('dragover', (event) => {
      if (!runtime.draggedSceneId || runtime.draggedSceneId === sceneId) {
        return;
      }

      event.preventDefault();
      runtime.dragClientY = event.clientY;
      const placement = getSceneDropPlacement(item, event.clientY);
      updateSceneDropIndicators(item, placement);
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    });

    item.addEventListener('dragleave', (event) => {
      if (event.relatedTarget && item.contains(event.relatedTarget)) {
        return;
      }
      clearSceneDropIndicators(item);
    });

    item.addEventListener('drop', (event) => {
      event.preventDefault();
      runtime.dragClientY = event.clientY;
      const draggedSceneId = runtime.draggedSceneId || event.dataTransfer?.getData('text/plain');
      const placement = getSceneDropPlacement(item, event.clientY);
      clearSceneDropIndicators(item);
      reorderScenes(draggedSceneId, sceneId, placement);
    });

    item.addEventListener('dragend', () => {
      stopSceneListAutoScroll();
      runtime.draggedSceneId = null;
      runtime.dragClientY = null;
      clearAllSceneDropIndicators();
      elements.sceneList.querySelectorAll('.is-dragging').forEach((card) => card.classList.remove('is-dragging'));
    });
  });
}

function selectSceneFromSceneList(sceneId, options = {}) {
  const {
    updateNodeMap = false,
    updateTabs = false,
    nodeMapSceneSelectionActive = null,
    mobileConfigHidden = null
  } = options;

  if (!state.scenes.some((scene) => scene.id === sceneId)) {
    return false;
  }

  if (nodeMapSceneSelectionActive !== null) {
    runtime.nodeMapSceneSelectionActive = Boolean(nodeMapSceneSelectionActive);
  }
  if (mobileConfigHidden !== null) {
    runtime.mobileConfigHidden = Boolean(mobileConfigHidden);
  }

  state.activeSceneId = sceneId;
  state.selectedMarkerId = null;
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  hideInfoMarkerDisplay(true);
  runtime.pendingSceneTransition = 'instant';
  runtime.forceInstantAmbientSceneSwitch = true;
  renderViewer();
  renderSceneList();
  if (updateNodeMap) {
    renderNodeMap();
  }
  if (updateTabs) {
    renderTabs();
  }
  renderSceneConfigOverlay();
  renderMarkerConfigOverlays();
  syncAmbientAudioPlayback();
  renderViewerSettingsPanel();
  renderAmbientAudioDebugTimeline();
  return true;
}

function startSceneListAutoScroll() {
  if (runtime.dragAutoScrollFrame !== null) {
    return;
  }

  const step = () => {
    runtime.dragAutoScrollFrame = null;

    if (!runtime.draggedSceneId || runtime.dragClientY == null) {
      return;
    }

    autoScrollSceneList(runtime.dragClientY);
    runtime.dragAutoScrollFrame = window.requestAnimationFrame(step);
  };

  runtime.dragAutoScrollFrame = window.requestAnimationFrame(step);
}

function stopSceneListAutoScroll() {
  if (runtime.dragAutoScrollFrame !== null) {
    window.cancelAnimationFrame(runtime.dragAutoScrollFrame);
    runtime.dragAutoScrollFrame = null;
  }
}

function autoScrollSceneList(clientY) {
  const list = elements.sceneList;
  if (!list) {
    return;
  }

  const bounds = list.getBoundingClientRect();
  const threshold = Math.min(72, bounds.height * 0.22);
  let delta = 0;

  if (clientY < bounds.top + threshold) {
    const ratio = 1 - ((clientY - bounds.top) / threshold);
    delta = -Math.max(6, Math.round(18 * ratio));
  } else if (clientY > bounds.bottom - threshold) {
    const ratio = 1 - ((bounds.bottom - clientY) / threshold);
    delta = Math.max(6, Math.round(18 * ratio));
  }

  if (delta !== 0) {
    list.scrollTop += delta;
  }
}
function getSceneDropPlacement(button, clientY) {
  const bounds = button.getBoundingClientRect();
  const offsetY = clientY - bounds.top;
  const ratio = bounds.height ? (offsetY / bounds.height) : 0.5;

  if (ratio < 0.26) {
    return 'before';
  }

  if (ratio > 0.74) {
    return 'after';
  }

  return 'swap';
}

function clearSceneDropIndicators(target = elements.sceneList) {
  target.querySelectorAll?.('.drop-before, .drop-after, .drop-swap').forEach((item) => {
    item.classList.remove('drop-before', 'drop-after', 'drop-swap');
  });
}

function clearAllSceneDropIndicators() {
  clearSceneDropIndicators(elements.sceneList);
}

function updateSceneDropIndicators(button, placement) {
  clearAllSceneDropIndicators();
  button.classList.add(`drop-${placement}`);
}


function renderMarkerPanels() {
  renderMarkerList();
  renderEffectList();
}

function renderMarkerCollection(listElement, markers, emptyMessage) {
  if (!listElement) {
    return;
  }

  if (!markers.length) {
    listElement.innerHTML = `<div class="empty-list">${escapeText(emptyMessage)}</div>`;
    return;
  }

  listElement.innerHTML = markers.map((marker, index) => {
    const scene = state.scenes.find((item) => item.id === marker.sceneId);
    const sceneName = scene?.name || 'Escena eliminada';
    const markerTypeLabel = getMarkerTypeLabel(marker.type);
    const selectedClass = marker.id === state.selectedMarkerId ? ' is-active' : '';
    return '<article class="marker-item' + selectedClass + '">' + '<div class="marker-item__surface">' + '<button class="marker-item__select" type="button" data-marker-select="' + escapeText(marker.id) + '">' + '<div class="marker-item__header">' + '<strong>' + escapeText(marker.name || ('Marcador ' + (index + 1))) + '</strong>' + '<span>' + escapeText(sceneName) + '</span>' + '</div>' + '<div class="marker-item__meta">' + '<span>' + escapeText(markerTypeLabel) + '</span>' + '<div class="marker-item__coordinates">' + '<span>Yaw ' + escapeText(formatSceneConfigAngle(marker.yaw)) + ' deg</span>' + '<span>Pitch ' + escapeText(formatSceneConfigAngle(marker.pitch)) + ' deg</span>' + '</div>' + '</div>' + '</button>' + '<div class="marker-item__actions">' + '<button class="scene-action scene-action--danger" type="button" data-marker-delete="' + escapeText(marker.id) + '">&#128465;</button>' + '</div>' + '</div>' + '</article>';
  }).join('');

  [...listElement.querySelectorAll('.marker-item')].forEach((item) => {
    const selectButton = item.querySelector('[data-marker-select]');
    const deleteButton = item.querySelector('[data-marker-delete]');
    selectButton?.addEventListener('click', () => selectMarkerFromPanel(selectButton.dataset.markerSelect));
    deleteButton?.addEventListener('click', () => requestDeleteMarker(deleteButton.dataset.markerDelete));
  });
}

function selectMarkerFromPanel(markerId) {
  const marker = state.markers.find((entry) => entry.id === markerId);
  if (!marker) {
    return;
  }

  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  hideInfoMarkerDisplay(true);

  if (marker.sceneId === state.activeSceneId && runtime.activeSceneInstance?.view) {
    state.selectedMarkerId = marker.id;
    renderMarkerPanels();
    renderMarkerConfigOverlays();
    renderActiveSceneMarkers();
    centerViewOnMarker(marker, { animate: true });
    return;
  }

  state.activeSceneId = marker.sceneId;
  state.selectedMarkerId = marker.id;
  runtime.pendingSceneTransition = 'instant';
  runtime.pendingMarkerFocus = { markerId: marker.id, animate: false };
  render();
}

function renderMarkerList() {
  const markers = state.markers.filter((marker) => !isEffectMarkerType(marker.type));
  renderMarkerCollection(elements.markerList, markers, 'Todavia no hay marcadores creados.');
}

function renderEffectList() {
  const effects = state.markers.filter((marker) => isEffectMarkerType(marker.type));
  renderMarkerCollection(elements.effectList, effects, 'Todavia no hay efectos creados.');
}

function destroyViewerMarkerHotspot(sceneInstance, markerId) {
  if (!sceneInstance?.hotspots?.has(markerId)) {
    return;
  }

  const hotspotEntry = sceneInstance.hotspots.get(markerId);
  if (sceneInstance.hotspotContainer && hotspotEntry?.hotspot && typeof sceneInstance.hotspotContainer.destroyHotspot === 'function') {
    sceneInstance.hotspotContainer.destroyHotspot(hotspotEntry.hotspot);
  } else {
    hotspotEntry?.element?.remove?.();
  }

  sceneInstance.hotspots.delete(markerId);
}

function clearSceneMarkerHotspots(sceneInstance) {
  if (!sceneInstance?.hotspots) {
    return;
  }

  [...sceneInstance.hotspots.keys()].forEach((markerId) => destroyViewerMarkerHotspot(sceneInstance, markerId));
}

function clearActiveSceneLights() {
  if (!elements.lightOverlay) {
    return;
  }

  elements.lightOverlay.innerHTML = '';
  elements.lightOverlay.hidden = true;
}

function clearActiveSceneSoundMarkers() {
  runtime.soundMarkerAudioEntries.forEach((entry) => destroySoundMarkerAudioEntry(entry));
  runtime.soundMarkerAudioEntries.clear();
  runtime.soundMarkerRetiringAudioEntries.forEach((entry) => destroySoundMarkerAudioEntry(entry));
  runtime.soundMarkerRetiringAudioEntries.clear();
}

function clearActiveSceneMarkers() {
  clearSceneMarkerHotspots(runtime.activeSceneInstance);
  clearActiveSceneLights();
  clearActiveSceneSoundMarkers();
  elements.viewerStage.classList.remove('is-marker-dragging');
}

function clearSelectedMarker() {
  state.selectedMarkerId = null;
  closeInfoMarkerContentEditor();
  renderNodeMap();
  renderMarkerConfigOverlays();
  renderActiveSceneMarkers();
}

function selectMarker(markerId) {
  state.selectedMarkerId = markerId;
  if (state.activeTab === 'mapa') {
    runtime.nodeMapSceneSelectionActive = false;
    runtime.mobileConfigHidden = false;
    renderTabs();
  }
  renderNodeMap();
  renderMarkerConfigOverlays();
  renderActiveSceneMarkers();
}

function selectActiveSceneForMapConfig(options = {}) {
  const { revealConfig = true } = options;
  if (state.activeTab !== 'mapa' || !state.activeSceneId) {
    return false;
  }

  runtime.nodeMapSceneSelectionActive = true;
  state.selectedMarkerId = null;
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  hideInfoMarkerDisplay(true);
  closeInfoMarkerContentEditor({ discardChanges: true });
  stopLinkMarkerAlignmentPreview();
  if (revealConfig) {
    runtime.mobileConfigHidden = false;
  }

  renderTabs();
  renderNodeMap();
  renderMarkerConfigOverlays();
  renderActiveSceneMarkers();
  return true;
}

function getActiveSceneMarkers() {
  return state.markers.filter((marker) => marker.sceneId === state.activeSceneId);
}

function getActiveSceneLightMarkers() {
  return getActiveSceneMarkers().filter((marker) => normalizeMarkerType(marker.type) === 'light');
}

function getActiveSceneSoundMarkers() {
  return getActiveSceneMarkers().filter((marker) => normalizeMarkerType(marker.type) === 'sound');
}

function updateViewerMarkerHotspot(marker, markerElement, hotspot) {
  const markerType = normalizeMarkerType(marker.type);
  markerElement.dataset.markerId = marker.id;
  markerElement.dataset.markerType = markerType;
  markerElement.classList.toggle('is-selected', marker.id === state.selectedMarkerId);
  markerElement.setAttribute('aria-label', marker.name || 'Marcador');
  markerElement.title = marker.name || 'Marcador';

  if (markerType === 'light') {
    syncLightMarkerRuntimeElement(marker, markerElement);
  } else {
    markerElement.innerHTML = `<span class="viewer-marker__icon">${getMarkerTypeBadge(marker.type)}</span>`;
  }

  if (hotspot && typeof hotspot.setPosition === 'function') {
    hotspot.setPosition({ yaw: marker.yaw, pitch: marker.pitch });
  }
}

function scheduleLightOpticsSync() {
  if (runtime.lightOpticsFrame) {
    return;
  }

  runtime.lightOpticsFrame = window.requestAnimationFrame(() => {
    runtime.lightOpticsFrame = 0;
    syncActiveSceneLightOptics();
  });
}

function syncActiveSceneLightOptics() {
  getActiveSceneLightMarkers().forEach((marker) => {
    const element = runtime.activeSceneInstance?.hotspots?.get(marker.id)?.element;
    syncLightMarkerOptics(marker, element);
  });
}

function renderActiveSceneLights() {
  clearActiveSceneLights();
  scheduleLightOpticsSync();
}

function renderActiveSceneMarkers() {
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  const sceneInstance = runtime.activeSceneInstance;
  const view = sceneInstance?.view;

  if (!activeScene || !sceneInstance || !view || elements.pano.hidden) {
    clearActiveSceneMarkers();
    hideInfoMarkerDisplay(true);
    return;
  }

  if (runtime.linkAlignmentMarkerId) {
    elements.markerOverlay.hidden = true;
    clearActiveSceneLights();
    syncActiveSceneSoundPlayback();
    hideInfoMarkerDisplay(true);
    return;
  }

  elements.markerOverlay.hidden = false;
  const sceneMarkers = getActiveSceneMarkers();
  const hotspotMarkers = sceneMarkers;
  const activeMarkerIds = new Set(hotspotMarkers.map((marker) => marker.id));

  hotspotMarkers.forEach((marker) => {
    let hotspotEntry = sceneInstance.hotspots.get(marker.id);
    if (!hotspotEntry) {
      const markerElement = createViewerMarkerElement(marker);
      const hotspot = sceneInstance.hotspotContainer?.createHotspot(markerElement, { yaw: marker.yaw, pitch: marker.pitch });
      hotspotEntry = { element: markerElement, hotspot };
      sceneInstance.hotspots.set(marker.id, hotspotEntry);
    }
    updateViewerMarkerHotspot(marker, hotspotEntry.element, hotspotEntry.hotspot);
  });

  [...sceneInstance.hotspots.keys()].filter((markerId) => !activeMarkerIds.has(markerId)).forEach((markerId) => destroyViewerMarkerHotspot(sceneInstance, markerId));
  renderActiveSceneLights();
  syncActiveSceneSoundPlayback();
  updateInfoMarkerDisplayPosition(view);
}

function createViewerMarkerElement(marker) {
  const markerType = normalizeMarkerType(marker.type);
  const markerElement = document.createElement(markerType === 'light' ? 'div' : 'button');
  if (markerType !== 'light') {
    markerElement.type = 'button';
  }
  markerElement.className = 'viewer-marker';
  markerElement.dataset.markerId = marker.id;
  markerElement.dataset.markerType = markerType;
  if (markerType === 'light') {
    markerElement.appendChild(createLightFlareElement(marker));
  }
  markerElement.addEventListener('pointerdown', (event) => {
    const isLightAnchorInteraction = markerType === 'light' && isLightMarkerEditableInCurrentTab() && event.target.closest('.viewer-light__anchor');
    if (markerType === 'light' && isLightMarkerEditableInCurrentTab() && !isLightAnchorInteraction) {
      return;
    }
    event.stopPropagation();
    if (isMarkerEditableInCurrentTab(marker)) {
      handleMarkerEditorPointerDown(event, marker.id);
      return;
    }
    if (markerType === 'light' || markerType === 'sound') {
      return;
    }
    handleViewerMarkerActivation(event, marker.id);
  });
  markerElement.addEventListener('pointerup', (event) => {
    if (markerType === 'light' && isLightMarkerEditableInCurrentTab() && !event.target.closest('.viewer-light__anchor')) {
      return;
    }
    event.stopPropagation();
  });
  markerElement.addEventListener('click', (event) => {
    if (markerType === 'light' && isLightMarkerEditableInCurrentTab() && !event.target.closest('.viewer-light__anchor')) {
      return;
    }
    event.stopPropagation();
  });
  markerElement.addEventListener('mouseenter', () => handleViewerMarkerHover(marker.id));
  markerElement.addEventListener('mouseleave', () => handleViewerMarkerLeave(marker.id));
  return markerElement;
}

function isMarkerEditableInCurrentTab(marker) {
  const type = normalizeMarkerType(marker?.type);
  return state.activeTab === 'mapa'
    || (state.activeTab === 'marcadores' && !isEffectMarkerType(type))
    || (state.activeTab === 'efectos' && isEffectMarkerType(type));
}

function isLightMarkerEditableInCurrentTab() {
  return state.activeTab === 'efectos' || state.activeTab === 'mapa';
}

function handleMarkerEditorPointerDown(event, markerId) {
  selectMarker(markerId);
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  const marker = state.markers.find((item) => item.id === markerId && item.sceneId === activeScene?.id);
  const markerElement = event.currentTarget;
  const hotspotEntry = runtime.activeSceneInstance?.hotspots?.get(markerId);

  if (!marker || !runtime.activeSceneInstance?.view || !markerElement || !hotspotEntry) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const pointerId = event.pointerId;
  const view = runtime.activeSceneInstance.view;
  const startClientX = event.clientX;
  const startClientY = event.clientY;
  let dragging = false;

  if (typeof markerElement.setPointerCapture === 'function') {
    markerElement.setPointerCapture(pointerId);
  }

  const updateMarkerPositionFromPointer = (pointerEvent) => {
    const nextCoordinates = getMarkerCoordinatesFromPointerEvent(pointerEvent, view);
    if (!nextCoordinates) {
      return;
    }

    marker.yaw = nextCoordinates.yaw;
    marker.pitch = nextCoordinates.pitch;
    if (hotspotEntry.hotspot && typeof hotspotEntry.hotspot.setPosition === 'function') {
      hotspotEntry.hotspot.setPosition({ yaw: marker.yaw, pitch: marker.pitch });
    }
    renderMarkerPanels();
    renderMarkerConfigOverlays();
    updateInfoMarkerDisplayPosition(view, marker.id === runtime.pinnedInfoMarkerId || marker.id === runtime.hoveredInfoMarkerId ? marker : undefined);
    scheduleLightOpticsSync();
  };

  const handlePointerMove = (pointerEvent) => {
    if (!dragging) {
      const distance = Math.hypot(pointerEvent.clientX - startClientX, pointerEvent.clientY - startClientY);
      if (distance < 6) {
        return;
      }

      dragging = true;
      runtime.activeMarkerDrag = { markerId, pointerId };
      elements.viewerStage.classList.add('is-marker-dragging');
    }

    updateMarkerPositionFromPointer(pointerEvent);
  };

  const stopDragging = () => {
    markerElement.removeEventListener('pointermove', handlePointerMove);
    markerElement.removeEventListener('pointerup', stopDragging);
    markerElement.removeEventListener('pointercancel', stopDragging);

    runtime.markerInteractionSuppressUntil = Date.now() + 180;

    if (!dragging) {
      renderMarkerConfigOverlays();
      return;
    }

    elements.viewerStage.classList.remove('is-marker-dragging');
    runtime.activeMarkerDrag = null;
    renderMarkerPanels();
    renderMarkerConfigOverlays();
    renderActiveSceneMarkers();
  };

  markerElement.addEventListener('pointermove', handlePointerMove);
  markerElement.addEventListener('pointerup', stopDragging);
  markerElement.addEventListener('pointercancel', stopDragging);
}

function getMarkerCoordinatesFromPointerEvent(event, view) {
  const rect = elements.pano.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  const x = clamp(event.clientX - rect.left, 0, rect.width);
  const y = clamp(event.clientY - rect.top, 0, rect.height);
  return view.screenToCoordinates({ x, y }, {});
}

function handleViewerMarkerActivation(event, markerId) {
  event.preventDefault();
  const marker = state.markers.find((item) => item.id === markerId && item.sceneId === state.activeSceneId);
  if (!marker) {
    return;
  }

  const markerType = normalizeMarkerType(marker.type);
  if (markerType === 'light' || markerType === 'sound') {
    return;
  }
  if (markerType === 'info') {
    toggleInfoMarkerPinned(marker.id);
    return;
  }
  activateLinkMarker(marker);
}

function handleViewerMarkerHover(markerId) {
  const marker = state.markers.find((item) => item.id === markerId && item.sceneId === state.activeSceneId);
  if (!marker || normalizeMarkerType(marker.type) !== 'info' || runtime.pinnedInfoMarkerId || (state.activeTab === 'marcadores' && !marker.previewInMarkerTab)) {
    return;
  }

  runtime.hoveredInfoMarkerId = marker.id;
  renderInfoMarkerDisplay(marker);
}

function handleViewerMarkerLeave(markerId) {
  if (runtime.pinnedInfoMarkerId || runtime.hoveredInfoMarkerId !== markerId) {
    return;
  }

  runtime.hoveredInfoMarkerId = null;
  if (runtime.hoveredInfoMarkerDisplay) {
    showInfoMarkerDisplay();
    return;
  }
  hideInfoMarkerDisplay();
}

function handleInfoMarkerDisplayEnter() {
  runtime.hoveredInfoMarkerDisplay = true;
  if (getDisplayedInfoMarker()) {
    showInfoMarkerDisplay();
  }
}

function handleInfoMarkerDisplayLeave(event) {
  const nextTarget = event?.relatedTarget;
  if (nextTarget && elements.infoMarkerDisplay?.contains(nextTarget)) {
    return;
  }
  runtime.hoveredInfoMarkerDisplay = false;
  if (!runtime.pinnedInfoMarkerId && !runtime.hoveredInfoMarkerId) {
    hideInfoMarkerDisplay();
  }
}

function toggleInfoMarkerPinned(markerId) {
  if (runtime.pinnedInfoMarkerId === markerId) {
    runtime.pinnedInfoMarkerId = null;
    if (runtime.hoveredInfoMarkerId) {
      const hoveredMarker = state.markers.find((item) => item.id === runtime.hoveredInfoMarkerId);
      if (hoveredMarker) {
        renderInfoMarkerDisplay(hoveredMarker);
        return;
      }
    }
    hideInfoMarkerDisplay();
    return;
  }

  const marker = state.markers.find((item) => item.id === markerId && item.sceneId === state.activeSceneId);
  if (!marker) {
    return;
  }

  runtime.pinnedInfoMarkerId = marker.id;
  renderInfoMarkerDisplay(marker);
}

function getDisplayedInfoMarker() {
  const markerId = runtime.pinnedInfoMarkerId || runtime.hoveredInfoMarkerId;
  return state.markers.find((item) => item.id === markerId && item.sceneId === state.activeSceneId) || null;
}

function normalizeLightHexColor(value) {
  const normalized = String(value || '').trim().match(/^#?([0-9a-fA-F]{6})$/);
  return normalized ? `#${normalized[1].toLowerCase()}` : LIGHT_MARKER_DEFAULT_COLOR;
}

function getLightMarkerColor(marker) { return normalizeLightHexColor(marker?.flareColor); }
function getLightMarkerRadius(marker) { const value = Number(marker?.flareRadius); return clamp(Number.isFinite(value) ? value : LIGHT_MARKER_DEFAULT_RADIUS, 20, 320); }
function getLightMarkerIntensity(marker) { const value = Number(marker?.flareIntensity); return clamp(Number.isFinite(value) ? value : LIGHT_MARKER_DEFAULT_INTENSITY, 0, 1); }
function getLightMarkerGhostIntensity(marker) { const value = Number(marker?.ghostIntensity); return clamp(Number.isFinite(value) ? value : LIGHT_MARKER_DEFAULT_GHOST_INTENSITY, 0, 1); }
function getLightMarkerRgbString(marker) {
  const hex = getLightMarkerColor(marker).slice(1);
  return `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}`;
}

function syncLightMarkerConfigColorInput() {
  if (!elements.lightMarkerConfigColor) {
    return;
  }

  const color = normalizeLightHexColor(elements.lightMarkerConfigColor.value);
  elements.lightMarkerConfigColor.style.setProperty('--selected-color', color);
  elements.lightMarkerConfigColor.style.borderColor = hexToRgba(color, 0.42);
}

function hexToRgba(hex, alpha = 1) {
  const normalized = normalizeLightHexColor(hex).slice(1);
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${clamp(Number(alpha) || 0, 0, 1)})`;
}
function createLightFlareElement() {
  const element = document.createElement('div');
  element.className = 'viewer-light';
  element.innerHTML = '<div class="viewer-light__flare"><div class="viewer-light__core"></div><div class="viewer-light__ring"></div><div class="viewer-light__ghost"></div><div class="viewer-light__axis"></div></div><div class="viewer-light__artifact" data-artifact-factor="0.32" data-artifact-size="0.34" data-artifact-opacity="0.28"></div><div class="viewer-light__artifact is-ring" data-artifact-factor="0.78" data-artifact-size="0.48" data-artifact-opacity="0.18"></div><div class="viewer-light__artifact" data-artifact-factor="1.14" data-artifact-size="0.22" data-artifact-opacity="0.12"></div><div class="viewer-light__anchor"></div>';
  return element;
}

function syncLightMarkerRuntimeElement(marker, markerElement) {
  if (!markerElement) {
    return;
  }

  const radius = getLightMarkerRadius(marker);
  const scale = radius / LIGHT_MARKER_DEFAULT_RADIUS;
  const opacity = clamp(getLightMarkerIntensity(marker), 0, 1);
  const color = getLightMarkerColor(marker);
  const colorRgba = hexToRgba(color, 0.92);
  const artifactRgba = hexToRgba(color, 0.7);

  markerElement.innerHTML = markerElement.innerHTML || '';
  markerElement.classList.toggle('is-selected', marker.id === state.selectedMarkerId);
  markerElement.style.width = '140px';
  markerElement.style.height = '140px';
  markerElement.style.marginLeft = '-70px';
  markerElement.style.marginTop = '-70px';

  const flare = markerElement.querySelector('.viewer-light__flare');
  if (flare) {
    flare.style.setProperty('--flare-opacity', String(opacity));
    flare.style.setProperty('--flare-color', colorRgba);
    flare.style.setProperty('--flare-axis-color', hexToRgba(color, 0.7));
    flare.style.setProperty('--flare-axis-soft-color', hexToRgba(color, 0.42));
    flare.style.setProperty('--flare-axis-shadow', hexToRgba(color, 0.16));
    flare.style.transform = `scale(${scale})`;
    flare.style.transformOrigin = '50% 50%';
  }

  [...markerElement.querySelectorAll('.viewer-light__artifact')].forEach((artifact) => {
    artifact.style.setProperty('--flare-color', artifactRgba);
    artifact.style.setProperty('--artifact-opacity', String(getLightMarkerGhostIntensity(marker)));
  });

  scheduleLightOpticsSync();
}

function syncLightMarkerOptics(marker, markerElement) {
  if (!marker || !markerElement || !elements.pano) {
    return;
  }

  const elementRect = markerElement.getBoundingClientRect();
  const viewerRect = elements.pano.getBoundingClientRect();
  if (!elementRect.width || !elementRect.height || !viewerRect.width || !viewerRect.height) {
    return;
  }

  const anchorCenter = {
    x: elementRect.left + (elementRect.width / 2),
    y: elementRect.top + (elementRect.height / 2)
  };
  const viewerCenter = {
    x: viewerRect.left + (viewerRect.width / 2),
    y: viewerRect.top + (viewerRect.height / 2)
  };
  const localViewerCenter = {
    x: viewerCenter.x - elementRect.left,
    y: viewerCenter.y - elementRect.top
  };
  const localAnchorCenter = {
    x: elementRect.width / 2,
    y: elementRect.height / 2
  };
  const vectorFromCenter = {
    x: anchorCenter.x - viewerCenter.x,
    y: anchorCenter.y - viewerCenter.y
  };
  const distance = Math.hypot(vectorFromCenter.x, vectorFromCenter.y);
  const distanceRatio = Math.min(1.6, distance / Math.max(viewerRect.width, viewerRect.height, 1));

  [...markerElement.querySelectorAll('.viewer-light__artifact')].forEach((artifact) => {
    const factor = Number(artifact.dataset.artifactFactor) || 0.5;
    const sizeFactor = Number(artifact.dataset.artifactSize) || 0.3;
    const artifactCenter = {
      x: localViewerCenter.x - ((localAnchorCenter.x - localViewerCenter.x) * factor),
      y: localViewerCenter.y - ((localAnchorCenter.y - localViewerCenter.y) * factor)
    };
    const scale = getLightMarkerRadius(marker) / LIGHT_MARKER_DEFAULT_RADIUS;
    const artifactSize = Math.max(20, (140 * scale) * sizeFactor * (0.86 + distanceRatio));
    artifact.style.left = `${artifactCenter.x.toFixed(2)}px`;
    artifact.style.top = `${artifactCenter.y.toFixed(2)}px`;
    artifact.style.setProperty('--artifact-size', `${artifactSize.toFixed(2)}px`);
  });

  const ghost = markerElement.querySelector('.viewer-light__ghost');
  if (ghost) {
    const reflectedX = localViewerCenter.x - ((localAnchorCenter.x - localViewerCenter.x) * 0.58);
    const reflectedY = localViewerCenter.y - ((localAnchorCenter.y - localViewerCenter.y) * 0.58);
    ghost.style.transform = `translate(${(reflectedX - localAnchorCenter.x).toFixed(2)}px, ${(reflectedY - localAnchorCenter.y).toFixed(2)}px) scale(${(0.58 + (distanceRatio * 0.08)).toFixed(3)})`;
    ghost.style.opacity = String(clamp(getLightMarkerGhostIntensity(marker), 0, 1));
  }
}

function normalizeInfoMarkerText(value) {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n') : '';
}

function stripInfoMarkerHtmlToText(html) {
  if (typeof html !== 'string' || !html.trim()) {
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return normalizeInfoMarkerText(doc.body.textContent || '');
}

function escapeInfoMarkerHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeInlineInfoMarkerNode(node) {
  if (!node) {
    return '';
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return escapeInfoMarkerHtml(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tagName = node.tagName.toLowerCase();
  const allowedInlineTags = new Set(['strong', 'b', 'em', 'i', 'u', 's', 'span']);
  const childHtml = Array.from(node.childNodes).map((child) => normalizeInlineInfoMarkerNode(child)).join('');
  if (!allowedInlineTags.has(tagName)) {
    return childHtml;
  }

  const normalizedTag = tagName === 'b' ? 'strong' : (tagName === 'i' ? 'em' : tagName);
  return '<' + normalizedTag + '>' + childHtml + '</' + normalizedTag + '>';
}

function sanitizeInfoMarkerRichTextHtml(htmlValue, fallbackText) {
  const html = typeof htmlValue === 'string' ? htmlValue : '';
  const fallback = normalizeInfoMarkerText(fallbackText);
  if (!html.trim()) {
    return fallback
      ? fallback.split('\n').map((line) => '<p>' + (line ? escapeInfoMarkerHtml(line) : '<br>') + '</p>').join('')
      : '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks = [];

  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeInfoMarkerText(node.textContent || '');
      text.split('\n').forEach((line) => {
        blocks.push('<p>' + (line ? escapeInfoMarkerHtml(line) : '<br>') + '</p>');
      });
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const tagName = node.tagName.toLowerCase();
    if (tagName === 'p' || tagName === 'div') {
      const blockHtml = Array.from(node.childNodes).map((child) => normalizeInlineInfoMarkerNode(child)).join('');
      blocks.push('<p>' + (blockHtml || '<br>') + '</p>');
      return;
    }

    if (tagName === 'ul' || tagName === 'ol') {
      const items = Array.from(node.children)
        .filter((child) => child.tagName && child.tagName.toLowerCase() === 'li')
        .map((child) => '<li>' + Array.from(child.childNodes).map((grandChild) => normalizeInlineInfoMarkerNode(grandChild)).join('') + '</li>')
        .join('');
      if (items) {
        blocks.push('<' + tagName + '>' + items + '</' + tagName + '>');
      }
      return;
    }

    const inlineContent = normalizeInlineInfoMarkerNode(node);
    if (inlineContent) {
      blocks.push('<p>' + inlineContent + '</p>');
    }
  });

  return blocks.join('');
}

function getInfoMarkerContentHtml(marker) {
  return sanitizeInfoMarkerRichTextHtml(marker?.contentHtml, marker?.content);
}

function hasInfoMarkerRenderableText(marker) {
  return Boolean(stripInfoMarkerHtmlToText(getInfoMarkerContentHtml(marker)).trim());
}

function getInfoMarkerDisplayText(marker) {
  if (hasInfoMarkerRenderableText(marker)) {
    return stripInfoMarkerHtmlToText(getInfoMarkerContentHtml(marker)).trim();
  }

  if (hasInfoMarkerRenderableMedia(marker)) {
    return '';
  }

  if (getInfoMarkerMediaKind(marker)) {
    const mediaLabel = getInfoMarkerMediaFileName(marker);
    return mediaLabel
      ? `El contenido "${mediaLabel}" no esta disponible en esta sesion.`
      : 'El contenido multimedia no esta disponible en esta sesion.';
  }

  return 'Todavia no hay contenido.';
}

function getInfoMarkerEditorContent() {
  if (runtime.infoMarkerContentEditor) {
    const html = runtime.infoMarkerContentEditor.root.innerHTML || '';
    const plainText = normalizeInfoMarkerText(runtime.infoMarkerContentEditor.getText() || '').replace(/\n$/, '');
    return {
      content: plainText,
      contentHtml: sanitizeInfoMarkerRichTextHtml(html, plainText)
    };
  }

  const html = elements.infoMarkerContentInput?.innerHTML || '';
  const plainText = stripInfoMarkerHtmlToText(html).replace(/\n$/, '');
  return {
    content: plainText,
    contentHtml: sanitizeInfoMarkerRichTextHtml(html, plainText)
  };
}

function setInfoMarkerEditorContent(marker) {
  const html = getInfoMarkerContentHtml(marker);
  if (runtime.infoMarkerContentEditor) {
    runtime.infoMarkerContentEditor.clipboard.dangerouslyPasteHTML(html || '<p><br></p>', 'silent');
    return;
  }

  if (elements.infoMarkerContentInput) {
    elements.infoMarkerContentInput.innerHTML = html;
  }
}

function getInfoMarkerPopupWidth(marker) {
  return clamp(Number(marker?.popupWidth) || 320, 220, 520);
}

function getInfoMarkerMediaSplit(marker) {
  const parsed = Number(marker?.mediaSplit);
  return clamp(Number.isFinite(parsed) ? parsed : 0.38, 0.1, 0.9);
}

function parseInfoMarkerMediaSplitInput(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? clamp(parsed, 0.1, 0.9) : null;
}

function formatInfoMarkerMediaSplitInput(value) {
  const parsed = Number(value);
  return clamp(Number.isFinite(parsed) ? parsed : 0.38, 0.1, 0.9)
    .toFixed(2)
    .replace('.', ',')
    .replace(/0+$/, '')
    .replace(/,$/, '');
}

function getResponsiveInfoMarkerPopupWidth(marker, viewerWidth) {
  const preferredWidth = getInfoMarkerPopupWidth(marker);
  const safeViewerWidth = Number(viewerWidth) || preferredWidth;
  const maxWidth = Math.max(220, safeViewerWidth - 32);
  const scale = clamp(safeViewerWidth / 1280, 0.72, 1.3);
  return clamp(preferredWidth * scale, 220, maxWidth);
}

function getInfoMarkerTextAlign(marker) {
  return ['left', 'center', 'right'].includes(marker?.textAlign) ? marker.textAlign : 'left';
}

function getInfoMarkerImageAlign(marker) {
  return ['top', 'right', 'bottom', 'left'].includes(marker?.imageAlign) ? marker.imageAlign : 'top';
}

function getInfoMarkerTextVerticalAlign(marker) {
  return ['top', 'center', 'bottom'].includes(marker?.textVerticalAlign) ? marker.textVerticalAlign : 'top';
}

function getIconToggleGroupValue(group) {
  return group?.querySelector('.icon-toggle.is-active')?.dataset.alignValue || '';
}

function setIconToggleGroupValue(group, value) {
  if (!group) {
    return;
  }

  [...group.querySelectorAll('.icon-toggle[data-align-value]')].forEach((button) => {
    const isActive = button.dataset.alignValue === value;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function handleInfoMarkerContentAlignmentSelection(event) {
  const button = event.target.closest?.('.icon-toggle[data-align-value]');
  if (!button) {
    return;
  }

  const group = button.parentElement;
  const value = button.dataset.alignValue;
  setIconToggleGroupValue(group, value);

  if (button.dataset.alignTarget === 'image') {
    updateSelectedInfoMarkerImageAlign(value);
    return;
  }

  if (button.dataset.alignTarget === 'text') {
    updateSelectedInfoMarkerTextAlign(value);
    return;
  }

  if (button.dataset.alignTarget === 'text-vertical') {
    updateSelectedInfoMarkerTextVerticalAlign(value);
  }
}

function getInfoMarkerMediaKind(marker) {
  const kind = marker?.mediaKind;
  if (kind === 'image' || kind === 'video' || kind === 'audio') {
    return kind;
  }
  return marker?.imageSrc ? 'image' : '';
}

function getInfoMarkerMediaSrc(marker) {
  if (typeof marker?.mediaSrc === 'string' && marker.mediaSrc) {
    return marker.mediaSrc;
  }
  if (typeof marker?.imageSrc === 'string' && marker.imageSrc) {
    return marker.imageSrc;
  }
  return '';
}

function getInfoMarkerMediaMimeType(marker) {
  if (typeof marker?.mediaMimeType === 'string' && marker.mediaMimeType) {
    return marker.mediaMimeType;
  }
  const mediaKind = getInfoMarkerMediaKind(marker);
  if (mediaKind === 'video') {
    return 'video/mp4';
  }
  if (mediaKind === 'audio') {
    return 'audio/mpeg';
  }
  if (mediaKind === 'image') {
    return 'image/jpeg';
  }
  return '';
}

function getInfoMarkerMediaFileName(marker) {
  return typeof marker?.mediaFileName === 'string' ? marker.mediaFileName : '';
}

function hasInfoMarkerRenderableMedia(marker) {
  return Boolean(getInfoMarkerMediaKind(marker) && getInfoMarkerMediaSrc(marker));
}

function detectInfoMarkerMediaKindFromFile(file) {
  const mimeType = String(file?.type || '').toLowerCase();
  const fileName = String(file?.name || '').toLowerCase();
  if (mimeType.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(fileName)) {
    return 'image';
  }
  if (mimeType === 'video/mp4' || mimeType === 'video/webm' || /\.(mp4|webm)$/i.test(fileName)) {
    return 'video';
  }
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp4' || mimeType === 'audio/ogg' || mimeType === 'audio/wav' || mimeType === 'audio/x-wav' || /\.(mp3|m4a|ogg|wav)$/i.test(fileName)) {
    return 'audio';
  }
  return '';
}

function createInfoMarkerMediaAssetFromFile(file) {
  const mediaKind = detectInfoMarkerMediaKindFromFile(file);
  if (!mediaKind) {
    return null;
  }

  const fallbackMimeType = mediaKind === 'video'
    ? 'video/mp4'
    : mediaKind === 'audio'
      ? 'audio/mpeg'
      : 'image/jpeg';
  const fallbackFileName = mediaKind === 'video'
    ? 'video.mp4'
    : mediaKind === 'audio'
      ? 'audio.mp3'
      : 'imagen.jpg';

  return {
    mediaKind,
    mediaSrc: URL.createObjectURL(file),
    mediaMimeType: file.type || fallbackMimeType,
    mediaFileName: file.name || fallbackFileName,
    mediaFile: file
  };
}

function assignInfoMarkerMedia(target, source) {
  const mediaKind = getInfoMarkerMediaKind(source);
  const mediaSrc = getInfoMarkerMediaSrc(source);
  target.mediaKind = mediaKind;
  target.mediaSrc = mediaSrc;
  target.mediaMimeType = mediaKind ? getInfoMarkerMediaMimeType(source) : '';
  target.mediaFileName = mediaKind ? getInfoMarkerMediaFileName(source) : '';
  target.mediaFile = mediaKind ? (source?.mediaFile || null) : null;
  target.imageSrc = mediaKind === 'image' && mediaSrc.startsWith('data:') ? mediaSrc : '';
}

function releaseInfoMarkerMediaAsset(holder) {
  const mediaSrc = typeof holder?.mediaSrc === 'string' ? holder.mediaSrc : '';
  if (mediaSrc.startsWith('blob:')) {
    URL.revokeObjectURL(mediaSrc);
  }
  if (!holder) {
    return;
  }
  holder.mediaKind = '';
  holder.mediaSrc = '';
  holder.mediaMimeType = '';
  holder.mediaFileName = '';
  holder.mediaFile = null;
  if ('imageSrc' in holder) {
    holder.imageSrc = '';
  }
}

function releaseInfoMarkerDraftPendingMedia(draft, referenceSrc = '') {
  if (!draft) {
    return;
  }

  const mediaSrc = typeof draft.mediaSrc === 'string' ? draft.mediaSrc : '';
  if (draft.ownsMediaUrl && mediaSrc && mediaSrc !== referenceSrc && mediaSrc.startsWith('blob:')) {
    URL.revokeObjectURL(mediaSrc);
  }
  draft.ownsMediaUrl = false;
}

function getInfoMarkerMediaFileExtension(marker) {
  const fileName = getInfoMarkerMediaFileName(marker);
  const fileNameMatch = fileName.match(/\.([a-z0-9]+)$/i);
  if (fileNameMatch) {
    return fileNameMatch[1].toLowerCase();
  }

  const mimeType = getInfoMarkerMediaMimeType(marker).toLowerCase();
  if (mimeType === 'image/png') { return 'png'; }
  if (mimeType === 'image/webp') { return 'webp'; }
  if (mimeType === 'image/gif') { return 'gif'; }
  if (mimeType === 'image/svg+xml') { return 'svg'; }
  if (mimeType === 'video/webm') { return 'webm'; }
  if (mimeType === 'video/mp4') { return 'mp4'; }
  if (mimeType === 'audio/mpeg') { return 'mp3'; }
  if (mimeType === 'audio/mp4') { return 'm4a'; }
  if (mimeType === 'audio/ogg') { return 'ogg'; }
  if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') { return 'wav'; }
  return getInfoMarkerMediaKind(marker) === 'video' ? 'mp4' : getInfoMarkerMediaKind(marker) === 'audio' ? 'mp3' : 'jpg';
}


function getSoundMarkerAudioSrc(marker) {
  return typeof marker?.soundSrc === 'string' ? marker.soundSrc : '';
}

function getSoundMarkerAudioMimeType(marker) {
  if (typeof marker?.soundMimeType === 'string' && marker.soundMimeType) {
    return marker.soundMimeType;
  }
  return 'audio/mpeg';
}

function getSoundMarkerAudioFileName(marker) {
  return typeof marker?.soundFileName === 'string' ? marker.soundFileName : '';
}

function hasSoundMarkerAudio(marker) {
  return Boolean(getSoundMarkerAudioSrc(marker));
}

function getSoundMarkerVolume(marker) {
  const value = Number(marker?.soundVolume);
  return clamp(Number.isFinite(value) ? value : SOUND_MARKER_DEFAULT_VOLUME, 0, 1);
}

function getSoundMarkerPan(marker) {
  const value = Number(marker?.soundPan);
  return clamp(Number.isFinite(value) ? value : SOUND_MARKER_DEFAULT_PAN, 0, 1);
}

function getSoundMarkerFocusDeg(marker) {
  const value = Number(marker?.soundFocusDeg);
  return clamp(Number.isFinite(value) ? value : SOUND_MARKER_DEFAULT_FOCUS_DEG, 20, 180);
}

function shouldSoundMarkerLoop(marker) {
  return marker?.soundLoop !== false;
}

function createSoundMarkerAudioAssetFromFile(file) {
  const mimeType = String(file?.type || '').toLowerCase();
  const fileName = String(file?.name || '').toLowerCase();
  const isSupported = mimeType === 'audio/mpeg'
    || mimeType === 'audio/mp4'
    || mimeType === 'audio/ogg'
    || mimeType === 'audio/wav'
    || mimeType === 'audio/x-wav'
    || /\.(mp3|m4a|ogg|wav)$/i.test(fileName);
  if (!isSupported) {
    return null;
  }

  return {
    soundSrc: URL.createObjectURL(file),
    soundMimeType: file.type || 'audio/mpeg',
    soundFileName: file.name || 'sound.mp3',
    soundFile: file
  };
}

function assignSoundMarkerAudio(target, source) {
  target.soundSrc = getSoundMarkerAudioSrc(source);
  target.soundMimeType = target.soundSrc ? getSoundMarkerAudioMimeType(source) : '';
  target.soundFileName = target.soundSrc ? getSoundMarkerAudioFileName(source) : '';
  target.soundFile = target.soundSrc ? (source?.soundFile || null) : null;
}

function releaseSoundMarkerAudioAsset(holder) {
  const soundSrc = typeof holder?.soundSrc === 'string' ? holder.soundSrc : '';
  if (soundSrc.startsWith('blob:')) {
    URL.revokeObjectURL(soundSrc);
  }
  if (!holder) {
    return;
  }
  holder.soundSrc = '';
  holder.soundMimeType = '';
  holder.soundFileName = '';
  holder.soundFile = null;
}

function getSoundMarkerAudioFileExtension(marker) {
  const fileName = getSoundMarkerAudioFileName(marker);
  const fileNameMatch = fileName.match(/\.([a-z0-9]+)$/i);
  if (fileNameMatch) {
    return fileNameMatch[1].toLowerCase();
  }

  const mimeType = getSoundMarkerAudioMimeType(marker).toLowerCase();
  if (mimeType === 'audio/mp4') { return 'm4a'; }
  if (mimeType === 'audio/ogg') { return 'ogg'; }
  if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') { return 'wav'; }
  return 'mp3';
}

function getSoundMarkerAudioSummary(marker) {
  return hasSoundMarkerAudio(marker)
    ? `Archivo cargado: ${getSoundMarkerAudioFileName(marker) || 'audio.mp3'}`
    : 'No hay audio cargado para este punto sonoro.';
}

function normalizeMarkerAngle(angle) {
  let next = Number.isFinite(Number(angle)) ? Number(angle) : 0;
  while (next > Math.PI) {
    next -= Math.PI * 2;
  }
  while (next < -Math.PI) {
    next += Math.PI * 2;
  }
  return next;
}

function ensureSoundMarkerAudioContext() {
  if (runtime.soundMarkerAudioContext) {
    return runtime.soundMarkerAudioContext;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  try {
    runtime.soundMarkerAudioContext = new AudioContextCtor();
  } catch (error) {
    console.warn('No se pudo crear el contexto de audio para los efectos sound.', error);
    runtime.soundMarkerAudioContext = null;
  }

  return runtime.soundMarkerAudioContext;
}

function tryResumeSoundMarkerAudioPlayback() {
  const context = runtime.soundMarkerAudioContext;
  if (context && context.state === 'suspended') {
    context.resume().catch(() => {});
  }

  runtime.soundMarkerAudioEntries.forEach((entry) => {
    if (!entry?.audio || entry.targetGain <= 0.001) {
      return;
    }
    if (entry.audio.paused || entry.audio.ended) {
      const playAttempt = entry.audio.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {});
      }
    }
  });
}

function ensureSoundMarkerAudioUnlockBinding() {
  if (!runtime.soundMarkerAudioUnlockBound) {
    window.addEventListener('pointerdown', tryResumeSoundMarkerAudioPlayback, true);
    runtime.soundMarkerAudioUnlockBound = true;
  }
}

function cancelSoundMarkerAudioEntryRetirement(entry) {
  if (!entry) {
    return;
  }

  if (entry.retireFrame) {
    cancelAnimationFrame(entry.retireFrame);
    entry.retireFrame = 0;
  }

  if (entry.retireTimer) {
    clearTimeout(entry.retireTimer);
    entry.retireTimer = 0;
  }

  entry.isRetiring = false;
  runtime.soundMarkerRetiringAudioEntries.delete(entry);
}

function destroySoundMarkerAudioEntry(entry) {
  if (!entry) {
    return;
  }

  cancelSoundMarkerAudioEntryRetirement(entry);

  try {
    entry.audio?.pause();
  } catch {}
  if (entry.audio) {
    try {
      entry.audio.removeAttribute('src');
      entry.audio.load();
    } catch {}
  }
  try { entry.sourceNode?.disconnect?.(); } catch {}
  try { entry.panNode?.disconnect?.(); } catch {}
  try { entry.gainNode?.disconnect?.(); } catch {}
}

function beginSoundMarkerSceneTransition(type, targetSceneId = state.activeSceneId) {
  const fadeMs = type === 'fade' ? SOUND_MARKER_SCENE_TRANSITION_MS : 0;
  runtime.soundMarkerSceneTransition = {
    fadeMs,
    targetSceneId: targetSceneId || null,
    pending: true
  };

  clearFrozenActiveSceneSoundMarkers();

  if (runtime.soundMarkerAudioEntries.size) {
    const outgoingEntries = [...runtime.soundMarkerAudioEntries.values()];
    runtime.soundMarkerAudioEntries.clear();
    outgoingEntries.forEach((entry) => {
      retireSoundMarkerAudioEntry(entry, fadeMs);
    });
  }
}

function consumeSoundMarkerSceneTransitionMs(currentSceneId = runtime.activeSceneInstance?.sceneId || null) {
  const transition = runtime.soundMarkerSceneTransition;
  if (!transition?.pending) {
    return 0;
  }

  if (transition.targetSceneId && currentSceneId && transition.targetSceneId !== currentSceneId) {
    return 0;
  }

  transition.pending = false;
  return Math.max(0, Number(transition.fadeMs) || 0);
}

function freezeActiveSceneSoundMarkers(sceneId = state.activeSceneId) {
  runtime.soundMarkerFreezeSceneId = sceneId || null;
}

function clearFrozenActiveSceneSoundMarkers() {
  runtime.soundMarkerFreezeSceneId = null;
}

function applySoundMarkerAudioEntryMix(entry, targetGain, targetPan, gainRampMs = 80, panRampMs = gainRampMs) {
  if (!entry) {
    return;
  }

  const previousTargetGain = Number.isFinite(entry.targetGain) ? entry.targetGain : 0;
  const previousTargetPan = Number.isFinite(entry.targetPan) ? entry.targetPan : 0;
  entry.targetGain = targetGain;
  entry.targetPan = targetPan;

  const context = runtime.soundMarkerAudioContext;
  if (entry.gainNode && context?.currentTime != null) {
    const now = context.currentTime;
    entry.gainNode.gain.cancelScheduledValues(now);
    entry.gainNode.gain.setValueAtTime(previousTargetGain, now);
    entry.gainNode.gain.linearRampToValueAtTime(targetGain, now + Math.max(0.001, gainRampMs / 1000));
    if (entry.panNode) {
      entry.panNode.pan.cancelScheduledValues(now);
      entry.panNode.pan.setValueAtTime(previousTargetPan, now);
      entry.panNode.pan.linearRampToValueAtTime(targetPan, now + Math.max(0.001, panRampMs / 1000));
    }
  } else if (entry.audio) {
    entry.audio.volume = targetGain;
  }

  if (targetGain > 0.001) {
    tryResumeSoundMarkerAudioPlayback();
  }
}

function retireSoundMarkerAudioEntry(entry, fadeMs = 0) {
  if (!entry) {
    return;
  }

  cancelSoundMarkerAudioEntryRetirement(entry);

  if (fadeMs <= 0) {
    destroySoundMarkerAudioEntry(entry);
    return;
  }

  entry.isRetiring = true;
  runtime.soundMarkerRetiringAudioEntries.add(entry);

  const startGain = Math.max(0, Number.isFinite(entry.targetGain) ? entry.targetGain : 0);
  const startPan = Number.isFinite(entry.targetPan) ? entry.targetPan : 0;
  const startTime = performance.now();
  const context = runtime.soundMarkerAudioContext;

  const step = (now) => {
    const progress = clamp((now - startTime) / fadeMs, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextGain = startGain * (1 - eased);

    entry.targetGain = nextGain;
    entry.targetPan = startPan;

    if (entry.gainNode && context?.currentTime != null) {
      entry.gainNode.gain.cancelScheduledValues(context.currentTime);
      entry.gainNode.gain.setValueAtTime(nextGain, context.currentTime);
      if (entry.panNode) {
        entry.panNode.pan.cancelScheduledValues(context.currentTime);
        entry.panNode.pan.setValueAtTime(startPan, context.currentTime);
      }
    } else if (entry.audio) {
      entry.audio.volume = nextGain;
    }

    if (progress < 1) {
      entry.retireFrame = window.requestAnimationFrame(step);
      return;
    }

    entry.retireFrame = 0;
    destroySoundMarkerAudioEntry(entry);
  };

  entry.retireFrame = window.requestAnimationFrame(step);
}

function createSoundMarkerAudioEntry(marker) {
  ensureSoundMarkerAudioUnlockBinding();
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = getSoundMarkerAudioSrc(marker);
  audio.loop = shouldSoundMarkerLoop(marker);


  const entry = {
    markerId: marker.id,
    key: getSoundMarkerAudioSrc(marker),
    audio,
    sourceNode: null,
    gainNode: null,
    panNode: null,
    targetGain: 0,
    targetPan: 0,
    isRetiring: false,
    retireTimer: 0,
    retireFrame: 0
  };

  const context = ensureSoundMarkerAudioContext();
  if (context && typeof context.createMediaElementSource === 'function') {
    try {
      entry.sourceNode = context.createMediaElementSource(audio);
      entry.gainNode = context.createGain();
      if (typeof context.createStereoPanner === 'function') {
        entry.panNode = context.createStereoPanner();
      }
      if (entry.panNode) {
        entry.sourceNode.connect(entry.panNode);
        entry.panNode.connect(entry.gainNode);
      } else {
        entry.sourceNode.connect(entry.gainNode);
      }
      entry.gainNode.connect(context.destination);
      entry.gainNode.gain.value = 0;
    } catch (error) {
      console.warn('No se pudo inicializar el audio direccional de un efecto sound.', error);
      entry.sourceNode = null;
      entry.gainNode = null;
      entry.panNode = null;
    }
  }

  return entry;
}

function getSoundMarkerDirectionalMix(marker, viewParameters) {
  const yaw = Number(viewParameters?.yaw) || 0;
  const pitch = Number(viewParameters?.pitch) || 0;
  const yawDelta = normalizeMarkerAngle(marker.yaw - yaw);
  const pitchDelta = (Number(marker.pitch) || 0) - pitch;
  const focusDeg = clamp(getSoundMarkerFocusDeg(marker), 20, 180);
  const normalizedFocus = (focusDeg - 20) / 160;
  const omniBlend = clamp((normalizedFocus - 0.5) / 0.5, 0, 1);
  const directionalFocusDeg = normalizedFocus <= 0.5
    ? 20 + (160 * (normalizedFocus / 0.5))
    : 180;
  const directionalFocusRad = directionalFocusDeg * Math.PI / 180;
  const angularDistance = Math.min(Math.hypot(yawDelta, pitchDelta), Math.PI);
  const directionalAlignment = clamp(1 - (angularDistance / directionalFocusRad), 0, 1);
  const alignment = directionalAlignment + ((1 - directionalAlignment) * omniBlend);
  return {
    gain: alignment * alignment,
    pan: clamp(Math.sin(yawDelta), -1, 1)
  };
}

function updateSoundMarkerAudioEntry(entry, marker, view, options = {}) {
  if (!entry || !marker || !view) {
    return;
  }

  cancelSoundMarkerAudioEntryRetirement(entry);
  entry.audio.loop = shouldSoundMarkerLoop(marker);
  const mix = getSoundMarkerDirectionalMix(marker, view.parameters?.() || view);
  const targetGain = runtime.viewerAmbientMuted
    ? 0
    : clamp(getSoundMarkerVolume(marker) * mix.gain * runtime.viewerAmbientVolume, 0, 1);
  const targetPan = clamp(mix.pan * getSoundMarkerPan(marker), -1, 1);
  applySoundMarkerAudioEntryMix(entry, targetGain, targetPan, options.gainRampMs ?? 80, options.panRampMs ?? 80);
}

function syncActiveSceneSoundPlayback() {
  const view = runtime.activeSceneInstance?.view;
  if (!view || elements.pano.hidden) {
    clearActiveSceneSoundMarkers();
    return;
  }

  if (runtime.soundMarkerFreezeSceneId && runtime.soundMarkerFreezeSceneId === state.activeSceneId) {
    return;
  }

  const transitionFadeMs = consumeSoundMarkerSceneTransitionMs(runtime.activeSceneInstance?.sceneId || null);
  const soundMarkers = getActiveSceneSoundMarkers().filter((marker) => hasSoundMarkerAudio(marker));
  const soundMarkersById = new Map(soundMarkers.map((marker) => [marker.id, marker]));

  runtime.soundMarkerAudioEntries.forEach((entry, markerId) => {
    const marker = soundMarkersById.get(markerId);
    if (!marker || entry.key !== getSoundMarkerAudioSrc(marker)) {
      runtime.soundMarkerAudioEntries.delete(markerId);
      retireSoundMarkerAudioEntry(entry, transitionFadeMs);
    }
  });

  soundMarkers.forEach((marker) => {
    let entry = runtime.soundMarkerAudioEntries.get(marker.id);
    const isNewEntry = !entry;
    if (!entry) {
      entry = createSoundMarkerAudioEntry(marker);
      runtime.soundMarkerAudioEntries.set(marker.id, entry);
    }
    updateSoundMarkerAudioEntry(entry, marker, view, { gainRampMs: isNewEntry ? transitionFadeMs : 80, panRampMs: 80 });
  });
}
function renderInfoMarkerContent(container, marker) {
  if (!container) {
    return;
  }

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'info-marker-rich';
  wrapper.dataset.imageAlign = getInfoMarkerImageAlign(marker);

  const mediaKind = getInfoMarkerMediaKind(marker);
  const mediaSrc = getInfoMarkerMediaSrc(marker);
  if (mediaKind && mediaSrc) {
    let mediaElement = null;
    if (mediaKind === 'video') {
      const video = document.createElement('video');
      video.className = 'info-marker-rich__media info-marker-rich__media--video';
      video.src = mediaSrc;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'auto';
      mediaElement = video;
    } else if (mediaKind === 'audio') {
      const audio = document.createElement('audio');
      audio.className = 'info-marker-rich__media info-marker-rich__media--audio';
      audio.src = mediaSrc;
      audio.controls = true;
      audio.preload = 'metadata';
      mediaElement = audio;
    } else {
      const image = document.createElement('img');
      image.className = 'info-marker-rich__media info-marker-rich__media--image';
      image.src = mediaSrc;
      image.alt = marker.name || 'Contenido del marcador';
      mediaElement = image;
    }

    wrapper.appendChild(mediaElement);
  }
  const contentHtml = getInfoMarkerContentHtml(marker);
  const fallbackText = getInfoMarkerDisplayText(marker);
  const hasTextContent = Boolean(contentHtml || fallbackText);
  const hasMediaContent = Boolean(mediaKind && mediaSrc);
  wrapper.dataset.hasSplit = hasTextContent && hasMediaContent ? 'true' : 'false';
  if (hasTextContent && hasMediaContent) {
    wrapper.style.setProperty('--info-media-split', (getInfoMarkerMediaSplit(marker) * 100) + '%');
  } else {
    wrapper.style.removeProperty('--info-media-split');
  }

  if (contentHtml || fallbackText) {
    const text = document.createElement('div');
    text.className = 'info-marker-rich__text';
    text.dataset.textAlign = getInfoMarkerTextAlign(marker);
    text.dataset.textVerticalAlign = getInfoMarkerTextVerticalAlign(marker);
    text.innerHTML = contentHtml || '<p>' + escapeInfoMarkerHtml(fallbackText) + '</p>';
    wrapper.appendChild(text);
  }

  container.appendChild(wrapper);
}

function getInfoMarkerDisplayContentKey(marker) {
  return [
    marker.id,
    marker.name || '',
    getInfoMarkerMediaKind(marker) || '',
    getInfoMarkerMediaSrc(marker) || '',
    getInfoMarkerContentHtml(marker) || '',
    getInfoMarkerDisplayText(marker) || '',
    getInfoMarkerImageAlign(marker) || '',
    getInfoMarkerTextAlign(marker) || '',
    getInfoMarkerTextVerticalAlign(marker) || '',
    String(getInfoMarkerMediaSplit(marker))
  ].join('||');
}

function renderInfoMarkerDisplay(marker) {
  const contentKey = getInfoMarkerDisplayContentKey(marker);
  if (runtime.infoDisplayRenderedMarkerId !== marker.id || runtime.infoDisplayRenderedContentKey !== contentKey) {
    renderInfoMarkerContent(elements.infoMarkerDisplayBody, marker);
    runtime.infoDisplayRenderedMarkerId = marker.id;
    runtime.infoDisplayRenderedContentKey = contentKey;
  }
  const viewerWidth = elements.viewerStage?.clientWidth || getInfoMarkerPopupWidth(marker);
  elements.infoMarkerDisplay.style.width = `${getResponsiveInfoMarkerPopupWidth(marker, viewerWidth)}px`;
  showInfoMarkerDisplay();
  updateInfoMarkerDisplayPosition(runtime.activeSceneInstance?.view, marker);
}

function updateInfoMarkerDisplayPosition(view, marker = getDisplayedInfoMarker()) {
  if (!view || !marker) {
    hideInfoMarkerDisplay(true);
    return;
  }

  const screenPosition = view.coordinatesToScreen({ yaw: marker.yaw, pitch: marker.pitch }, {});
  const hasScreenPosition = Boolean(screenPosition) && Number.isFinite(screenPosition.x) && Number.isFinite(screenPosition.y);
  if (!hasScreenPosition) {
    hideInfoMarkerDisplay(true);
    return;
  }

  const viewerRect = elements.viewerStage.getBoundingClientRect();
  const hotspotInViewer = screenPosition.x >= 0 && screenPosition.x <= viewerRect.width && screenPosition.y >= 0 && screenPosition.y <= viewerRect.height;
  if (!hotspotInViewer) {
    hideInfoMarkerDisplay();
    return;
  }

  const popupWidth = getResponsiveInfoMarkerPopupWidth(marker, viewerRect.width);
  const popupWasVisible = !elements.infoMarkerDisplay.hidden && elements.infoMarkerDisplay.classList.contains('is-visible');
  const previousDisplayRect = popupWasVisible ? elements.infoMarkerDisplay.getBoundingClientRect() : null;
  showInfoMarkerDisplay();
  elements.infoMarkerDisplay.style.width = `${popupWidth}px`;

  const popupHeight = elements.infoMarkerDisplay.offsetHeight || 180;
  const gap = 18;
  const edgePadding = 20;
  const connectorInset = 10;
  const placementHitboxPadding = gap + connectorInset + 10;
  const verticalPlacementSafetyMargin = 64;
  const horizontalPlacementSafetyMargin = 44;
  const popupOffset = 18;
  const spaceAbove = screenPosition.y - edgePadding - gap;
  const spaceBelow = viewerRect.height - screenPosition.y - edgePadding - gap;
  const spaceLeft = screenPosition.x - edgePadding - gap;
  const spaceRight = viewerRect.width - screenPosition.x - edgePadding - gap;
  const preferredSidePlacement = screenPosition.x <= (viewerRect.width / 2) ? 'right' : 'left';
  const fallbackSidePlacement = preferredSidePlacement === 'right' ? 'left' : 'right';
  const canUseVerticalPlacement = screenPosition.x >= edgePadding + verticalPlacementSafetyMargin
    && screenPosition.x <= viewerRect.width - edgePadding - verticalPlacementSafetyMargin;
  const canUseHorizontalPlacement = screenPosition.y >= edgePadding + horizontalPlacementSafetyMargin
    && screenPosition.y <= viewerRect.height - edgePadding - horizontalPlacementSafetyMargin;
  const topFits = canUseVerticalPlacement && spaceAbove >= (popupHeight + placementHitboxPadding);
  const bottomFits = canUseVerticalPlacement && spaceBelow >= (popupHeight + placementHitboxPadding);
  const preferredSideFits = canUseHorizontalPlacement && (preferredSidePlacement === 'right'
    ? spaceRight >= (popupWidth + placementHitboxPadding)
    : spaceLeft >= (popupWidth + placementHitboxPadding));
  const fallbackSideFits = canUseHorizontalPlacement && (fallbackSidePlacement === 'right'
    ? spaceRight >= (popupWidth + placementHitboxPadding)
    : spaceLeft >= (popupWidth + placementHitboxPadding));

  let placement = 'top';
  if (topFits) {
    placement = 'top';
  } else if (bottomFits) {
    placement = 'bottom';
  } else if (preferredSideFits) {
    placement = preferredSidePlacement;
  } else if (fallbackSideFits) {
    placement = fallbackSidePlacement;
  } else {
    const candidates = [
      { placement: 'top', space: spaceAbove },
      { placement: 'bottom', space: spaceBelow },
      { placement: preferredSidePlacement, space: preferredSidePlacement === 'right' ? spaceRight : spaceLeft },
      { placement: fallbackSidePlacement, space: fallbackSidePlacement === 'right' ? spaceRight : spaceLeft }
    ];
    candidates.sort((a, b) => b.space - a.space);
    placement = candidates[0].placement;
  }

  let popupLeft = 0;
  let popupTop = 0;

  if (placement === 'top' || placement === 'bottom') {
    popupLeft = clamp(screenPosition.x - (popupWidth / 2), edgePadding, viewerRect.width - edgePadding - popupWidth);
    if (placement === 'bottom') {
      popupTop = clamp(screenPosition.y + popupOffset, edgePadding, viewerRect.height - edgePadding - popupHeight);
    } else {
      popupTop = clamp(screenPosition.y - popupHeight - popupOffset, edgePadding, viewerRect.height - edgePadding - popupHeight);
    }
  } else {
    popupTop = clamp(screenPosition.y - (popupHeight / 2), edgePadding, viewerRect.height - edgePadding - popupHeight);
    if (placement === 'right') {
      popupLeft = clamp(screenPosition.x + popupOffset, edgePadding, viewerRect.width - edgePadding - popupWidth);
    } else {
      popupLeft = clamp(screenPosition.x - popupWidth - popupOffset, edgePadding, viewerRect.width - edgePadding - popupWidth);
    }
  }

  const connectorX = clamp(screenPosition.x - popupLeft, connectorInset, popupWidth - connectorInset);
  const connectorY = clamp(screenPosition.y - popupTop, connectorInset, popupHeight - connectorInset);
  const previousPlacement = runtime.infoDisplayPlacement;
  const previousLeft = previousDisplayRect ? (previousDisplayRect.left - viewerRect.left) : null;
  const previousTop = previousDisplayRect ? (previousDisplayRect.top - viewerRect.top) : null;

  elements.infoMarkerDisplay.classList.toggle('is-below', placement === 'bottom');
  elements.infoMarkerDisplay.classList.toggle('is-left', placement === 'left');
  elements.infoMarkerDisplay.classList.toggle('is-right', placement === 'right');
  elements.infoMarkerDisplay.style.setProperty('--info-connector-x', `${connectorX}px`);
  elements.infoMarkerDisplay.style.setProperty('--info-connector-y', `${connectorY}px`);
  elements.infoMarkerDisplay.style.left = `${popupLeft}px`;
  elements.infoMarkerDisplay.style.top = `${popupTop}px`;
  runtime.infoDisplayPlacement = placement;
  runtime.infoDisplayLastLeft = popupLeft;
  runtime.infoDisplayLastTop = popupTop;
  animateInfoMarkerPlacementShift(previousPlacement, placement, previousLeft, previousTop, popupLeft, popupTop);
}

function createInfoMarkerContentDraft(marker) {
  const popupWidth = getInfoMarkerPopupWidth(marker);
  const mediaSplit = getInfoMarkerMediaSplit(marker);
  return {
    content: marker.content || '',
    contentHtml: getInfoMarkerContentHtml(marker),
    imageSrc: marker.imageSrc || '',
    mediaKind: getInfoMarkerMediaKind(marker),
    mediaSrc: getInfoMarkerMediaSrc(marker),
    mediaMimeType: getInfoMarkerMediaMimeType(marker),
    mediaFileName: getInfoMarkerMediaFileName(marker),
    mediaFile: marker.mediaFile || null,
    ownsMediaUrl: false,
    imageAlign: getInfoMarkerImageAlign(marker),
    textAlign: getInfoMarkerTextAlign(marker),
    textVerticalAlign: getInfoMarkerTextVerticalAlign(marker),
    popupWidth,
    popupWidthInput: String(popupWidth),
    mediaSplit,
    mediaSplitInput: formatInfoMarkerMediaSplitInput(mediaSplit)
  };
}

function getInfoMarkerDraftPopupWidth(draft) {
  if (!draft) {
    return 320;
  }

  const rawValue = Number(draft.popupWidthInput);
  if (Number.isFinite(rawValue)) {
    return clamp(rawValue, 220, 520);
  }

  return clamp(Number(draft.popupWidth) || 320, 220, 520);
}

function getInfoMarkerDraftMediaSplit(draft) {
  if (!draft) {
    return 0.38;
  }

  const parsedValue = parseInfoMarkerMediaSplitInput(draft.mediaSplitInput);
  if (parsedValue !== null) {
    return parsedValue;
  }

  return clamp(Number(draft.mediaSplit) || 0.38, 0.1, 0.9);
}

function getInfoMarkerContentDraft() {
  return runtime.infoMarkerContentDraft;
}

function positionInfoMarkerContentOverlay() {
  positionCenteredViewerOverlay(elements.infoMarkerContentOverlay);
}

function openSelectedInfoMarkerContentEditor() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'info') {
    return;
  }

  runtime.editingInfoMarkerContentId = marker.id;
  runtime.infoMarkerContentDraft = createInfoMarkerContentDraft(marker);
  renderMarkerConfigOverlays();
  elements.infoMarkerContentOverlay.hidden = false;
  scheduleInfoMarkerContentOverlayPosition();
  elements.infoMarkerContentTitle.textContent = marker.name || 'Editar contenido';
  setInfoMarkerEditorContent(runtime.infoMarkerContentDraft);
  elements.infoMarkerContentImage.value = '';
  setIconToggleGroupValue(elements.infoMarkerContentImageAlign, runtime.infoMarkerContentDraft.imageAlign);
  setIconToggleGroupValue(elements.infoMarkerContentTextAlign, runtime.infoMarkerContentDraft.textAlign);
  setIconToggleGroupValue(elements.infoMarkerContentTextVerticalAlign, runtime.infoMarkerContentDraft.textVerticalAlign);
  elements.infoMarkerContentWidth.value = runtime.infoMarkerContentDraft.popupWidthInput;
  syncInfoMarkerContentMediaSplitControls(getInfoMarkerDraftMediaSplit(runtime.infoMarkerContentDraft));
  syncInfoMarkerContentEditorTutorialLock();
  renderInfoMarkerContentPreview();
}

function closeInfoMarkerContentEditor(options = {}) {
  const { discardChanges = true } = options;
  if (discardChanges) {
    const marker = getSelectedMarker();
    releaseInfoMarkerDraftPendingMedia(runtime.infoMarkerContentDraft, getInfoMarkerMediaSrc(marker));
    runtime.infoMarkerContentDraft = null;
  }
  runtime.editingInfoMarkerContentId = null;
  elements.infoMarkerContentOverlay.hidden = true;
  renderMarkerConfigOverlays();
}

function saveInfoMarkerContentEditor() {
  const marker = getSelectedMarker();
  const draft = getInfoMarkerContentDraft();
  if (!marker || normalizeMarkerType(marker.type) !== 'info' || !draft) {
    return;
  }

  const previousMediaSrc = getInfoMarkerMediaSrc(marker);
  const nextMediaSrc = typeof draft.mediaSrc === 'string' ? draft.mediaSrc : '';
  if (previousMediaSrc && previousMediaSrc !== nextMediaSrc && previousMediaSrc.startsWith('blob:')) {
    URL.revokeObjectURL(previousMediaSrc);
  }

  marker.content = draft.content;
  marker.contentHtml = draft.contentHtml;
  assignInfoMarkerMedia(marker, draft);
  marker.imageAlign = draft.imageAlign;
  marker.textAlign = draft.textAlign;
  marker.textVerticalAlign = draft.textVerticalAlign;
  marker.popupWidth = getInfoMarkerDraftPopupWidth(draft);
  marker.mediaSplit = getInfoMarkerDraftMediaSplit(draft);
  draft.ownsMediaUrl = false;
  runtime.infoMarkerContentDraft = null;
  refreshSelectedInfoMarkerPresentation(marker);
  closeInfoMarkerContentEditor({ discardChanges: false });
}

function updateSelectedInfoMarkerContent() {
  const draft = getInfoMarkerContentDraft();
  if (!draft) {
    return;
  }

  const editorContent = getInfoMarkerEditorContent();
  draft.content = editorContent.content;
  draft.contentHtml = editorContent.contentHtml;
  renderInfoMarkerContentPreview();
}

function renderInfoMarkerContentPreview() {
  const marker = getSelectedMarker();
  const draft = getInfoMarkerContentDraft();
  if (!marker || !draft) {
    return;
  }

  const previewMarker = {
    ...marker,
    ...draft
  };
  renderInfoMarkerContent(elements.infoMarkerContentPreviewBody, previewMarker);

  const previewShellWidth = elements.infoMarkerContentPreviewBody.parentElement?.clientWidth || getInfoMarkerDraftPopupWidth(draft);
  const previewWidth = getResponsiveInfoMarkerPopupWidth(previewMarker, previewShellWidth);
  elements.infoMarkerContentPreviewBody.style.width = previewWidth + 'px';
  elements.infoMarkerContentPreviewBody.style.maxWidth = 'none';
  if (elements.infoMarkerContentPreviewBody.parentElement) {
    elements.infoMarkerContentPreviewBody.parentElement.scrollLeft = 0;
  }
  renderInfoMarkerContentPreviewDivider(previewMarker, draft);
  scheduleInfoMarkerContentOverlayPosition();
}

function syncInfoMarkerContentMediaSplitControls(split) {
  const normalizedSplit = clamp(Number.isFinite(Number(split)) ? Number(split) : 0.38, 0, 1);
  const formattedSplit = formatInfoMarkerMediaSplitInput(normalizedSplit);
  if (elements.infoMarkerContentMediaSplit) {
    elements.infoMarkerContentMediaSplit.value = formattedSplit;
  }
  if (elements.infoMarkerContentMediaSplitSlider) {
    elements.infoMarkerContentMediaSplitSlider.value = String(normalizedSplit);
  }
}

function removeInfoMarkerContentPreviewDivider() {
  elements.infoMarkerContentPreviewBody?.querySelector('.info-marker-content-preview-divider')?.remove();
  elements.infoMarkerContentPreviewBody?.classList.remove('is-split-draggable');
}

function updateInfoMarkerContentPreviewDividerPosition(divider, previewBody, wrapper, mediaElement, imageAlign) {
  if (!divider || !previewBody || !wrapper || !mediaElement) {
    return;
  }

  const previewRect = previewBody.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  const mediaRect = mediaElement.getBoundingClientRect();
  const boundary = imageAlign === 'right'
    ? (mediaRect.left - previewRect.left)
    : (mediaRect.right - previewRect.left);

  divider.style.left = boundary + 'px';
  divider.style.top = (wrapperRect.top - previewRect.top) + 'px';
  divider.style.height = wrapperRect.height + 'px';
}

function renderInfoMarkerContentPreviewDivider(previewMarker, draft) {
  const previewBody = elements.infoMarkerContentPreviewBody;
  if (!previewBody || !draft) {
    return;
  }

  removeInfoMarkerContentPreviewDivider();

  const imageAlign = getInfoMarkerImageAlign(previewMarker);
  if (imageAlign !== 'left' && imageAlign !== 'right') {
    return;
  }

  const wrapper = previewBody.querySelector('.info-marker-rich');
  const mediaElement = wrapper?.querySelector('.info-marker-rich__media');
  const textElement = wrapper?.querySelector('.info-marker-rich__text');
  if (!wrapper || !mediaElement || !textElement) {
    return;
  }

  previewBody.classList.add('is-split-draggable');

  const divider = document.createElement('button');
  divider.type = 'button';
  divider.className = 'info-marker-content-preview-divider';
  divider.setAttribute('aria-label', 'Ajustar espacio entre contenido media y texto');
  previewBody.appendChild(divider);
  updateInfoMarkerContentPreviewDividerPosition(divider, previewBody, wrapper, mediaElement, imageAlign);

  const applySplitFromClientX = (clientX) => {
    const wrapperRect = wrapper.getBoundingClientRect();
    if (!wrapperRect.width) {
      return;
    }

    let nextSplit = (clientX - wrapperRect.left) / wrapperRect.width;
    nextSplit = clamp(nextSplit, 0.1, 0.9);

    draft.mediaSplit = nextSplit;
    draft.mediaSplitInput = formatInfoMarkerMediaSplitInput(nextSplit);
    syncInfoMarkerContentMediaSplitControls(nextSplit);
    wrapper.style.setProperty('--info-media-split', (nextSplit * 100) + '%');
    updateInfoMarkerContentPreviewDividerPosition(divider, previewBody, wrapper, mediaElement, imageAlign);
  };

  divider.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    divider.setPointerCapture?.(event.pointerId);

    const handlePointerMove = (moveEvent) => {
      applySplitFromClientX(moveEvent.clientX);
    };

    const stopDragging = (endEvent) => {
      divider.removeEventListener('pointermove', handlePointerMove);
      divider.removeEventListener('pointerup', stopDragging);
      divider.removeEventListener('pointercancel', stopDragging);
      if (endEvent?.pointerId != null) {
        divider.releasePointerCapture?.(endEvent.pointerId);
      }
    };

    divider.addEventListener('pointermove', handlePointerMove);
    divider.addEventListener('pointerup', stopDragging);
    divider.addEventListener('pointercancel', stopDragging);
  });
}

function refreshSelectedInfoMarkerPresentation(marker) {
  renderMarkerPanels();
  renderNodeMap();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
  if (runtime.pinnedInfoMarkerId === marker.id || runtime.hoveredInfoMarkerId === marker.id) {
    renderInfoMarkerDisplay(marker);
  }
}

async function updateSelectedInfoMarkerImage() {
  const draft = getInfoMarkerContentDraft();
  const file = elements.infoMarkerContentImage.files?.[0];
  const marker = getSelectedMarker();
  if (!draft || !file) {
    return;
  }

  const nextMedia = createInfoMarkerMediaAssetFromFile(file);
  if (!nextMedia) {
    window.alert('Selecciona una imagen, un video MP4/WebM o un audio MP3/M4A/OGG/WAV para este hotspot.');
    elements.infoMarkerContentImage.value = '';
    return;
  }

  releaseInfoMarkerDraftPendingMedia(draft, getInfoMarkerMediaSrc(marker));
  assignInfoMarkerMedia(draft, nextMedia);
  draft.ownsMediaUrl = true;
  renderInfoMarkerContentPreview();
  elements.infoMarkerContentImage.value = '';
}

function clearSelectedInfoMarkerImage() {
  const draft = getInfoMarkerContentDraft();
  const marker = getSelectedMarker();
  if (!draft) {
    return;
  }

  releaseInfoMarkerDraftPendingMedia(draft, getInfoMarkerMediaSrc(marker));
  draft.imageSrc = '';
  draft.mediaKind = '';
  draft.mediaSrc = '';
  draft.mediaMimeType = '';
  draft.mediaFileName = '';
  draft.mediaFile = null;
  renderInfoMarkerContentPreview();
}

function updateSelectedInfoMarkerImageAlign(value = getIconToggleGroupValue(elements.infoMarkerContentImageAlign)) {
  const draft = getInfoMarkerContentDraft();
  if (!draft) {
    return;
  }

  draft.imageAlign = getInfoMarkerImageAlign({ imageAlign: value });
  setIconToggleGroupValue(elements.infoMarkerContentImageAlign, draft.imageAlign);
  renderInfoMarkerContentPreview();
}

function updateSelectedInfoMarkerTextAlign(value = getIconToggleGroupValue(elements.infoMarkerContentTextAlign)) {
  const draft = getInfoMarkerContentDraft();
  if (!draft) {
    return;
  }

  draft.textAlign = getInfoMarkerTextAlign({ textAlign: value });
  setIconToggleGroupValue(elements.infoMarkerContentTextAlign, draft.textAlign);
  renderInfoMarkerContentPreview();
}

function updateSelectedInfoMarkerTextVerticalAlign(value = getIconToggleGroupValue(elements.infoMarkerContentTextVerticalAlign)) {
  const draft = getInfoMarkerContentDraft();
  if (!draft) {
    return;
  }

  draft.textVerticalAlign = getInfoMarkerTextVerticalAlign({ textVerticalAlign: value });
  setIconToggleGroupValue(elements.infoMarkerContentTextVerticalAlign, draft.textVerticalAlign);
  renderInfoMarkerContentPreview();
}

function updateSelectedInfoMarkerPopupWidth(options = {}) {
  const draft = getInfoMarkerContentDraft();
  if (!draft) {
    return;
  }

  const commit = Boolean(options.commit);
  draft.popupWidthInput = elements.infoMarkerContentWidth.value;
  const parsedWidth = Number(draft.popupWidthInput);
  if (Number.isFinite(parsedWidth)) {
    const clampedWidth = clamp(parsedWidth, 220, 520);
    draft.popupWidth = clampedWidth;
    if (commit) {
      draft.popupWidthInput = String(clampedWidth);
      elements.infoMarkerContentWidth.value = draft.popupWidthInput;
    }
  } else if (commit) {
    draft.popupWidthInput = String(clamp(Number(draft.popupWidth) || 320, 220, 520));
    elements.infoMarkerContentWidth.value = draft.popupWidthInput;
  }
  renderInfoMarkerContentPreview();
}

function updateSelectedInfoMarkerMediaSplit() {
  const draft = getInfoMarkerContentDraft();
  if (!draft) {
    return;
  }

  draft.mediaSplitInput = elements.infoMarkerContentMediaSplit.value;
  const parsedSplit = parseInfoMarkerMediaSplitInput(draft.mediaSplitInput);
  if (parsedSplit !== null) {
    draft.mediaSplit = parsedSplit;
    syncInfoMarkerContentMediaSplitControls(parsedSplit);
  }
  renderInfoMarkerContentPreview();
}

function updateSelectedInfoMarkerMediaSplitFromSlider() {
  const draft = getInfoMarkerContentDraft();
  if (!draft) {
    return;
  }

  const parsedSplit = clamp(Number(elements.infoMarkerContentMediaSplitSlider.value) || 0.38, 0.1, 0.9);
  draft.mediaSplit = parsedSplit;
  draft.mediaSplitInput = formatInfoMarkerMediaSplitInput(parsedSplit);
  syncInfoMarkerContentMediaSplitControls(parsedSplit);
  renderInfoMarkerContentPreview();
}

async function centerViewOnMarker(marker, options = {}) {
  const { animate = false } = options;
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  const view = runtime.activeSceneInstance?.view;
  if (!activeScene || !view) {
    return;
  }

  const currentParameters = view.parameters?.() || activeScene.initialViewParameters;
  const startYaw = currentParameters?.yaw ?? 0;
  const startPitch = currentParameters?.pitch ?? 0;
  const currentFov = currentParameters?.fov ?? activeScene.initialViewParameters?.fov ?? INITIAL_FOV;
  const targetFov = marker?.fov ?? currentFov;

  if (!animate) {
    view.setParameters({
      yaw: marker.yaw,
      pitch: marker.pitch,
      fov: targetFov
    });
    return;
  }

  const yawDelta = Math.atan2(Math.sin(marker.yaw - startYaw), Math.cos(marker.yaw - startYaw));
  const pitchDelta = marker.pitch - startPitch;

  await new Promise((resolve) => {
    const startTime = performance.now();

    const step = (now) => {
      const progress = clamp((now - startTime) / LINK_MARKER_CENTER_TRANSITION_MS, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      view.setParameters({
        yaw: startYaw + (yawDelta * eased),
        pitch: startPitch + (pitchDelta * eased),
        fov: currentFov + ((targetFov - currentFov) * eased)
      });

      if (progress < 1) {
        window.requestAnimationFrame(step);
        return;
      }

      resolve();
    };

    window.requestAnimationFrame(step);
  });
}

async function centerViewOnLinkMarker(marker) {
  await centerViewOnMarker(marker, { animate: true });
}

async function startLinkMarkerAlignmentPreview(marker) {
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  const targetScene = getTargetSceneForMarker(marker);

  if (!activeScene || !targetScene) {
    return false;
  }

  if (activeScene.processed.mode !== 'multires-listo' || targetScene.processed.mode !== 'multires-listo') {
    return false;
  }

  if (marker.centerBeforeTransition) {
    await centerViewOnLinkMarker(marker);
  }

  ensureViewer();
  ensureAlignmentViewer();
  if (!runtime.alignmentViewer) {
    return false;
  }

  const alignmentSceneInstance = getOrCreateAlignmentRuntimeScene(targetScene);
  alignmentSceneInstance.view.setParameters(getLinkMarkerTargetViewParameters(marker, targetScene));
  alignmentSceneInstance.scene.switchTo({ transitionDuration: 0 });

  runtime.linkAlignmentMarkerId = marker.id;
  runtime.activeAlignmentSceneInstance = alignmentSceneInstance;
  elements.alignmentPano.hidden = false;
  elements.viewerStage.classList.add('is-link-alignment-preview');
  hideInfoMarkerDisplay(true);
  if (typeof runtime.alignmentViewer.updateSize === 'function') {
    runtime.alignmentViewer.updateSize();
  }
  updateViewerCoordinates(alignmentSceneInstance.view.parameters());
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
  return true;
}

function stopLinkMarkerAlignmentPreview() {
  runtime.linkAlignmentMarkerId = null;
  runtime.activeAlignmentSceneInstance = null;
  elements.viewerStage.classList.remove('is-link-alignment-preview');
  elements.alignmentPano.hidden = true;
  renderActiveSceneMarkers();
  updateViewerCoordinates(runtime.activeSceneInstance?.view?.parameters?.());
}

function saveSelectedLinkMarkerAlignmentPreview() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'link' || runtime.linkAlignmentMarkerId !== marker.id) {
    return;
  }

  const targetScene = getTargetSceneForMarker(marker);
  const alignmentView = runtime.activeAlignmentSceneInstance?.view?.parameters?.();
  if (!targetScene || !alignmentView) {
    stopLinkMarkerAlignmentPreview();
    renderMarkerConfigOverlays();
    return;
  }

  marker.targetViewParameters = getNormalizedViewParameters(alignmentView, targetScene.initialViewParameters);
  stopLinkMarkerAlignmentPreview();
  renderMarkerConfigOverlays();
}

async function toggleSelectedLinkMarkerAlignmentPreview() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'link') {
    return;
  }

  if (!marker.targetSceneId) {
    window.alert('Selecciona una escena destino antes de definir la vista inicial.');
    return;
  }

  if (runtime.linkAlignmentMarkerId === marker.id) {
    saveSelectedLinkMarkerAlignmentPreview();
    return;
  }

  const started = await startLinkMarkerAlignmentPreview(marker);
  if (!started) {
    window.alert('Necesitamos que la escena actual y la destino esten listas para previsualizar la vista inicial.');
  }
}

async function activateLinkMarker(marker) {
  const targetScene = state.scenes.find((scene) => scene.id === marker.targetSceneId);
  if (!targetScene) {
    return;
  }

  if ((marker.transition || 'fade') === 'fade' && marker.centerBeforeTransition) {
    freezeActiveSceneSoundMarkers(marker.sceneId);
  }

  if (marker.centerBeforeTransition) {
    await centerViewOnLinkMarker(marker);
  }

  runtime.pendingSceneTargetViewParameters = {
    sceneId: targetScene.id,
    parameters: getLinkMarkerTargetViewParameters(marker, targetScene)
  };
  state.activeSceneId = targetScene.id;
  state.selectedMarkerId = null;
  runtime.pendingSceneTransition = marker.transition || 'fade';
  runtime.pendingSceneTransitionDurationMs = getLinkMarkerTransitionDurationMs(marker);
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  hideInfoMarkerDisplay(true);
  render();
}

function getMarkerTypeBadge(type) {
  const markerType = normalizeMarkerType(type);
  if (markerType === 'info') { return '\u24DC'; }
  if (markerType === 'light') { return '\u2726'; }
  if (markerType === 'sound') { return '\u266B'; }
  return '\u27A4';
}

function createNodeMapLinkMarker(sourceSceneId, targetSceneId, options = {}) {
  const { renderAfter = true, coordinates = null } = options;
  const sourceScene = state.scenes.find((scene) => scene.id === sourceSceneId);
  const targetScene = state.scenes.find((scene) => scene.id === targetSceneId);
  if (!sourceScene || !targetScene || sourceSceneId === targetSceneId) {
    return null;
  }

  const sourceView = sourceScene.initialViewParameters || { yaw: 0, pitch: 0, fov: INITIAL_FOV };
  const markerView = coordinates || sourceView;
  const marker = {
    id: crypto.randomUUID(),
    type: 'link',
    name: getMarkerTypeDefaultName('link', state.markers.length + 1),
    sceneId: sourceScene.id,
    yaw: markerView?.yaw ?? 0,
    pitch: markerView?.pitch ?? 0,
    fov: markerView?.fov ?? INITIAL_FOV,
    content: '',
    contentHtml: '',
    imageSrc: '',
    mediaKind: '',
    mediaSrc: '',
    mediaMimeType: '',
    mediaFileName: '',
    mediaFile: null,
    imageAlign: 'top',
    textAlign: 'left',
    textVerticalAlign: 'top',
    popupWidth: 320,
      mediaSplit: 0.38,
    previewInMarkerTab: false,
    soundSrc: '',
    soundMimeType: '',
    soundFileName: '',
    soundFile: null,
    soundVolume: SOUND_MARKER_DEFAULT_VOLUME,
    soundPan: SOUND_MARKER_DEFAULT_PAN,
    soundFocusDeg: SOUND_MARKER_DEFAULT_FOCUS_DEG,
    soundLoop: true,
    targetSceneId: targetScene.id,
    targetViewParameters: null,
    transition: 'fade',
    transitionDurationMs: DEFAULT_LINK_MARKER_TRANSITION_MS,
    centerBeforeTransition: true,
    flareColor: LIGHT_MARKER_DEFAULT_COLOR,
    flareRadius: LIGHT_MARKER_DEFAULT_RADIUS,
    flareIntensity: LIGHT_MARKER_DEFAULT_INTENSITY,
    ghostIntensity: LIGHT_MARKER_DEFAULT_GHOST_INTENSITY,
    createdAt: new Date().toISOString()
  };

  state.markers.push(marker);
  state.activeSceneId = sourceScene.id;
  state.selectedMarkerId = marker.id;
  runtime.pendingSceneTransition = 'instant';
  runtime.pendingMarkerFocus = { markerId: marker.id, animate: false };
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  if (renderAfter) {
    render();
  }
  return marker;
}

function createMarker(type = 'link') {
  closeInfoMarkerContentEditor({ discardChanges: true });
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  if (!activeScene) {
    window.alert('Primero selecciona una escena para crear un marcador.');
    return;
  }

  const currentView = runtime.activeSceneInstance?.view?.parameters?.() || activeScene.initialViewParameters;
  const markerCount = state.markers.length + 1;
  const markerType = normalizeMarkerType(type);
  const marker = {
    id: crypto.randomUUID(),
    type: markerType,
    name: getMarkerTypeDefaultName(type, markerCount),
    sceneId: activeScene.id,
    yaw: currentView?.yaw ?? 0,
    pitch: currentView?.pitch ?? 0,
    fov: currentView?.fov ?? INITIAL_FOV,
    content: '',
    contentHtml: '',
    imageSrc: '',
    mediaKind: '',
    mediaSrc: '',
    mediaMimeType: '',
    mediaFileName: '',
    mediaFile: null,
    imageAlign: 'top',
    textAlign: 'left',
    textVerticalAlign: 'top',
    popupWidth: 320,
      mediaSplit: 0.38,
    previewInMarkerTab: false,
    soundSrc: '',
    soundMimeType: '',
    soundFileName: '',
    soundFile: null,
    soundVolume: SOUND_MARKER_DEFAULT_VOLUME,
    soundPan: SOUND_MARKER_DEFAULT_PAN,
    soundFocusDeg: SOUND_MARKER_DEFAULT_FOCUS_DEG,
    soundLoop: true,
    targetSceneId: markerType === 'link' ? getDefaultLinkTargetSceneId(activeScene.id) : null,
    targetViewParameters: null,
    transition: 'fade',
    transitionDurationMs: DEFAULT_LINK_MARKER_TRANSITION_MS,
    centerBeforeTransition: markerType === 'link',
    flareColor: LIGHT_MARKER_DEFAULT_COLOR,
    flareRadius: LIGHT_MARKER_DEFAULT_RADIUS,
    flareIntensity: LIGHT_MARKER_DEFAULT_INTENSITY,
    ghostIntensity: LIGHT_MARKER_DEFAULT_GHOST_INTENSITY,
    createdAt: new Date().toISOString()
  };

  state.markers.push(marker);
  state.selectedMarkerId = marker.id;
  if (isEffectMarkerType(markerType)) {
    state.activeTab = 'efectos';
  }
  runtime.hoveredInfoMarkerId = null;
  runtime.pinnedInfoMarkerId = null;
  renderMarkerPanels();
  renderNodeMap();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function setStartScene(sceneId) {
  if (!state.scenes.some((scene) => scene.id === sceneId) || state.startSceneId === sceneId) {
    return;
  }

  state.startSceneId = sceneId;
  renderSceneList();
  renderProjectSummary();
  renderNodeMap();
  renderSceneConfigOverlay();
}

function requestDeleteScene(sceneId) {
  const scene = state.scenes.find((item) => item.id === sceneId);
  if (!scene) {
    return;
  }

  if (!runtime.viewerSettingsSafeDelete) {
    deleteScene(sceneId);
    return;
  }

  openConfirmDialog({
    title: 'Borrar escena',
    message:       'Se borrara la escena "' + (scene.name || scene.fileName || 'Sin nombre') + '" y todos sus hotspots y efectos.',
    confirmLabel: 'Borrar',
    onConfirm: () => deleteScene(sceneId)
  });
}

function requestDeleteMarker(markerId) {
  const marker = state.markers.find((item) => item.id === markerId);
  if (!marker) {
    return;
  }

  if (!runtime.viewerSettingsSafeDelete) {
    deleteMarker(markerId);
    return;
  }

  const markerType = normalizeMarkerType(marker.type);
  const isEffect = isEffectMarkerType(markerType);
  const markerLabel = isEffect ? 'el efecto' : 'el hotspot';
  openConfirmDialog({
    title: isEffect ? 'Borrar efecto' : 'Borrar hotspot',
    message: 'Se borrara ' + markerLabel + ' "' + (marker.name || getMarkerTypeDefaultName(marker.type, 1)) + '".',
    confirmLabel: 'Borrar',
    onConfirm: () => deleteMarker(markerId)
  });
}

function deleteScene(sceneId) {
  const index = state.scenes.findIndex((scene) => scene.id === sceneId);
  if (index === -1) {
    return;
  }

  const [scene] = state.scenes.splice(index, 1);
  releaseSceneAssets(scene);
  state.markers = state.markers.filter((marker) => {
    if (marker.sceneId !== sceneId) {
      return true;
    }
    releaseMarkerAssets(marker);
    return false;
  });
  if (getSelectedMarker()?.sceneId === sceneId) {
    state.selectedMarkerId = null;
  }

  if (state.activeSceneId === sceneId) {
    state.activeSceneId = state.scenes[index]?.id || state.scenes[index - 1]?.id || null;
    renderViewer();
  }

  if (state.startSceneId === sceneId) {
    state.startSceneId = state.scenes[0]?.id || null;
  }

  runtime.nodeMapExpandedSceneIds.delete(sceneId);
  if (runtime.nodeMapLinkCreation?.sourceSceneId === sceneId || runtime.nodeMapLinkCreation?.targetSceneId === sceneId) {
    cancelNodeMapLinkCreation();
  }

  state.processingCount = Math.max(0, state.processingCount - (scene.processed.mode === 'procesando' ? 1 : 0));
  renderSceneList();
  renderProjectSummary();
  renderMarkerPanels();
  renderNodeMap();
  renderNodeMapActions();
  renderSceneConfigOverlay();
  renderMarkerConfigOverlays();
  renderStatus();
}

function deleteMarker(markerId) {
  const markerIndex = state.markers.findIndex((marker) => marker.id === markerId);
  if (markerIndex === -1) {
    return;
  }

  const [marker] = state.markers.splice(markerIndex, 1);
  releaseMarkerAssets(marker);

  if (state.selectedMarkerId === markerId) {
    if (state.activeTab === 'marcadores') {
      const nextSceneMarker = state.markers.find((item) => item.sceneId === state.activeSceneId && !isEffectMarkerType(item.type));
      state.selectedMarkerId = nextSceneMarker?.id || null;
    } else if (state.activeTab === 'efectos') {
      const nextSceneEffect = state.markers.find((item) => item.sceneId === state.activeSceneId && isEffectMarkerType(item.type));
      state.selectedMarkerId = nextSceneEffect?.id || null;
    } else {
      state.selectedMarkerId = null;
    }
  }

  if (runtime.hoveredInfoMarkerId === markerId) {
    runtime.hoveredInfoMarkerId = null;
  }

  if (runtime.pinnedInfoMarkerId === markerId) {
    runtime.pinnedInfoMarkerId = null;
  }

  if (runtime.editingInfoMarkerContentId === markerId) {
    closeInfoMarkerContentEditor({ discardChanges: true });
  }

  if (runtime.linkAlignmentMarkerId === markerId) {
    stopLinkMarkerAlignmentPreview();
  }

  if (marker.sceneId === state.activeSceneId) {
    hideInfoMarkerDisplay(true);
  }

  renderMarkerPanels();
  renderNodeMap();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}
function reorderScenes(draggedSceneId, targetSceneId, placement) {
  if (!draggedSceneId || !targetSceneId || draggedSceneId === targetSceneId) {
    return;
  }

  const fromIndex = state.scenes.findIndex((scene) => scene.id === draggedSceneId);
  const targetIndex = state.scenes.findIndex((scene) => scene.id === targetSceneId);

  if (fromIndex === -1 || targetIndex === -1) {
    return;
  }

  if (placement === 'swap') {
    [state.scenes[fromIndex], state.scenes[targetIndex]] = [state.scenes[targetIndex], state.scenes[fromIndex]];
    renderSceneList();
    renderProjectSummary();
    return;
  }

  const [movedScene] = state.scenes.splice(fromIndex, 1);
  let insertIndex = targetIndex;

  if (placement === 'before') {
    insertIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
  } else if (placement === 'after') {
    insertIndex = fromIndex < targetIndex ? targetIndex : targetIndex + 1;
  }

  state.scenes.splice(Math.max(0, insertIndex), 0, movedScene);
  renderSceneList();
  renderProjectSummary();
}
function getSceneProgressText(scene) {
  if (scene.processed.mode === 'procesando') {
    return `${Math.round((scene.processed.progress || 0) * 100)}%`;
  }

  return scene.processed.mode === 'multires-listo' ? String.fromCharCode(10003) : scene.processed.mode;
}

function updateSceneProgressUI(scene) {
  const sceneButton = elements.sceneList.querySelector(`[data-scene-id="${scene.id}"]`);
  const progressNode = sceneButton?.querySelector('[data-scene-progress]');

  if (progressNode) {
    progressNode.textContent = getSceneProgressText(scene);
  } else {
    renderSceneList();
  }

  if (scene.id === state.activeSceneId) {
    renderViewer();
  }

  renderStatus();
}
function renderViewer() {
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  const alignmentMarker = runtime.linkAlignmentMarkerId
    ? state.markers.find((marker) => marker.id === runtime.linkAlignmentMarkerId)
    : null;

  if (runtime.linkAlignmentMarkerId && (!alignmentMarker || alignmentMarker.sceneId !== state.activeSceneId || state.activeTab !== 'marcadores')) {
    stopLinkMarkerAlignmentPreview();
  }

  if (!activeScene) {
    runtime.activeSceneInstance = null;
    runtime.hoveredInfoMarkerId = null;
    runtime.pinnedInfoMarkerId = null;
    hideInfoMarkerDisplay(true);
    clearActiveSceneMarkers();
    elements.viewerTitle.textContent = 'Sin escena seleccionada';
    elements.viewerDetail.textContent = 'Esperando panoramas';
    elements.viewerMode.textContent = '16:9';
    updateViewerCoordinates();
    elements.pano.hidden = true;
    elements.emptyState.hidden = false;
    elements.emptyState.innerHTML = `
      <div>
        <p class="viewer-stage__kicker">Editor inicial</p>
        <h3>Carga tu primera escena para empezar</h3>
        <p>Cuando importes panoramas, este viewport mostrara la escena activa en formato 16:9.</p>
      </div>
    `;
    return;
  }

  elements.viewerTitle.textContent = activeScene.name;
  elements.viewerMode.textContent = 'Marzipano multires';

  if (activeScene.processed.mode === 'procesando') {
    const progress = Math.round((activeScene.processed.progress || 0) * 100);
    const progressLabel = activeScene.processed.progressLabel || 'Generando tiles multires';

    elements.viewerDetail.textContent = `Procesando ${progress}%`;
    updateViewerCoordinates(activeScene.initialViewParameters);
    runtime.hoveredInfoMarkerId = null;
    runtime.pinnedInfoMarkerId = null;
    hideInfoMarkerDisplay(true);
    elements.pano.hidden = true;
    elements.emptyState.hidden = false;
    clearActiveSceneMarkers();
    elements.emptyState.innerHTML = `
      <div>
        <p class="viewer-stage__kicker">Procesando</p>
        <h3>${escapeText(activeScene.name)}</h3>
        <div class="viewer-stage__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
          <div class="viewer-stage__progress-bar">
            <span style="width: ${progress}%"></span>
          </div>
          <strong>${progress}%</strong>
        </div>
        <p>${escapeText(progressLabel)}</p>
      </div>
    `;
    return;
  }

  if (activeScene.processed.mode !== 'multires-listo') {
    elements.viewerDetail.textContent = 'La escena no tiene assets disponibles';
    updateViewerCoordinates(activeScene.initialViewParameters);
    runtime.hoveredInfoMarkerId = null;
    runtime.pinnedInfoMarkerId = null;
    hideInfoMarkerDisplay(true);
    elements.pano.hidden = true;
    elements.emptyState.hidden = false;
    clearActiveSceneMarkers();
    elements.emptyState.innerHTML = `
      <div>
        <p class="viewer-stage__kicker">Sin assets</p>
        <h3>${escapeText(activeScene.name)}</h3>
        <p>${escapeText(activeScene.processed.error || 'Esta escena no pudo reconstruirse desde el JSON actual.')}</p>
      </div>
    `;
    return;
  }

  elements.pano.hidden = false;
  elements.emptyState.hidden = true;

  ensureViewer();
  if (runtime.viewer && typeof runtime.viewer.updateSize === 'function') {
    runtime.viewer.updateSize();
  }

  try {
    const previousActiveSceneId = runtime.activeSceneInstance?.sceneId || null;
    const sceneInstance = getOrCreateRuntimeScene(activeScene);
    const pendingSceneTargetView = runtime.pendingSceneTargetViewParameters?.sceneId === activeScene.id
      ? runtime.pendingSceneTargetViewParameters.parameters
      : null;
    const pendingMarkerFocus = runtime.pendingMarkerFocus;
    const isSceneChange = previousActiveSceneId !== activeScene.id;
    const hasPendingSceneTarget = Boolean(pendingSceneTargetView);
    const shouldResetView = isSceneChange || hasPendingSceneTarget || Boolean(pendingMarkerFocus);
    const shouldSwitchScene = isSceneChange || hasPendingSceneTarget;
    const sceneTransition = runtime.pendingSceneTransition;
    const sceneTransitionDurationMs = runtime.pendingSceneTransitionDurationMs || DEFAULT_LINK_MARKER_TRANSITION_MS;
    runtime.activeSceneInstance = sceneInstance;
    if (shouldSwitchScene) {
      beginSoundMarkerSceneTransition(sceneTransition, activeScene.id);
    }
    if (shouldResetView) {
      sceneInstance.view.setParameters(getNormalizedViewParameters(pendingSceneTargetView, activeScene.initialViewParameters));
    }
    runtime.pendingSceneTargetViewParameters = null;
    if (shouldSwitchScene) {
      if (sceneTransition === 'instant') {
        sceneInstance.scene.switchTo({ transitionDuration: 0 });
      } else {
        sceneInstance.scene.switchTo({ transitionDuration: sceneTransitionDurationMs });
      }
    }
    runtime.pendingSceneTransition = 'fade';
    runtime.pendingSceneTransitionDurationMs = DEFAULT_LINK_MARKER_TRANSITION_MS;
    bindActiveViewCoordinates(activeScene, sceneInstance.view);

    if (pendingMarkerFocus) {
      const markerToFocus = state.markers.find((marker) => marker.id === pendingMarkerFocus.markerId && marker.sceneId === activeScene.id);
      runtime.pendingMarkerFocus = null;
      if (markerToFocus) {
        sceneInstance.view.setParameters({
          yaw: markerToFocus.yaw,
          pitch: markerToFocus.pitch,
          fov: markerToFocus.fov ?? sceneInstance.view.parameters()?.fov ?? INITIAL_FOV
        });
      }
    }

    elements.viewerDetail.textContent = `${activeScene.width} x ${activeScene.height} origen, cara ${activeScene.processed.faceSize}px`;
    updateViewerCoordinates(sceneInstance.view.parameters());
    syncActiveSceneSoundPlayback();
    renderActiveSceneMarkers();
  } catch (error) {
    console.error(error);
    runtime.hoveredInfoMarkerId = null;
    runtime.pinnedInfoMarkerId = null;
    hideInfoMarkerDisplay(true);
    elements.pano.hidden = true;
    elements.emptyState.hidden = false;
    clearActiveSceneMarkers();
    elements.viewerDetail.textContent = 'Error al abrir la escena';
    elements.emptyState.innerHTML = `
      <div>
        <p class="viewer-stage__kicker">Error</p>
        <h3>${escapeText(activeScene.name)}</h3>
        <p>${escapeText(error && error.message ? error.message : "Marzipano no pudo crear la escena.")}</p>
      </div>
    `;
  }
}

function formatSceneConfigAngle(value) {
  return ((value || 0) * 180 / Math.PI).toFixed(1);
}

function isNodeMapConfigVisible() {
  return state.activeTab === 'mapa'
    && (runtime.nodeMapSceneSelectionActive || Boolean(state.selectedMarkerId))
    && (!isCompactLayout() || !runtime.mobileConfigHidden);
}

function renderSceneConfigOverlay() {
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  const hasScene = Boolean(activeScene);
  const selectedMarker = getSelectedMarker();
  const hasActiveSceneMarkerSelection = Boolean(selectedMarker && activeScene && selectedMarker.sceneId === activeScene.id);
  const shouldShowMapSceneConfig = isNodeMapConfigVisible() && runtime.nodeMapSceneSelectionActive && !hasActiveSceneMarkerSelection;

  const shouldShowOverlay = hasScene && (state.activeTab === 'escenas' || shouldShowMapSceneConfig);
  elements.sceneConfigOverlay.hidden = !shouldShowOverlay;

  if (!hasScene) {
    return;
  }

  elements.sceneConfigTitle.textContent = activeScene.name || 'Configuracion de escena';
  elements.sceneConfigName.value = activeScene.name || '';
  elements.sceneConfigYaw.value = formatSceneConfigAngle(activeScene.initialViewParameters.yaw);
  elements.sceneConfigPitch.value = formatSceneConfigAngle(activeScene.initialViewParameters.pitch);
  elements.sceneConfigFov.value = formatSceneConfigAngle(activeScene.initialViewParameters.fov);
  elements.sceneConfigStart?.classList.toggle('scene-action--active', activeScene.id === state.startSceneId);
  renderSceneAmbientAudioControls(activeScene);
  positionSceneConfigOverlay();
}

function renderMarkerConfigOverlays() {
  const marker = getSelectedMarker();
  const markerType = normalizeMarkerType(marker?.type);
  renderSceneConfigOverlay();
  const canShowMapMarkerConfig = isNodeMapConfigVisible();

  const isMarkerPanelSelection = Boolean(marker && marker.sceneId === state.activeSceneId && ((state.activeTab === 'marcadores' && !isEffectMarkerType(markerType)) || (canShowMapMarkerConfig && !isEffectMarkerType(markerType))));
  const isEffectPanelSelection = Boolean(marker && marker.sceneId === state.activeSceneId && ((state.activeTab === 'efectos' && isEffectMarkerType(markerType)) || (canShowMapMarkerConfig && isEffectMarkerType(markerType))));

  if (runtime.linkAlignmentMarkerId && (!isMarkerPanelSelection || !marker || markerType !== 'link' || marker.id !== runtime.linkAlignmentMarkerId)) {
    stopLinkMarkerAlignmentPreview();
  }

  if (elements.infoMarkerConfigOverlay) {
    elements.infoMarkerConfigOverlay.hidden = true;
  }
  if (elements.linkMarkerConfigOverlay) {
    elements.linkMarkerConfigOverlay.hidden = true;
  }
  if (elements.lightMarkerConfigOverlay) {
    elements.lightMarkerConfigOverlay.hidden = true;
  }
  if (elements.soundMarkerConfigOverlay) {
    elements.soundMarkerConfigOverlay.hidden = true;
  }

  if (isEffectPanelSelection) {
    if (markerType === 'sound') {
      renderSoundMarkerConfigOverlay(marker);
      return;
    }
    renderLightMarkerConfigOverlay(marker);
    return;
  }
  if (!isMarkerPanelSelection) {
    return;
  }
  if (markerType === 'info') {
    elements.infoMarkerConfigOverlay.hidden = runtime.editingInfoMarkerContentId === marker.id;
    if (!elements.infoMarkerConfigOverlay.hidden) { renderInfoMarkerConfigOverlay(marker); }
    return;
  }
  renderLinkMarkerConfigOverlay(marker);
}

function renderInfoMarkerConfigOverlay(marker) {
  elements.infoMarkerConfigOverlay.hidden = false;
  elements.infoMarkerConfigTitle.textContent = marker.name || 'Marcador media';
  elements.infoMarkerConfigName.value = marker.name || '';
  elements.infoMarkerConfigYaw.value = formatSceneConfigAngle(marker.yaw);
  elements.infoMarkerConfigPitch.value = formatSceneConfigAngle(marker.pitch);
  elements.infoMarkerConfigPreviewInTab.checked = Boolean(marker.previewInMarkerTab);
  renderInfoMarkerContent(elements.infoMarkerConfigPreviewBody, marker);
  const configPreviewWidth = getResponsiveInfoMarkerPopupWidth(marker, elements.infoMarkerConfigPreviewBody.parentElement?.clientWidth || getInfoMarkerPopupWidth(marker));
  elements.infoMarkerConfigPreviewBody.style.width = 'min(' + configPreviewWidth + 'px, 100%)';
  positionInfoMarkerConfigOverlay();
}

function renderLightMarkerConfigOverlay(marker) {
  if (!elements.lightMarkerConfigOverlay) {
    return;
  }

  elements.lightMarkerConfigOverlay.hidden = false;
  elements.lightMarkerConfigTitle.textContent = marker.name || 'Light';
  elements.lightMarkerConfigName.value = marker.name || '';
  elements.lightMarkerConfigYaw.value = formatSceneConfigAngle(marker.yaw);
  elements.lightMarkerConfigPitch.value = formatSceneConfigAngle(marker.pitch);
  elements.lightMarkerConfigColor.value = getLightMarkerColor(marker);
  elements.lightMarkerConfigRadius.value = String(getLightMarkerRadius(marker));
  elements.lightMarkerConfigIntensity.value = String(getLightMarkerIntensity(marker));
  elements.lightMarkerConfigGhostIntensity.value = String(getLightMarkerGhostIntensity(marker));
  syncLightMarkerConfigColorInput();
  positionLightMarkerConfigOverlay();
}

function renderLinkMarkerConfigOverlay(marker) {
  elements.linkMarkerConfigOverlay.hidden = false;
  elements.linkMarkerConfigTitle.textContent = marker.name || 'Marcador link';
  elements.linkMarkerConfigName.value = marker.name || '';
  elements.linkMarkerConfigYaw.value = formatSceneConfigAngle(marker.yaw);
  elements.linkMarkerConfigPitch.value = formatSceneConfigAngle(marker.pitch);
  renderLinkMarkerTargetSceneOptions(marker);
  elements.linkMarkerConfigTransition.value = marker.transition || 'fade';
  elements.linkMarkerConfigTransitionDuration.value = String(Math.round(getLinkMarkerTransitionDurationMs(marker)));
  syncLinkMarkerTransitionDurationControl();
  elements.linkMarkerConfigCenterBeforeTransition.checked = Boolean(marker.centerBeforeTransition);
  const targetScene = getTargetSceneForMarker(marker);
  const hasReadyTargetScene = Boolean(targetScene && targetScene.processed.mode === 'multires-listo');
  const isAlignmentActive = runtime.linkAlignmentMarkerId === marker.id;
  const savedTargetView = marker.targetViewParameters ? getLinkMarkerTargetViewParameters(marker, targetScene) : null;
  elements.linkMarkerConfigAlignView.disabled = !hasReadyTargetScene || !runtime.activeSceneInstance?.view;
  elements.linkMarkerConfigAlignView.textContent = isAlignmentActive ? 'Guardar vista inicial' : 'Definir vista inicial';
  elements.linkMarkerConfigAlignView.classList.toggle('is-active', isAlignmentActive);

  let alignmentHintText = 'Superpone la escena destino sobre la actual para definir exactamente como se va a abrir la transicion.';
  if (!targetScene) {
    alignmentHintText = 'Selecciona una escena destino para preparar la vista de entrada.';
  } else if (!hasReadyTargetScene) {
    alignmentHintText = 'La escena destino todavia no esta lista para previsualizarse.';
  } else if (isAlignmentActive) {
    alignmentHintText = 'Panea la escena destino superpuesta y vuelve a presionar para guardar esta vista inicial.';
  } else if (savedTargetView) {
    alignmentHintText = `Vista guardada: Yaw ${formatAngle(savedTargetView.yaw)} | Pitch ${formatAngle(savedTargetView.pitch)} | FOV ${formatAngle(savedTargetView.fov)}`;
  }

  elements.linkMarkerConfigAlignmentHint.textContent = alignmentHintText;
  positionLinkMarkerConfigOverlay();
}

function renderLinkMarkerTargetSceneOptions(marker) {
  const targetScenes = state.scenes.filter((scene) => scene.id !== marker.sceneId);
  elements.linkMarkerConfigTargetScene.innerHTML = targetScenes.length
    ? targetScenes.map((scene) => `<option value="${escapeText(scene.id)}">${escapeText(scene.name || scene.fileName || scene.id)}</option>`).join('')
    : '<option value="">No hay otra escena disponible</option>';

  if (!targetScenes.length) {
    marker.targetSceneId = null;
    elements.linkMarkerConfigTargetScene.value = '';
    elements.linkMarkerConfigTargetScene.disabled = true;
    return;
  }

  const fallbackTargetSceneId = targetScenes[0].id;
  marker.targetSceneId = targetScenes.some((scene) => scene.id === marker.targetSceneId) ? marker.targetSceneId : fallbackTargetSceneId;
  elements.linkMarkerConfigTargetScene.disabled = false;
  elements.linkMarkerConfigTargetScene.value = marker.targetSceneId;
}

function updateSelectedInfoMarkerName() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'info') {
    return;
  }

  marker.name = elements.infoMarkerConfigName.value.trimStart();
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
  renderInfoMarkerContentPreview(marker);
  if (runtime.pinnedInfoMarkerId === marker.id || runtime.hoveredInfoMarkerId === marker.id) {
    renderInfoMarkerDisplay(marker);
  }
}

function updateSelectedInfoMarkerPreviewInTab() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'info') {
    return;
  }

  marker.previewInMarkerTab = elements.infoMarkerConfigPreviewInTab.checked;
  renderMarkerConfigOverlays();
  renderActiveSceneMarkers();

  if (state.activeTab !== 'marcadores') {
    return;
  }

  if (marker.previewInMarkerTab) {
    runtime.hoveredInfoMarkerId = marker.id;
    renderInfoMarkerDisplay(marker);
    return;
  }

  if (!runtime.pinnedInfoMarkerId || runtime.pinnedInfoMarkerId === marker.id) {
    runtime.hoveredInfoMarkerId = null;
    runtime.pinnedInfoMarkerId = runtime.pinnedInfoMarkerId === marker.id ? null : runtime.pinnedInfoMarkerId;
    hideInfoMarkerDisplay();
  }
}

function updateSelectedLinkMarkerName() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'link') {
    return;
  }

  marker.name = elements.linkMarkerConfigName.value.trimStart();
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function updateSelectedLightMarkerName() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'light') {
    return;
  }

  marker.name = elements.lightMarkerConfigName.value.trimStart();
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function updateSelectedLightMarkerAppearance() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'light') {
    return;
  }

  marker.flareColor = normalizeLightHexColor(elements.lightMarkerConfigColor.value);
  syncLightMarkerConfigColorInput();
  marker.flareRadius = getLightMarkerRadius({ flareRadius: elements.lightMarkerConfigRadius.value });
  marker.flareIntensity = getLightMarkerIntensity({ flareIntensity: elements.lightMarkerConfigIntensity.value });
  marker.ghostIntensity = getLightMarkerGhostIntensity({ ghostIntensity: elements.lightMarkerConfigGhostIntensity.value });
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function renderSoundMarkerConfigOverlay(marker) {
  if (!elements.soundMarkerConfigOverlay) {
    return;
  }

  elements.soundMarkerConfigOverlay.hidden = false;
  elements.soundMarkerConfigTitle.textContent = marker.name || 'Sound';
  elements.soundMarkerConfigName.value = marker.name || '';
  elements.soundMarkerConfigYaw.value = formatSceneConfigAngle(marker.yaw);
  elements.soundMarkerConfigPitch.value = formatSceneConfigAngle(marker.pitch);
  elements.soundMarkerConfigAudioSummary.textContent = getSoundMarkerAudioSummary(marker);
  elements.soundMarkerConfigVolume.value = String(Math.round(getSoundMarkerVolume(marker) * 100));
  elements.soundMarkerConfigPan.value = String(Math.round(getSoundMarkerPan(marker) * 100));
  elements.soundMarkerConfigFocus.value = String(Math.round(getSoundMarkerFocusDeg(marker)));
  elements.soundMarkerConfigLoop.checked = shouldSoundMarkerLoop(marker);
  positionSoundMarkerConfigOverlay();
}

function updateSelectedSoundMarkerName() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'sound') {
    return;
  }

  marker.name = elements.soundMarkerConfigName.value.trimStart();
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function updateSelectedSoundMarkerSettings() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'sound') {
    return;
  }

  marker.soundVolume = clamp((Number(elements.soundMarkerConfigVolume.value) || 0) / 100, 0, 1);
  marker.soundPan = clamp((Number(elements.soundMarkerConfigPan.value) || 0) / 100, 0, 1);
  marker.soundFocusDeg = clamp(Number(elements.soundMarkerConfigFocus.value) || SOUND_MARKER_DEFAULT_FOCUS_DEG, 20, 180);
  marker.soundLoop = Boolean(elements.soundMarkerConfigLoop.checked);
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function applySelectedSoundMarkerCoordinates() {
  applySelectedMarkerCoordinates(elements.soundMarkerConfigYaw.value, elements.soundMarkerConfigPitch.value, 'sound');
}

function clearSelectedSoundMarkerAudio() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'sound') {
    return;
  }

  releaseSoundMarkerAudioAsset(marker);
  if (runtime.soundMarkerAudioEntries.has(marker.id)) {
    destroySoundMarkerAudioEntry(runtime.soundMarkerAudioEntries.get(marker.id));
    runtime.soundMarkerAudioEntries.delete(marker.id);
  }
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function updateSelectedSoundMarkerAudio(event) {
  const marker = getSelectedMarker();
  const file = event?.target?.files?.[0];
  if (!marker || normalizeMarkerType(marker.type) !== 'sound') {
    if (event?.target) {
      event.target.value = '';
    }
    return;
  }

  if (!file) {
    return;
  }

  const asset = createSoundMarkerAudioAssetFromFile(file);
  if (!asset) {
    window.alert('Selecciona un archivo de audio valido (.mp3, .m4a, .ogg o .wav).');
    event.target.value = '';
    return;
  }

  releaseSoundMarkerAudioAsset(marker);
  assignSoundMarkerAudio(marker, asset);
  if (runtime.soundMarkerAudioEntries.has(marker.id)) {
    destroySoundMarkerAudioEntry(runtime.soundMarkerAudioEntries.get(marker.id));
    runtime.soundMarkerAudioEntries.delete(marker.id);
  }
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
  event.target.value = '';
}

function applySelectedInfoMarkerCoordinates() {
  applySelectedMarkerCoordinates(elements.infoMarkerConfigYaw.value, elements.infoMarkerConfigPitch.value, 'info');
}

function applySelectedLinkMarkerCoordinates() {
  applySelectedMarkerCoordinates(elements.linkMarkerConfigYaw.value, elements.linkMarkerConfigPitch.value, 'link');
}

function applySelectedLightMarkerCoordinates() {
  applySelectedMarkerCoordinates(elements.lightMarkerConfigYaw.value, elements.lightMarkerConfigPitch.value, 'light');
}

function applySelectedMarkerCoordinates(yawValue, pitchValue, type) {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== type) {
    return;
  }

  marker.yaw = (Number(yawValue) || 0) * Math.PI / 180;
  marker.pitch = clamp((Number(pitchValue) || 0) * Math.PI / 180, -90 * Math.PI / 180, 90 * Math.PI / 180);
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function captureCurrentViewForSelectedMarker() {
  const marker = getSelectedMarker();
  const currentParameters = runtime.activeSceneInstance?.view?.parameters?.();
  if (!marker || !currentParameters) {
    return;
  }

  marker.yaw = currentParameters.yaw ?? marker.yaw;
  marker.pitch = currentParameters.pitch ?? marker.pitch;
  renderMarkerPanels();
  renderActiveSceneMarkers();
  renderMarkerConfigOverlays();
}

function applySelectedLinkMarkerSettings() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'link') {
    return;
  }

  const previousTargetSceneId = marker.targetSceneId;
  marker.targetSceneId = elements.linkMarkerConfigTargetScene.value || null;
  marker.transition = elements.linkMarkerConfigTransition.value || 'fade';
  marker.transitionDurationMs = getLinkMarkerTransitionDurationMs({ transitionDurationMs: elements.linkMarkerConfigTransitionDuration.value });
  marker.centerBeforeTransition = Boolean(elements.linkMarkerConfigCenterBeforeTransition.checked);
  syncLinkMarkerTransitionDurationControl();

  if (marker.targetSceneId !== previousTargetSceneId) {
    marker.targetViewParameters = null;
  }

  renderMarkerConfigOverlays();

  if (runtime.linkAlignmentMarkerId === marker.id) {
    if (!marker.targetSceneId) {
      stopLinkMarkerAlignmentPreview();
      renderMarkerConfigOverlays();
      return;
    }

    startLinkMarkerAlignmentPreview(marker);
  }
}

async function testSelectedLinkMarkerTransition() {
  const marker = getSelectedMarker();
  if (!marker || normalizeMarkerType(marker.type) !== 'link') {
    return;
  }

  if (!marker.targetSceneId) {
    window.alert('Selecciona una escena destino para probar la transicion.');
    return;
  }

  activateLinkMarker(marker);
}

function getDefaultLinkTargetSceneId(currentSceneId) {
  return state.scenes.find((scene) => scene.id !== currentSceneId)?.id || null;
}

function applySceneConfigInputs() {
  const scene = state.scenes.find((item) => item.id === state.activeSceneId);
  if (!scene) {
    return;
  }

  const fovLimits = getProjectFovConfig();
  const nextYaw = (Number(elements.sceneConfigYaw.value) || 0) * Math.PI / 180;
  const nextPitch = clamp((Number(elements.sceneConfigPitch.value) || 0) * Math.PI / 180, -90 * Math.PI / 180, 90 * Math.PI / 180);
  const nextFov = clamp((Number(elements.sceneConfigFov.value) || 0) * Math.PI / 180, fovLimits.minRad, fovLimits.maxRad);

  scene.initialViewParameters = {
    ...scene.initialViewParameters,
    yaw: nextYaw,
    pitch: nextPitch,
    fov: nextFov
  };

  if (scene.runtimeScene?.view) {
    scene.runtimeScene.view.setParameters(scene.initialViewParameters);
  }

  renderViewer();
  renderSceneConfigOverlay();
}

function captureCurrentViewForSceneConfig() {
  const scene = state.scenes.find((item) => item.id === state.activeSceneId);
  if (!scene) {
    return;
  }

  const currentParameters = scene.runtimeScene?.view?.parameters?.() || scene.initialViewParameters;
  scene.initialViewParameters = {
    ...scene.initialViewParameters,
    ...currentParameters
  };

  renderSceneConfigOverlay();
  renderViewer();
}
function formatAngle(value) {
  return ((value || 0) * 180 / Math.PI).toFixed(1) + " deg";
}

function updateViewerCoordinates(parameters = null) {
  const yaw = parameters?.yaw ?? 0;
  const pitch = parameters?.pitch ?? 0;
  const fov = parameters?.fov ?? INITIAL_FOV;
  elements.viewerCoordinates.textContent = `Yaw ${formatAngle(yaw)} | Pitch ${formatAngle(pitch)} | FOV ${formatAngle(fov)}`;
}

function getNormalizedViewParameters(parameters, fallback = null) {
  const fallbackParams = fallback || { yaw: 0, pitch: 0, fov: INITIAL_FOV };
  const { minRad, maxRad } = getProjectFovConfig();
  const nextYaw = Number(parameters?.yaw);
  const nextPitch = Number(parameters?.pitch);
  const nextFov = Number(parameters?.fov);

  return {
    yaw: Number.isFinite(nextYaw) ? nextYaw : (fallbackParams.yaw ?? 0),
    pitch: clamp(Number.isFinite(nextPitch) ? nextPitch : (fallbackParams.pitch ?? 0), -Math.PI / 2, Math.PI / 2),
    fov: clamp(Number.isFinite(nextFov) ? nextFov : (fallbackParams.fov ?? INITIAL_FOV), minRad, maxRad)
  };
}

function getTargetSceneForMarker(marker) {
  return state.scenes.find((scene) => scene.id === marker?.targetSceneId) || null;
}

function getLinkMarkerTargetViewParameters(marker, targetScene = null) {
  const fallbackScene = targetScene || getTargetSceneForMarker(marker);
  return getNormalizedViewParameters(marker?.targetViewParameters, fallbackScene?.initialViewParameters);
}

function transitionSupportsDuration(transitionType) {
  return (transitionType || 'fade') !== 'instant';
}

function getLinkMarkerTransitionDurationMs(marker) {
  const value = Number(marker?.transitionDurationMs);
  return clamp(Number.isFinite(value) ? value : DEFAULT_LINK_MARKER_TRANSITION_MS, 100, 10000);
}

function syncLinkMarkerTransitionDurationControl() {
  if (!elements.linkMarkerConfigTransition || !elements.linkMarkerConfigTransitionDuration) {
    return;
  }

  elements.linkMarkerConfigTransitionDuration.disabled = !transitionSupportsDuration(elements.linkMarkerConfigTransition.value || 'fade');
}

function bindActiveViewCoordinates(scene, view) {
  runtime.activeViewListenerCleanup = { sceneId: scene.id, view };
  updateViewerCoordinates(view.parameters());
}
function getOrCreateAlignmentRuntimeScene(scene) {
  if (scene.alignmentRuntimeScene) {
    return scene.alignmentRuntimeScene;
  }

  const source = new window.Marzipano.ImageUrlSource((tile) => {
    const key = `${tile.z}/${tile.face}/${tile.y}/${tile.x}`;
    return {
      url: scene.processed.tiles[key]
    };
  }, {
    cubeMapPreviewUrl: scene.processed.previewUrl,
    cubeMapPreviewFaceOrder: PREVIEW_FACE_ORDER.join('')
  });

  const geometry = new window.Marzipano.CubeGeometry(scene.processed.levels);
  const limiter = createSceneViewLimiter(scene);
  const view = new window.Marzipano.RectilinearView(scene.initialViewParameters, limiter);
  const marzipanoScene = runtime.alignmentViewer.createScene({
    source,
    geometry,
    view,
    pinFirstLevel: true
  });

  scene.alignmentRuntimeScene = {
    scene: marzipanoScene,
    view,
    onViewChange: () => {
      if (runtime.linkAlignmentMarkerId && runtime.activeAlignmentSceneInstance?.view === view) {
        updateViewerCoordinates(view.parameters());
      }
    }
  };

  if (typeof view.addEventListener === 'function') {
    view.addEventListener('change', scene.alignmentRuntimeScene.onViewChange);
  }

  return scene.alignmentRuntimeScene;
}

function getOrCreateRuntimeScene(scene) {
  if (scene.runtimeScene) {
    return scene.runtimeScene;
  }

  const source = new window.Marzipano.ImageUrlSource((tile) => {
    const key = `${tile.z}/${tile.face}/${tile.y}/${tile.x}`;
    return {
      url: scene.processed.tiles[key]
    };
  }, {
    cubeMapPreviewUrl: scene.processed.previewUrl,
    cubeMapPreviewFaceOrder: PREVIEW_FACE_ORDER.join('')
  });

  const geometry = new window.Marzipano.CubeGeometry(scene.processed.levels);
  const limiter = createSceneViewLimiter(scene);
  const view = new window.Marzipano.RectilinearView(scene.initialViewParameters, limiter);
  const marzipanoScene = runtime.viewer.createScene({
    source,
    geometry,
    view,
    pinFirstLevel: true
  });

  scene.runtimeScene = {
    sceneId: scene.id,
    scene: marzipanoScene,
    view,
    hotspotContainer: typeof marzipanoScene.hotspotContainer === 'function' ? marzipanoScene.hotspotContainer() : null,
    hotspots: new Map(),
    onViewChange: () => {
      if (scene.id === state.activeSceneId) {
        updateViewerCoordinates(view.parameters());
        updateInfoMarkerDisplayPosition(view);
        scheduleLightOpticsSync();
        syncActiveSceneSoundPlayback();
      }
    }
  };

  if (typeof view.addEventListener === 'function') {
    view.addEventListener('change', scene.runtimeScene.onViewChange);
  }

  return scene.runtimeScene;
}

function triggerStatusSheen() {
  const statusCard = elements.projectSummaryCard;
  if (!statusCard) {
    return;
  }

  const now = performance.now();
  if ((now - runtime.statusSheenLastAt) < 850) {
    return;
  }

  runtime.statusSheenLastAt = now;

  if (runtime.statusSheenResetTimer !== null) {
    window.clearTimeout(runtime.statusSheenResetTimer);
    runtime.statusSheenResetTimer = null;
  }

  statusCard.classList.remove('is-sheening');
  void statusCard.offsetWidth;
  statusCard.classList.add('is-sheening');
  runtime.statusSheenResetTimer = window.setTimeout(() => {
    statusCard.classList.remove('is-sheening');
    runtime.statusSheenResetTimer = null;
  }, 900);
}

function setStatusText(text) {
  if (!elements.projectSummaryCopy) {
    return;
  }

  const nextText = typeof text === 'string' ? text : '';
  if (elements.projectSummaryCopy.textContent === nextText) {
    return;
  }

  elements.projectSummaryCopy.textContent = nextText;
  triggerStatusSheen();
}

function getTabStatusMessage(tabId) {
  switch (tabId) {
    case 'instrucciones':
      return 'Instrucciones: este panel sera la entrada al tutorial guiado del editor.';
    case 'comandos':
      return 'Comandos: aqui puedes guardar, importar, exportar o borrar el proyecto actual.';
    case 'proyecto':
      return 'Proyecto: ajusta los datos globales del tour desde este panel.';
    case 'escenas':
      return 'Escenas: importa panoramas, elige la inicial y ordena el recorrido.';
    case 'marcadores':
      return 'Marcadores: crea hotspots link y media sobre la escena activa.';
    case 'efectos':
      return 'Efectos: agrega luces y flares sobre la escena activa.';
    case 'mapa':
      return 'Mapa: navega el tour como grafo y crea conexiones entre escenas.';
    default:
      return 'Panel listo.';
  }
}

function getPanelHelpStatusMessage(panelId) {
  switch (panelId) {
    case 'instrucciones':
      return 'Ayuda de Instrucciones: el overlay guiado se agregara en una siguiente version.';
    case 'comandos':
      return 'Ayuda de Comandos: este boton abrira una guia rapida del panel en una siguiente version.';
    case 'proyecto':
      return 'Ayuda de Proyecto: este boton mostrara la explicacion de cada ajuste global.';
    case 'escenas':
      return 'Ayuda de Escenas: aqui explicaremos importacion, orden y escena inicial.';
    case 'marcadores':
      return 'Ayuda de Marcadores: aqui explicaremos hotspots link, info y su configuracion.';
    case 'efectos':
      return 'Ayuda de Efectos: aqui explicaremos luces, brillo y posicion.';
    case 'mapa':
      return 'Ayuda de Mapa: aqui explicaremos nodos, conexiones y flujos de creacion.';
    default:
      return 'Ayuda del panel proximamente.';
  }
}

function showTransientStatus(text, duration = 2200) {
  if (!text) {
    return;
  }

  if (runtime.transientStatusTimer !== null) {
    window.clearTimeout(runtime.transientStatusTimer);
  }

  runtime.transientStatus = text;
  setStatusText(text);
  runtime.transientStatusTimer = window.setTimeout(() => {
    runtime.transientStatus = null;
    runtime.transientStatusTimer = null;
    renderStatus();
  }, duration);
}

function getStatusText() {
  return elements.projectSummaryCopy?.textContent || '';
}
function renderStatus() {
  if (runtime.transientStatus) {
    setStatusText(runtime.transientStatus);
    return;
  }

  const readyScenes = state.scenes.filter((scene) => scene.processed.mode === 'multires-listo').length;
  const hasScenes = state.scenes.length > 0;
  const loadingScenes = state.scenes.filter((scene) => scene.processed.mode === 'procesando');
  let statusText = 'Define el nombre del proyecto y agrega escenas para construir el tour.';

  if (state.processingCount > 0 && loadingScenes.length) {
    const loadingSummary = loadingScenes
      .slice(0, 3)
      .map((scene) => `${scene.name || scene.fileName}: ${Math.round((scene.processed.progress || 0) * 100)}% (${scene.processed.progressLabel || 'Procesando'})`)
      .join(' | ');
    const extraCount = loadingScenes.length - Math.min(loadingScenes.length, 3);
    statusText = `Importando ${loadingScenes.length} escena${loadingScenes.length === 1 ? '' : 's'}: ${loadingSummary}${extraCount > 0 ? ` | +${extraCount} mas` : ''}`;
  } else if (readyScenes > 0) {
    statusText = `El proyecto contiene ${readyScenes} escena${readyScenes === 1 ? '' : 's'} lista${readyScenes === 1 ? '' : 's'} para organizar.`;
  } else if (hasScenes) {
    statusText = `Hay ${state.scenes.length} escena${state.scenes.length === 1 ? '' : 's'} cargada${state.scenes.length === 1 ? '' : 's'} en el proyecto.`;
  }

  if (state.activeTab === 'mapa' && runtime.nodeMapLinkCreation !== null) {
    const creationStage = getNodeMapLinkCreationStage();
    if (creationStage === 'source') {
      statusText = 'Creación de hotspot link: selecciona primero la escena origen.';
    } else if (creationStage === 'target') {
      statusText = 'Creación de hotspot link: ahora selecciona la escena destino.';
    } else if (creationStage === 'placement') {
      statusText = 'Creación de hotspot link: panea el visor si hace falta y usa el tercer click para ubicar el hotspot.';
    }
  } else if (runtime.pendingMarkerPlacement !== null) {
    statusText = 'Creación de ' + (runtime.pendingMarkerPlacement.type === 'light' ? 'efecto light' : runtime.pendingMarkerPlacement.type === 'sound' ? 'efecto sound' : runtime.pendingMarkerPlacement.type === 'link' ? 'hotspot link' : 'hotspot media') + ': panea el visor y haz click para ubicarlo. También puedes elegir otra escena desde el mapa.';
  }

  setStatusText(statusText);
}

function saveProjectToJson() {
  return saveProjectPackage();
}

function serializeMarker(marker) {
  const mediaKind = getInfoMarkerMediaKind(marker);
  const mediaSrc = getInfoMarkerMediaSrc(marker);
  const serializedMediaSrc = mediaSrc && !mediaSrc.startsWith('blob:') && !mediaSrc.startsWith('data:') ? mediaSrc : '';
  const legacyImageSrc = mediaKind === 'image' && mediaSrc.startsWith('data:') ? mediaSrc : '';
  const soundSrc = getSoundMarkerAudioSrc(marker);
  const serializedSoundSrc = soundSrc && !soundSrc.startsWith('blob:') && !soundSrc.startsWith('data:') ? soundSrc : '';

  return {
    id: marker.id,
    name: marker.name,
    type: normalizeMarkerType(marker.type),
    sceneId: marker.sceneId,
    yaw: marker.yaw,
    pitch: marker.pitch,
    fov: marker.fov,
    content: marker.content || '',
    contentHtml: getInfoMarkerContentHtml(marker),
    imageSrc: legacyImageSrc,
    mediaKind,
    mediaSrc: serializedMediaSrc,
    mediaMimeType: mediaKind ? getInfoMarkerMediaMimeType(marker) : '',
    mediaFileName: mediaKind ? getInfoMarkerMediaFileName(marker) : '',
    imageAlign: getInfoMarkerImageAlign(marker),
    textAlign: getInfoMarkerTextAlign(marker),
    textVerticalAlign: getInfoMarkerTextVerticalAlign(marker),
    popupWidth: getInfoMarkerPopupWidth(marker),
    mediaSplit: getInfoMarkerMediaSplit(marker),
    previewInMarkerTab: Boolean(marker.previewInMarkerTab),
    soundSrc: serializedSoundSrc,
    soundMimeType: getSoundMarkerAudioFileName(marker) ? getSoundMarkerAudioMimeType(marker) : '',
    soundFileName: getSoundMarkerAudioFileName(marker),
    soundVolume: getSoundMarkerVolume(marker),
    soundPan: getSoundMarkerPan(marker),
    soundFocusDeg: getSoundMarkerFocusDeg(marker),
    soundLoop: shouldSoundMarkerLoop(marker),
    targetSceneId: marker.targetSceneId || null,
    targetViewParameters: marker.targetViewParameters ? getLinkMarkerTargetViewParameters(marker, getTargetSceneForMarker(marker)) : null,
    transition: marker.transition || 'fade',
    transitionDurationMs: getLinkMarkerTransitionDurationMs(marker),
    centerBeforeTransition: Boolean(marker.centerBeforeTransition),
    flareColor: getLightMarkerColor(marker),
    flareRadius: getLightMarkerRadius(marker),
    flareIntensity: getLightMarkerIntensity(marker),
    ghostIntensity: getLightMarkerGhostIntensity(marker),
    createdAt: marker.createdAt
  };
}

function serializeScene(scene) {
  return {
    id: scene.id,
    name: scene.name,
    fileName: scene.fileName,
    mimeType: scene.mimeType,
    importKey: scene.importKey || null,
    width: scene.width,
    height: scene.height,
    createdAt: scene.createdAt,
    ambientAudio: serializeAmbientAudioConfig(scene.ambientAudio),
    ambientAudioSyncTimeline: Boolean(scene.ambientAudioSyncTimeline),
    sourceImageDataUrl: scene.sourceImageDataUrl || null,
    mapNodePosition: normalizeSceneMapNodePosition(scene.mapNodePosition),
    initialViewParameters: scene.initialViewParameters,
    processed: {
      mode: scene.processed.mode,
      levels: scene.processed.levels,
      faceSize: scene.processed.faceSize,
      error: scene.processed.error,
      note: scene.sourceImageDataUrl
        ? 'El JSON incluye la imagen fuente para regenerar los tiles al importar.'
        : 'Este JSON no incluye la imagen fuente, asi que la escena no puede reconstruirse automaticamente.'
    }
  };
}

function getSceneFileExtension(scene) {
  const fileName = String(scene?.fileName || '').toLowerCase();
  const fileNameMatch = fileName.match(/\.([a-z0-9]+)$/i);
  if (fileNameMatch) {
    return fileNameMatch[1].toLowerCase();
  }

  const mimeType = String(scene?.mimeType || '').toLowerCase();
  if (mimeType === 'image/png') { return 'png'; }
  if (mimeType === 'image/webp') { return 'webp'; }
  if (mimeType === 'image/gif') { return 'gif'; }
  if (mimeType === 'image/avif') { return 'avif'; }
  if (mimeType === 'image/tiff' || mimeType === 'image/x-tiff') { return 'tiff'; }
  return 'jpg';
}

function getPackagedSceneSourcePath(scene) {
  return `project-files/source/${scene.id}.${getSceneFileExtension(scene)}`;
}

function getPackagedScenePreviewPath(scene) {
  return `project-files/tiles/${scene.id}/preview.jpg`;
}

function getPackagedSceneTilesBasePath(scene) {
  return `project-files/tiles/${scene.id}`;
}

function getPackagedProjectAmbientAudioPath(audio) {
  return `project-files/audio/project.${getAmbientAudioFileExtension(audio)}`;
}

function getPackagedSceneAmbientAudioPath(scene) {
  return `project-files/audio/scenes/${scene.id}.${getAmbientAudioFileExtension(scene?.ambientAudio)}`;
}

function getStandaloneProjectAmbientAudioPath(audio) {
  return `app-files/audio/project.${getAmbientAudioFileExtension(audio)}`;
}

function getStandaloneSceneAmbientAudioPath(scene) {
  return `app-files/audio/scenes/${scene.id}.${getAmbientAudioFileExtension(scene?.ambientAudio)}`;
}

function serializePackagedAmbientAudioConfig(audio = null, packagedPath = '') {
  const normalized = serializeAmbientAudioConfig(audio);
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    src: packagedPath || normalized.src
  };
}

function getPackagedMarkerMediaPath(marker) {
  return `project-files/media/${marker.id}.${getInfoMarkerMediaFileExtension(marker)}`;
}

function getPackagedMarkerSoundPath(marker) {
  return `project-files/sound/${marker.id}.${getSoundMarkerAudioFileExtension(marker)}`;
}

function serializePackagedMarker(marker) {
  const serialized = serializeMarker(marker);
  const mediaKind = getInfoMarkerMediaKind(marker);
  const mediaSrc = getInfoMarkerMediaSrc(marker);
  const soundSrc = getSoundMarkerAudioSrc(marker);

  if (mediaKind && mediaSrc) {
    serialized.mediaSrc = getPackagedMarkerMediaPath(marker);
    serialized.imageSrc = '';
  }

  if (soundSrc) {
    serialized.soundSrc = getPackagedMarkerSoundPath(marker);
  }

  return serialized;
}

function serializePackagedScene(scene) {
  const serialized = serializeScene(scene);
  const hasReadyAssets = scene.processed.mode === 'multires-listo' && scene.processed.previewUrl && Object.keys(scene.processed.tiles || {}).length;

  return {
    ...serialized,
    ambientAudio: serializePackagedAmbientAudioConfig(scene.ambientAudio, scene.ambientAudio?.src ? getPackagedSceneAmbientAudioPath(scene) : ''),
    sourceImageDataUrl: null,
    sourceImagePath: scene.sourceImageDataUrl ? getPackagedSceneSourcePath(scene) : '',
    processed: {
      mode: scene.processed.mode,
      levels: scene.processed.levels,
      faceSize: scene.processed.faceSize,
      error: scene.processed.error,
      previewPath: hasReadyAssets ? getPackagedScenePreviewPath(scene) : '',
      tilesBasePath: hasReadyAssets ? getPackagedSceneTilesBasePath(scene) : '',
      note: hasReadyAssets
        ? 'El paquete incluye los tiles multires listos para restaurar esta escena.'
        : scene.sourceImageDataUrl
          ? 'El paquete incluye la imagen fuente para reconstruir esta escena si hiciera falta.'
          : 'Este paquete no incluye imagen fuente ni multires para esta escena.'
    }
  };
}

async function saveProjectPackage() {
  const payload = {
    version: 16,
    format: 'drone360-project-package',
    project: {
      ...state.project,
      ambientAudio: serializePackagedAmbientAudioConfig(state.project.ambientAudio, state.project.ambientAudio?.src ? getPackagedProjectAmbientAudioPath(state.project.ambientAudio) : ''),
      startSceneId: state.startSceneId
    },
    scenes: state.scenes.map(serializePackagedScene),
    markers: state.markers.map(serializePackagedMarker)
  };

  const previousStatus = getStatusText();
  const projectSlug = slugify(state.project.name || 'tour-drone360') || 'tour-drone360';
  const rootDir = `${projectSlug}-project`;
  setStatusText('Empaquetando proyecto...');

  try {
    const files = [{
      path: `${rootDir}/project.json`,
      data: JSON.stringify(payload, null, 2)
    }];

    const projectAmbientAudio = normalizeAmbientAudioConfig(state.project.ambientAudio);
    if (projectAmbientAudio?.src) {
      files.push({
        path: `${rootDir}/${getPackagedProjectAmbientAudioPath(projectAmbientAudio)}`,
        data: await urlToUint8Array(projectAmbientAudio.src, 'No se pudo leer el audio ambiente del proyecto para guardar el proyecto.')
      });
    }

    for (const scene of state.scenes) {
      setStatusText(`Empaquetando ${scene.name || scene.fileName || scene.id}...`);

      if (scene.sourceImageDataUrl) {
        files.push({
          path: `${rootDir}/${getPackagedSceneSourcePath(scene)}`,
          data: await urlToUint8Array(scene.sourceImageDataUrl, 'No se pudo leer la imagen fuente de una escena para guardar el proyecto.')
        });
      }

      const sceneAmbientAudio = normalizeAmbientAudioConfig(scene.ambientAudio);
      if (sceneAmbientAudio?.src) {
        files.push({
          path: `${rootDir}/${getPackagedSceneAmbientAudioPath(scene)}`,
          data: await urlToUint8Array(sceneAmbientAudio.src, 'No se pudo leer el audio ambiente de una escena para guardar el proyecto.')
        });
      }

      if (scene.processed.mode === 'multires-listo' && scene.processed.previewUrl && Object.keys(scene.processed.tiles || {}).length) {
        files.push({
          path: `${rootDir}/${getPackagedScenePreviewPath(scene)}`,
          data: await urlToUint8Array(scene.processed.previewUrl, 'No se pudo leer el preview multires de una escena para guardar el proyecto.')
        });

        for (const [tileKey, tileUrl] of Object.entries(scene.processed.tiles || {})) {
          const [z, face, y, x] = tileKey.split('/');
          files.push({
            path: `${rootDir}/${getPackagedSceneTilesBasePath(scene)}/${z}/${face}/${y}/${x}.jpg`,
            data: await urlToUint8Array(tileUrl, 'No se pudo leer uno de los tiles multires de una escena para guardar el proyecto.')
          });
        }
      }
    }

    for (const marker of state.markers) {
      const mediaKind = getInfoMarkerMediaKind(marker);
      const mediaSrc = getInfoMarkerMediaSrc(marker);
      if (mediaKind && mediaSrc) {
        files.push({
          path: `${rootDir}/${getPackagedMarkerMediaPath(marker)}`,
          data: marker.mediaFile
            ? new Uint8Array(await marker.mediaFile.arrayBuffer())
            : await urlToUint8Array(mediaSrc, 'No se pudo leer el archivo multimedia de un hotspot para guardar el proyecto.')
        });
      }

      const soundSrc = getSoundMarkerAudioSrc(marker);
      if (soundSrc) {
        files.push({
          path: `${rootDir}/${getPackagedMarkerSoundPath(marker)}`,
          data: marker.soundFile
            ? new Uint8Array(await marker.soundFile.arrayBuffer())
            : await urlToUint8Array(soundSrc, 'No se pudo leer el archivo de un efecto sound para guardar el proyecto.')
        });
      }
    }

    downloadBlob(`${projectSlug}-project.zip`, createStoredZip(files));
    setStatusText(previousStatus);
  } catch (error) {
    console.error(error);
    setStatusText(previousStatus);
    window.alert('No se pudo guardar el paquete del proyecto.');
  }
}
async function exportStandalonePlayer() {
  const readyScenes = state.scenes.filter((scene) => scene.processed.mode === 'multires-listo');

  if (!readyScenes.length) {
    window.alert('Todavia no hay escenas multires listas para exportar.');
    return;
  }

  const skippedScenes = state.scenes.length - readyScenes.length;
  const previousStatus = getStatusText();
  const projectSlug = slugify(state.project.name || 'tour-drone360') || 'tour-drone360';
  const rootDir = `${projectSlug}-standalone`;
  setStatusText('Empaquetando player standalone...');

  try {
    const fetchRequiredText = async (url, errorMessage) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(errorMessage);
      }
      return response.text();
    };

    const [marzipanoSource, packagedIndexHtml, packagedStyleCss, packagedIndexScript] = await Promise.all([
      fetchRequiredText('./lib/marzipano.js', 'No se pudo leer el runtime de Marzipano para el export.'),
      fetchRequiredText('./export-player/index.html', 'No se pudo leer la plantilla HTML del player standalone.'),
      fetchRequiredText('./export-player/style.css', 'No se pudo leer la plantilla CSS del player standalone.'),
      fetchRequiredText('./export-player/index.js', 'No se pudo leer la plantilla JS del player standalone.')
    ]);

    const scenes = [];
    const files = [];
    const totalTiles = readyScenes.reduce((count, scene) => count + Object.keys(scene.processed.tiles || {}).length, 0);
    let completedTiles = 0;

    files.push({
      path: `${rootDir}/index.html`,
      data: packagedIndexHtml.replaceAll('__PROJECT_TITLE__', escapeHtml(state.project.name || 'Proyecto Drone360'))
    });
    files.push({
      path: `${rootDir}/app-files/style.css`,
      data: packagedStyleCss
    });
    files.push({
      path: `${rootDir}/app-files/index.js`,
      data: packagedIndexScript
    });
    files.push({
      path: `${rootDir}/app-files/marzipano.js`,
      data: marzipanoSource
    });

    const projectAmbientAudio = normalizeAmbientAudioConfig(state.project.ambientAudio);
    if (projectAmbientAudio?.src) {
      files.push({
        path: `${rootDir}/${getStandaloneProjectAmbientAudioPath(projectAmbientAudio)}`,
        data: await urlToUint8Array(projectAmbientAudio.src, 'No se pudo leer el audio ambiente del proyecto para el export.')
      });
    }

    for (const scene of readyScenes) {
      setStatusText(`Empaquetando ${scene.name}...`);

      const sceneAmbientAudio = normalizeAmbientAudioConfig(scene.ambientAudio);

      scenes.push({
        id: scene.id,
        name: scene.name,
        fileName: scene.fileName,
        levels: scene.processed.levels,
        faceSize: scene.processed.faceSize,
        initialViewParameters: scene.initialViewParameters,
        ambientAudio: serializePackagedAmbientAudioConfig(scene.ambientAudio, sceneAmbientAudio?.src ? getStandaloneSceneAmbientAudioPath(scene) : ''),
        ambientAudioSyncTimeline: Boolean(scene.ambientAudioSyncTimeline)
      });

      if (sceneAmbientAudio?.src) {
        files.push({
          path: `${rootDir}/${getStandaloneSceneAmbientAudioPath(scene)}`,
          data: await urlToUint8Array(sceneAmbientAudio.src, 'No se pudo leer el audio ambiente de una escena para el export.')
        });
      }

      files.push({
        path: `${rootDir}/app-files/tiles/${scene.id}/preview.jpg`,
        data: await blobUrlToUint8Array(scene.processed.previewUrl)
      });

      const tileEntries = Object.entries(scene.processed.tiles || {});
      for (const [tileKey, tileUrl] of tileEntries) {
        const [z, face, y, x] = tileKey.split('/');
        files.push({
          path: `${rootDir}/app-files/tiles/${scene.id}/${z}/${face}/${y}/${x}.jpg`,
          data: await blobUrlToUint8Array(tileUrl)
        });
        completedTiles += 1;
        setStatusText(`Empaquetando tiles ${completedTiles}/${totalTiles}...`);
        if ((completedTiles % 12) === 0) {
          await pauseForFrame();
        }
      }
    }

    const exportedSceneIds = new Set(readyScenes.map((scene) => scene.id));
    const markers = [];
    for (const marker of state.markers
      .filter((item) => exportedSceneIds.has(item.sceneId))
      .filter((item) => normalizeMarkerType(item.type) !== 'link' || exportedSceneIds.has(item.targetSceneId))) {
      const mediaKind = getInfoMarkerMediaKind(marker);
      const mediaSrc = getInfoMarkerMediaSrc(marker);
      let packagedMediaPath = '';
      const soundSrc = getSoundMarkerAudioSrc(marker);
      let packagedSoundPath = '';

      if (mediaKind && mediaSrc) {
        const mediaExtension = getInfoMarkerMediaFileExtension(marker);
        packagedMediaPath = `app-files/media/${marker.id}.${mediaExtension}`;
        const mediaBytes = marker.mediaFile
          ? new Uint8Array(await marker.mediaFile.arrayBuffer())
          : await blobUrlToUint8Array(mediaSrc);
        files.push({
          path: `${rootDir}/${packagedMediaPath}`,
          data: mediaBytes
        });
      }

      if (soundSrc) {
        const soundExtension = getSoundMarkerAudioFileExtension(marker);
        packagedSoundPath = `app-files/sound/${marker.id}.${soundExtension}`;
        const soundBytes = marker.soundFile
          ? new Uint8Array(await marker.soundFile.arrayBuffer())
          : await blobUrlToUint8Array(soundSrc);
        files.push({
          path: `${rootDir}/${packagedSoundPath}`,
          data: soundBytes
        });
      }

      markers.push({
        id: marker.id,
        name: marker.name,
        type: normalizeMarkerType(marker.type),
        sceneId: marker.sceneId,
        yaw: marker.yaw,
        pitch: marker.pitch,
        content: marker.content || '',
        contentHtml: getInfoMarkerContentHtml(marker),
        imageSrc: '',
        mediaKind,
        mediaSrc: packagedMediaPath,
        mediaMimeType: mediaKind ? getInfoMarkerMediaMimeType(marker) : '',
        mediaFileName: mediaKind ? getInfoMarkerMediaFileName(marker) : '',
        imageAlign: getInfoMarkerImageAlign(marker),
        textAlign: getInfoMarkerTextAlign(marker),
        textVerticalAlign: getInfoMarkerTextVerticalAlign(marker),
        popupWidth: getInfoMarkerPopupWidth(marker),
        mediaSplit: getInfoMarkerMediaSplit(marker),
        soundSrc: packagedSoundPath,
        soundMimeType: getSoundMarkerAudioFileName(marker) ? getSoundMarkerAudioMimeType(marker) : '',
        soundFileName: getSoundMarkerAudioFileName(marker),
        soundVolume: getSoundMarkerVolume(marker),
        soundPan: getSoundMarkerPan(marker),
        soundFocusDeg: getSoundMarkerFocusDeg(marker),
        soundLoop: shouldSoundMarkerLoop(marker),
        targetSceneId: marker.targetSceneId || null,
        targetViewParameters: marker.targetViewParameters ? getLinkMarkerTargetViewParameters(marker, getTargetSceneForMarker(marker)) : null,
        transition: marker.transition || 'fade',
        transitionDurationMs: getLinkMarkerTransitionDurationMs(marker),
        centerBeforeTransition: Boolean(marker.centerBeforeTransition),
        flareColor: getLightMarkerColor(marker),
        flareRadius: getLightMarkerRadius(marker),
        flareIntensity: getLightMarkerIntensity(marker),
        ghostIntensity: getLightMarkerGhostIntensity(marker)
      });
    }

    files.push({
      path: `${rootDir}/app-files/data.js`,
      data: buildPackagedDataScript({
        projectName: state.project.name || 'Proyecto Drone360',
        projectAmbientAudio: serializePackagedAmbientAudioConfig(state.project.ambientAudio, projectAmbientAudio?.src ? getStandaloneProjectAmbientAudioPath(projectAmbientAudio) : ''),
        projectAmbientAudioTransitionMs: getProjectAmbientAudioTimingConfig().transitionMs,
        projectAmbientAudioOffset: getProjectAmbientAudioTimingConfig().offset,
        projectAmbientAudioBackground: Boolean(state.project.ambientAudioBackground),
        previewFaceOrder: PREVIEW_FACE_ORDER.join(''),
        minFov: getProjectFovConfig().minRad,
        maxFov: getProjectFovConfig().maxRad,
        startSceneId: state.startSceneId || readyScenes[0]?.id || null,
        scenes,
        markers
      })
    });

    setStatusText('Generando zip standalone...');
    const zipBlob = createStoredZip(files);
    downloadBlob(`${projectSlug}-standalone.zip`, zipBlob);

    if (skippedScenes > 0) {
      window.alert(`Se exportaron ${readyScenes.length} escena(s) listas. ${skippedScenes} escena(s) pendientes quedaron afuera.`);
    }
  } catch (error) {
    console.error(error);
    window.alert(error && error.message ? error.message : 'No se pudo generar el player standalone.');
  } finally {
    setStatusText(previousStatus);
  }
}

function resetProject() {
  openConfirmDialog({
    title: 'Borrar proyecto',
    message: 'Se borrara el estado actual del tour. Esta accion no se puede deshacer.',
    confirmLabel: 'Borrar',
    onConfirm: () => {
      state.scenes.forEach((scene) => releaseAmbientAudioConfigAsset(scene?.ambientAudio));
      state.scenes.forEach(releaseSceneAssets);
      state.markers.forEach(releaseMarkerAssets);
      state.project.name = '';
      releaseAmbientAudioConfigAsset(state.project.ambientAudio);
      state.project.ambientAudio = null;
      state.project.ambientAudioTransitionMs = DEFAULT_AMBIENT_AUDIO_TRANSITION_MS;
      state.project.ambientAudioOffset = DEFAULT_AMBIENT_AUDIO_OFFSET;
      state.project.ambientAudioBackground = false;
      resetProjectAudioTimelineClock();
      state.scenes = [];
      state.markers = [];
      state.selectedMarkerId = null;
      state.activeSceneId = null;
      state.startSceneId = null;
      state.processingCount = 0;
      render();
    }
  });
}

async function importProjectFile(file) {
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip = header.length >= 4 && header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;

  if (isZip) {
    const packaged = await readPackagedProjectFile(file);
    await hydrateState(packaged.payload, {
      packageFiles: packaged.files,
      packageBasePath: packaged.basePath,
      fromPackage: true
    });
    return;
  }

  const raw = await file.text();
  await hydrateState(JSON.parse(raw));
}

async function readPackagedProjectFile(file) {
  const files = parseStoredZipEntries(await file.arrayBuffer());
  const projectEntryPath = [...files.keys()].find((path) => /(^|\/)project\.json$/i.test(path))
    || [...files.keys()].find((path) => /\.json$/i.test(path));

  if (!projectEntryPath) {
    throw new Error('No se encontro project.json dentro del paquete.');
  }

  const raw = decodeText(files.get(projectEntryPath));
  const basePath = projectEntryPath.includes('/') ? projectEntryPath.slice(0, projectEntryPath.lastIndexOf('/') + 1) : '';
  return {
    payload: JSON.parse(raw),
    files,
    basePath
  };
}

function getPackagedFileBytes(files, basePath, relativePath) {
  if (!files || !relativePath) {
    return null;
  }

  return files.get(`${basePath || ''}${relativePath}`) || files.get(relativePath) || null;
}

function enumerateSceneTileDescriptors(scene) {
  const levels = Array.isArray(scene?.processed?.levels) ? scene.processed.levels : [];
  const tilesBasePath = scene?.processed?.tilesBasePath || '';
  const descriptors = [];

  levels.forEach((level, z) => {
    const tilesPerAxis = Math.max(1, Math.ceil((Number(level?.size) || 0) / (Number(level?.tileSize) || 1)));
    PREVIEW_FACE_ORDER.forEach((face) => {
      for (let y = 0; y < tilesPerAxis; y += 1) {
        for (let x = 0; x < tilesPerAxis; x += 1) {
          descriptors.push({
            key: `${z}/${face}/${y}/${x}`,
            path: `${tilesBasePath}/${z}/${face}/${y}/${x}.jpg`
          });
        }
      }
    });
  });

  return descriptors;
}

async function blobToDataUrl(blob) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el blob empaquetado.'));
    reader.readAsDataURL(blob);
  });
}

async function uint8ArrayToDataUrl(bytes, mimeType) {
  return blobToDataUrl(new Blob([bytes], { type: mimeType || 'application/octet-stream' }));
}

function createFileFromBytes(bytes, fileName, mimeType) {
  return new File([bytes], fileName || 'archivo.bin', { type: mimeType || 'application/octet-stream' });
}

async function hydratePackagedAmbientAudioConfig(audio, packageFiles, packageBasePath = '') {
  const normalized = normalizeAmbientAudioConfig(audio);
  if (!normalized) {
    return { audio: null, missing: false };
  }

  if (normalized.src.startsWith('blob:') || normalized.src.startsWith('data:')) {
    return { audio: normalized, missing: false };
  }

  const audioBytes = getPackagedFileBytes(packageFiles, packageBasePath, normalized.src);
  if (!audioBytes) {
    return { audio: null, missing: true };
  }

  return {
    audio: {
      ...normalized,
      src: URL.createObjectURL(createFileFromBytes(audioBytes, normalized.fileName, normalized.mimeType))
    },
    missing: false
  };
}

async function hydratePackagedSceneAssets(scene, packageFiles, packageBasePath = '') {
  let restoredProcessed = false;
  let restoredSourceImage = false;

  const sourceImagePath = scene?.sourceImagePath || '';
  if (sourceImagePath) {
    const sourceBytes = getPackagedFileBytes(packageFiles, packageBasePath, sourceImagePath);
    if (sourceBytes) {
      scene.sourceImageDataUrl = await uint8ArrayToDataUrl(sourceBytes, scene.mimeType || 'image/jpeg');
      restoredSourceImage = true;
    }
  }

  const previewPath = scene?.processed?.previewPath || '';
  const tilesBasePath = scene?.processed?.tilesBasePath || '';
  if (!previewPath || !tilesBasePath || !Array.isArray(scene?.processed?.levels) || !scene.processed.levels.length) {
    return { restoredProcessed, restoredSourceImage };
  }

  const previewBytes = getPackagedFileBytes(packageFiles, packageBasePath, previewPath);
  if (!previewBytes) {
    return { restoredProcessed, restoredSourceImage };
  }

  const previewUrl = URL.createObjectURL(new Blob([previewBytes], { type: 'image/jpeg' }));
  const assetUrls = [previewUrl];
  const tiles = {};

  try {
    for (const descriptor of enumerateSceneTileDescriptors(scene)) {
      const tileBytes = getPackagedFileBytes(packageFiles, packageBasePath, descriptor.path);
      if (!tileBytes) {
        throw new Error(`Falta un tile empaquetado para la escena ${scene.name || scene.id}.`);
      }
      const tileUrl = URL.createObjectURL(new Blob([tileBytes], { type: 'image/jpeg' }));
      assetUrls.push(tileUrl);
      tiles[descriptor.key] = tileUrl;
    }
  } catch (error) {
    assetUrls.forEach((url) => URL.revokeObjectURL(url));
    throw error;
  }

  scene.processed = {
    ...scene.processed,
    mode: 'multires-listo',
    previewUrl,
    posterUrl: previewUrl,
    tiles,
    assetUrls,
    error: null,
    progress: 1,
    progressLabel: 'Escena lista'
  };
  restoredProcessed = true;
  return { restoredProcessed, restoredSourceImage };
}

function hydratePackagedMarkerBinaryAssets(markers, packageFiles, packageBasePath = '') {
  let missingMarkerMediaCount = 0;
  let missingSoundMarkerAudioCount = 0;

  markers.forEach((marker) => {
    const mediaKind = getInfoMarkerMediaKind(marker);
    const mediaPath = typeof marker?.mediaSrc === 'string' ? marker.mediaSrc : '';
    if (mediaKind && mediaPath && !mediaPath.startsWith('blob:') && !mediaPath.startsWith('data:')) {
      const mediaBytes = getPackagedFileBytes(packageFiles, packageBasePath, mediaPath);
      if (mediaBytes) {
        const mediaFile = createFileFromBytes(mediaBytes, getInfoMarkerMediaFileName(marker), getInfoMarkerMediaMimeType(marker));
        marker.mediaFile = mediaFile;
        marker.mediaSrc = URL.createObjectURL(mediaFile);
      } else {
        missingMarkerMediaCount += 1;
        releaseInfoMarkerMediaAsset(marker);
      }
    }

    const soundPath = typeof marker?.soundSrc === 'string' ? marker.soundSrc : '';
    if (soundPath && !soundPath.startsWith('blob:') && !soundPath.startsWith('data:')) {
      const soundBytes = getPackagedFileBytes(packageFiles, packageBasePath, soundPath);
      if (soundBytes) {
        const soundFile = createFileFromBytes(soundBytes, getSoundMarkerAudioFileName(marker), getSoundMarkerAudioMimeType(marker));
        marker.soundFile = soundFile;
        marker.soundSrc = URL.createObjectURL(soundFile);
      } else {
        missingSoundMarkerAudioCount += 1;
        releaseSoundMarkerAudioAsset(marker);
      }
    }
  });

  return { missingMarkerMediaCount, missingSoundMarkerAudioCount };
}
async function hydrateState(payload, options = {}) {
  const { packageFiles = null, packageBasePath = '', fromPackage = false } = options;

  releaseAmbientAudioConfigAsset(state.project.ambientAudio);
  state.scenes.forEach((scene) => releaseAmbientAudioConfigAsset(scene?.ambientAudio));
  state.scenes.forEach(releaseSceneAssets);
  state.markers.forEach(releaseMarkerAssets);
  const nextProjectConfig = normalizeProjectConfig(payload?.project || {});
  state.project.name = nextProjectConfig.name;
  state.project.minFovDeg = nextProjectConfig.minFovDeg;
  state.project.maxFovDeg = nextProjectConfig.maxFovDeg;
  state.project.ambientAudio = nextProjectConfig.ambientAudio;
  state.project.ambientAudioTransitionMs = nextProjectConfig.ambientAudioTransitionMs;
  state.project.ambientAudioOffset = nextProjectConfig.ambientAudioOffset;
  state.project.ambientAudioBackground = nextProjectConfig.ambientAudioBackground;
  resetProjectAudioTimelineClock();
  state.scenes = Array.isArray(payload?.scenes) ? payload.scenes.map(normalizeHydratedScene) : [];
  state.markers = Array.isArray(payload?.markers) ? payload.markers.map(normalizeHydratedMarker) : [];

  let missingAmbientAudioCount = 0;
  if (packageFiles) {
    const hydratedProjectAmbientAudio = await hydratePackagedAmbientAudioConfig(state.project.ambientAudio, packageFiles, packageBasePath);
    state.project.ambientAudio = hydratedProjectAmbientAudio.audio;
    if (hydratedProjectAmbientAudio.missing) {
      missingAmbientAudioCount += 1;
    }

    for (const scene of state.scenes) {
      const hydratedSceneAmbientAudio = await hydratePackagedAmbientAudioConfig(scene.ambientAudio, packageFiles, packageBasePath);
      scene.ambientAudio = hydratedSceneAmbientAudio.audio;
      if (hydratedSceneAmbientAudio.missing) {
        missingAmbientAudioCount += 1;
      }

      try {
        await hydratePackagedSceneAssets(scene, packageFiles, packageBasePath);
      } catch (error) {
        console.error(error);
      }
    }

    hydratePackagedMarkerBinaryAssets(state.markers, packageFiles, packageBasePath);
  }

  const missingMarkerMediaCount = state.markers.filter((marker) => getInfoMarkerMediaKind(marker) && !hasInfoMarkerRenderableMedia(marker)).length;
  const missingSoundMarkerAudioCount = state.markers.filter((marker) => getSoundMarkerAudioFileName(marker) && !hasSoundMarkerAudio(marker)).length;
  state.selectedMarkerId = null;
  state.startSceneId = payload?.project?.startSceneId || state.scenes[0]?.id || null;
  state.activeSceneId = state.startSceneId || state.scenes[0]?.id || null;
  state.processingCount = 0;

  const rebuildableScenes = state.scenes.filter((scene) => scene.processed.mode !== 'multires-listo' && scene.sourceImageDataUrl);
  const missingSourceScenes = state.scenes.filter((scene) => scene.processed.mode !== 'multires-listo' && !scene.sourceImageDataUrl);

  if (!rebuildableScenes.length) {
    render();
    if (fromPackage) {
      if (missingSourceScenes.length) {
        window.alert('El paquete se importo, pero algunas escenas no incluian assets suficientes para restaurarse completamente.');
      }
      if (missingMarkerMediaCount || missingSoundMarkerAudioCount || missingAmbientAudioCount) {
        const missingParts = [];
        if (missingMarkerMediaCount) { missingParts.push('hotspots multimedia'); }
        if (missingSoundMarkerAudioCount) { missingParts.push('efectos sound'); }
        if (missingAmbientAudioCount) { missingParts.push('audios ambiente'); }
        window.alert('El paquete restaura ' + missingParts.join(' y ') + ', pero faltaban algunos archivos binarios dentro del paquete.');
      }
    } else {
      if (missingSourceScenes.length) {
        window.alert('Este JSON restaura la estructura del proyecto, pero no incluye las imagenes fuente de las escenas. Guarda otra vez el proyecto con esta version para que el JSON tambien pueda reconstruirlas.');
      }
      if (missingMarkerMediaCount || missingSoundMarkerAudioCount) {
        const missingParts = [];
        if (missingMarkerMediaCount) { missingParts.push('hotspots multimedia'); }
        if (missingSoundMarkerAudioCount) { missingParts.push('efectos sound'); }
        window.alert('Este JSON restaura ' + missingParts.join(' y ') + ', pero no incluye sus archivos binarios. Para llevar ese contenido contigo usa Exportar proyecto.');
      }
    }
    return;
  }

  state.processingCount = rebuildableScenes.length;
  rebuildableScenes.forEach((scene) => {
    scene.processed = {
      ...scene.processed,
      mode: 'procesando',
      progress: 0,
      progressLabel: fromPackage ? 'Reconstruyendo escena desde el paquete' : 'Reconstruyendo tiles desde el JSON',
      error: null
    };
  });
  render();

  for (const scene of rebuildableScenes) {
    try {
      const sourceFile = await dataUrlToFile(scene.sourceImageDataUrl, scene.fileName || `${scene.name || 'escena'}.jpg`, scene.mimeType || 'image/jpeg');
      const rebuiltScene = await processSceneFile(scene, sourceFile);
      replaceScene(rebuiltScene);
    } catch (error) {
      console.error(error);
      replaceScene({
        ...scene,
        processed: {
          ...scene.processed,
          mode: 'error',
          error: fromPackage ? 'No se pudo reconstruir la escena desde el paquete del proyecto.' : 'No se pudo reconstruir la escena desde la imagen guardada en el JSON.',
          progress: 0,
          progressLabel: 'Error al reconstruir la escena'
        }
      });
    } finally {
      state.processingCount = Math.max(0, state.processingCount - 1);
      render();
    }
  }

  if (missingSourceScenes.length) {
    if (fromPackage) {
      window.alert(`Se restauraron o reconstruyeron ${rebuildableScenes.length} escena(s), pero ${missingSourceScenes.length} no tenian ni multires ni imagen fuente dentro del paquete.`);
    } else {
      window.alert(`Se reconstruyeron ${rebuildableScenes.length} escena(s) desde el JSON, pero ${missingSourceScenes.length} no incluian imagen fuente.`);
    }
  }
  if (missingMarkerMediaCount || missingSoundMarkerAudioCount || (fromPackage && missingAmbientAudioCount)) {
    const missingParts = [];
    if (missingMarkerMediaCount) { missingParts.push('hotspots multimedia'); }
    if (missingSoundMarkerAudioCount) { missingParts.push('efectos sound'); }
    if (fromPackage && missingAmbientAudioCount) { missingParts.push('audios ambiente'); }
    window.alert((fromPackage
      ? 'El paquete restaura '
      : 'Este JSON restaura ') + missingParts.join(' y ') + (fromPackage
      ? ', pero faltaban algunos archivos binarios dentro del paquete.'
      : ', pero no incluye sus archivos binarios. Para llevar ese contenido contigo usa Exportar proyecto.'));
  }
}
function normalizeHydratedMarker(marker) {
  const mediaKind = getInfoMarkerMediaKind(marker);
  const mediaSrc = typeof marker?.mediaSrc === 'string' ? marker.mediaSrc : '';
  const soundSrc = typeof marker?.soundSrc === 'string' ? marker.soundSrc : '';
  return {
    id: marker?.id || crypto.randomUUID(),
    name: marker?.name || getMarkerTypeDefaultName(marker?.type, 1),
    type: normalizeMarkerType(marker?.type),
    sceneId: marker?.sceneId || null,
    yaw: Number.isFinite(Number(marker?.yaw)) ? Number(marker.yaw) : 0,
    pitch: Number.isFinite(Number(marker?.pitch)) ? Number(marker.pitch) : 0,
    fov: Number.isFinite(Number(marker?.fov)) ? Number(marker.fov) : INITIAL_FOV,
    content: marker?.content || '',
    contentHtml: getInfoMarkerContentHtml(marker),
    imageSrc: marker?.imageSrc || '',
    mediaKind,
    mediaSrc,
    mediaMimeType: mediaKind ? getInfoMarkerMediaMimeType(marker) : '',
    mediaFileName: mediaKind ? getInfoMarkerMediaFileName(marker) : '',
    mediaFile: null,
    imageAlign: getInfoMarkerImageAlign(marker),
    textAlign: getInfoMarkerTextAlign(marker),
    textVerticalAlign: getInfoMarkerTextVerticalAlign(marker),
    popupWidth: getInfoMarkerPopupWidth(marker),
    mediaSplit: getInfoMarkerMediaSplit(marker),
    previewInMarkerTab: Boolean(marker?.previewInMarkerTab),
    soundSrc,
    soundMimeType: getSoundMarkerAudioFileName(marker) ? getSoundMarkerAudioMimeType(marker) : '',
    soundFileName: getSoundMarkerAudioFileName(marker),
    soundFile: null,
    soundVolume: getSoundMarkerVolume(marker),
    soundPan: getSoundMarkerPan(marker),
    soundFocusDeg: getSoundMarkerFocusDeg(marker),
    soundLoop: shouldSoundMarkerLoop(marker),
    targetSceneId: marker?.targetSceneId || null,
    targetViewParameters: marker?.targetViewParameters ? getNormalizedViewParameters(marker.targetViewParameters) : null,
    transition: marker?.transition || 'fade',
    transitionDurationMs: getLinkMarkerTransitionDurationMs(marker),
    centerBeforeTransition: Boolean(marker?.centerBeforeTransition),
    flareColor: getLightMarkerColor(marker),
    flareRadius: getLightMarkerRadius(marker),
    flareIntensity: getLightMarkerIntensity(marker),
    ghostIntensity: getLightMarkerGhostIntensity(marker),
    createdAt: marker?.createdAt || new Date().toISOString()
  };
}

function normalizeMarkerType(type) {
  if (type === 'info' || type === 'light' || type === 'sound') {
    return type;
  }
  return 'link';
}

function isEffectMarkerType(type) {
  const markerType = normalizeMarkerType(type);
  return markerType === 'light' || markerType === 'sound';
}

function getMarkerTypeLabel(type) {
  const markerType = normalizeMarkerType(type);
  if (markerType === 'info') { return '\u24DC Media'; }
  if (markerType === 'light') { return '\u2726 Light'; }
  if (markerType === 'sound') { return '\u266B Sound'; }
  return '\uD83D\uDD17 Link';
}

function getMarkerTypeDefaultName(type, count) {
  const markerType = normalizeMarkerType(type);
  return `${markerType === 'info' ? 'Media' : markerType === 'light' ? 'Light' : markerType === 'sound' ? 'Sound' : 'Link'} ${count}`;
}

function normalizeHydratedScene(scene) {
  const hasSourceImage = Boolean(scene?.sourceImageDataUrl);

  return {
    ...scene,
    importKey: scene?.importKey || null,
    sourceImageDataUrl: scene?.sourceImageDataUrl || null,
    mapNodePosition: normalizeSceneMapNodePosition(scene?.mapNodePosition),
    ambientAudio: normalizeAmbientAudioConfig(scene?.ambientAudio),
    ambientAudioSyncTimeline: Boolean(scene?.ambientAudioSyncTimeline),
    initialViewParameters: scene.initialViewParameters || {
      yaw: 0,
      pitch: 0,
      fov: INITIAL_FOV
    },
    processed: {
      mode: hasSourceImage ? 'procesando' : (scene?.processed?.mode || 'json-sin-assets'),
      levels: Array.isArray(scene?.processed?.levels) ? scene.processed.levels : [],
      faceSize: scene?.processed?.faceSize || null,
      previewPath: scene?.processed?.previewPath || '',
      tilesBasePath: scene?.processed?.tilesBasePath || '',
      previewUrl: null,
      posterUrl: null,
      tiles: {},
      assetUrls: [],
      error: hasSourceImage ? null : (scene?.processed?.error || 'Importa otra vez las imagenes fuente para regenerar los tiles en este navegador.'),
      progress: 0,
      progressLabel: hasSourceImage
        ? 'Reconstruyendo tiles desde el JSON'
        : (scene?.processed?.progressLabel || 'Importa otra vez las imagenes fuente para regenerar los tiles.')
    }
  };
}

function releaseMarkerAssets(marker) {
  releaseInfoMarkerMediaAsset(marker);
  releaseSoundMarkerAudioAsset(marker);
  if (marker?.id && runtime.soundMarkerAudioEntries.has(marker.id)) {
    destroySoundMarkerAudioEntry(runtime.soundMarkerAudioEntries.get(marker.id));
    runtime.soundMarkerAudioEntries.delete(marker.id);
  }
}

function releaseSceneAssets(scene) {
  if (scene?.runtimeScene) {
    clearSceneMarkerHotspots(scene.runtimeScene);
  }

  if (scene?.alignmentRuntimeScene && runtime.activeAlignmentSceneInstance === scene.alignmentRuntimeScene) {
    stopLinkMarkerAlignmentPreview();
  }

  scene.runtimeScene = null;
  scene.alignmentRuntimeScene = null;

  if (!scene?.processed?.assetUrls) {
    return;
  }

  scene.processed.assetUrls.forEach((url) => URL.revokeObjectURL(url));
  scene.processed.assetUrls = [];
}


async function urlToUint8Array(url, errorMessage = 'No se pudo leer uno de los archivos del proyecto.') {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function blobUrlToUint8Array(url) {
  return urlToUint8Array(url, 'No se pudo leer uno de los tiles multires para el export.');
}


function buildPackagedIndexHtml(projectName) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(projectName)}</title>
  <link rel="stylesheet" href="app-files/style.css">
</head>
<body>
  <div class="layout">
    <main class="viewer">
      <button class="overlay-toggle" id="sceneToggle" type="button" aria-controls="sceneSidebar" aria-expanded="false">Escenas</button>
      <button class="overlay-backdrop" id="sceneBackdrop" type="button" aria-label="Cerrar lista de escenas" hidden></button>
      <aside class="sidebar" id="sceneSidebar" aria-label="Lista de escenas">
        <div class="sidebar__header">
          <div>
            <h1 id="projectTitle">${escapeHtml(projectName)}</h1>
            <p>Selecciona una escena del tour.</p>
          </div>
          <button class="sidebar__close" id="sceneClose" type="button" aria-label="Cerrar">Cerrar</button>
        </div>
        <div class="scene-list" id="sceneList"></div>
      </aside>
      <div class="topbar">
        <h2 id="sceneTitle"></h2>
        <p id="sceneMeta"></p>
      </div>
      <div class="viewer-stage">
        <div id="pano"></div>
      </div>
    </main>
  </div>
  <script src="app-files/marzipano.js"></script>
  <script src="app-files/data.js"></script>
  <script src="app-files/index.js"></script>
</body>
</html>`;
}

function buildPackagedStyleCss() {
  return `:root {
  color-scheme: dark;
  --bg: #081018;
  --panel: rgba(10, 16, 24, 0.82);
  --panel-strong: rgba(8, 12, 18, 0.92);
  --line: rgba(255,255,255,0.12);
  --text: #f4f7fb;
  --muted: rgba(244,247,251,0.72);
  --accent: #64f5c1;
  --radius: 16px;
  --shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  overflow: hidden;
  font-family: "Segoe UI", Arial, sans-serif;
  background: radial-gradient(circle at top, rgba(100,245,193,0.14), transparent 24%), linear-gradient(180deg, #081018, #05090f);
  color: var(--text);
}
.layout,
.viewer,
.viewer-stage,
#pano {
  width: 100%;
  height: 100%;
}
.layout {
  height: 100svh;
}
.viewer {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.viewer-stage {
  position: absolute;
  inset: 0;
}
#pano {
  min-height: 100svh;
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.overlay-toggle,
.sidebar__close,
.scene-button {
  font: inherit;
}
.overlay-toggle {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 4;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 10px 14px;
  background: var(--panel-strong);
  color: var(--text);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow);
  cursor: pointer;
}
.overlay-backdrop {
  position: absolute;
  inset: 0;
  z-index: 2;
  border: 0;
  background: rgba(3, 6, 10, 0.38);
}
.overlay-backdrop[hidden] {
  display: none;
}
.sidebar {
  position: absolute;
  top: 16px;
  left: 16px;
  bottom: 16px;
  z-index: 5;
  width: min(320px, calc(100vw - 32px));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow);
  overflow: hidden;
  transform: translateX(calc(-100% - 20px));
  opacity: 0;
  pointer-events: none;
  transition: transform 180ms ease, opacity 180ms ease;
}
.viewer.sidebar-open .sidebar {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}
.sidebar__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}
.sidebar h1 {
  margin: 0 0 6px;
  font-size: 1rem;
}
.sidebar p {
  margin: 0;
  color: var(--muted);
  font-size: 0.84rem;
}
.sidebar__close {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.04);
  color: var(--text);
  cursor: pointer;
}
.scene-list {
  display: grid;
  gap: 10px;
  align-content: start;
  grid-auto-rows: max-content;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}
.scene-button {
  width: 100%;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  border-radius: 12px;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease;
}
.scene-button.is-active {
  border-color: rgba(100,245,193,0.7);
  background: rgba(100,245,193,0.12);
}
.scene-button strong {
  display: block;
  font-size: 0.95rem;
}
.scene-button span {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--muted);
}
.topbar {
  position: absolute;
  top: 16px;
  left: 76px;
  z-index: 3;
  width: fit-content;
  max-width: min(440px, calc(100vw - 108px));
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(6, 10, 16, 0.68);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow);
}
.topbar h2 {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.1;
}
.topbar p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 0.76rem;
}
@media (max-width: 720px) {
  .overlay-toggle {
    top: 12px;
    left: 12px;
  }
  .sidebar {
    top: 12px;
    left: 12px;
    bottom: 12px;
    width: min(320px, calc(100vw - 24px));
  }
  .topbar {
    top: 58px;
    left: 12px;
    max-width: min(340px, calc(100vw - 24px));
  }
}
`;
}

function buildPackagedDataScript(bundle) {
  const payload = {
    projectName: bundle.projectName,
    projectAmbientAudio: bundle.projectAmbientAudio || null,
    projectAmbientAudioTransitionMs: bundle.projectAmbientAudioTransitionMs,
    projectAmbientAudioOffset: bundle.projectAmbientAudioOffset,
    projectAmbientAudioBackground: bundle.projectAmbientAudioBackground,
    previewFaceOrder: bundle.previewFaceOrder,
    minFov: bundle.minFov,
    maxFov: bundle.maxFov,
    startSceneId: bundle.startSceneId,
    scenes: bundle.scenes,
    markers: bundle.markers || []
  };

  return `var APP_DATA = ${JSON.stringify(payload, null, 2)};\n`;
}

function buildPackagedIndexScript() {
  return [
    '(function() {',
    '  function escapeText(value) {',
    '    return String(value)',
    '      .replace(/&/g, "&amp;")',
    '      .replace(/</g, "&lt;")',
    '      .replace(/>/g, "&gt;")',
    '      .replace(/"/g, "&quot;")',
    '      .replace(/\'/g, "&#39;");',
    '  }',
    '',
    '  var data = window.APP_DATA || { scenes: [] };',
    '  var viewerRoot = document.querySelector(".viewer");',
    '  var panoElement = document.getElementById("pano");',
    '  var sceneListElement = document.getElementById("sceneList");',
    '  var sceneTitleElement = document.getElementById("sceneTitle");',
    '  var sceneMetaElement = document.getElementById("sceneMeta");',
    '  var sceneToggleElement = document.getElementById("sceneToggle");',
    '  var sceneBackdropElement = document.getElementById("sceneBackdrop");',
    '  var sceneCloseElement = document.getElementById("sceneClose");',
    '  var viewer = new window.Marzipano.Viewer(panoElement, { controls: { mouseViewMode: "drag" } });',
    '',
    '  function setSidebarOpen(isOpen) {',
    '    viewerRoot.classList.toggle("sidebar-open", isOpen);',
    '    sceneToggleElement.setAttribute("aria-expanded", isOpen ? "true" : "false");',
    '    sceneBackdropElement.hidden = !isOpen;',
    '  }',
    '',
    '  if (sceneToggleElement) {',
    '    sceneToggleElement.addEventListener("click", function() {',
    '      setSidebarOpen(!viewerRoot.classList.contains("sidebar-open"));',
    '    });',
    '  }',
    '',
    '  if (sceneBackdropElement) {',
    '    sceneBackdropElement.addEventListener("click", function() {',
    '      setSidebarOpen(false);',
    '    });',
    '  }',
    '',
    '  if (sceneCloseElement) {',
    '    sceneCloseElement.addEventListener("click", function() {',
    '      setSidebarOpen(false);',
    '    });',
    '  }',
    '',
    '  window.addEventListener("keydown", function(event) {',
    '    if (event.key === "Escape") {',
    '      setSidebarOpen(false);',
    '    }',
    '  });',
    '',
    '  var scenes = data.scenes.map(function(sceneData) {',
    '    var source = new window.Marzipano.ImageUrlSource(function(tile) {',
    '      var key = String(tile.z) + "/" + tile.face + "/" + tile.y + "/" + tile.x + ".jpg";',
    '      return { url: "app-files/tiles/" + sceneData.id + "/" + key };',
    '    }, {',
    '      cubeMapPreviewUrl: "app-files/tiles/" + sceneData.id + "/preview.jpg",',
    '      cubeMapPreviewFaceOrder: data.previewFaceOrder',
    '    });',
    '    var geometry = new window.Marzipano.CubeGeometry(sceneData.levels);',
    '    var limit = window.Marzipano.RectilinearView.limit;',
    '    var resolutionLimiter = limit.resolution(sceneData.faceSize);',
    '    var verticalLimiter = limit.vfov(data.minFov || (30 * Math.PI / 180), data.maxFov || (120 * Math.PI / 180));',
    '    var horizontalLimiter = limit.hfov(data.minFov || (30 * Math.PI / 180), data.maxFov || (120 * Math.PI / 180));',
    '    var pitchLimiter = limit.pitch(-Math.PI / 2, Math.PI / 2);',
    '    var limiter = function(params) {',
    '      var next = resolutionLimiter(params);',
    '      next = verticalLimiter(next);',
    '      next = horizontalLimiter(next);',
    '      next = pitchLimiter(next);',
    '      return next;',
    '    };',
    '    var view = new window.Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);',
    '    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });',
    '    return { data: sceneData, scene: scene, view: view };',
    '  });',
    '',
    '  function renderSceneList(activeId) {',
    '    sceneListElement.innerHTML = scenes.map(function(entry) {',
    '      var activeClass = entry.data.id === activeId ? " is-active" : "";',
    '      return "" +',
    '        "<button class=\\"scene-button" + activeClass + "\\" data-scene-id=\\"" + escapeText(entry.data.id) + "\\" type=\\"button\\">" +',
    '          "<strong>" + escapeText(entry.data.name) + "</strong>" +',
    '          "<span>" + escapeText(entry.data.fileName || entry.data.id) + "</span>" +',
    '        "</button>";',
    '    }).join("");',
    '',
    '    Array.from(sceneListElement.querySelectorAll("[data-scene-id]")).forEach(function(button) {',
    '      button.addEventListener("click", function() {',
    '        var nextScene = scenes.find(function(entry) {',
    '          return entry.data.id === button.dataset.sceneId;',
    '        });',
    '        if (nextScene) {',
    '          switchScene(nextScene);',
    '          setSidebarOpen(false);',
    '        }',
    '      });',
    '    });',
    '  }',
    '',
    '  function switchScene(entry) {',
    '    entry.view.setParameters(entry.data.initialViewParameters);',
    '    entry.scene.switchTo();',
    '    sceneTitleElement.textContent = entry.data.name;',
    '    sceneMetaElement.textContent = String(entry.data.faceSize) + "px cara, " + String(entry.data.levels.length) + " nivel(es)";',
    '    renderSceneList(entry.data.id);',
    '    viewer.updateSize();',
    '  }',
    '',
    '  window.addEventListener("resize", function() { viewer.updateSize(); });',
    '  if (scenes.length) {',
    '    var initialScene = scenes.find(function(entry) { return entry.data.id === data.startSceneId; }) || scenes[0];',
    '    renderSceneList(initialScene.data.id);',
    '    switchScene(initialScene);',
    '  } else {',
    '    sceneTitleElement.textContent = "Sin escenas";',
    '    sceneMetaElement.textContent = "Este paquete no contiene escenas exportadas.";',
    '  }',
    '})();',
    ''
  ].join('\n');
}
function createStoredZip(files) {
  const encodedFiles = files.map((file) => {
    const pathBytes = encodeText(file.path.replace(/\\/g, '/'));
    const dataBytes = toUint8Array(file.data);
    const checksum = crc32(dataBytes);
    return {
      pathBytes,
      dataBytes,
      checksum,
      date: new Date()
    };
  });

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  encodedFiles.forEach((file) => {
    const timestamp = toDosDateTime(file.date);
    const localHeader = new Uint8Array(30 + file.pathBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, timestamp.time, true);
    localView.setUint16(12, timestamp.date, true);
    localView.setUint32(14, file.checksum >>> 0, true);
    localView.setUint32(18, file.dataBytes.length, true);
    localView.setUint32(22, file.dataBytes.length, true);
    localView.setUint16(26, file.pathBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(file.pathBytes, 30);
    localParts.push(localHeader, file.dataBytes);

    const centralHeader = new Uint8Array(46 + file.pathBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, timestamp.time, true);
    centralView.setUint16(14, timestamp.date, true);
    centralView.setUint32(16, file.checksum >>> 0, true);
    centralView.setUint32(20, file.dataBytes.length, true);
    centralView.setUint32(24, file.dataBytes.length, true);
    centralView.setUint16(28, file.pathBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(file.pathBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + file.dataBytes.length;
  });

  const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, encodedFiles.length, true);
  endView.setUint16(10, encodedFiles.length, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, endRecord], { type: 'application/zip' });
}

function parseStoredZipEntries(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = findStoredZipEndOffset(view, bytes.length);
  if (endOffset < 0) {
    throw new Error('No se pudo localizar el final del zip del proyecto.');
  }

  const totalEntries = view.getUint16(endOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(endOffset + 16, true);
  const entries = new Map();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('El directorio central del zip del proyecto es invalido.');
    }

    const compressionMethod = view.getUint16(offset + 10, true);
    if (compressionMethod !== 0) {
      throw new Error('Este zip usa compresion no soportada. Vuelve a guardar el proyecto desde esta app.');
    }

    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileNameStart = offset + 46;
    const fileName = decodeText(bytes.slice(fileNameStart, fileNameStart + fileNameLength));

    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
      throw new Error('Uno de los archivos del zip del proyecto tiene un encabezado invalido.');
    }

    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    entries.set(fileName, bytes.slice(dataOffset, dataOffset + compressedSize));

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findStoredZipEndOffset(view, byteLength) {
  const minimumLength = 22;
  const start = Math.max(0, byteLength - 0xffff - minimumLength);
  for (let offset = byteLength - minimumLength; offset >= start; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      return offset;
    }
  }
  return -1;
}
function toDosDateTime(date) {
  const safeDate = date instanceof Date ? date : new Date();
  const year = Math.max(1980, safeDate.getFullYear());
  const month = safeDate.getMonth() + 1;
  const day = safeDate.getDate();
  const hours = safeDate.getHours();
  const minutes = safeDate.getMinutes();
  const seconds = Math.floor(safeDate.getSeconds() / 2);

  return {
    date: ((year - 1980) << 9) | (month << 5) | day,
    time: (hours << 11) | (minutes << 5) | seconds
  };
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  return encodeText(String(value));
}

function encodeText(value) {
  return new TextEncoder().encode(value);
}

function decodeText(value) {
  return new TextDecoder().decode(value);
}

function crc32(bytes) {
  let crc = -1;
  const table = getCrc32Table();

  for (let index = 0; index < bytes.length; index += 1) {
    crc = (crc >>> 8) ^ table[(crc ^ bytes[index]) & 0xff];
  }

  return (crc ^ -1) >>> 0;
}

let crc32TableCache = null;

function getCrc32Table() {
  if (crc32TableCache) {
    return crc32TableCache;
  }

  crc32TableCache = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    crc32TableCache[index] = value >>> 0;
  }

  return crc32TableCache;
}

function downloadBlob(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadFile(fileName, content, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtml(value) {
  return escapeText(value);
}

function nextPowerOfTwo(value) {
  let power = 1;
  while (power < value) {
    power *= 2;
  }
  return power;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getNodeMapElasticAxisBounds(maxScroll) {
  const max = Math.max(0, Number(maxScroll) || 0);
  const margin = Math.min(NODE_MAP_ELASTIC_INNER_MARGIN, max / 2);
  return {
    min: 0,
    max,
    innerMin: margin,
    innerMax: max - margin,
    margin
  };
}

function getNodeMapElasticBounds() {
  if (!elements.nodeMap) {
    const emptyBounds = getNodeMapElasticAxisBounds(0);
    return { x: emptyBounds, y: emptyBounds };
  }

  return {
    x: getNodeMapElasticAxisBounds(elements.nodeMap.scrollWidth - elements.nodeMap.clientWidth),
    y: getNodeMapElasticAxisBounds(elements.nodeMap.scrollHeight - elements.nodeMap.clientHeight)
  };
}

function updateNodeMapElasticGuide() {
  if (!elements.nodeMapViewport || !elements.nodeMap) {
    return;
  }

  const bounds = getNodeMapElasticBounds();
  elements.nodeMapViewport.style.setProperty('--node-map-elastic-left', `${Math.round(bounds.x.margin)}px`);
  elements.nodeMapViewport.style.setProperty('--node-map-elastic-right', `${Math.round(bounds.x.margin)}px`);
  elements.nodeMapViewport.style.setProperty('--node-map-elastic-top', `${Math.round(bounds.y.margin)}px`);
  elements.nodeMapViewport.style.setProperty('--node-map-elastic-bottom', `${Math.round(bounds.y.margin)}px`);
}

function getNodeMapElasticRawLimit(bounds) {
  if (!bounds || bounds.margin <= 0) {
    return 0;
  }

  return (bounds.margin * 2) / (1 + NODE_MAP_ELASTIC_MIN_DRAG_FACTOR);
}

function clampNodeMapElasticVirtual(virtualPosition, bounds) {
  if (!Number.isFinite(virtualPosition) || !bounds) {
    return 0;
  }

  const rawLimit = getNodeMapElasticRawLimit(bounds);
  return clamp(virtualPosition, bounds.innerMin - rawLimit, bounds.innerMax + rawLimit);
}

function getNodeMapElasticVisiblePull(rawPull, bounds) {
  if (!bounds || bounds.margin <= 0) {
    return 0;
  }

  const rawLimit = getNodeMapElasticRawLimit(bounds);
  const pull = clamp(rawPull, 0, rawLimit);
  const curve = (1 - NODE_MAP_ELASTIC_MIN_DRAG_FACTOR) / (2 * rawLimit);
  return clamp(pull - (curve * pull * pull), 0, bounds.margin);
}

function getNodeMapElasticRawPullFromVisible(visiblePull, bounds) {
  if (!bounds || bounds.margin <= 0) {
    return 0;
  }

  const pull = clamp(visiblePull, 0, bounds.margin);
  const rawLimit = getNodeMapElasticRawLimit(bounds);
  const curve = (1 - NODE_MAP_ELASTIC_MIN_DRAG_FACTOR) / (2 * rawLimit);
  if (curve <= 0) {
    return pull;
  }

  const discriminant = Math.max(0, 1 - (4 * curve * pull));
  return clamp((1 - Math.sqrt(discriminant)) / (2 * curve), 0, rawLimit);
}

function getNodeMapElasticScrollFromVirtual(virtualPosition, bounds) {
  if (!Number.isFinite(virtualPosition) || !bounds || bounds.margin <= 0) {
    return clamp(virtualPosition || 0, bounds?.min || 0, bounds?.max || 0);
  }

  if (virtualPosition < bounds.innerMin) {
    return bounds.innerMin - getNodeMapElasticVisiblePull(bounds.innerMin - virtualPosition, bounds);
  }
  if (virtualPosition > bounds.innerMax) {
    return bounds.innerMax + getNodeMapElasticVisiblePull(virtualPosition - bounds.innerMax, bounds);
  }

  return clamp(virtualPosition, bounds.min, bounds.max);
}

function getNodeMapElasticVirtualFromScroll(scrollPosition, bounds) {
  if (!Number.isFinite(scrollPosition) || !bounds || bounds.margin <= 0) {
    return clamp(scrollPosition || 0, bounds?.min || 0, bounds?.max || 0);
  }

  if (scrollPosition < bounds.innerMin) {
    return bounds.innerMin - getNodeMapElasticRawPullFromVisible(bounds.innerMin - scrollPosition, bounds);
  }
  if (scrollPosition > bounds.innerMax) {
    return bounds.innerMax + getNodeMapElasticRawPullFromVisible(scrollPosition - bounds.innerMax, bounds);
  }

  return clamp(scrollPosition, bounds.min, bounds.max);
}

function getNodeMapElasticReturnTarget(position, bounds) {
  if (bounds.margin <= 0) {
    return clamp(position, bounds.min, bounds.max);
  }
  if (position < bounds.innerMin) {
    return bounds.innerMin;
  }
  if (position > bounds.innerMax) {
    return bounds.innerMax;
  }
  return position;
}

function clampNodeMapScrollToStableBounds(position, bounds) {
  if (bounds.margin <= 0) {
    return clamp(position, bounds.min, bounds.max);
  }

  return clamp(position, bounds.innerMin, bounds.innerMax);
}

function getNodeMapFocusScrollTarget() {
  if (!elements.nodeMap || !state.scenes.length) {
    return null;
  }

  const scene = state.scenes.find((entry) => entry.id === state.activeSceneId) || state.scenes[0];
  const sceneIndex = state.scenes.findIndex((entry) => entry.id === scene.id);
  const bounds = getNodeMapSceneBounds(scene, sceneIndex);
  const zoom = getNodeMapZoom();

  return {
    left: ((bounds.x + (runtime.nodeMapRenderOffsetX || 0) + (bounds.width / 2)) * zoom) - (elements.nodeMap.clientWidth / 2),
    top: ((bounds.y + (runtime.nodeMapRenderOffsetY || 0) + (bounds.height / 2)) * zoom) - (elements.nodeMap.clientHeight / 2)
  };
}

function getNodeMapSceneScrollTarget(sceneId, options = {}) {
  if (!elements.nodeMap || !sceneId) {
    return null;
  }

  const scene = state.scenes.find((entry) => entry.id === sceneId);
  if (!scene) {
    return null;
  }

  const sceneIndex = state.scenes.findIndex((entry) => entry.id === scene.id);
  const bounds = getNodeMapSceneBounds(scene, sceneIndex);
  const zoom = getNodeMapZoom();
  const horizontalAnchor = options.horizontalAnchor ?? 0.72;
  const verticalAnchor = options.verticalAnchor ?? 0.5;

  return {
    left: ((bounds.x + (runtime.nodeMapRenderOffsetX || 0) + (bounds.width / 2)) * zoom) - (elements.nodeMap.clientWidth * horizontalAnchor),
    top: ((bounds.y + (runtime.nodeMapRenderOffsetY || 0) + (bounds.height / 2)) * zoom) - (elements.nodeMap.clientHeight * verticalAnchor)
  };
}

function scheduleCompactNodeMapTutorialPan(sceneId) {
  if (!isCompactLayout() || !sceneId) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (state.activeTab !== 'mapa' || !elements.nodeMap) {
      return;
    }

    const target = getNodeMapSceneScrollTarget(sceneId, { horizontalAnchor: 0.72, verticalAnchor: 0.5 });
    if (!target) {
      return;
    }

    const bounds = getNodeMapElasticBounds();
    elements.nodeMap.scrollLeft = clampNodeMapScrollToStableBounds(target.left, bounds.x);
    elements.nodeMap.scrollTop = clampNodeMapScrollToStableBounds(target.top, bounds.y);

    if (runtime.tutorial !== null) {
      window.requestAnimationFrame(updateTutorialPresentation);
    }
  });
}

function getNodeMapCenterOfMassScrollTarget() {
  if (!elements.nodeMap || !state.scenes.length) {
    return null;
  }

  const zoom = getNodeMapZoom();
  const centerSum = state.scenes.reduce((sum, scene, index) => {
    const bounds = getNodeMapSceneBounds(scene, index);
    return {
      x: sum.x + bounds.x + (bounds.width / 2),
      y: sum.y + bounds.y + (bounds.height / 2)
    };
  }, { x: 0, y: 0 });
  const centerX = centerSum.x / state.scenes.length;
  const centerY = centerSum.y / state.scenes.length;

  return {
    left: ((centerX + (runtime.nodeMapRenderOffsetX || 0)) * zoom) - (elements.nodeMap.clientWidth / 2),
    top: ((centerY + (runtime.nodeMapRenderOffsetY || 0)) * zoom) - (elements.nodeMap.clientHeight / 2)
  };
}

function alignNodeMapToStableBounds(options = {}) {
  if (!elements.nodeMap) {
    return;
  }

  const { focusContent = false } = options;
  const bounds = getNodeMapElasticBounds();
  const focusTarget = focusContent ? getNodeMapFocusScrollTarget() : null;
  elements.nodeMap.scrollLeft = focusTarget
    ? clampNodeMapScrollToStableBounds(focusTarget.left, bounds.x)
    : getNodeMapElasticReturnTarget(elements.nodeMap.scrollLeft, bounds.x);
  elements.nodeMap.scrollTop = focusTarget
    ? clampNodeMapScrollToStableBounds(focusTarget.top, bounds.y)
    : getNodeMapElasticReturnTarget(elements.nodeMap.scrollTop, bounds.y);
}

function stopNodeMapHomePan() {
  if (runtime.nodeMapHomePanFrame) {
    cancelAnimationFrame(runtime.nodeMapHomePanFrame);
    runtime.nodeMapHomePanFrame = 0;
  }
}

function smoothPanNodeMapTo(left, top, duration = NODE_MAP_HOME_PAN_MS) {
  if (!elements.nodeMap) {
    return;
  }

  stopNodeMapHomePan();
  stopNodeMapElasticReturn();

  const bounds = getNodeMapElasticBounds();
  const startLeft = elements.nodeMap.scrollLeft;
  const startTop = elements.nodeMap.scrollTop;
  const targetLeft = clampNodeMapScrollToStableBounds(left, bounds.x);
  const targetTop = clampNodeMapScrollToStableBounds(top, bounds.y);
  const distance = Math.hypot(targetLeft - startLeft, targetTop - startTop);
  if (distance < 0.5) {
    elements.nodeMap.scrollLeft = targetLeft;
    elements.nodeMap.scrollTop = targetTop;
    return;
  }

  const startTime = performance.now();
  const step = (timestamp) => {
    if (runtime.nodeMapDrag || runtime.nodeMapPan) {
      runtime.nodeMapHomePanFrame = 0;
      return;
    }

    const progress = easeOutCubic((timestamp - startTime) / duration);
    elements.nodeMap.scrollLeft = startLeft + ((targetLeft - startLeft) * progress);
    elements.nodeMap.scrollTop = startTop + ((targetTop - startTop) * progress);

    if (progress >= 1) {
      elements.nodeMap.scrollLeft = targetLeft;
      elements.nodeMap.scrollTop = targetTop;
      runtime.nodeMapHomePanFrame = 0;
      return;
    }

    runtime.nodeMapHomePanFrame = requestAnimationFrame(step);
  };

  runtime.nodeMapHomePanFrame = requestAnimationFrame(step);
}

function centerNodeMapOnNodeMass() {
  const target = getNodeMapCenterOfMassScrollTarget();
  if (!target) {
    return;
  }

  smoothPanNodeMapTo(target.left, target.top);
}

function maybeAlignNodeMapToStableBounds() {
  if (!runtime.nodeMapNeedsStableScroll || state.activeTab !== 'mapa') {
    return;
  }

  runtime.nodeMapNeedsStableScroll = false;
  stopNodeMapElasticReturn();
  window.requestAnimationFrame(() => {
    alignNodeMapToStableBounds({ focusContent: true });
  });
}

function stopNodeMapElasticReturn() {
  if (runtime.nodeMapElasticReturnFrame) {
    cancelAnimationFrame(runtime.nodeMapElasticReturnFrame);
    runtime.nodeMapElasticReturnFrame = 0;
  }
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - clamp(progress, 0, 1), 3);
}

function startNodeMapElasticReturn() {
  if (!elements.nodeMap) {
    return;
  }

  stopNodeMapElasticReturn();

  const bounds = getNodeMapElasticBounds();
  const startLeft = elements.nodeMap.scrollLeft;
  const startTop = elements.nodeMap.scrollTop;
  const targetLeft = getNodeMapElasticReturnTarget(startLeft, bounds.x);
  const targetTop = getNodeMapElasticReturnTarget(startTop, bounds.y);
  const distance = Math.hypot(targetLeft - startLeft, targetTop - startTop);
  if (distance < 0.5) {
    elements.nodeMap.scrollLeft = targetLeft;
    elements.nodeMap.scrollTop = targetTop;
    return;
  }

  const maxDistance = Math.max(1, Math.hypot(bounds.x.margin, bounds.y.margin));
  const distanceProgress = clamp(distance / maxDistance, 0, 1);
  const duration = NODE_MAP_ELASTIC_RETURN_MAX_MS - ((NODE_MAP_ELASTIC_RETURN_MAX_MS - NODE_MAP_ELASTIC_RETURN_MIN_MS) * distanceProgress);
  const startTime = performance.now();

  const step = (timestamp) => {
    if (runtime.nodeMapPan) {
      runtime.nodeMapElasticReturnFrame = 0;
      return;
    }

    const progress = easeOutCubic((timestamp - startTime) / duration);
    elements.nodeMap.scrollLeft = startLeft + ((targetLeft - startLeft) * progress);
    elements.nodeMap.scrollTop = startTop + ((targetTop - startTop) * progress);

    if (progress >= 1) {
      elements.nodeMap.scrollLeft = targetLeft;
      elements.nodeMap.scrollTop = targetTop;
      runtime.nodeMapElasticReturnFrame = 0;
      return;
    }

    runtime.nodeMapElasticReturnFrame = requestAnimationFrame(step);
  };

  runtime.nodeMapElasticReturnFrame = requestAnimationFrame(step);
}

function mod(value, length) {
  return ((value % length) + length) % length;
}

function pauseForFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

init();







async function dataUrlToFile(dataUrl, fileName, mimeType) {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('No se pudo leer la imagen embebida del proyecto.');
  }

  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType || blob.type || 'image/jpeg' });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}





























































