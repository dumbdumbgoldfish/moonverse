import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MOONIE_OPENAI_TEXT_MODEL_DEFAULT,
  MOONIE_OPENAI_VISION_MODEL_DEFAULT,
  resolveOpenAiTextModel,
  resolveOpenAiVisionModel,
  supportsCustomTemperature,
} from "./openai";

describe("resolveOpenAiTextModel", () => {
  it("defaults to gpt-5.6-luna", () => {
    const previous = process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MODEL;
    try {
      assert.equal(resolveOpenAiTextModel(), MOONIE_OPENAI_TEXT_MODEL_DEFAULT);
      assert.equal(MOONIE_OPENAI_TEXT_MODEL_DEFAULT, "gpt-5.6-luna");
    } finally {
      if (previous === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = previous;
    }
  });

  it("respects OPENAI_MODEL override", () => {
    const previous = process.env.OPENAI_MODEL;
    process.env.OPENAI_MODEL = "gpt-5.6-terra";
    try {
      assert.equal(resolveOpenAiTextModel(), "gpt-5.6-terra");
    } finally {
      if (previous === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = previous;
    }
  });
});

describe("resolveOpenAiVisionModel", () => {
  it("defaults to gpt-5.6-terra", () => {
    const previousModel = process.env.OPENAI_MODEL;
    const previousVision = process.env.OPENAI_VISION_MODEL;
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_VISION_MODEL;
    try {
      assert.equal(resolveOpenAiVisionModel(), MOONIE_OPENAI_VISION_MODEL_DEFAULT);
      assert.equal(MOONIE_OPENAI_VISION_MODEL_DEFAULT, "gpt-5.6-terra");
    } finally {
      if (previousModel === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = previousModel;
      if (previousVision === undefined) delete process.env.OPENAI_VISION_MODEL;
      else process.env.OPENAI_VISION_MODEL = previousVision;
    }
  });

  it("prefers OPENAI_VISION_MODEL over OPENAI_MODEL", () => {
    const previousModel = process.env.OPENAI_MODEL;
    const previousVision = process.env.OPENAI_VISION_MODEL;
    process.env.OPENAI_MODEL = "gpt-5.6-luna";
    process.env.OPENAI_VISION_MODEL = "gpt-5.6-sol";
    try {
      assert.equal(resolveOpenAiVisionModel(), "gpt-5.6-sol");
    } finally {
      if (previousModel === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = previousModel;
      if (previousVision === undefined) delete process.env.OPENAI_VISION_MODEL;
      else process.env.OPENAI_VISION_MODEL = previousVision;
    }
  });
});

describe("supportsCustomTemperature", () => {
  it("returns false for gpt-5.6 models", () => {
    assert.equal(supportsCustomTemperature("gpt-5.6-luna"), false);
    assert.equal(supportsCustomTemperature("gpt-5.6-terra"), false);
  });

  it("returns true for other models", () => {
    assert.equal(supportsCustomTemperature("gpt-4o-mini"), true);
  });
});
