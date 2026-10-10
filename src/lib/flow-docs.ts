/** One diagram from docs/FLOWS.md, as shown in the about-page explorer. */
export type FlowDoc = {
  id: string
  group: string
  title: string
  summary: string
  chart: string
  points: string[]
}

/**
 * Splits docs/FLOWS.md into its diagrams. The document is the single source:
 * each `###` section under a `##` group holds a summary paragraph, one
 * ```mermaid block, and optional bullet points.
 */
export function parseFlowDocs(markdown: string): FlowDoc[] {
  const flows: FlowDoc[] = []
  let group = ""
  for (const block of markdown.split(/^(?=##+ )/m)) {
    const heading = /^(#{2,3}) (.+)$/m.exec(block)
    if (!heading) continue
    if (heading[1] === "##") {
      group = heading[2]!.trim()
      continue
    }
    const chart = /```mermaid\n([\s\S]*?)```/.exec(block)?.[1]
    if (!chart) continue
    const body = block.slice(heading[0].length)
    const [beforeChart = "", afterChart = ""] = body.split(
      /```mermaid[\s\S]*?```/
    )
    const title = heading[2]!.trim()
    flows.push({
      id: `${flows.length + 1}-${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`,
      group,
      title,
      summary:
        beforeChart
          .trim()
          .split(/\n\s*\n/)[0]
          ?.replace(/\s+/g, " ") ?? "",
      chart: chart.trim(),
      points: afterChart
        .split("\n")
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2).trim()),
    })
  }
  return flows
}
