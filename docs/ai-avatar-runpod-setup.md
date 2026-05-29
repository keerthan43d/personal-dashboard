# AI Avatar Video — RunPod Serverless Setup

This is the **compute half** of the AI Avatar feature. The dashboard (built in this repo)
sends a photo + voice clip + script to a **RunPod Serverless** endpoint that runs ComfyUI
with the LTX 2.3 avatar workflow, then gets back an `.mp4`.

You do these steps once on your RunPod account. Claude does **not** touch RunPod.
When you finish, you'll hand back two things:

1. `lib/avatar/workflow.api.json` — the **API-format** export of the workflow (step 5).
2. Three env values for `.env.local` (step 7): `RUNPOD_API_KEY`, `RUNPOD_AVATAR_ENDPOINT_ID`, and the bucket vars.

> Time/cost note: the model downloads are large (tens of GB) and slow. Start step 2 early —
> you can build the dashboard in parallel while it downloads.

---

## What the workflow needs

From the workflow's own notes (`Ltx 2.3_AI Avatar_AI JIGYASA.json`):

- **Models** — from https://huggingface.co/Kijai/LTXV2_comfy
  - LTX 2.3 **22B distilled** transformer (FP8) — the main video model
  - LTX 2.3 **IC-LoRA detailer**
  - **Gemma-3 LTX 2.3 text projection** + text encoder: https://huggingface.co/unsloth/gemma-3-12b-it-GGUF
  - **Video VAE** + **Audio VAE**
  - LTX 2.3 **spatial upscaler**
- **Custom nodes**
  - `ComfyUI-QwenTTS` — voice cloning: https://github.com/1038lab/ComfyUI-QwenTTS (+ its `0.6B` TTS model)
  - `ComfyUI-VideoHelperSuite` — provides `VHS_VideoCombine` (final mp4 mux)
  - The `LTXV*` nodes (`LTXVImgToVideoInplace`, `LTXVConcatAVLatent`, `LTXVAudioVAEEncode`, etc.) are **ComfyUI core** in recent versions — no separate install, but you need an up‑to‑date ComfyUI/worker that includes them.

> The exact model **filenames** are whatever the loader nodes in the workflow expect. After you
> load the workflow (step 4), each loader's dropdown shows the filename it wants — match those.

---

## Step 1 — Create a Network Volume

RunPod → **Storage → Network Volumes → New**.
- Size: **80 GB** (LTX 22B FP8 + Gemma + VAEs + upscaler add up).
- Region: pick one that has the GPUs you want (e.g. an RTX 4090 / L40S region).

This volume holds all the heavy models so you never re-download them, and both your temp pod
(step 3–5) and the serverless endpoint (step 6) mount it.

---

## Step 2 — Spin up a temporary GPU Pod (to download + test)

RunPod → **Pods → Deploy**.
- Template: a **ComfyUI** template (e.g. "ComfyUI" or "AI-Dock ComfyUI"), or a plain PyTorch image.
- GPU: anything with **≥24 GB VRAM** (a 4090 is fine; LTX 22B FP8 is heavy).
- **Attach the network volume** from step 1 (mount at `/workspace`).
- Expose the ComfyUI port (usually `8188`) via HTTP.

Open ComfyUI's web UI from the pod's "Connect" menu.

---

## Step 3 — Install custom nodes + download models (on the pod)

In ComfyUI, install **ComfyUI-Manager** if it isn't already, then install:
- **ComfyUI-QwenTTS** (`1038lab/ComfyUI-QwenTTS`)
- **ComfyUI-VideoHelperSuite**

Then download the models into the volume. Open the pod terminal and, **inside your ComfyUI
`models/` folder on the volume**, place files by role:

```
models/
  diffusion_models/   ← LTX 2.3 22B distilled FP8 transformer
  loras/              ← LTX 2.3 IC-LoRA detailer
  text_encoders/      ← Gemma-3 LTX 2.3 text projection / encoder (GGUF)
  vae/                ← LTX video VAE  AND  audio VAE
  upscale_models/     ← LTX 2.3 spatial upscaler
```

Use `huggingface-cli download Kijai/LTXV2_comfy --local-dir ...` (and the unsloth Gemma repo)
to pull them. The QwenTTS 0.6B model downloads automatically on first run, or per that repo's README.

> If a loader in the workflow can't find its file, the dropdown will be empty — that's your
> signal the file is in the wrong folder or misnamed.

---

## Step 4 — Load the workflow and run it once

1. Drag `Ltx 2.3_AI Avatar_AI JIGYASA.json` into ComfyUI.
2. Fix any **red** (missing) nodes — install whatever Manager flags.
3. In each loader node, pick the model file you downloaded.
4. Put a test photo in the **LoadImage** node and a short (5–15s) voice clip in **LoadAudio**.
5. **Queue Prompt.** First run is slow (model load). Confirm you get a talking-head mp4 out of
   the `VHS_VideoCombine` node.

