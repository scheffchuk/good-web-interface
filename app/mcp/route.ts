import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

async function fetchLatestDocs(): Promise<string | null> {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/raunofreiberg/interfaces/main/README.md"
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const content = await response.text();
    return content.trim();
  } catch (error) {
    console.error("Failed to fetch latest docs:", error);
    return null;
  }
}

const guidelines = {
  interactivity: [
    "Clicking the input label should focus the input field",
    "Inputs should be wrapped with a <form> to submit by pressing Enter",
    "Inputs should have an appropriate type like password, email, etc",
    "Inputs should disable spellcheck and autocomplete attributes most of the time",
    "Inputs should leverage HTML form validation by using the required attribute when appropriate",
    "Input prefix and suffix decorations should be absolutely positioned on top of the text input with padding, not next to it, and trigger focus on the input",
    "Toggles should immediately take effect, not require confirmation",
    "Buttons should be disabled after submission to avoid duplicate network requests",
    "Interactive elements should disable user-select for inner content",
    "Decorative elements (glows, gradients) should disable pointer-events to not hijack events",
    "Interactive elements in a vertical or horizontal list should have no dead areas between each element, instead, increase their padding",
  ],
  typography: [
    "Fonts should have -webkit-font-smoothing: antialiased applied for better legibility",
    "Fonts should have text-rendering: optimizeLegibility applied for better legibility",
    "Fonts should be subset based on the content, alphabet or relevant language(s)",
    "Font weight should not change on hover or selected state to prevent layout shift",
    "Font weights below 400 should not be used",
    "Medium sized headings generally look best with a font weight between 500-600",
    "Adjust values fluidly by using CSS clamp(), e.g. clamp(48px, 5vw, 72px) for the font-size of a heading",
    "Where available, tabular figures should be applied with font-variant-numeric: tabular-nums, particularly in tables or when layout shifts are undesirable, like in timers",
    "Prevent text resizing unexpectedly in landscape mode on iOS with -webkit-text-size-adjust: 100%",
  ],
  motion: [
    "Switching themes should not trigger transitions and animations on elements",
    "Animation duration should not be more than 200ms for interactions to feel immediate",
    "Animation values should be proportional to the trigger size: Don't animate dialog scale in from 0 → 1, fade opacity and scale from ~0.8",
    "Don't scale buttons on press from 1 → 0.8, but ~0.96, ~0.9, or so",
    "Actions that are frequent and low in novelty should avoid extraneous animations: Opening a right click menu, Deleting or adding items from a list, Hovering trivial buttons",
    "Looping animations should pause when not visible on the screen to offload CPU and GPU usage",
    "Use scroll-behavior: smooth for navigating to in-page anchors, with an appropriate offset",
  ],
  touch: [
    "Hover states should not be visible on touch press, use @media (hover: hover)",
    "Font size for inputs should not be smaller than 16px to prevent iOS zooming on focus",
    "Inputs should not auto focus on touch devices as it will open the keyboard and cover the screen",
    "Apply muted and playsinline to <video /> tags to auto play on iOS",
    "Disable touch-action for custom components that implement pan and zoom gestures to prevent interference from native behavior like zooming and scrolling",
    "Disable the default iOS tap highlight with -webkit-tap-highlight-color: rgba(0,0,0,0), but always replace it with an appropriate alternative",
  ],
  accessibility: [
    "Disabled buttons should not have tooltips, they are not accessible",
    "Box shadow should be used for focus rings, not outline which won't respect radius",
    "Focusable elements in a sequential list should be navigable with ↑ ↓",
    "Focusable elements in a sequential list should be deletable with ⌘ Backspace",
    "To open immediately on press, dropdown menus should trigger on mousedown, not click",
    "Use a svg favicon with a style tag that adheres to the system theme based on prefers-color-scheme",
    "Icon only interactive elements should define an explicit aria-label",
    "Tooltips triggered by hover should not contain interactive content",
    "Images should always be rendered with <img> for screen readers and ease of copying from the right click menu",
    "Illustrations built with HTML should have an explicit aria-label instead of announcing the raw DOM tree to people using screen readers",
    "Gradient text should unset the gradient on ::selection state",
    "When using nested menus, use a prediction cone to prevent the pointer from accidentally closing the menu when moving across other elements",
  ],
  optimizations: [
    "Large blur() values for filter and backdrop-filter may be slow",
    "Scaling and blurring filled rectangles will cause banding, use radial gradients instead",
    "Sparingly enable GPU rendering with transform: translateZ(0) for unperformant animations",
    "Toggle will-change on unperformant scroll animations for the duration of the animation",
    "Auto-playing too many videos on iOS will choke the device, pause or even unmount off-screen videos",
    "Bypass React's render lifecycle with refs for real-time values that can commit to the DOM directly",
    "Detect and adapt to the hardware and network capabilities of the user's device",
  ],
  design: [
    "Optimistically update data locally and roll back on server error with feedback",
    "Authentication redirects should happen on the server before the client loads to avoid janky URL changes",
    "Style the document selection state with ::selection",
    "Display feedback relative to its trigger: Show a temporary inline checkmark on a successful copy, not a notification",
    "Highlight the relevant input(s) on form error(s)",
    "Empty states should prompt to create a new item, with optional templates",
  ],
} as const;

