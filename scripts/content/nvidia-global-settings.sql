-- Local review: npx wrangler d1 execute DB --local --file=scripts/content/nvidia-global-settings.sql
-- Published status is required by the public blog route, even for local review.
-- Production sync approved October 6, 2026. Apply with --remote to publish.
-- Artwork was uploaded to R2 before publication; the public/images copy is the source archive.
PRAGMA foreign_keys = ON;

-- Keep the same local-review post if it was created under the earlier GPU-specific slug.
UPDATE content SET slug = 'nvidia-global-settings'
WHERE id = 'bdbd4174-317b-46aa-a621-6d193b718531'
  AND slug = 'nvidia-global-settings-rtx-5080';

INSERT INTO content (
  id, slug, title, markdown, page_type, status, author_id,
  published_at, created_at, updated_at, featured_image_url
)
VALUES (
  'bdbd4174-317b-46aa-a621-6d193b718531',
  'nvidia-global-settings',
  'NVIDIA global settings for G-SYNC: defaults and exceptions',
  'This guide assumes an NVIDIA GPU and a G-SYNC or G-SYNC Compatible monitor, with variable refresh enabled. Start with most NVIDIA global graphics settings at their defaults, then use Program Settings for games that need an exception.

The settings below favor image quality without forcing extra processing on every game. Competitive players who accept tearing, VR users, and people running CUDA applications will need some exceptions. Shader Cache has two controls, so its size and compiler get separate explanations.

If you use a fixed-refresh monitor, choose V-Sync and FPS limits per game. The G-SYNC setup described here requires a variable-refresh display.

*Reviewed October 6, 2026. These are recommendations, not benchmark results. Available options depend on your driver, GPU, and display.*

## Check which features your hardware supports

Most of these defaults work across NVIDIA GPUs. Feature availability is the main difference:

- **DLSS:** Super Resolution and DLAA require RTX hardware. DLSS Frame Generation supports RTX 40- and 50-series GPUs; Multi Frame Generation and its dynamic mode require RTX 50-series hardware. [NVIDIA''s hardware support table](https://www.nvidia.com/en-us/geforce/technologies/dlss/)
- **Smooth Motion:** NVIDIA supports it on RTX 40- and 50-series cards with compatible drivers and games. [Smooth Motion support](https://www.nvidia.com/en-us/geforce/news/nvidia-app-global-dlss-overrides-rtx-40-series-smooth-motion/)
- **G-SYNC:** This guide assumes G-SYNC is enabled on a G-SYNC or G-SYNC Compatible display. Check the selected monitor and display mode in the G-SYNC setup controls.

Skip controls your hardware does not offer. On a laptop, also consider battery life when choosing a GPU or performance policy.

## Recommended global settings for G-SYNC

| Setting | Global default |
| --- | --- |
| DLSS Override – Model Presets | Recommended |
| DLSS Override – Frame Generation Mode | Use 3D app setting |
| DLSS Override – Super Resolution Mode | Use 3D app setting |
| Smooth Motion | Off |
| Low Latency Mode | Off; use in-game Reflex where available |
| CUDA Memory Fallback | Driver Default |
| DSR – Factors | Off |
| GPU App Assignment | Your NVIDIA gaming GPU |
| Image Scaling | Off |
| Max Frame Rate | Off globally; choose a G-SYNC cap per game when needed |
| Monitor Technology | G-SYNC / G-SYNC Compatible |
| OpenGL GDI Compatibility | Auto |
| Power Management Mode | Normal |
| RTX Dynamic Vibrance | Off |
| Shader Cache size | Driver Default |
| Shader Compiler / Auto Shader Compilation | Off initially; optional |
| Vertical Sync | On for this G-SYNC setup |
| Virtual Reality – Variable Rate Super Sampling | Off |
| Vulkan/OpenGL Present Method | Auto |

To change a setting for one game, select its executable under **Graphics → Program Settings**. Save a screenshot of your original values before editing them.

## DLSS model presets: Recommended

**Why:** Recommended selects a model preset for supported DLSS modes and lets you use NVIDIA''s model updates without choosing preset letters yourself. [NVIDIA''s DLSS preset explanation](https://www.nvidia.com/en-ph/geforce/news/dlss-4-5-dynamic-multi-frame-gen-6x-2nd-gen-transformer-super-res/)

**Change it when:** A game develops ghosting, unstable fine detail, or worse performance after an update. Compare its own model with Recommended in the same scene. Keep a custom preset if it fixes the problem.

On RTX 20- and 30-series cards, the newer DLSS 4.5 models can have a larger performance cost. Compare Recommended with a lighter model or the game''s own setting before keeping the override. [NVIDIA''s older-GPU guidance](https://www.nvidia.com/en-us/geforce/news/nvidia-app-dlss-4-5-dynamic-multi-frame-generation-available-now/)

NVIDIA can update what Recommended selects. A preset letter from an older guide may no longer be the best choice.

## DLSS frame generation mode: Use 3D app setting

**Why:** Start with the game''s frame-generation controls so you can judge the result before applying a driver override.

**Change it when:** You want to try an available frame-generation override in a supported game. On RTX 50-series cards, NVIDIA offers Dynamic Multi Frame Generation, which adjusts the multiplier toward a target frame rate. [NVIDIA''s frame-generation update](https://www.nvidia.com/en-us/geforce/news/nvidia-app-dlss-4-5-dynamic-multi-frame-generation-available-now/)

Try it first in a demanding single-player game. Check mouse response and moving UI elements as well as FPS. A higher counter can still come with sluggish input or visual artifacts.

## DLSS super resolution mode: Use 3D app setting

**Why:** Keep the choice between DLAA and DLSS quality modes in the game''s menu. The right choice depends on your resolution and how much performance you need. [NVIDIA''s DLSS quality-mode overview](https://developer.nvidia.com/blog/?p=65089)

**Change it when:** A supported game''s menu lacks the mode you want. Start with Quality; try Balanced or Performance if you need more FPS. Watch foliage and thin objects in motion, where image-quality differences can be easier to spot.

This control chooses the quality mode. Model Presets chooses the model that processes it. You can leave the mode to the game and still use Recommended presets.

## Smooth Motion: Off

**Why:** Smooth Motion generates an intermediate frame at the driver level for compatible games without DLSS Frame Generation. Leave it off until you have a game that needs it. [NVIDIA''s Smooth Motion overview](https://www.nvidia.com/en-us/geforce/news/nvidia-app-global-dlss-overrides-rtx-40-series-smooth-motion/)

**Change it when:** A supported game lacks native frame generation and you want smoother-looking motion. Try it in a slower-paced single-player game, checking for artifacts and changes in camera response.

Use one frame-generation system at a time. NVIDIA warns against combining Smooth Motion with native DLSS Frame Generation. [NVIDIA''s compatibility guidance](https://docs.nvidia.com/datacenter/tesla/driver-installation-guide/gaming.html)

## Low Latency Mode: Off globally

**Why:** Enable Reflex in games that offer it. Reflex coordinates CPU and GPU work within the game and takes precedence over the driver''s Ultra Low Latency mode. [NVIDIA''s latency guide](https://www.nvidia.com/en-us/geforce/guides/system-latency-optimization-guide/)

**Change it when:** A game has no Reflex option. Try On, then Ultra in its profile, and check responsiveness and frame pacing. Results depend on the game''s rendering path and workload.

Start Reflex at On. If On + Boost is available, compare it separately and check power use and temperatures.

## CUDA Memory Fallback: Driver Default

**Why:** Driver Default leaves CUDA memory management with the driver. NVIDIA documents system-memory fallback as a way to keep Stable Diffusion running when dedicated GPU memory runs short, at a cost in speed. [NVIDIA''s fallback explanation](https://nvidia.custhelp.com/app/answers/detail/a_id/5490/)

**Change it when:** You run local AI, rendering, or another CUDA application and have identified memory fallback as a problem. Prefer No Sysmem Fallback can make an oversized workload fail rather than continue slowly. Allowing fallback may be preferable when finishing the job matters more than speed.

Apply the change to the process doing the work, such as its Python executable.

## DSR – Factors: Off

**Why:** DSR and DLDSR render above the display''s native resolution, then downsample the result. Leave them off while you set up the game at native resolution. [NVIDIA''s DLDSR explanation](https://www.nvidia.com/en-us/geforce/news/gfecnt/20221/god-of-war-game-ready-driver/)

**Change it when:** An older or lighter game has spare GPU capacity and you want cleaner edges or less shimmering. Enable a factor, then select the higher resolution in the game. Checking the factor only makes that resolution available.

Check FPS and UI readability at the higher resolution. Leave the Windows desktop at its normal resolution unless the game requires otherwise.

## GPU App Assignment: Your NVIDIA gaming GPU

**Why:** Assign games to the NVIDIA GPU you intend to use for gaming. On a desktop with one dedicated GPU, that choice is usually straightforward.

**Change it when:** You have multiple GPUs and need to direct work to a specific device. Integrated graphics can also be appropriate for lightweight applications, especially on a laptop where battery life matters.

Windows can override the driver''s application GPU preference. If a game launches on the wrong adapter, check **Windows Settings → System → Display → Graphics** too. [NVIDIA''s GPU-assignment guidance](https://www.nvidia.com/content/Control-Panel-Help/vLatest/en-us/mergedProjects/nv3d/Setting_the_Preferred_Graphics_Processor.htm)

## Image Scaling: Off

**Why:** NVIDIA Image Scaling upscales a lower-resolution image and adds sharpening. Leave it off while choosing the game''s own rendering or upscaling mode. [NVIDIA''s Image Scaling guide](https://www.nvidia.com/en-us/geforce/news/nvidia-image-scaler-dlss-rtx-november-2021-updates/)

**Change it when:** A game lacks a useful built-in upscaler and you need to render at a lower resolution for performance. Try Image Scaling with that lower resolution and adjust sharpening conservatively.

Check text and fine detail. Add sharpening only if it improves the image at your normal viewing distance.

## Max Frame Rate: Off globally

**Why:** Leaving this off lets you choose a cap per game. A cap can reduce power use when the GPU would otherwise render frames you do not need. [NVIDIA''s frame-limit guidance](https://nvidia.custhelp.com/app/answers/detail/a_id/4958/)

**Change it when:** You want to stay below a G-SYNC display''s refresh ceiling, reduce heat, or settle on a sustainable performance target. Start with the in-game limiter if it produces stable pacing; use the driver''s per-game cap if the game lacks a good one.

Use a global cap if you want one target for nearly every game. Check how it interacts with Reflex and frame generation first.

## Monitor Technology: G-SYNC

**Why:** Use G-SYNC with a compatible variable-refresh display. Confirm that it is enabled for the intended monitor and display mode in the separate G-SYNC setup controls. [NVIDIA''s setup instructions](https://www.nvidia.com/content/Control-Panel-Help/vLatest/en-us/mergedProjects/nvdsp/To_use_variable_refresh_rates.htm)

**Change it when:** You use a fixed-refresh monitor or a supported strobing mode. For a game that flickers with variable refresh, try fixed refresh in its profile.

The value shown here is only part of the setup. Check the monitor''s own adaptive-sync control and Windows'' selected refresh rate as well.

## OpenGL GDI Compatibility: Auto

**Why:** This controls compatibility between OpenGL applications and Windows GDI. Auto leaves that choice to the driver. [NVIDIA''s driver-setting reference](https://docs.nvidia.com/nvapi/NvApiDriverSettings_8h.html)

**Change it when:** An OpenGL application has a repeatable display problem and its vendor recommends a different mode. Change that executable''s profile and restore Auto if it does not help.

## Power Management Mode: Normal

**Why:** Normal lets the driver adjust GPU performance to the workload, avoiding higher performance states when an application does not need them. NVIDIA documents Prefer Maximum Performance as a possible fix for poor performance caused by incorrect clock throttling. [NVIDIA''s power-management guidance](https://nvidia.custhelp.com/app/answers/detail/a_id/3130/kw/toggle/related/1)

**Change it when:** Repeatable stutters or performance drops correlate with GPU clock changes, and a comparison shows Prefer Maximum Performance helps. Apply it to that game and monitor temperatures and power use.

Keep Prefer Maximum Performance only where you can reproduce a benefit.

## RTX Dynamic Vibrance: Off

**Why:** Off preserves the game''s original colors. Dynamic Vibrance changes them with a filter. [NVIDIA''s filter description](https://blogs.nvidia.com/blog/ai-studio-app-geforce-rtx-remix/)

**Change it when:** You prefer stronger colors or find a modest adjustment helps you distinguish elements in one game. Tune it per game and compare several scenes, including dark areas and bright effects.

Use it if you prefer the result. Tune it for each game''s palette.

## Shader Cache size: Driver Default

**Why:** The cache stores compiled shaders for reuse. Its size limit controls storage, not a fixed FPS boost. NVIDIA''s support guidance currently identifies Driver Default as 16 GB. [NVIDIA''s shader-cache guidance](https://nvidia.custhelp.com/app/answers/detail/a_id/5735/)

**Change it when:** You want to retain more cached data and have plenty of disk space. Unlimited removes the size ceiling without reserving that space in advance. Keep a limit on a crowded SSD.

Leave a working cache alone. Clearing it requires shaders to be recreated.

## Shader Compiler: Off initially

**Why:** NVIDIA introduced Auto Shader Compilation as a beta feature. It rebuilds previously generated DirectX 12 shaders after driver updates, while the system is idle or on demand. Leave it off initially if you prefer to avoid beta features. [NVIDIA''s compilation overview](https://www.nvidia.com/en-us/geforce/news/nvidia-app-dlss-4-5-dynamic-multi-frame-generation-available-now/)

**Change it when:** You frequently update drivers and want shaders rebuilt before your next gaming session. Enable it and review any resource controls.

A newly installed game still needs its initial shader generation. The normal shader cache works with this compiler toggle off.

## Vertical Sync: On for this G-SYNC setup

**Why:** For tear-free G-SYNC gaming, NVIDIA recommends V-Sync together with Reflex or Ultra Low Latency Mode. In that supported combination, an automatic cap keeps FPS below the display''s refresh ceiling. [NVIDIA''s synchronization guidance](https://www.nvidia.com/en-us/geforce/guides/system-latency-optimization-guide/)

**Change it when:** You prioritize the lowest possible latency and accept tearing. Disable V-Sync in that game''s profile and its menu, then compare the result. On a fixed-refresh display, choose V-Sync according to that game''s latency and tearing tradeoff.

For fullscreen games, start with driver V-Sync On and in-game V-Sync Off. NVIDIA notes that windowed games may need in-game V-Sync instead. Verify the combination in the display mode you actually use.

## Virtual Reality – Variable Rate Super Sampling: Off

**Why:** VRSS is a specialized image-quality feature for supported VR applications. NVIDIA describes support for compatible DirectX 11 titles using forward rendering and MSAA. It has no role in the ordinary monitor setup covered here. [NVIDIA''s VRSS requirements](https://developer.nvidia.com/vrworks/graphics/variablerateshading)

**Change it when:** You use a supported VR title and have GPU headroom. Try Adaptive in that game''s profile and judge image quality while watching whether the headset maintains its target frame rate.

Keep supersampling only if the headset holds its target frame rate.

## Vulkan/OpenGL Present Method: Auto

**Why:** Auto lets the driver choose how Vulkan and OpenGL applications present frames. [NVIDIA''s setting definitions](https://docs.nvidia.com/nvapi/NvApiDriverSettings_8h.html)

**Change it when:** One application has a repeatable presentation problem, such as trouble in a specific window mode. Compare the available methods in that program''s profile and keep a change only if it resolves the issue.

## Set up G-SYNC and the frame cap

The caps below are for keeping FPS within a variable-refresh display''s G-SYNC range. They are not a general prescription for fixed-refresh monitors.

First confirm your display runs at the refresh rate you expect and G-SYNC is enabled for it. NVIDIA provides fullscreen and windowed options; choose the one appropriate to your games and check actual behavior. [G-SYNC setup](https://www.nvidia.com/content/Control-Panel-Help/vLatest/en-us/mergedProjects/nvdsp/To_use_variable_refresh_rates.htm)

**If the game has Reflex:** enable it, use the V-Sync arrangement described above, and check whether FPS already settles below refresh. Avoid adding another limiter by habit.

**If the game lacks Reflex:** set a manual cap below refresh, or test a supported Ultra Low Latency configuration. For manual caps, these are practical starting values:

| Display refresh | Starting cap |
| --- | --- |
| 120 Hz | 117 FPS |
| 144 Hz | 141 FPS |
| 165 Hz | 162 FPS |
| 240 Hz | 237 FPS |

These are starting points with a three-FPS margin, not measured optima. Lower the cap if the limiter overshoots. If the game rarely reaches the display ceiling, choose a lower target it can sustain.

With frame generation active, check how the game''s limiter interacts with it. Start with the game''s controls and one limiter.

## Check each change

Use the same repeatable scene and change one setting at a time. Compare responsiveness, visible artifacts, and frame pacing alongside average FPS. Check power or temperatures when they motivated the change.

Keep exceptions in Program Settings and record what they fixed. After a game or driver update, revisit them if the original problem disappears.',
  'post',
  'published',
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  'https://media.orboro.net/images/nvidia-global-settings-header.webp'
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  markdown = excluded.markdown,
  page_type = excluded.page_type,
  status = excluded.status,
  published_at = COALESCE(content.published_at, excluded.published_at),
  updated_at = excluded.updated_at,
  featured_image_url = excluded.featured_image_url;

INSERT OR IGNORE INTO content_categories (content_id, category_id)
SELECT
  (SELECT id FROM content WHERE slug = 'nvidia-global-settings'),
  id
FROM categories
WHERE slug = 'gaming';

INSERT INTO media (id, url, alt_text, caption, created_by, created_at)
VALUES (
  'e0c97a16-991e-4f1b-8f69-d9d0f22218de',
  'https://media.orboro.net/images/nvidia-global-settings-header.webp',
  'Cartoon JD at a gaming desk, considering graphics settings beside a fantasy game preview and a PC tower.',
  'Header artwork for NVIDIA global settings for G-SYNC: defaults and exceptions.',
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
)
ON CONFLICT(id) DO UPDATE SET
  url = excluded.url,
  alt_text = excluded.alt_text,
  caption = excluded.caption;
