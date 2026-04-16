(function() {
  var LINK_MARKER_CENTER_TRANSITION_MS = 420;
  var LIGHT_MARKER_DEFAULT_COLOR = '#ffd26a';
  var LIGHT_MARKER_DEFAULT_RADIUS = 84;
  var LIGHT_MARKER_DEFAULT_INTENSITY = 1;
  var LIGHT_MARKER_DEFAULT_GHOST_INTENSITY = 0.6;
  var SOUND_MARKER_DEFAULT_VOLUME = 0.72;
  var SOUND_MARKER_DEFAULT_PAN = 0.85;
  var SOUND_MARKER_DEFAULT_FOCUS_DEG = 96;
  var SOUND_MARKER_SCENE_TRANSITION_MS = 1000;
  var DEFAULT_LINK_MARKER_TRANSITION_MS = 1000;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeText(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeMarkerType(type) {
    if (type === 'info' || type === 'light' || type === 'sound') { return type; }
    return 'link';
  }

  function getMarkerTypeBadge(type) {
    var markerType = normalizeMarkerType(type);
    if (markerType === 'info') { return '\u24DC'; }
    if (markerType === 'light') { return '\u2726'; }
    if (markerType === 'sound') { return '\u266B'; }
    return '\u27A4';
  }

  function normalizeInfoMarkerText(value) {
    return typeof value === 'string' ? value.replace(/\r\n?/g, '\n') : '';
  }

  function stripInfoMarkerHtmlToText(html) {
    if (typeof html !== 'string' || !html.trim()) {
      return '';
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
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

    var tagName = node.tagName.toLowerCase();
    var allowedInlineTags = new Set(['strong', 'b', 'em', 'i', 'u', 's', 'span']);
    var childHtml = Array.from(node.childNodes).map(function(child) { return normalizeInlineInfoMarkerNode(child); }).join('');
    if (!allowedInlineTags.has(tagName)) {
      return childHtml;
    }

    var normalizedTag = tagName === 'b' ? 'strong' : (tagName === 'i' ? 'em' : tagName);
    return '<' + normalizedTag + '>' + childHtml + '</' + normalizedTag + '>';
  }

  function sanitizeInfoMarkerRichTextHtml(htmlValue, fallbackText) {
    var html = typeof htmlValue === 'string' ? htmlValue : '';
    var fallback = normalizeInfoMarkerText(fallbackText);
    if (!html.trim()) {
      return fallback
        ? fallback.split('\n').map(function(line) { return '<p>' + (line ? escapeInfoMarkerHtml(line) : '<br>') + '</p>'; }).join('')
        : '';
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    var blocks = [];

    Array.from(doc.body.childNodes).forEach(function(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = normalizeInfoMarkerText(node.textContent || '');
        text.split('\n').forEach(function(line) {
          blocks.push('<p>' + (line ? escapeInfoMarkerHtml(line) : '<br>') + '</p>');
        });
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      var tagName = node.tagName.toLowerCase();
      if (tagName === 'p' || tagName === 'div') {
        var blockHtml = Array.from(node.childNodes).map(function(child) { return normalizeInlineInfoMarkerNode(child); }).join('');
        blocks.push('<p>' + (blockHtml || '<br>') + '</p>');
        return;
      }

      if (tagName === 'ul' || tagName === 'ol') {
        var items = Array.from(node.children)
          .filter(function(child) { return child.tagName && child.tagName.toLowerCase() === 'li'; })
          .map(function(child) {
            return '<li>' + Array.from(child.childNodes).map(function(grandChild) { return normalizeInlineInfoMarkerNode(grandChild); }).join('') + '</li>';
          })
          .join('');
        if (items) {
          blocks.push('<' + tagName + '>' + items + '</' + tagName + '>');
        }
        return;
      }

      var inlineContent = normalizeInlineInfoMarkerNode(node);
      if (inlineContent) {
        blocks.push('<p>' + inlineContent + '</p>');
      }
    });

    return blocks.join('');
  }

  function getInfoMarkerContentHtml(marker) {
    return sanitizeInfoMarkerRichTextHtml(marker && marker.contentHtml, marker && marker.content);
  }

  function getInfoMarkerMediaKind(marker) {
    var kind = marker && marker.mediaKind;
    if (kind === 'image' || kind === 'video' || kind === 'audio') {
      return kind;
    }
    return marker && marker.imageSrc ? 'image' : '';
  }

  function getInfoMarkerMediaSrc(marker) {
    if (marker && marker.mediaSrc) {
      return marker.mediaSrc;
    }
    return marker && marker.imageSrc ? marker.imageSrc : '';
  }

  function getInfoMarkerMediaFileName(marker) {
    return marker && marker.mediaFileName ? String(marker.mediaFileName) : '';
  }

  function getInfoMarkerDisplayText(marker) {
    var text = stripInfoMarkerHtmlToText(getInfoMarkerContentHtml(marker)).trim();
    if (text) {
      return text;
    }
    if (getInfoMarkerMediaKind(marker) && getInfoMarkerMediaSrc(marker)) {
      return '';
    }
    if (getInfoMarkerMediaKind(marker)) {
      var mediaLabel = getInfoMarkerMediaFileName(marker);
      return mediaLabel
        ? 'El contenido "' + mediaLabel + '" no esta disponible en esta sesion.'
        : 'El contenido multimedia no esta disponible en esta sesion.';
    }
    return 'Todavia no hay contenido.';
  }

  function getInfoMarkerPopupWidth(marker) {
    return clamp(Number(marker && marker.popupWidth) || 320, 220, 520);
  }

  function getInfoMarkerMediaSplit(marker) {
    return clamp(Number(marker && marker.mediaSplit) || 0.38, 0, 1);
  }

  function getResponsiveInfoMarkerPopupWidth(marker, viewerWidth) {
    var preferredWidth = getInfoMarkerPopupWidth(marker);
    var safeViewerWidth = Number(viewerWidth) || preferredWidth;
    var maxWidth = Math.max(220, safeViewerWidth - 32);
    var scale = clamp(safeViewerWidth / 1280, 0.72, 1.3);
    return clamp(preferredWidth * scale, 220, maxWidth);
  }

  function getInfoMarkerTextAlign(marker) {
    return ['left', 'center', 'right'].includes(marker && marker.textAlign) ? marker.textAlign : 'left';
  }

  function getInfoMarkerImageAlign(marker) {
    return ['top', 'right', 'bottom', 'left'].includes(marker && marker.imageAlign) ? marker.imageAlign : 'top';
  }

  function getInfoMarkerTextVerticalAlign(marker) {
    return ['top', 'center', 'bottom'].includes(marker && marker.textVerticalAlign) ? marker.textVerticalAlign : 'top';
  }

  function renderInfoMarkerContent(container, marker) {
    if (!container) {
      return;
    }

    container.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'info-marker-rich';
    wrapper.dataset.imageAlign = getInfoMarkerImageAlign(marker);

    var mediaKind = getInfoMarkerMediaKind(marker);
    var mediaSrc = getInfoMarkerMediaSrc(marker);
    if (mediaKind && mediaSrc) {
      var mediaElement = null;
      if (mediaKind === 'video') {
        var video = document.createElement('video');
        video.className = 'info-marker-rich__media info-marker-rich__media--video';
        video.src = mediaSrc;
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        mediaElement = video;
      } else if (mediaKind === 'audio') {
        var audio = document.createElement('audio');
        audio.className = 'info-marker-rich__media info-marker-rich__media--audio';
        audio.src = mediaSrc;
        audio.controls = true;
        audio.preload = 'metadata';
        mediaElement = audio;
      } else {
        var image = document.createElement('img');
        image.className = 'info-marker-rich__media info-marker-rich__media--image';
        image.src = mediaSrc;
        image.alt = marker.name || 'Contenido del marcador';
        mediaElement = image;
      }
      wrapper.appendChild(mediaElement);
    }

    var contentHtml = getInfoMarkerContentHtml(marker);
      var fallbackText = getInfoMarkerDisplayText(marker);
      var hasTextContent = Boolean(contentHtml || fallbackText);
      var hasMediaContent = Boolean(mediaKind && mediaSrc);
      wrapper.dataset.hasSplit = hasTextContent && hasMediaContent ? 'true' : 'false';
      if (hasTextContent && hasMediaContent) {
        wrapper.style.setProperty('--info-media-split', (getInfoMarkerMediaSplit(marker) * 100) + '%');
      } else {
        wrapper.style.removeProperty('--info-media-split');
      }
      if (contentHtml || fallbackText) {
      var text = document.createElement('div');
      text.className = 'info-marker-rich__text';
      text.dataset.textAlign = getInfoMarkerTextAlign(marker);
      text.dataset.textVerticalAlign = getInfoMarkerTextVerticalAlign(marker);
      text.innerHTML = contentHtml || '<p>' + escapeInfoMarkerHtml(fallbackText) + '</p>';
      wrapper.appendChild(text);
    }
    container.appendChild(wrapper);
  }

  function normalizeLightHexColor(value) {
    var normalized = String(value || '').trim().match(/^#?([0-9a-fA-F]{6})$/);
    return normalized ? '#' + normalized[1].toLowerCase() : LIGHT_MARKER_DEFAULT_COLOR;
  }

  function getLightMarkerColor(marker) { return normalizeLightHexColor(marker && marker.flareColor); }
  function getLightMarkerRadius(marker) { var value = Number(marker && marker.flareRadius); return clamp(Number.isFinite(value) ? value : LIGHT_MARKER_DEFAULT_RADIUS, 20, 320); }
  function getLightMarkerIntensity(marker) { var value = Number(marker && marker.flareIntensity); return clamp(Number.isFinite(value) ? value : LIGHT_MARKER_DEFAULT_INTENSITY, 0, 1); }
  function getLightMarkerGhostIntensity(marker) { var value = Number(marker && marker.ghostIntensity); return clamp(Number.isFinite(value) ? value : LIGHT_MARKER_DEFAULT_GHOST_INTENSITY, 0, 1); }
  function getLightMarkerRgbString(marker) {
    var hex = getLightMarkerColor(marker).slice(1);
    return parseInt(hex.slice(0, 2), 16) + ', ' + parseInt(hex.slice(2, 4), 16) + ', ' + parseInt(hex.slice(4, 6), 16);
  }

  function hexToRgba(hex, alpha) {
    var normalized = normalizeLightHexColor(hex).slice(1);
    var red = parseInt(normalized.slice(0, 2), 16);
    var green = parseInt(normalized.slice(2, 4), 16);
    var blue = parseInt(normalized.slice(4, 6), 16);
    return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + clamp(Number(alpha) || 0, 0, 1) + ')';
  }

  function createLightFlareElement(marker, x, y, reflectedX, reflectedY) {
    var markerElement = document.createElement('div');
    markerElement.className = 'viewer-light-marker';
    markerElement.style.left = String(x) + 'px';
    markerElement.style.top = String(y) + 'px';
    markerElement.style.width = '140px';
    markerElement.style.height = '140px';
    markerElement.style.marginLeft = '-70px';
    markerElement.style.marginTop = '-70px';

    var flare = document.createElement('div');
    flare.className = 'viewer-light';
    flare.innerHTML = '<div class="viewer-light__flare"><div class="viewer-light__core"></div><div class="viewer-light__ring"></div><div class="viewer-light__ghost"></div><div class="viewer-light__axis"></div></div><div class="viewer-light__artifact" data-artifact-factor="0.32" data-artifact-size="0.34"></div><div class="viewer-light__artifact is-ring" data-artifact-factor="0.78" data-artifact-size="0.48"></div><div class="viewer-light__artifact" data-artifact-factor="1.14" data-artifact-size="0.22"></div>';
    markerElement.appendChild(flare);

    var color = getLightMarkerColor(marker);
    var radius = getLightMarkerRadius(marker);
    var scale = radius / LIGHT_MARKER_DEFAULT_RADIUS;
    var intensity = clamp(getLightMarkerIntensity(marker), 0, 1);
    var ghostIntensity = clamp(getLightMarkerGhostIntensity(marker), 0, 1);
    var colorRgba = hexToRgba(color, 0.92);
    var artifactRgba = hexToRgba(color, 0.7);
    var centerX = (reflectedX + x) * 0.5;
    var centerY = (reflectedY + y) * 0.5;
    var localViewerCenter = {
      x: (centerX - x) + 70,
      y: (centerY - y) + 70
    };
    var localAnchorCenter = { x: 70, y: 70 };
    var distance = Math.hypot(x - centerX, y - centerY);
    var distanceRatio = Math.min(1.6, distance / Math.max(viewerStageElement ? viewerStageElement.clientWidth : 1, viewerStageElement ? viewerStageElement.clientHeight : 1, 1));

    var flareElement = flare.querySelector('.viewer-light__flare');
    if (flareElement) {
      flareElement.style.setProperty('--flare-opacity', String(intensity));
      flareElement.style.setProperty('--flare-color', colorRgba);
      flareElement.style.setProperty('--flare-axis-color', hexToRgba(color, 0.7));
      flareElement.style.setProperty('--flare-axis-soft-color', hexToRgba(color, 0.42));
      flareElement.style.setProperty('--flare-axis-shadow', hexToRgba(color, 0.16));
      flareElement.style.transform = 'scale(' + scale + ')';
      flareElement.style.transformOrigin = '50% 50%';
    }

    Array.prototype.forEach.call(flare.querySelectorAll('.viewer-light__artifact'), function(artifact) {
      var factor = Number(artifact.dataset.artifactFactor) || 0.5;
      var sizeFactor = Number(artifact.dataset.artifactSize) || 0.3;
      var artifactCenter = {
        x: localViewerCenter.x - ((localAnchorCenter.x - localViewerCenter.x) * factor),
        y: localViewerCenter.y - ((localAnchorCenter.y - localViewerCenter.y) * factor)
      };
      var artifactSize = Math.max(20, (140 * scale) * sizeFactor * (0.86 + distanceRatio));
      artifact.style.left = String(artifactCenter.x) + 'px';
      artifact.style.top = String(artifactCenter.y) + 'px';
      artifact.style.setProperty('--artifact-size', String(artifactSize) + 'px');
      artifact.style.setProperty('--flare-color', artifactRgba);
      artifact.style.setProperty('--artifact-opacity', String(ghostIntensity));
    });

    var ghost = flare.querySelector('.viewer-light__ghost');
    if (ghost) {
      var ghostX = localViewerCenter.x - ((localAnchorCenter.x - localViewerCenter.x) * 0.58);
      var ghostY = localViewerCenter.y - ((localAnchorCenter.y - localViewerCenter.y) * 0.58);
      ghost.style.transform = 'translate(' + (ghostX - localAnchorCenter.x).toFixed(2) + 'px, ' + (ghostY - localAnchorCenter.y).toFixed(2) + 'px) scale(' + (0.58 + (distanceRatio * 0.08)).toFixed(3) + ')';
      ghost.style.opacity = String(ghostIntensity);
    }

    return markerElement;
  }

  var data = window.APP_DATA || { scenes: [], markers: [] };
  var viewerRoot = document.querySelector('.viewer');
  var viewerStageElement = document.getElementById('viewerStage');
  var panoElement = document.getElementById('pano');
  var infoMarkerDisplayElement = document.getElementById('infoMarkerDisplay');
  var infoMarkerDisplayBodyElement = document.getElementById('infoMarkerDisplayBody');
  var sceneListElement = document.getElementById('sceneList');
  var sceneTitleElement = document.getElementById('sceneTitle');
  var sceneToggleElement = document.getElementById('sceneToggle');
  var viewerSettingsToggleElement = document.getElementById('viewerSettingsToggle');
  var viewerSettingsPanelElement = document.getElementById('viewerSettingsPanel');
  var viewerSettingsVolumeElement = document.getElementById('viewerSettingsVolume');
  var viewerSettingsMuteElement = document.getElementById('viewerSettingsMute');
  var viewerSettingsStatusElement = document.getElementById('viewerSettingsStatus');
  var fullscreenToggleElement = document.getElementById('fullscreenToggle');
  var sceneBackdropElement = document.getElementById('sceneBackdrop');
  var sceneCloseElement = document.getElementById('sceneClose');
  var viewer = new window.Marzipano.Viewer(panoElement, { controls: { mouseViewMode: 'drag' } });
  var lightOverlayElement = document.createElement('div');
  lightOverlayElement.className = 'viewer-stage__lights';
  lightOverlayElement.hidden = true;
  if (viewerStageElement) { viewerStageElement.appendChild(lightOverlayElement); }
  var markers = Array.isArray(data.markers) ? data.markers.slice() : [];
  var activeSceneEntry = null;
  var pinnedInfoMarkerId = null;
  var hoveredInfoMarkerId = null;
  var infoDisplayPlacement = 'top';
  var infoDisplayPlacementShiftTimer = null;
  var DEFAULT_AMBIENT_AUDIO_TRANSITION_MS = 900;
  var DEFAULT_AMBIENT_AUDIO_OFFSET = 0;
  var ambientAudioElement = null;
  var ambientAudioKey = '';
  var ambientAudioBaseVolume = 0.55;
  var ambientAudioTransition = null;
  var projectBackgroundAudioElement = null;
  var projectBackgroundAudioKey = '';
  var projectAudioTimelineStartedAtMs = null;
  var ambientVolume = 1;
  var ambientMuted = false;
  var settingsOpen = false;
  var soundMarkerAudioContext = null;
  var soundMarkerAudioEntries = new Map();
  var soundMarkerRetiringAudioEntries = new Set();
  var soundMarkerSceneTransition = null;
  var soundMarkerFreezeSceneId = null;
  var soundMarkerAudioUnlockBound = false;

  function clearInfoMarkerPlacementShift() {
    if (infoDisplayPlacementShiftTimer) {
      window.clearTimeout(infoDisplayPlacementShiftTimer);
      infoDisplayPlacementShiftTimer = null;
    }
    if (!infoMarkerDisplayElement) {
      return;
    }
    infoMarkerDisplayElement.classList.remove('is-placement-shifting');
    infoMarkerDisplayElement.style.setProperty('--info-placement-shift-x', '0px');
    infoMarkerDisplayElement.style.setProperty('--info-placement-shift-y', '0px');
  }

  function animateInfoMarkerPlacementShift(previousPlacement, nextPlacement, previousLeft, previousTop, nextLeft, nextTop) {
    if (!infoMarkerDisplayElement || previousPlacement === nextPlacement || infoMarkerDisplayElement.hidden) {
      return;
    }

    if (!Number.isFinite(previousLeft) || !Number.isFinite(previousTop) || !Number.isFinite(nextLeft) || !Number.isFinite(nextTop)) {
      return;
    }

    var shiftX = previousLeft - nextLeft;
    var shiftY = previousTop - nextTop;
    if (Math.abs(shiftX) < 0.5 && Math.abs(shiftY) < 0.5) {
      return;
    }

    clearInfoMarkerPlacementShift();
    infoMarkerDisplayElement.style.setProperty('--info-placement-shift-x', shiftX + 'px');
    infoMarkerDisplayElement.style.setProperty('--info-placement-shift-y', shiftY + 'px');
    void infoMarkerDisplayElement.offsetWidth;
    infoMarkerDisplayElement.classList.add('is-placement-shifting');
    requestAnimationFrame(function() {
      infoMarkerDisplayElement.style.setProperty('--info-placement-shift-x', '0px');
      infoMarkerDisplayElement.style.setProperty('--info-placement-shift-y', '0px');
    });
    infoDisplayPlacementShiftTimer = window.setTimeout(function() {
      clearInfoMarkerPlacementShift();
    }, 340);
  }

  function showInfoMarkerDisplay() {
    if (!infoMarkerDisplayElement) {
      return;
    }

    infoMarkerDisplayElement.hidden = false;
    requestAnimationFrame(function() {
      infoMarkerDisplayElement.classList.add('is-visible');
    });
  }

  function hideInfoMarkerDisplay(immediate) {
    if (!infoMarkerDisplayElement) {
      return;
    }

    clearInfoMarkerPlacementShift();
    infoMarkerDisplayElement.classList.remove('is-visible');
    if (immediate) {
      infoMarkerDisplayElement.hidden = true;
    }
  }

  function getDisplayedInfoMarker() {
    var markerId = pinnedInfoMarkerId || hoveredInfoMarkerId;
    if (!markerId || !activeSceneEntry) {
      return null;
    }

    return markers.find(function(marker) {
      return marker.id === markerId && marker.sceneId === activeSceneEntry.data.id;
    }) || null;
  }

  function updateInfoMarkerDisplayPosition(marker) {
    if (!activeSceneEntry || !viewerStageElement || !infoMarkerDisplayElement) {
      hideInfoMarkerDisplay(true);
      return;
    }

    var activeMarker = marker || getDisplayedInfoMarker();
    if (!activeMarker) {
      hideInfoMarkerDisplay(true);
      return;
    }

    var screenPosition = activeSceneEntry.view.coordinatesToScreen({ yaw: activeMarker.yaw, pitch: activeMarker.pitch }, {});
    var hasScreenPosition = screenPosition && Number.isFinite(screenPosition.x) && Number.isFinite(screenPosition.y);
    if (!hasScreenPosition) {
      hideInfoMarkerDisplay(true);
      return;
    }

    var viewerRect = viewerStageElement.getBoundingClientRect();
    var hotspotInViewer = screenPosition.x >= 0 && screenPosition.x <= viewerRect.width && screenPosition.y >= 0 && screenPosition.y <= viewerRect.height;
    if (!hotspotInViewer) {
      hideInfoMarkerDisplay(true);
      return;
    }

    var popupWidth = getResponsiveInfoMarkerPopupWidth(activeMarker, viewerRect.width);
    var popupWasVisible = !infoMarkerDisplayElement.hidden && infoMarkerDisplayElement.classList.contains('is-visible');
    var previousDisplayRect = popupWasVisible ? infoMarkerDisplayElement.getBoundingClientRect() : null;
    infoMarkerDisplayElement.style.width = popupWidth + 'px';
    showInfoMarkerDisplay();

    var popupHeight = infoMarkerDisplayElement.offsetHeight || 180;
    var gap = 18;
    var edgePadding = 20;
    var connectorInset = 10;
    var placementHitboxPadding = gap + connectorInset + 10;
    var verticalPlacementSafetyMargin = 64;
    var horizontalPlacementSafetyMargin = 44;
    var popupOffset = 18;
    var spaceAbove = screenPosition.y - edgePadding - gap;
    var spaceBelow = viewerRect.height - screenPosition.y - edgePadding - gap;
    var spaceLeft = screenPosition.x - edgePadding - gap;
    var spaceRight = viewerRect.width - screenPosition.x - edgePadding - gap;
    var preferredSidePlacement = screenPosition.x <= (viewerRect.width / 2) ? 'right' : 'left';
    var fallbackSidePlacement = preferredSidePlacement === 'right' ? 'left' : 'right';
    var canUseVerticalPlacement = screenPosition.x >= edgePadding + verticalPlacementSafetyMargin
      && screenPosition.x <= viewerRect.width - edgePadding - verticalPlacementSafetyMargin;
    var canUseHorizontalPlacement = screenPosition.y >= edgePadding + horizontalPlacementSafetyMargin
      && screenPosition.y <= viewerRect.height - edgePadding - horizontalPlacementSafetyMargin;
    var topFits = canUseVerticalPlacement && spaceAbove >= (popupHeight + placementHitboxPadding);
    var bottomFits = canUseVerticalPlacement && spaceBelow >= (popupHeight + placementHitboxPadding);
    var preferredSideFits = canUseHorizontalPlacement && (preferredSidePlacement === 'right'
      ? spaceRight >= (popupWidth + placementHitboxPadding)
      : spaceLeft >= (popupWidth + placementHitboxPadding));
    var fallbackSideFits = canUseHorizontalPlacement && (fallbackSidePlacement === 'right'
      ? spaceRight >= (popupWidth + placementHitboxPadding)
      : spaceLeft >= (popupWidth + placementHitboxPadding));

    var placement = 'top';
    if (topFits) {
      placement = 'top';
    } else if (bottomFits) {
      placement = 'bottom';
    } else if (preferredSideFits) {
      placement = preferredSidePlacement;
    } else if (fallbackSideFits) {
      placement = fallbackSidePlacement;
    } else {
      var candidates = [
        { placement: 'top', space: spaceAbove },
        { placement: 'bottom', space: spaceBelow },
        { placement: preferredSidePlacement, space: preferredSidePlacement === 'right' ? spaceRight : spaceLeft },
        { placement: fallbackSidePlacement, space: fallbackSidePlacement === 'right' ? spaceRight : spaceLeft }
      ];
      candidates.sort(function(a, b) { return b.space - a.space; });
      placement = candidates[0].placement;
    }

    var popupLeft = 0;
    var popupTop = 0;

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

    var connectorX = clamp(screenPosition.x - popupLeft, connectorInset, popupWidth - connectorInset);
    var connectorY = clamp(screenPosition.y - popupTop, connectorInset, popupHeight - connectorInset);
    var previousPlacement = infoDisplayPlacement;
    var previousLeft = previousDisplayRect ? (previousDisplayRect.left - viewerRect.left) : null;
    var previousTop = previousDisplayRect ? (previousDisplayRect.top - viewerRect.top) : null;

    infoMarkerDisplayElement.classList.toggle('is-below', placement === 'bottom');
    infoMarkerDisplayElement.classList.toggle('is-left', placement === 'left');
    infoMarkerDisplayElement.classList.toggle('is-right', placement === 'right');
    infoMarkerDisplayElement.style.setProperty('--info-connector-x', connectorX + 'px');
    infoMarkerDisplayElement.style.setProperty('--info-connector-y', connectorY + 'px');
    infoMarkerDisplayElement.style.left = popupLeft + 'px';
    infoMarkerDisplayElement.style.top = popupTop + 'px';
    infoDisplayPlacement = placement;
    animateInfoMarkerPlacementShift(previousPlacement, placement, previousLeft, previousTop, popupLeft, popupTop);
  }

  function renderInfoMarkerDisplay(marker) {
    if (!infoMarkerDisplayBodyElement || !viewerStageElement) {
      return;
    }

    renderInfoMarkerContent(infoMarkerDisplayBodyElement, marker);
    var viewerWidth = viewerStageElement.clientWidth || getInfoMarkerPopupWidth(marker);
    infoMarkerDisplayElement.style.width = getResponsiveInfoMarkerPopupWidth(marker, viewerWidth) + 'px';
    showInfoMarkerDisplay();
    updateInfoMarkerDisplayPosition(marker);
  }

  function setSidebarOpen(isOpen) {
    viewerRoot.classList.toggle('sidebar-open', isOpen);
    sceneToggleElement.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    sceneBackdropElement.hidden = !isOpen;
  }


  function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function isViewerFullscreen() {
    var current = getFullscreenElement();
    return Boolean(current && viewerRoot && (current === viewerRoot || viewerRoot.contains(current)));
  }

  function syncFullscreenButton() {
    if (!fullscreenToggleElement) {
      return;
    }
    var supported = Boolean((viewerRoot && viewerRoot.requestFullscreen) || (viewerRoot && viewerRoot.webkitRequestFullscreen));
    if (!supported) {
      fullscreenToggleElement.hidden = true;
      return;
    }
    var active = isViewerFullscreen();
    fullscreenToggleElement.hidden = false;
    fullscreenToggleElement.innerHTML = '&#9974;';
    fullscreenToggleElement.setAttribute('aria-pressed', active ? 'true' : 'false');
    fullscreenToggleElement.setAttribute('aria-label', active ? 'Salir de pantalla completa' : 'Pantalla completa');
    fullscreenToggleElement.title = active ? 'Salir de pantalla completa' : 'Pantalla completa';
  }

  function toggleFullscreen() {
    if (!viewerRoot) {
      return;
    }
    if (isViewerFullscreen()) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      return;
    }
    if (viewerRoot.requestFullscreen) {
      viewerRoot.requestFullscreen();
    } else if (viewerRoot.webkitRequestFullscreen) {
      viewerRoot.webkitRequestFullscreen();
    }
  }

  function closeInfoPopup() {
    pinnedInfoMarkerId = null;
    hoveredInfoMarkerId = null;
    hideInfoMarkerDisplay(true);
  }

  function normalizeAmbientAudioConfig(audio) {
    if (!audio || typeof audio.src !== 'string' || !audio.src) {
      return null;
    }

    return {
      src: audio.src,
      fileName: audio.fileName || 'audio-ambiente.mp3',
      mimeType: audio.mimeType || 'audio/mpeg',
      volume: clamp(Number.isFinite(Number(audio.volume)) ? Number(audio.volume) : 0.55, 0, 1)
    };
  }

  function getAmbientAudioTimingConfig() {
    var transitionMs = clamp(Number.isFinite(Number(data.projectAmbientAudioTransitionMs)) ? Number(data.projectAmbientAudioTransitionMs) : DEFAULT_AMBIENT_AUDIO_TRANSITION_MS, 0, 10000);
    var offsetRaw = Number(data.projectAmbientAudioOffset);
    var fadeOutRaw = Number(data.projectAmbientAudioFadeOutRatio);
    var fadeInRaw = Number(data.projectAmbientAudioFadeInRatio);
    var legacyFadeMs = Number(data.projectAmbientAudioFadeMs);
    var legacyOffset = DEFAULT_AMBIENT_AUDIO_OFFSET;

    if (Number.isFinite(offsetRaw)) {
      legacyOffset = clamp(offsetRaw, -1, 1);
    } else if (Number.isFinite(fadeOutRaw) || Number.isFinite(fadeInRaw) || Number.isFinite(legacyFadeMs)) {
      var legacyFadeOutRatio = clamp(Number.isFinite(fadeOutRaw) ? fadeOutRaw : (transitionMs > 0 ? clamp((Number.isFinite(legacyFadeMs) ? legacyFadeMs : transitionMs) / transitionMs, 0, 1) : 1), 0, 1);
      var legacyFadeInRatio = clamp(Number.isFinite(fadeInRaw) ? fadeInRaw : (transitionMs > 0 ? clamp((Number.isFinite(legacyFadeMs) ? legacyFadeMs : transitionMs) / transitionMs, 0, 1) : 1), 0, 1);
      var legacyInStart = 1 - legacyFadeInRatio;
      var averageDuration = (legacyFadeOutRatio + legacyFadeInRatio) * 0.5;
      legacyOffset = averageDuration > 0 ? clamp(legacyInStart / averageDuration, -1, 1) : DEFAULT_AMBIENT_AUDIO_OFFSET;
    }

    return {
      transitionMs: transitionMs,
      offset: legacyOffset
    };
  }

  function isProjectAmbientAudioBackgroundEnabled() {
    return Boolean(data.projectAmbientAudioBackground);
  }

  function getProjectAmbientAudioConfig() {
    return normalizeAmbientAudioConfig(data.projectAmbientAudio);
  }

  function getSceneAmbientAudioConfig() {
    return normalizeAmbientAudioConfig(activeSceneEntry && activeSceneEntry.data && activeSceneEntry.data.ambientAudio);
  }

  function isSceneAmbientAudioTimelineSynced() {
    return Boolean(activeSceneEntry && activeSceneEntry.data && activeSceneEntry.data.ambientAudioSyncTimeline);
  }

  function ensureProjectAudioTimelineClock() {
    if (!isFinite(projectAudioTimelineStartedAtMs)) {
      projectAudioTimelineStartedAtMs = performance.now();
    }
    return projectAudioTimelineStartedAtMs;
  }

  function getProjectAudioTimelinePosition(durationSeconds) {
    var duration = Number(durationSeconds);
    if (!isFinite(duration) || duration <= 0) {
      return 0;
    }

    var anchor = ensureProjectAudioTimelineClock();
    var elapsedSeconds = Math.max(0, (performance.now() - anchor) / 1000);
    return elapsedSeconds % duration;
  }

  function primeAmbientAudioForTimeline(audio, options) {
    options = options || {};
    if (!audio || !options.syncTimeline) {
      return Promise.resolve();
    }

    ensureProjectAudioTimelineClock();

    var applyTimelinePosition = function() {
      if (!isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }
      try {
        audio.currentTime = getProjectAudioTimelinePosition(audio.duration);
      } catch (error) {
        console.warn('No se pudo sincronizar el audio con el tiempo del proyecto.', error);
      }
    };

    if (isFinite(audio.duration) && audio.duration > 0) {
      applyTimelinePosition();
      return Promise.resolve();
    }

    return new Promise(function(resolve) {
      var cleanup = function() {
        audio.removeEventListener('loadedmetadata', handleReady);
        audio.removeEventListener('canplay', handleReady);
        audio.removeEventListener('error', handleDone);
      };
      var handleReady = function() {
        cleanup();
        applyTimelinePosition();
        resolve();
      };
      var handleDone = function() {
        cleanup();
        resolve();
      };
      audio.addEventListener('loadedmetadata', handleReady, { once: true });
      audio.addEventListener('canplay', handleReady, { once: true });
      audio.addEventListener('error', handleDone, { once: true });
    });
  }

  function getEffectiveAmbientAudio() {
    var sceneAudio = getSceneAmbientAudioConfig();
    if (sceneAudio) {
      return { scope: 'scene', config: sceneAudio, syncTimeline: isSceneAmbientAudioTimelineSynced() };
    }

    var projectAudio = getProjectAmbientAudioConfig();
    if (projectAudio) {
      return { scope: 'project', config: projectAudio, syncTimeline: false };
    }

    return null;
  }

function createAmbientAudioElement() {
    var audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    return audio;
  }

  function ensureAmbientAudioElement() {
    if (!ambientAudioElement) {
      ambientAudioElement = createAmbientAudioElement();
    }
    return ambientAudioElement;
  }

  function stopAmbientAudioElement(audio) {
    if (!audio) {
      return;
    }
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  function stopProjectBackgroundAmbientAudio() {
    if (!projectBackgroundAudioElement) {
      projectBackgroundAudioKey = '';
      return;
    }
    stopAmbientAudioElement(projectBackgroundAudioElement);
    projectBackgroundAudioElement = null;
    projectBackgroundAudioKey = '';
  }

  function syncProjectBackgroundAmbientAudio() {
    if (!isProjectAmbientAudioBackgroundEnabled()) {
      stopProjectBackgroundAmbientAudio();
      return null;
    }

    var projectAudio = getProjectAmbientAudioConfig();
    if (!projectAudio) {
      stopProjectBackgroundAmbientAudio();
      return null;
    }

    var nextKey = projectAudio.src;
    var audio = projectBackgroundAudioElement;
    if (!audio || projectBackgroundAudioKey !== nextKey) {
      if (audio) {
        stopAmbientAudioElement(audio);
      }
      audio = createAmbientAudioElement();
      audio.src = projectAudio.src;
      audio.currentTime = 0;
      projectBackgroundAudioElement = audio;
      projectBackgroundAudioKey = nextKey;
    }

    audio.loop = true;
    audio.muted = ambientMuted;
    audio.volume = getAmbientTargetVolume(projectAudio.volume);
    if (!audio.muted && audio.volume > 0 && audio.paused) {
      var playAttempt = audio.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(function() {});
      }
    }

    return projectAudio;
  }

  function cancelAmbientAudioTransition(options) {
    if (!ambientAudioTransition) {
      return;
    }

    cancelAnimationFrame(ambientAudioTransition.frameId);
    var preserveCurrent = Boolean(options && options.preserveCurrent);
    if (ambientAudioTransition.fromAudio && ambientAudioTransition.fromAudio !== ambientAudioElement) {
      stopAmbientAudioElement(ambientAudioTransition.fromAudio);
    }
    if (ambientAudioTransition.toAudio && (!preserveCurrent || ambientAudioTransition.toAudio !== ambientAudioElement)) {
      stopAmbientAudioElement(ambientAudioTransition.toAudio);
    }
    ambientAudioTransition = null;
  }

  function getAmbientTargetVolume(baseVolume) {
    if (ambientMuted) {
      return 0;
    }
    return clamp((Number(baseVolume) || 0) * ambientVolume, 0, 1);
  }

  function getAmbientTransitionProfile() {
    var timing = getAmbientAudioTimingConfig();
    var transitionMs = Math.max(0, timing.transitionMs);
    var offset = clamp(timing.offset, -1, 1);

    if (transitionMs <= 0) {
      return {
        transitionMs: 0,
        offset: offset,
        fadeDuration: 0,
        fadeOutStart: 0,
        fadeInStart: 0
      };
    }

    var fadeDuration = transitionMs / (1 + Math.abs(offset));
    var fadeOutStart = offset < 0 ? Math.abs(offset) * fadeDuration : 0;
    var fadeInStart = offset > 0 ? offset * fadeDuration : 0;
    return {
      transitionMs: transitionMs,
      offset: offset,
      fadeDuration: fadeDuration,
      fadeOutStart: fadeOutStart,
      fadeInStart: fadeInStart
    };
  }

  function startAmbientAudioTransition(nextAudio, nextBaseVolume, options) {
    cancelAmbientAudioTransition();

    var previousAudio = ambientAudioElement && ambientAudioElement !== nextAudio ? ambientAudioElement : null;
    var previousVolume = previousAudio ? previousAudio.volume : 0;
    var profile = getAmbientTransitionProfile();
    var targetVolume = getAmbientTargetVolume(nextBaseVolume);
    var nextStartRequested = false;

    ambientAudioElement = nextAudio;
    ambientAudioBaseVolume = nextBaseVolume;

    var startNextAudio = function() {
      if (nextStartRequested) {
        return;
      }
      nextStartRequested = true;

      var beginPlayback = function() {
        if (ambientAudioElement !== nextAudio) {
          return;
        }
        nextAudio.muted = ambientMuted;
        nextAudio.volume = profile.transitionMs <= 0 || profile.fadeDuration <= 0 ? targetVolume : 0;
        var playAttempt = nextAudio.play();
        if (playAttempt && typeof playAttempt.catch === 'function') {
          playAttempt.catch(function() {});
        }
      };

      primeAmbientAudioForTimeline(nextAudio, options).finally(beginPlayback);
    };

    if (profile.transitionMs <= 0) {
      if (previousAudio) {
        stopAmbientAudioElement(previousAudio);
      }
      startNextAudio();
      nextAudio.volume = targetVolume;
      return;
    }

    var start = performance.now();
    var nextStarted = false;

    var step = function(now) {
      var elapsed = Math.max(0, now - start);

      if (previousAudio) {
        var fadeOutElapsed = Math.max(0, elapsed - profile.fadeOutStart);
        var fadeOutProgress = profile.fadeDuration <= 0 ? 1 : Math.min(1, fadeOutElapsed / profile.fadeDuration);
        var fadeOutEased = 1 - Math.pow(1 - fadeOutProgress, 3);
        previousAudio.volume = previousVolume * (1 - fadeOutEased);
        previousAudio.muted = ambientMuted;
      }

      if (!nextStarted && elapsed >= profile.fadeInStart) {
        nextStarted = true;
        startNextAudio();
      }

      if (nextStarted) {
        var fadeInElapsed = Math.max(0, elapsed - profile.fadeInStart);
        var fadeInProgress = profile.fadeDuration <= 0 ? 1 : Math.min(1, fadeInElapsed / profile.fadeDuration);
        var fadeInEased = 1 - Math.pow(1 - fadeInProgress, 3);
        nextAudio.volume = targetVolume * fadeInEased;
        nextAudio.muted = ambientMuted;
      }

      if (elapsed < profile.transitionMs) {
        ambientAudioTransition.frameId = requestAnimationFrame(step);
        return;
      }

      nextAudio.volume = targetVolume;
      nextAudio.muted = ambientMuted;
      if (previousAudio) {
        stopAmbientAudioElement(previousAudio);
      }
      ambientAudioTransition = null;
    };

    ambientAudioTransition = {
      fromAudio: previousAudio,
      toAudio: nextAudio,
      frameId: requestAnimationFrame(step)
    };
  }

function fadeOutAmbientAudio() {
    if (!ambientAudioElement) {
      ambientAudioKey = '';
      ambientAudioBaseVolume = 0.55;
      cancelAmbientAudioTransition();
      return;
    }

    cancelAmbientAudioTransition();
    var audio = ambientAudioElement;
    var startVolume = audio.volume;
    var profile = getAmbientTransitionProfile();

    if (profile.transitionMs <= 0 || profile.fadeDuration <= 0) {
      stopAmbientAudioElement(audio);
      ambientAudioElement = null;
      ambientAudioKey = '';
      ambientAudioBaseVolume = 0.55;
      return;
    }

    var start = performance.now();

    ambientAudioTransition = {
      fromAudio: audio,
      toAudio: null,
      frameId: requestAnimationFrame(function step(now) {
        var elapsed = Math.max(0, now - start);
        var progress = Math.min(1, elapsed / profile.fadeDuration);
        var eased = 1 - Math.pow(1 - progress, 3);
        audio.volume = startVolume * (1 - eased);
        if (progress < 1) {
          ambientAudioTransition.frameId = requestAnimationFrame(step);
          return;
        }
        stopAmbientAudioElement(audio);
        ambientAudioTransition = null;
      })
    };

    ambientAudioElement = null;
    ambientAudioKey = '';
    ambientAudioBaseVolume = 0.55;
  }

  function renderViewerSettings() {
    if (viewerSettingsToggleElement) {
      viewerSettingsToggleElement.setAttribute('aria-expanded', settingsOpen ? 'true' : 'false');
    }
    if (viewerSettingsPanelElement) {
      viewerSettingsPanelElement.hidden = !settingsOpen;
    }
    if (viewerSettingsVolumeElement) {
      viewerSettingsVolumeElement.value = String(Math.round(ambientVolume * 100));
    }
    if (viewerSettingsMuteElement) {
      viewerSettingsMuteElement.checked = ambientMuted;
    }
    if (viewerSettingsStatusElement) {
      var projectAudio = getProjectAmbientAudioConfig();
      var sceneAudio = getSceneAmbientAudioConfig();
      if (isProjectAmbientAudioBackgroundEnabled() && projectAudio && sceneAudio) {
        viewerSettingsStatusElement.textContent = 'Audio activo: proyecto + escena | base ' + Math.round(projectAudio.volume * 100) + '% + ' + Math.round(sceneAudio.volume * 100) + '%';
      } else {
        var effective = getEffectiveAmbientAudio();
        viewerSettingsStatusElement.textContent = effective
          ? 'Audio activo: ' + (effective.scope === 'scene' ? 'escena' : 'proyecto') + ' | volumen base ' + Math.round(effective.config.volume * 100) + '%'
          : 'Sin audio ambiente activo.';
      }
    }
  }

  function syncAmbientAudioPlayback() {
    syncProjectBackgroundAmbientAudio();
    var effective = isProjectAmbientAudioBackgroundEnabled()
      ? (getSceneAmbientAudioConfig() ? { scope: 'scene', config: getSceneAmbientAudioConfig(), syncTimeline: isSceneAmbientAudioTimelineSynced() } : null)
      : getEffectiveAmbientAudio();
    if (!effective) {
      fadeOutAmbientAudio();
      renderViewerSettings();
      return;
    }

    var nextKey = effective.config.src + '::' + (effective.syncTimeline ? 'sync' : 'local');
    if (ambientAudioKey === nextKey && ambientAudioElement) {
      cancelAmbientAudioTransition({ preserveCurrent: true });
      ambientAudioBaseVolume = effective.config.volume;
      ambientAudioElement.loop = true;
      ambientAudioElement.muted = ambientMuted;
      ambientAudioElement.volume = getAmbientTargetVolume(effective.config.volume);
      if (!ambientAudioElement.muted && ambientAudioElement.volume > 0 && ambientAudioElement.paused) {
        var resumedPlay = ambientAudioElement.play();
        if (resumedPlay && typeof resumedPlay.catch === 'function') {
          resumedPlay.catch(function() {});
        }
      }
      renderViewerSettings();
      return;
    }

    var nextAudio = createAmbientAudioElement();
    nextAudio.src = effective.config.src;
    nextAudio.currentTime = 0;
    nextAudio.loop = true;
    nextAudio.muted = ambientMuted;
    nextAudio.volume = 0;

    ambientAudioKey = nextKey;
    startAmbientAudioTransition(nextAudio, effective.config.volume, { syncTimeline: Boolean(effective.syncTimeline) });
    renderViewerSettings();
  }

function toggleViewerSettings(forceOpen) {
    settingsOpen = typeof forceOpen === 'boolean' ? forceOpen : !settingsOpen;
    renderViewerSettings();
  }

  function getSoundMarkerAudioSrc(marker) {
    return typeof (marker && marker.soundSrc) === 'string' ? marker.soundSrc : '';
  }

  function hasSoundMarkerAudio(marker) {
    return Boolean(getSoundMarkerAudioSrc(marker));
  }

  function getSoundMarkerVolume(marker) {
    var value = Number(marker && marker.soundVolume);
    return clamp(Number.isFinite(value) ? value : SOUND_MARKER_DEFAULT_VOLUME, 0, 1);
  }

  function getSoundMarkerPan(marker) {
    var value = Number(marker && marker.soundPan);
    return clamp(Number.isFinite(value) ? value : SOUND_MARKER_DEFAULT_PAN, 0, 1);
  }

  function getSoundMarkerFocusDeg(marker) {
    var value = Number(marker && marker.soundFocusDeg);
    return clamp(Number.isFinite(value) ? value : SOUND_MARKER_DEFAULT_FOCUS_DEG, 20, 180);
  }

  function shouldSoundMarkerLoop(marker) {
    return !marker || marker.soundLoop !== false;
  }

  function normalizeMarkerAngle(angle) {
    var next = Number.isFinite(Number(angle)) ? Number(angle) : 0;
    while (next > Math.PI) { next -= Math.PI * 2; }
    while (next < -Math.PI) { next += Math.PI * 2; }
    return next;
  }

  function ensureSoundMarkerAudioContext() {
    if (soundMarkerAudioContext) {
      return soundMarkerAudioContext;
    }
    var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }
    try {
      soundMarkerAudioContext = new AudioContextCtor();
    } catch (error) {
      console.warn('No se pudo crear el contexto de audio para los efectos sound.', error);
      soundMarkerAudioContext = null;
    }
    return soundMarkerAudioContext;
  }

  function tryResumeSoundMarkerAudioPlayback() {
    var context = soundMarkerAudioContext;
    if (context && context.state === 'suspended') {
      context.resume().catch(function() {});
    }
    soundMarkerAudioEntries.forEach(function(entry) {
      if (!entry || !entry.audio || entry.targetGain <= 0.001) {
        return;
      }
      if (entry.audio.paused || entry.audio.ended) {
        var playAttempt = entry.audio.play();
        if (playAttempt && typeof playAttempt.catch === 'function') {
          playAttempt.catch(function() {});
        }
      }
    });
  }

  function ensureSoundMarkerAudioUnlockBinding() {
    if (!soundMarkerAudioUnlockBound) {
      window.addEventListener('pointerdown', tryResumeSoundMarkerAudioPlayback, true);
      soundMarkerAudioUnlockBound = true;
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
    soundMarkerRetiringAudioEntries.delete(entry);
  }

  function destroySoundMarkerAudioEntry(entry) {
    if (!entry) {
      return;
    }
    cancelSoundMarkerAudioEntryRetirement(entry);
    try { entry.audio && entry.audio.pause(); } catch (error) {}
    if (entry.audio) {
      try {
        entry.audio.removeAttribute('src');
        entry.audio.load();
      } catch (error) {}
    }
    try { entry.sourceNode && entry.sourceNode.disconnect(); } catch (error) {}
    try { entry.panNode && entry.panNode.disconnect(); } catch (error) {}
    try { entry.gainNode && entry.gainNode.disconnect(); } catch (error) {}
  }

  function beginSoundMarkerSceneTransition(type, targetSceneId) {
    var fadeMs = type === 'fade' ? SOUND_MARKER_SCENE_TRANSITION_MS : 0;
    soundMarkerSceneTransition = {
      fadeMs: fadeMs,
      targetSceneId: targetSceneId || null,
      pending: true
    };

    clearFrozenActiveSceneSoundMarkers();

    if (soundMarkerAudioEntries.size) {
      var outgoingEntries = Array.from(soundMarkerAudioEntries.values());
      soundMarkerAudioEntries.clear();
      outgoingEntries.forEach(function(entry) {
        retireSoundMarkerAudioEntry(entry, fadeMs);
      });
    }
  }

  function consumeSoundMarkerSceneTransitionMs(currentSceneId) {
    var transition = soundMarkerSceneTransition;
    if (!transition || !transition.pending) {
      return 0;
    }
    if (transition.targetSceneId && currentSceneId && transition.targetSceneId !== currentSceneId) {
      return 0;
    }
    transition.pending = false;
    return Math.max(0, Number(transition.fadeMs) || 0);
  }

  function freezeActiveSceneSoundMarkers(sceneId) {
    soundMarkerFreezeSceneId = sceneId || null;
  }

  function clearFrozenActiveSceneSoundMarkers() {
    soundMarkerFreezeSceneId = null;
  }

  function applySoundMarkerAudioEntryMix(entry, targetGain, targetPan, gainRampMs, panRampMs) {
    if (!entry) {
      return;
    }
    if (gainRampMs == null) { gainRampMs = 80; }
    if (panRampMs == null) { panRampMs = gainRampMs; }
    var previousTargetGain = Number.isFinite(entry.targetGain) ? entry.targetGain : 0;
    var previousTargetPan = Number.isFinite(entry.targetPan) ? entry.targetPan : 0;
    entry.targetGain = targetGain;
    entry.targetPan = targetPan;

    var context = soundMarkerAudioContext;
    if (entry.gainNode && context && context.currentTime != null) {
      var now = context.currentTime;
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

  function retireSoundMarkerAudioEntry(entry, fadeMs) {
    if (!entry) {
      return;
    }

    cancelSoundMarkerAudioEntryRetirement(entry);
    if (!fadeMs || fadeMs <= 0) {
      destroySoundMarkerAudioEntry(entry);
      return;
    }

    entry.isRetiring = true;
    soundMarkerRetiringAudioEntries.add(entry);

    var startGain = Math.max(0, Number.isFinite(entry.targetGain) ? entry.targetGain : 0);
    var startPan = Number.isFinite(entry.targetPan) ? entry.targetPan : 0;
    var startTime = performance.now();
    var context = soundMarkerAudioContext;

    var step = function(now) {
      var progress = clamp((now - startTime) / fadeMs, 0, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var nextGain = startGain * (1 - eased);

      entry.targetGain = nextGain;
      entry.targetPan = startPan;

      if (entry.gainNode && context && context.currentTime != null) {
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
    var audio = new Audio();
    audio.preload = 'auto';
    audio.src = getSoundMarkerAudioSrc(marker);
    audio.loop = shouldSoundMarkerLoop(marker);


    var entry = {
      markerId: marker.id,
      key: getSoundMarkerAudioSrc(marker),
      audio: audio,
      sourceNode: null,
      gainNode: null,
      panNode: null,
      targetGain: 0,
      targetPan: 0,
      isRetiring: false,
      retireTimer: 0,
      retireFrame: 0
    };

    var context = ensureSoundMarkerAudioContext();
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
    var yaw = Number(viewParameters && viewParameters.yaw) || 0;
    var pitch = Number(viewParameters && viewParameters.pitch) || 0;
    var yawDelta = normalizeMarkerAngle(marker.yaw - yaw);
    var pitchDelta = (Number(marker.pitch) || 0) - pitch;
    var focusDeg = clamp(getSoundMarkerFocusDeg(marker), 20, 180);
    var normalizedFocus = (focusDeg - 20) / 160;
    var omniBlend = clamp((normalizedFocus - 0.5) / 0.5, 0, 1);
    var directionalFocusDeg = normalizedFocus <= 0.5
      ? 20 + (160 * (normalizedFocus / 0.5))
      : 180;
    var directionalFocusRad = directionalFocusDeg * Math.PI / 180;
    var angularDistance = Math.min(Math.hypot(yawDelta, pitchDelta), Math.PI);
    var directionalAlignment = clamp(1 - (angularDistance / directionalFocusRad), 0, 1);
    var alignment = directionalAlignment + ((1 - directionalAlignment) * omniBlend);
    return {
      gain: alignment * alignment,
      pan: clamp(Math.sin(yawDelta), -1, 1)
    };
  }

  function updateSoundMarkerAudioEntry(entry, marker, view, options) {
    if (!entry || !marker || !view) {
      return;
    }

    options = options || {};
    cancelSoundMarkerAudioEntryRetirement(entry);
    entry.audio.loop = shouldSoundMarkerLoop(marker);
    var viewParameters = typeof view.parameters === 'function' ? view.parameters() : view;
    var mix = getSoundMarkerDirectionalMix(marker, viewParameters);
    var targetGain = ambientMuted
      ? 0
      : clamp(getSoundMarkerVolume(marker) * mix.gain * ambientVolume, 0, 1);
    var targetPan = clamp(mix.pan * getSoundMarkerPan(marker), -1, 1);
    applySoundMarkerAudioEntryMix(entry, targetGain, targetPan, options.gainRampMs == null ? 80 : options.gainRampMs, options.panRampMs == null ? 80 : options.panRampMs);
  }

  function clearActiveSceneSoundMarkers() {
    soundMarkerAudioEntries.forEach(function(entry) {
      destroySoundMarkerAudioEntry(entry);
    });
    soundMarkerAudioEntries.clear();
    soundMarkerRetiringAudioEntries.forEach(function(entry) {
      destroySoundMarkerAudioEntry(entry);
    });
    soundMarkerRetiringAudioEntries.clear();
  }

  function getActiveSceneSoundMarkers() {
    if (!activeSceneEntry) {
      return [];
    }
    return getSceneMarkers(activeSceneEntry.data.id).filter(function(marker) {
      return normalizeMarkerType(marker.type) === 'sound' && hasSoundMarkerAudio(marker);
    });
  }

  function syncActiveSceneSoundPlayback() {
    var view = activeSceneEntry && activeSceneEntry.view;
    if (!view) {
      clearActiveSceneSoundMarkers();
      return;
    }

    if (soundMarkerFreezeSceneId && activeSceneEntry && soundMarkerFreezeSceneId === activeSceneEntry.data.id) {
      return;
    }

    var transitionFadeMs = consumeSoundMarkerSceneTransitionMs(activeSceneEntry && activeSceneEntry.data ? activeSceneEntry.data.id : null);
    var soundMarkers = getActiveSceneSoundMarkers();
    var soundMarkersById = new Map(soundMarkers.map(function(marker) { return [marker.id, marker]; }));
    soundMarkerAudioEntries.forEach(function(entry, markerId) {
      var marker = soundMarkersById.get(markerId);
      if (!marker || entry.key !== getSoundMarkerAudioSrc(marker)) {
        soundMarkerAudioEntries.delete(markerId);
        retireSoundMarkerAudioEntry(entry, transitionFadeMs);
      }
    });

    soundMarkers.forEach(function(marker) {
      var entry = soundMarkerAudioEntries.get(marker.id);
      var isNewEntry = !entry;
      if (!entry) {
        entry = createSoundMarkerAudioEntry(marker);
        soundMarkerAudioEntries.set(marker.id, entry);
      }
      updateSoundMarkerAudioEntry(entry, marker, view, { gainRampMs: isNewEntry ? transitionFadeMs : 80, panRampMs: 80 });
    });
  }
  function getSceneMarkers(sceneId) {
    return markers.filter(function(marker) {
      return marker.sceneId === sceneId;
    });
  }

  function handleInfoMarkerEnter(marker) {
    if (!marker || pinnedInfoMarkerId) {
      return;
    }

    hoveredInfoMarkerId = marker.id;
    renderInfoMarkerDisplay(marker);
  }

  function handleInfoMarkerLeave(marker) {
    if (!marker || pinnedInfoMarkerId || hoveredInfoMarkerId !== marker.id) {
      return;
    }

    hoveredInfoMarkerId = null;
    hideInfoMarkerDisplay(true);
  }

  function getNormalizedViewParameters(parameters, fallback) {
    var fallbackParams = fallback || { yaw: 0, pitch: 0, fov: Math.PI / 2 };
    var nextYaw = Number(parameters && parameters.yaw);
    var nextPitch = Number(parameters && parameters.pitch);
    var nextFov = Number(parameters && parameters.fov);

    return {
      yaw: Number.isFinite(nextYaw) ? nextYaw : fallbackParams.yaw,
      pitch: clamp(Number.isFinite(nextPitch) ? nextPitch : fallbackParams.pitch, -Math.PI / 2, Math.PI / 2),
      fov: clamp(Number.isFinite(nextFov) ? nextFov : fallbackParams.fov, data.minFov || (30 * Math.PI / 180), data.maxFov || (120 * Math.PI / 180))
    };
  }

  function getLinkMarkerTargetViewParameters(marker, targetScene) {
    return getNormalizedViewParameters(marker && marker.targetViewParameters, targetScene && targetScene.data ? targetScene.data.initialViewParameters : null);
  }

  function getLinkMarkerTransitionDurationMs(marker) {
    var value = Number(marker && marker.transitionDurationMs);
    return clamp(Number.isFinite(value) ? value : DEFAULT_LINK_MARKER_TRANSITION_MS, 100, 10000);
  }

  function centerViewOnLinkMarker(marker) {
    return new Promise(function(resolve) {
      if (!activeSceneEntry || !activeSceneEntry.view) {
        resolve();
        return;
      }

      var currentParameters = activeSceneEntry.view.parameters ? activeSceneEntry.view.parameters() : activeSceneEntry.data.initialViewParameters;
      var startYaw = currentParameters && typeof currentParameters.yaw === 'number' ? currentParameters.yaw : 0;
      var startPitch = currentParameters && typeof currentParameters.pitch === 'number' ? currentParameters.pitch : 0;
      var fov = currentParameters && currentParameters.fov ? currentParameters.fov : activeSceneEntry.data.initialViewParameters.fov;
      var yawDelta = Math.atan2(Math.sin(marker.yaw - startYaw), Math.cos(marker.yaw - startYaw));
      var pitchDelta = marker.pitch - startPitch;
      var startTime = performance.now();

      function step(now) {
        var progress = clamp((now - startTime) / LINK_MARKER_CENTER_TRANSITION_MS, 0, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        activeSceneEntry.view.setParameters({
          yaw: startYaw + (yawDelta * eased),
          pitch: startPitch + (pitchDelta * eased),
          fov: fov
        });

        if (progress < 1) {
          window.requestAnimationFrame(step);
          return;
        }

        resolve();
      }

      window.requestAnimationFrame(step);
    });
  }

  async function activateLinkMarker(marker) {
    var targetScene = scenes.find(function(entry) {
      return entry.data.id === marker.targetSceneId;
    });

    if (!targetScene) {
      return;
    }

    if ((marker.transition || 'fade') === 'fade' && marker.centerBeforeTransition) {
      freezeActiveSceneSoundMarkers(marker.sceneId);
    }

    if (marker.centerBeforeTransition) {
      await centerViewOnLinkMarker(marker);
    }

    switchScene(targetScene, marker.transition || 'fade', getLinkMarkerTargetViewParameters(marker, targetScene), getLinkMarkerTransitionDurationMs(marker));
  }

  function toggleInfoMarkerPinned(marker) {
    if (!marker) {
      return;
    }

    if (pinnedInfoMarkerId === marker.id) {
      pinnedInfoMarkerId = null;
      if (hoveredInfoMarkerId === marker.id) {
        renderInfoMarkerDisplay(marker);
      } else {
        hideInfoMarkerDisplay(true);
      }
      return;
    }

    pinnedInfoMarkerId = marker.id;
    hoveredInfoMarkerId = null;
    renderInfoMarkerDisplay(marker);
  }

  function renderActiveSceneLights() {
    if (!activeSceneEntry || !lightOverlayElement) {
      return;
    }

    var sceneLights = getSceneMarkers(activeSceneEntry.data.id).filter(function(marker) { return normalizeMarkerType(marker.type) === 'light'; });
    if (!sceneLights.length) {
      lightOverlayElement.innerHTML = '';
      lightOverlayElement.hidden = true;
      return;
    }

    var bounds = viewerStageElement.getBoundingClientRect();
    lightOverlayElement.innerHTML = '';
    var centerX = bounds.width / 2;
    var centerY = bounds.height / 2;

    sceneLights.forEach(function(marker) {
      var screenPosition = activeSceneEntry.view.coordinatesToScreen({ yaw: marker.yaw, pitch: marker.pitch }, {});
      // Keep lens artifacts alive even when the source is just outside the viewport.
      if (!screenPosition || !Number.isFinite(screenPosition.x) || !Number.isFinite(screenPosition.y)) { return; }
      var reflectedX = centerX - (screenPosition.x - centerX);
      var reflectedY = centerY - (screenPosition.y - centerY);
      lightOverlayElement.appendChild(createLightFlareElement(marker, screenPosition.x, screenPosition.y, reflectedX, reflectedY));
    });

    lightOverlayElement.hidden = lightOverlayElement.childElementCount === 0;
  }

  function createMarkerElement(marker) {
    var markerElement = document.createElement('button');
    markerElement.type = 'button';
    markerElement.className = 'viewer-marker';
    markerElement.dataset.markerId = marker.id;
    markerElement.dataset.markerType = normalizeMarkerType(marker.type);
    markerElement.setAttribute('aria-label', marker.name || 'Hotspot');
    markerElement.title = marker.name || 'Hotspot';
    markerElement.innerHTML = '<span class="viewer-marker__icon">' + getMarkerTypeBadge(marker.type) + '</span>';

    markerElement.addEventListener('click', function(event) {
      event.stopPropagation();
      if (normalizeMarkerType(marker.type) === 'info') {
        toggleInfoMarkerPinned(marker);
        return;
      }
      activateLinkMarker(marker);
    });

    markerElement.addEventListener('mouseenter', function() {
      if (normalizeMarkerType(marker.type) === 'info') {
        handleInfoMarkerEnter(marker);
      }
    });

    markerElement.addEventListener('mouseleave', function() {
      if (normalizeMarkerType(marker.type) === 'info') {
        handleInfoMarkerLeave(marker);
      }
    });

    return markerElement;
  }

  function destroyMarkerHotspot(entry, markerId) {
    if (!entry || !entry.hotspots || !entry.hotspots.has(markerId)) {
      return;
    }

    var hotspotEntry = entry.hotspots.get(markerId);
    if (entry.hotspotContainer && hotspotEntry && hotspotEntry.hotspot && typeof entry.hotspotContainer.destroyHotspot === 'function') {
      entry.hotspotContainer.destroyHotspot(hotspotEntry.hotspot);
    } else if (hotspotEntry && hotspotEntry.element && typeof hotspotEntry.element.remove === 'function') {
      hotspotEntry.element.remove();
    }

    entry.hotspots.delete(markerId);
  }

  function syncMarkerHotspot(marker, entry) {
    if (normalizeMarkerType(marker.type) === 'light' || normalizeMarkerType(marker.type) === 'sound') {
      destroyMarkerHotspot(entry, marker.id);
      return;
    }
    var hotspotEntry = entry.hotspots.get(marker.id);
    if (!hotspotEntry) {
      var markerElement = createMarkerElement(marker);
      var hotspot = entry.hotspotContainer && typeof entry.hotspotContainer.createHotspot === 'function'
        ? entry.hotspotContainer.createHotspot(markerElement, { yaw: marker.yaw, pitch: marker.pitch })
        : null;
      hotspotEntry = { element: markerElement, hotspot: hotspot };
      entry.hotspots.set(marker.id, hotspotEntry);
    }

    hotspotEntry.element.dataset.markerType = normalizeMarkerType(marker.type);
    hotspotEntry.element.setAttribute('aria-label', marker.name || 'Hotspot');
    hotspotEntry.element.title = marker.name || 'Hotspot';
    hotspotEntry.element.innerHTML = '<span class="viewer-marker__icon">' + getMarkerTypeBadge(marker.type) + '</span>';
    if (hotspotEntry.hotspot && typeof hotspotEntry.hotspot.setPosition === 'function') {
      hotspotEntry.hotspot.setPosition({ yaw: marker.yaw, pitch: marker.pitch });
    }
  }

  function renderActiveSceneMarkers() {
    if (!activeSceneEntry) {
      hideInfoMarkerDisplay(true);
      if (lightOverlayElement) { lightOverlayElement.innerHTML = ''; lightOverlayElement.hidden = true; }
      clearActiveSceneSoundMarkers();
      return;
    }

    var sceneMarkers = getSceneMarkers(activeSceneEntry.data.id);
    var hotspotMarkers = sceneMarkers.filter(function(marker) { var markerType = normalizeMarkerType(marker.type); return markerType !== 'light' && markerType !== 'sound'; });
    var activeMarkerIds = new Set(hotspotMarkers.map(function(marker) { return marker.id; }));

    hotspotMarkers.forEach(function(marker) {
      syncMarkerHotspot(marker, activeSceneEntry);
    });

    Array.from(activeSceneEntry.hotspots.keys())
      .filter(function(markerId) { return !activeMarkerIds.has(markerId); })
      .forEach(function(markerId) { destroyMarkerHotspot(activeSceneEntry, markerId); });

    renderActiveSceneLights();
    syncActiveSceneSoundPlayback();
    if (!getDisplayedInfoMarker()) {
      hideInfoMarkerDisplay(true);
    } else {
      updateInfoMarkerDisplayPosition();
    }
  }

  if (sceneToggleElement) {
    sceneToggleElement.addEventListener('click', function() {
      setSidebarOpen(!viewerRoot.classList.contains('sidebar-open'));
    });
  }

  if (sceneBackdropElement) {
    sceneBackdropElement.addEventListener('click', function() {
      setSidebarOpen(false);
    });
  }

  if (sceneCloseElement) {
    sceneCloseElement.addEventListener('click', function() {
      setSidebarOpen(false);
    });
  }


  if (viewerSettingsToggleElement) {
    viewerSettingsToggleElement.addEventListener('click', function(event) {
      event.stopPropagation();
      toggleViewerSettings();
    });
  }

  if (viewerSettingsPanelElement) {
    viewerSettingsPanelElement.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  }

  if (viewerSettingsVolumeElement) {
    viewerSettingsVolumeElement.addEventListener('input', function() {
      ambientVolume = clamp((Number(viewerSettingsVolumeElement.value) || 0) / 100, 0, 1);
      syncAmbientAudioPlayback();
      syncActiveSceneSoundPlayback();
    });
  }

  if (viewerSettingsMuteElement) {
    viewerSettingsMuteElement.addEventListener('change', function() {
      ambientMuted = Boolean(viewerSettingsMuteElement.checked);
      syncAmbientAudioPlayback();
      syncActiveSceneSoundPlayback();
    });
  }

  if (fullscreenToggleElement) {
    fullscreenToggleElement.addEventListener('click', function() {
      toggleFullscreen();
    });
    syncFullscreenButton();
  }

  document.addEventListener('fullscreenchange', function() {
    syncFullscreenButton();
    viewer.updateSize();
    renderActiveSceneMarkers();
    updateInfoMarkerDisplayPosition();
  });

  document.addEventListener('webkitfullscreenchange', function() {
    syncFullscreenButton();
    viewer.updateSize();
    renderActiveSceneMarkers();
    updateInfoMarkerDisplayPosition();
  });

  window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeInfoPopup();
      setSidebarOpen(false);
      toggleViewerSettings(false);
    }
  });

  document.addEventListener('pointerdown', function(event) {
    if (settingsOpen && viewerSettingsPanelElement && viewerSettingsToggleElement) {
      var clickedInsideSettings = viewerSettingsPanelElement.contains(event.target) || viewerSettingsToggleElement.contains(event.target);
      if (!clickedInsideSettings) {
        toggleViewerSettings(false);
      }
    }

    if (projectBackgroundAudioElement && projectBackgroundAudioElement.paused && !ambientMuted && projectBackgroundAudioElement.volume > 0) {
      var backgroundPlay = projectBackgroundAudioElement.play();
      if (backgroundPlay && typeof backgroundPlay.catch === 'function') {
        backgroundPlay.catch(function() {});
      }
    }
    if (ambientAudioElement && ambientAudioElement.paused && !ambientMuted && ambientAudioElement.volume > 0) {
      var playAttempt = ambientAudioElement.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(function() {});
      }
    }
    if (ambientAudioTransition && ambientAudioTransition.toAudio && ambientAudioTransition.toAudio.paused && !ambientMuted) {
      var transitionPlay = ambientAudioTransition.toAudio.play();
      if (transitionPlay && typeof transitionPlay.catch === 'function') {
        transitionPlay.catch(function() {});
      }
    }
  }, true);

  var scenes = data.scenes.map(function(sceneData) {
    var source = new window.Marzipano.ImageUrlSource(function(tile) {
      var key = String(tile.z) + '/' + tile.face + '/' + tile.y + '/' + tile.x + '.jpg';
      return { url: 'app-files/tiles/' + sceneData.id + '/' + key };
    }, {
      cubeMapPreviewUrl: 'app-files/tiles/' + sceneData.id + '/preview.jpg',
      cubeMapPreviewFaceOrder: data.previewFaceOrder
    });

    var geometry = new window.Marzipano.CubeGeometry(sceneData.levels);
    var limit = window.Marzipano.RectilinearView.limit;
    var resolutionLimiter = limit.resolution(sceneData.faceSize);
    var verticalLimiter = limit.vfov(data.minFov || (30 * Math.PI / 180), data.maxFov || (120 * Math.PI / 180));
    var horizontalLimiter = limit.hfov(data.minFov || (30 * Math.PI / 180), data.maxFov || (120 * Math.PI / 180));
    var pitchLimiter = limit.pitch(-Math.PI / 2, Math.PI / 2);
    var limiter = function(params) {
      var next = resolutionLimiter(params);
      next = verticalLimiter(next);
      next = horizontalLimiter(next);
      next = pitchLimiter(next);
      return next;
    };

    var view = new window.Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
    var entry = {
      data: sceneData,
      scene: scene,
      view: view,
      hotspotContainer: typeof scene.hotspotContainer === 'function' ? scene.hotspotContainer() : null,
      hotspots: new Map()
    };

    if (typeof view.addEventListener === 'function') {
      view.addEventListener('change', function() {
        if (activeSceneEntry && activeSceneEntry.data.id === sceneData.id) {
          updateInfoMarkerDisplayPosition();
          renderActiveSceneLights();
          syncActiveSceneSoundPlayback();
        }
      });
    }

    return entry;
  });

  function renderSceneList(activeId) {
    sceneListElement.innerHTML = scenes.map(function(entry) {
      var activeClass = entry.data.id === activeId ? ' is-active' : '';
      return '' +
        '<button class="scene-button' + activeClass + '" data-scene-id="' + escapeText(entry.data.id) + '" type="button">' +
          '<strong>' + escapeText(entry.data.name) + '</strong>' +
          '<span>' + escapeText(entry.data.fileName || entry.data.id) + '</span>' +
        '</button>';
    }).join('');

    Array.from(sceneListElement.querySelectorAll('[data-scene-id]')).forEach(function(button) {
      button.addEventListener('click', function() {
        var nextScene = scenes.find(function(entry) {
          return entry.data.id === button.dataset.sceneId;
        });

        if (nextScene) {
          switchScene(nextScene, 'fade');
          setSidebarOpen(false);
        }
      });
    });
  }

  function switchScene(entry, transitionType, viewParameters, transitionDurationMs) {
    activeSceneEntry = entry;
    beginSoundMarkerSceneTransition(transitionType, entry && entry.data ? entry.data.id : null);
    closeInfoPopup();
    entry.view.setParameters(getNormalizedViewParameters(viewParameters, entry.data.initialViewParameters));

    if (transitionType === 'instant') {
      entry.scene.switchTo({ transitionDuration: 0 });
    } else {
      entry.scene.switchTo({ transitionDuration: clamp(Number.isFinite(Number(transitionDurationMs)) ? Number(transitionDurationMs) : DEFAULT_LINK_MARKER_TRANSITION_MS, 100, 10000) });
    }

    sceneTitleElement.textContent = entry.data.name;
    renderSceneList(entry.data.id);
    renderActiveSceneMarkers();
    viewer.updateSize();
    syncAmbientAudioPlayback();
    syncActiveSceneSoundPlayback();
  }

  if (viewerStageElement) {
    viewerStageElement.addEventListener('click', function(event) {
      if (event.target === viewerStageElement || event.target === panoElement) {
        closeInfoPopup();
      }
    });
  }

  window.addEventListener('resize', function() {
    viewer.updateSize();
    renderActiveSceneMarkers();
    updateInfoMarkerDisplayPosition();
  });

  renderViewerSettings();

  if (scenes.length) {
    var initialScene = scenes.find(function(entry) {
      return entry.data.id === data.startSceneId;
    }) || scenes[0];
    renderSceneList(initialScene.data.id);
    switchScene(initialScene, 'fade');
  } else {
    sceneTitleElement.textContent = 'Sin escenas';
  }
})();

