import ort from "onnxruntime-node";
import path from "path";

let sessionPromise = null;

export function getOnnxSession() {
  if (!sessionPromise) {
    const modelPath = path.resolve(process.cwd(), "models", "driving_safety.onnx");
    sessionPromise = ort.InferenceSession.create(modelPath, {
      // CPU by default. Keep it simple to start.
      executionProviders: ["cpuExecutionProvider"],
    });
  }
  return sessionPromise;
}

/**
 * Run inference.
 * @param {Float32Array} inputData - flattened tensor data
 * @param {number[]} inputShape - e.g. [1, 3, 224, 224]
 * @param {string} inputName - model input key
 */
export async function runOnnx(inputData, inputShape, inputName) {
  const session = await getOnnxSession();

  const tensor = new ort.Tensor("float32", inputData, inputShape);

  const feeds = {};
  feeds[inputName] = tensor;

  const results = await session.run(feeds);
  return results;
}
