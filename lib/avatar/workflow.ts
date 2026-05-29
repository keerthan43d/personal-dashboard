import workflowJson from "./workflow.api.json";

/**
 * A ComfyUI prompt in **API format**: a flat map keyed by node id, each node
 * carrying a `class_type` and an `inputs` object. This is what the RunPod
 * `worker-comfyui` endpoint expects — NOT the UI-format workflow you drag into
 * ComfyUI. See docs/ai-avatar-runpod-setup.md step 5.
 */
export type ComfyNode = {
  class_type: string;
  inputs: Record<string, unknown>;
  _meta?: { title?: string };
};
export type ComfyPrompt = Record<string, ComfyNode>;

/**
 * Node ids in the LTX 2.3 AI-avatar workflow that we override per generation.
 * Pinned from the provided workflow; re-confirm against your API-format export
 * if you edit the graph in ComfyUI.
 */
export const AVATAR_NODES = {
  /** LoadImage — the avatar photo. inputs.image = filename in ComfyUI input/ */
  image: "378",
  /** LoadAudio — the voice-reference clip. inputs.audio = filename */
  audio: "367",
  /** PrimitiveStringMultiline "Prompt (what to say)" — the spoken script */
  script: "373",
  /** PrimitiveStringMultiline "Reference transcribe" — transcript of the sample */
  referenceText: "353",
  /** CLIPTextEncode (positive) — motion/scene prompt for the video */
  motion: "380",
} as const;

const DEFAULT_MOTION_PROMPT =
  "Animation move of a person at the studio.\n\n" +
  "They look at the camera and talk. Accurate lipsync to the input audio.\n\n" +
  "realistic video, 4k quality, subtle natural hand movements.";

export interface BuildAvatarPromptOptions {
  imageName: string;
  audioName: string;
  script: string;
  referenceText?: string;
  motionPrompt?: string;
  /** Randomize sampler / TTS seeds so repeat runs differ. Default true. */
  randomizeSeeds?: boolean;
}

/** The raw API-format graph (frozen import). */
function getTemplate(): ComfyPrompt {
  return workflowJson as unknown as ComfyPrompt;
}

/**
 * True once the user has replaced workflow.api.json with a real API-format
 * export (i.e. the graph contains actual nodes with a class_type).
 */
export function isWorkflowConfigured(): boolean {
  const graph = getTemplate();
  return Object.values(graph).some(
    (n) => n && typeof n === "object" && typeof (n as ComfyNode).class_type === "string"
  );
}

/** Set a string-ish widget on a node, tolerant of which key the node uses. */
function setStringInput(node: ComfyNode | undefined, value: string) {
  if (!node) return;
  if ("value" in node.inputs) node.inputs.value = value;
  else if ("text" in node.inputs) node.inputs.text = value;
  else if ("string" in node.inputs) node.inputs.string = value;
  else node.inputs.value = value; // best-effort default
}

/**
 * Deep-clones the workflow template and injects this generation's inputs.
 * Missing nodes are skipped (so a placeholder graph won't throw) — callers
 * should gate on isWorkflowConfigured() first.
 */
export function buildAvatarPrompt(opts: BuildAvatarPromptOptions): ComfyPrompt {
  const {
    imageName,
    audioName,
    script,
    referenceText,
    motionPrompt,
    randomizeSeeds = true,
  } = opts;

  const graph: ComfyPrompt = structuredClone(getTemplate());

  const imageNode = graph[AVATAR_NODES.image];
  if (imageNode) imageNode.inputs.image = imageName;

  const audioNode = graph[AVATAR_NODES.audio];
  if (audioNode) audioNode.inputs.audio = audioName;

  setStringInput(graph[AVATAR_NODES.script], script);

  if (referenceText !== undefined) {
    setStringInput(graph[AVATAR_NODES.referenceText], referenceText);
  }

  const motionNode = graph[AVATAR_NODES.motion];
  if (motionNode && "text" in motionNode.inputs) {
    motionNode.inputs.text = motionPrompt?.trim() || DEFAULT_MOTION_PROMPT;
  }

  if (randomizeSeeds) {
    for (const node of Object.values(graph)) {
      if (!node || typeof node !== "object" || !node.inputs) continue;
      const seed = Math.floor(Math.random() * 1_000_000_000_000_000);
      if ("noise_seed" in node.inputs) node.inputs.noise_seed = seed;
      if ("seed" in node.inputs) node.inputs.seed = seed;
    }
  }

  return graph;
}

export { DEFAULT_MOTION_PROMPT };