type Category = keyof typeof guidelines;
const categories = Object.keys(guidelines) as Category[];

const quickTips = {
  forms: [
    "Inputs should be wrapped with a <form> to submit by pressing Enter",
    "Use appropriate input types like password, email, etc",
    "Font size for inputs should not be smaller than 16px to prevent iOS zooming on focus",
    "Clicking the input label should focus the input field",
    "Inputs should disable spellcheck and autocomplete attributes most of the time",
    "Use HTML form validation with the required attribute when appropriate",
  ],
  buttons: [
    "Buttons should be disabled after submission to avoid duplicate network requests",
    "Disabled buttons should not have tooltips, they are not accessible",
    "Icon only interactive elements should define an explicit aria-label",
    "Hover states should not be visible on touch press, use @media (hover: hover)",
    "Don't scale buttons on press from 1 → 0.8, but ~0.96, ~0.9, or so",
  ],
  animations: [
    "Animation duration should not be more than 200ms for interactions to feel immediate",
    "Looping animations should pause when not visible on the screen to offload CPU and GPU usage",
    "Animation values should be proportional to the trigger size",
    "Switching themes should not trigger transitions and animations on elements",
    "Actions that are frequent and low in novelty should avoid extraneous animations",
  ],
  mobile: [
    "Hover states should not be visible on touch press, use @media (hover: hover)",
    "Font size for inputs should not be smaller than 16px to prevent iOS zooming on focus",
    "Inputs should not auto focus on touch devices as it will open the keyboard and cover the screen",
    "Apply muted and playsinline to <video /> tags to auto play on iOS",
    "Disable the default iOS tap highlight with -webkit-tap-highlight-color: rgba(0,0,0,0), but always replace it with an appropriate alternative",
  ],
  accessibility: [
    "Disabled buttons should not have tooltips, they are not accessible",
    "Box shadow should be used for focus rings, not outline which won't respect radius",
    "Icon only interactive elements should define an explicit aria-label",
    "Images should always be rendered with <img> for screen readers and ease of copying from the right click menu",
    "Illustrations built with HTML should have an explicit aria-label instead of announcing the raw DOM tree",
  ],
  optimizations: [
    "Large blur() values for filter and backdrop-filter may be slow",
    "Scaling and blurring filled rectangles will cause banding, use radial gradients instead",
    "Sparingly enable GPU rendering with transform: translateZ(0) for unperformant animations",
    "Auto-playing too many videos on iOS will choke the device, pause or even unmount off-screen videos",
    "Detect and adapt to the hardware and network capabilities of the user's device",
  ],
} as const;

type Scenario = keyof typeof quickTips;
const scenarios = Object.keys(quickTips) as Scenario[];

// Utility functions
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const formatList = (items: readonly string[]) => items.map((i) => `- ${i}`).join("\n");
const fmtSection = (heading: string, items: readonly string[]) => `## ${heading}\n${formatList(items)}`;
const fmtAllGuidelines = () => categories.map((cat) => fmtSection(titleCase(cat), guidelines[cat])).join("\n\n");

// Pattern validation utilities
const splitOnFirst = (text: string, tokens: RegExp) => {
  const m = text.match(tokens);
  if (!m) return null;
  const idx = m.index ?? -1;
  if (idx < 0) return null;
  return {
    before: text.slice(0, idx).trim(),
    token: m[0],
    after: text.slice(idx + m[0].length).trim(),
  };
};

