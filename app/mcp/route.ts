import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

async function fetchLatestDocs(): Promise<string | null> {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/raunofreiberg/interfaces/main/README.md"
    );
    const content = await response.text();
    return content;
  } catch (error) {
    console.error("Failed to fetch latest docs:", error);
    return null;
  }
}

const guidelines: Record<string, string[]> = {
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
};

const handler = createMcpHandler(
  async (server) => {
    server.tool(
      "get_guidelines",
      "Get web interface guidelines by category",
      {
        category: z
          .enum([
            "interactivity",
            "typography",
            "motion",
            "touch",
            "accessibility",
            "optimizations",
            "design",
            "all",
          ])
          .optional(),
      },
      async ({ category = "all" }) => {
        if (category === "all") {
          const allGuidelines = Object.entries(guidelines)
            .map(
              ([cat, rules]) =>
                `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n${rules
                  .map((rule) => `- ${rule}`)
                  .join("\n")}`
            )
            .join("\n\n");
          return {
            content: [{ type: "text", text: allGuidelines }],
          };
        }

        const categoryGuidelines = guidelines[category];
        if (!categoryGuidelines) {
          return {
            content: [
              {
                type: "text",
                text: `Category "${category}" not found. Available categories: ${Object.keys(
                  guidelines
                ).join(", ")}`,
              },
            ],
          };
        }

        const formattedGuidelines = `## ${
          category.charAt(0).toUpperCase() + category.slice(1)
        } Guidelines\n${categoryGuidelines
          .map((rule) => `- ${rule}`)
          .join("\n")}`;
        return {
          content: [{ type: "text", text: formattedGuidelines }],
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
        const results: string[] = [];
        const searchTerm = query.toLowerCase();

        Object.entries(guidelines).forEach(([category, rules]) => {
          rules.forEach((rule) => {
            if (rule.toLowerCase().includes(searchTerm)) {
              results.push(`**${category}**: ${rule}`);
            }
          });
        });

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
              text: `Found ${
                results.length
              } guidelines matching "${query}":\n\n${results.join("\n\n")}`,
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
          .enum([
            "interactivity",
            "typography",
            "motion",
            "touch",
            "accessibility",
            "optimizations",
            "design",
          ])
          .optional(),
      },
      async ({ pattern, category }) => {
        const relevantGuidelines = category
          ? { [category]: guidelines[category] }
          : guidelines;
        const violations: string[] = [];
        const recommendations: string[] = [];

        Object.entries(relevantGuidelines).forEach(([cat, rules]) => {
          rules.forEach((rule) => {
            const lowerPattern = pattern.toLowerCase();
            const lowerRule = rule.toLowerCase();

            if (
              lowerRule.includes("avoid") ||
              lowerRule.includes("don't") ||
              lowerRule.includes("prevent")
            ) {
              const issue = rule.split(/avoid|don't|prevent/i)[1]?.trim();
              if (issue && lowerPattern.includes(issue.toLowerCase())) {
                violations.push(`**${cat}**: ${rule}`);
              }
            } else if (
              lowerRule.includes("use") ||
              lowerRule.includes("apply") ||
              lowerRule.includes("ensure")
            ) {
              recommendations.push(`**${cat}**: ${rule}`);
            }
          });
        });

        let result = `## Pattern Validation for: "${pattern}"\n\n`;

        if (violations.length > 0) {
          result += `### ⚠️ Potential Issues:\n${violations.join("\n")}\n\n`;
        }

        if (recommendations.length > 0) {
          result += `### ✅ Relevant Recommendations:\n${recommendations
            .slice(0, 5)
            .join("\n")}\n\n`;
        }

        if (violations.length === 0 && recommendations.length === 0) {
          result +=
            "No specific violations or recommendations found for this pattern.";
        }

        return {
          content: [{ type: "text", text: result }],
        };
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
        scenario: z.enum([
          "forms",
          "buttons",
          "animations",
          "mobile",
          "accessibility",
          "optimizations",
        ]),
      },
      async ({ scenario }) => {
        const tips: Record<string, string[]> = {
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
        };

        const scenarioTips = tips[scenario];
        const formattedTips = `## ${
          scenario.charAt(0).toUpperCase() + scenario.slice(1)
        } Quick Tips\n\n${scenarioTips.map((tip) => `- ${tip}`).join("\n")}`;

        return {
          content: [{ type: "text", text: formattedTips }],
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
