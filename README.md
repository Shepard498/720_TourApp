# 720 TourApp

720 TourApp is a browser-based editor for building interactive 360 virtual tours. It lets a user import panoramic scenes, process them into Marzipano-compatible cube tiles, place interactive markers, configure project audio, edit scene links visually, and export a standalone tour player.

Author: Gonzalo Tejera

## What The App Does

The app is split into two related experiences:

- The editor, opened from `index.html`, is where tours are created and configured.
- The exported player, based on the files in `export-player/`, is the lightweight viewer that is packaged when a tour is exported.

In the editor, a tour can include:

- Multiple 360 scenes generated from imported panorama images.
- Link hotspots that move between scenes.
- Media/info hotspots with formatted text and image, video, or audio content.
- Light effects placed directly over the panorama.
- Directional sound markers.
- Project-level and scene-level ambient audio.
- A node map for arranging scenes and creating links visually.
- Guided tutorials backed by bundled sample tour assets.

## Project Structure

```text
.
|-- index.html
|-- app.js
|-- styles.css
|-- TourBuilderAppIcon.ico
|-- lib/
|   `-- marzipano.js
|-- export-player/
|   |-- index.html
|   |-- index.js
|   |-- style.css
|   `-- index.before-sound-impl.backup.js
`-- tutorial-assets/
```

### `index.html`

Main editor markup. It defines the side navigation, project panel, scene list, marker/effects panels, node map, viewer stage, configuration overlays, tutorial overlay, and hidden file inputs.

The page loads:

- Quill from jsDelivr for rich-text editing.
- `lib/marzipano.js` for 360 viewing.
- `app.js` for all editor behavior.
- `styles.css` for the editor UI.

### `app.js`

Main editor application logic. This is where the state model, event binding, rendering, scene processing, marker editing, audio handling, save/import/export flows, tutorials, and node map behavior live.

Important responsibilities include:

- Keeping the in-memory `state` for project settings, scenes, markers, selected scene, selected marker, and processing status.
- Building multiresolution cube-map scene assets from imported panorama images.
- Rendering the editor panels, scene viewer, markers, effects, and node map.
- Managing marker types: `link`, `info`, `light`, and `sound`.
- Serializing projects to JSON or a packaged zip.
- Hydrating saved projects back into editor state.
- Building the standalone player bundle during export.

The saved project format currently uses an internal version number in `saveProjectToJson()` and related package serialization functions. If the data shape changes, update the serializer and hydrator together.

### `styles.css`

Main editor stylesheet. It controls the full app shell, side panels, viewer layout, mobile drawers, overlays, node map, marker UI, tutorial UI, and responsive behavior.

### `lib/marzipano.js`

Vendored Marzipano viewer library. The editor and exported player use it to display generated cube-map scenes.

### `export-player/`

Template files for the standalone tour viewer. When the user exports a tour, the editor packages these files with generated project data and assets.

- `index.html` is the standalone viewer HTML shell.
- `index.js` runs the exported tour experience.
- `style.css` styles the exported viewer.
- `index.before-sound-impl.backup.js` is a backup of an older player implementation before sound support.

Exported tours are structured around an `app-files/` directory that includes player code, Marzipano, generated `data.js`, scene tiles, previews, and packaged media/audio assets.

### `tutorial-assets/`

Bundled sample multiresolution tour assets used by the guided tutorials. These are not generic app assets; they support the built-in walkthroughs for importing scenes, creating markers, effects, and using the node map.

## Main User Flow

1. Open the editor in a browser.
2. Configure project settings such as name, FOV limits, and ambient audio.
3. Import panorama images as scenes.
4. The app processes scenes into cube faces and tile levels for efficient viewing.
5. Select a start scene and adjust scene view settings.
6. Add markers:
   - Link markers connect scenes.
   - Info markers show formatted text and media.
   - Light markers add visual flare effects.
   - Sound markers add directional audio.
7. Use the node map to organize scenes and create/edit relationships visually.
8. Save a project package if the tour should be edited again later.
9. Export a standalone player package when the tour is ready to publish.

## Save, Import, And Export

The app has three different persistence-related actions:

- **Guardar** creates a project package intended for restoring work in the editor.
- **Importar** reads a previous JSON or packaged project and hydrates the editor state.
- **Exportar** creates a standalone player bundle for viewing the finished tour outside the editor.

Project packages preserve editor data and binary assets needed to continue editing. Standalone exports are optimized for playback and include generated player files plus packaged scene/media/audio data.

## Running Locally

This is a static HTML/CSS/JavaScript app. There is no build step in the current repository.

Open `index.html` directly in a browser, or serve the folder with any simple static server if browser file-access restrictions get in the way of local testing.

Example:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Note: Quill is loaded from jsDelivr, so the rich-text editor needs network access unless Quill is vendored locally in the future.

## Development Notes

- The app is currently framework-free and keeps most editor behavior in `app.js`.
- Marzipano is bundled locally, so the 360 viewer does not depend on an external Marzipano CDN.
- The UI text is primarily Spanish.
- Imported scene and media assets are handled in browser memory using object URLs, data URLs, and packaged zip bytes.
- The app creates zip files manually with stored entries; there is no external zip dependency.
- Be careful when changing serialized project data. Update both save/export serialization and import/hydration paths.
- Be careful when changing marker behavior. The editor and exported player both need to understand marker data.

## Key Concepts

- **Scene**: A 360 panorama processed into Marzipano cube-map assets with preview and tile levels.
- **Marker**: An interactive point placed in a scene. Supported marker types are link, info, light, and sound.
- **Link marker**: A marker that transitions the viewer from one scene to another.
- **Info marker**: A marker that displays rich text and optional media.
- **Light marker**: A marker rendered as a visual light/flare effect.
- **Sound marker**: A marker with directional audio behavior.
- **Node map**: A visual graph-like editor for arranging scenes and managing scene relationships.
- **Standalone player**: The exported viewer package built from `export-player/` templates and generated tour data.