const NEG_RE = /\b(avoid|don'?t|do not|prevent)\b/i;
const POS_RE = /\b(use|apply|ensure|leverage|should)\b/i;

const handler = createMcpHandler(
  async (server) => {
    server.tool(
      "get_guidelines",
      "Get web interface guidelines by category",
      {
        category: z
          .enum(["interactivity", "typography", "motion", "touch", "accessibility", "optimizations", "design", "all"])
          .optional(),
      },
      async ({ category = "all" }) => {
        if (category === "all") {
          return { content: [{ type: "text", text: fmtAllGuidelines() }] };
        }

        const categoryGuidelines = guidelines[category];
        if (!categoryGuidelines) {
          return {
            content: [
              {
                type: "text",
                text: `Category "${category}" not found. Available categories: ${categories.join(", ")}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: fmtSection(`${titleCase(category)} Guidelines`, categoryGuidelines),
            },
          ],
        };
      }
    );

    server.tool(
      "search_guidelines",
      "Search for specific guidelines by keyword",
      {
        query: z.string(),
      },
      async ({ query }) => {
        const q = query.trim().toLowerCase();
        if (!q) {
          return {
            content: [{ type: "text", text: "Query cannot be empty." }],
          };
        }

        const results: string[] = [];
        for (const cat of categories) {
          for (const rule of guidelines[cat]) {
            if (rule.toLowerCase().includes(q)) {
              results.push(`**${cat}**: ${rule}`);
            }
          }
        }

        if (results.length === 0) {
          return {
            content: [
              { type: "text", text: `No guidelines found matching "${query}"` },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Found ${results.length} guidelines matching "${query}":\n\n${results.join("\n\n")}`,
            },
          ],
        };
      }
    );

    server.tool(
      "validate_pattern",
      "Validate interface patterns against guidelines",
      {
        pattern: z.string(),
        category: z
          .enum(categories as [Category, ...Category[]])
          .optional(),
      },
      async ({ pattern, category }) => {
        const pat = pattern.trim();
        const patLower = pat.toLowerCase();

        const source: Partial<typeof guidelines> = category
          ? { [category]: guidelines[category] }
          : guidelines;

        const issues: string[] = [];
        const recs: string[] = [];

        for (const [cat, rules] of Object.entries(source) as [Category, readonly string[]][]) {
          for (const rule of rules) {
            const ruleLower = rule.toLowerCase();

            // Negative guidance: flag if the "after" part is present in the pattern
            if (NEG_RE.test(rule)) {
              const split = splitOnFirst(rule, NEG_RE);
              const target = split?.after?.toLowerCase();
              if (target && target.length >= 3 && patLower.includes(target)) {
                issues.push(`**${cat}**: ${rule}`);
              }
              continue;
            }

            // Positive guidance: surface as recommendation if thematically relevant
            if (POS_RE.test(ruleLower)) {
              // Heuristic: show a subset that contains any keyword from the pattern
              const anyWord = patLower
                .split(/\W+/)
                .filter(Boolean)
                .some((w) => ruleLower.includes(w));
              if (anyWord || !category) {
                recs.push(`**${cat}**: ${rule}`);
              }
            }
          }
        }

        let out = `## Pattern Validation for: "${pat}"\n\n`;
        if (issues.length) {
          out += `### ⚠️ Potential Issues:\n${issues.join("\n")}\n\n`;
        }
        if (recs.length) {
          out += `### ✅ Relevant Recommendations:\n${recs.slice(0, 5).join("\n")}\n\n`;
        }
        if (!issues.length && !recs.length) {
          out += "No specific violations or recommendations found for this pattern.";
        }

        return { content: [{ type: "text", text: out }] };
      }
    );

    server.tool(
      "get_updated_docs",
      "Fetch the latest documentation from GitHub repository",
      {
        format: z.enum(["full", "preview"]).default("preview"),
      },
      async ({ format }) => {
        const githubDocs = await fetchLatestDocs();

        if (!githubDocs) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to fetch latest documentation from GitHub repository.",
              },
            ],
          };
        }

        let result = "## Latest Documentation from GitHub\n\n";

        if (format === "preview") {
          result +=
            "```markdown\n" +
            githubDocs.substring(0, 2000) +
            (githubDocs.length > 2000
              ? "...\n(truncated - use format: 'full' for complete content)"
              : "") +
            "\n```";
        } else {
          result += "```markdown\n" + githubDocs + "\n```";
        }

        return {
          content: [{ type: "text", text: result }],
        };
      }
    );

    server.tool(
      "get_quick_tips",
      "Get quick interface tips for common scenarios",
      {
        scenario: z.enum(scenarios as [Scenario, ...Scenario[]]),
      },
      async ({ scenario }) => {
        const tips = quickTips[scenario];
        return {
          content: [
            {
              type: "text",
              text: fmtSection(`${titleCase(scenario)} Quick Tips`, tips),
            },
          ],
        };
      }
    );
  },
  {
    capabilities: {
      tools: {
        get_guidelines: {
          description:
            "Get web interface guidelines by category (interactivity, typography, motion, touch, accessibility, optimizations, design, or all)",
        },
        search_guidelines: {
          description: "Search for specific guidelines by keyword",
        },
        validate_pattern: {
          description: "Validate interface patterns against guidelines",
        },
        get_updated_docs: {
          description: "Fetch the latest documentation from GitHub repository",
        },
        get_quick_tips: {
          description:
            "Get quick interface tips for common scenarios (forms, buttons, animations, mobile, accessibility, optimizations)"
        },
      },
    },
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
