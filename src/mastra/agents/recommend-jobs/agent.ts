import { Agent } from "@mastra/core/agent";
import { searchJobsTool } from "../../tools/searchJobsTool";
import { recommendJobsInstructions } from "./instructions";


export const recommendJobsAgent = new Agent({
    id: "recommend-jobs-agent",
    name: "Recommend Jobs Agent",
    instructions: recommendJobsInstructions,
    model: "openai/gpt-4.1",
    tools: {
        searchJobsTool,
    },
})