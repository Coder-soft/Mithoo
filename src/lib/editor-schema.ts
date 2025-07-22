import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from "@blocknote/core";

// The schema for our editor, which defines which blocks and inline content are allowed.
export const schema = BlockNoteSchema.create({
  blockSpecs: {
    // Adds all default blocks.
    ...defaultBlockSpecs,
  },
  inlineContentSpecs: {
    // Adds all default inline content.
    ...defaultInlineContentSpecs,
  },
  styleSpecs: {
    // Adds all default styles.
    ...defaultStyleSpecs,
  }
});