This proves the volume + nodes + models all work before you pay for a serverless endpoint.

---

## Step 5 — Export the workflow in **API format**  ⭐ (hand this to Claude)

In ComfyUI: **Settings (gear) → enable "Dev mode options"** → a **"Save (API Format)"** button
appears next to the normal Save. Click it.

This produces a different JSON (a flat map keyed by node id, each with `class_type` + `inputs`) —
**that** is what RunPod needs. The file you originally shared is the UI format and won't run on the worker.

Save that file and drop its contents into the repo at:

```
lib/avatar/workflow.api.json
```

(There's a placeholder there now; replace it.) The dashboard patches node **378** (photo),
**367** (voice clip), **373** (script), and **353** (reference transcript) on this graph.

---

## Step 6 — Deploy the Serverless endpoint

Use the official **`runpod/worker-comfyui`** worker, extended with our two custom nodes.

**6a. Build a small custom image** (so QwenTTS + VHS are present). Create this `Dockerfile`:

```dockerfile
FROM runpod/worker-comfyui:latest

# Custom nodes the workflow needs (LTX nodes are already in ComfyUI core)
RUN comfy-node-install comfyui-videohelpersuite \
 && comfy-node-install https://github.com/1038lab/ComfyUI-QwenTTS
```

Push it to Docker Hub (or use RunPod's GitHub-repo build).

> Make sure the base `runpod/worker-comfyui` is a **recent** tag whose ComfyUI includes the
> LTX 2.3 (`LTXVImgToVideoInplace`, `LTXVConcatAVLatent`, …) core nodes. If those nodes come up
> missing on the worker, bump the base image tag.

**6b. Create the endpoint.** RunPod → **Serverless → New Endpoint**.
- Container image: the image you just built.
- **Attach the network volume** from step 1 (mounts at `/runpod-volume`). Point ComfyUI at the
  volume's models via `extra_model_paths.yaml` (the worker docs show how) so you don't bake 80 GB
  into the image.
- GPU: ≥24 GB. Set **Max workers** = 1 to start; **Idle timeout** low (e.g. 5s) so it scales to zero.

**6c. Enable mp4 output via a bucket** (recommended — videos are too big for inline base64).
On the endpoint, set the S3-compatible bucket env vars so finished files come back as a **URL**:

```
BUCKET_ENDPOINT_URL = https://<your-s3-endpoint>
BUCKET_ACCESS_KEY_ID = <key>
BUCKET_SECRET_ACCESS_KEY = <secret>
```

(Any S3-compatible store works — RunPod S3, Cloudflare R2, AWS S3, Backblaze.) If you skip this,
the worker returns base64 and the dashboard handles it as a fallback, but URLs are far better.

---

## Step 7 — Grab credentials for the dashboard

Add to `.env.local` in this repo:

```
RUNPOD_API_KEY=<RunPod → Settings → API Keys>
RUNPOD_AVATAR_ENDPOINT_ID=<the endpoint id from step 6b>

# only if you set up the bucket in 6c (lets the dashboard re-host / verify URLs):
RUNPOD_BUCKET_ENDPOINT_URL=
RUNPOD_BUCKET_ACCESS_KEY_ID=
RUNPOD_BUCKET_SECRET_ACCESS_KEY=
```

---

## How input/output flows (so the wiring makes sense)

- **Input:** the dashboard sends the photo and the voice clip as `input.images[]`
  (`{ name, image: <base64> }`). The worker writes both into ComfyUI's `input/` folder by name.
  The patched workflow's `LoadImage` (node 378) and `LoadAudio` (node 367) then read them by filename.
- **Run:** dashboard `POST`s to `https://api.runpod.ai/v2/<endpoint>/run` (async) → gets a job id.
- **Poll:** dashboard `GET`s `https://api.runpod.ai/v2/<endpoint>/status/<id>` until `COMPLETED`.
- **Output:** the worker returns the `VHS_VideoCombine` mp4 — as a bucket **URL** (if 6c) or base64.
  The dashboard saves it and renders `<video>`.

---

## Checklist before you tell Claude "go"

- [ ] Network volume created, models downloaded, workflow ran clean on the pod (step 4)
- [ ] `lib/avatar/workflow.api.json` replaced with your **API-format** export (step 5)
- [ ] Serverless endpoint live with QwenTTS + VHS nodes (step 6)
- [ ] `.env.local` has `RUNPOD_API_KEY` + `RUNPOD_AVATAR_ENDPOINT_ID` (+ bucket vars) (step 7)
