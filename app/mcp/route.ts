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
    "Input labels should focus the input field when clicked",
    "Wrap inputs in <form> to enable Enter key submission",
    "Use appropriate input types (password, email)",
    "Disable spellcheck and autocomplete attributes when appropriate",
    "Use HTML form validation with required attribute",
    "Position input decorations absolutely",
    "Implement immediate toggle effects",
    "Disable buttons after submission to prevent duplicate requests",
  ],
  typography: [
    "Apply -webkit-font-smoothing: antialiased",
    "Use text-rendering: optimizeLegibility",
    "Subset fonts based on content/language",
    "Avoid font weight changes that cause layout shifts",
    "Use font weights 400 or higher",
    "Use clamp() for fluid font sizing",
    "Apply font-variant-numeric: tabular-nums for consistent layouts",
  ],
  motion: [
    "Limit animation duration to 200ms",
    "Avoid transitions during theme switching",
    "Scale animations proportionally to trigger size",
    "Minimize animations for frequent, low-novelty actions",
    "Pause looping animations when off-screen",
  ],
  touch: [
    "Use @media (hover: hover) for touch interactions",
    "Maintain input font size ≥ 16px to prevent iOS zooming",
    "Avoid auto-focusing inputs on touch devices",
    "Apply muted and playsinline to videos",
  ],
  accessibility: [
    "Avoid tooltips on disabled buttons",
    "Use box shadows for focus rings",
    "Provide aria-label for icon-only elements",
    "Ensure screen reader compatibility",
    "Create meaningful selection states",
  ],
  performance: [
    "Use radial gradients to prevent banding",
    "Sparingly enable GPU rendering",
    "Pause/unmount off-screen videos",
    "Adapt to device hardware capabilities",
  ],
  design: [
    "Optimistically update data with error rollback",
    "Handle authentication redirects server-side",
    "Provide contextual feedback",
    "Create helpful empty states",
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
            "performance",
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
            "performance",
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
          "performance",
        ]),
      },
      async ({ scenario }) => {
        const tips: Record<string, string[]> = {
          forms: [
            "Wrap inputs in <form> for Enter key submission",
            "Use appropriate input types (email, password, etc.)",
            "Keep input font size ≥ 16px on mobile to prevent zoom",
            "Focus input when label is clicked",
            "Disable spellcheck on sensitive inputs",
          ],
          buttons: [
            "Disable buttons after submission to prevent duplicates",
            "Avoid tooltips on disabled buttons",
            "Use aria-label for icon-only buttons",
            "Apply hover states only on pointer devices",
            "Provide immediate visual feedback on click",
          ],
          animations: [
            "Keep durations under 200ms",
            "Pause looping animations when off-screen",
            "Scale animations proportionally to trigger size",
            "Avoid transitions during theme switching",
            "Minimize animations for frequent actions",
          ],
          mobile: [
            "Use @media (hover: hover) for touch interactions",
            "Maintain minimum 44px touch targets",
            "Avoid auto-focus on touch devices",
            "Add muted and playsinline to videos",
            "Consider thumb reach zones",
          ],
          accessibility: [
            "Use semantic HTML elements",
            "Provide aria-label for icon-only elements",
            "Ensure keyboard navigation works",
            "Use sufficient color contrast",
            "Create meaningful focus indicators",
          ],
          performance: [
            "Minimize GPU rendering usage",
            "Pause off-screen videos",
            "Use font-display: swap for web fonts",
            "Optimize images for device capabilities",
            "Lazy load below-the-fold content",
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
            "Get web interface guidelines by category (interactivity, typography, motion, touch, accessibility, performance, design, or all)",
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
            "Get quick interface tips for common scenarios (forms, buttons, animations, mobile, accessibility, performance)",
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
