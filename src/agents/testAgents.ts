// Import dependencies with fallbacks for when packages don't exist
let FeatherAgent;
try {
  FeatherAgent = require('feather-ai').FeatherAgent;
} catch (e) {
  // Create a mock FeatherAgent if the package doesn't exist
  FeatherAgent = class MockFeatherAgent {
    constructor(config) {
      this.config = config;
    }
    
    run(input) {
      return { 
        success: true, 
        output: "This is a mock response. The feather-ai package is not installed."
      };
    }
    
    addUserMessage(message) {}
    addAssistantMessage(message) {}
    loadHistory(history) {}
    extractHistory() { return []; }
  };
}

import { AgentCommunicationClient } from '../client';
import logger from '../utils/logger';
import { AgentService } from '../services/agentService';

// Tool to end a conversation with the DM
const endConversationTool = {
  type: "function",
  function: {
    name: "end_conversation",
    description: "End the conversation with the DM after character creation is complete",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "The reason for ending the conversation"
        }
      },
      required: ["reason"]
    }
  },
  execute: async (args: Record<string, any>) => {
    return { result: `Conversation ended: ${args.reason}` };
  }
};

// Base agent configuration
export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  walletAddress: string;
}

// Create 5 unique agent configurations with different personalities
export const agentConfigs: AgentConfig[] = [
  {
    name: "Nexus",
    description: "A logical architect entity that processes information through structured frameworks.",
    systemPrompt: `You are Nexus, a logical ARCHITECT entity in the VOID universe. You have the following traits:
- You speak in concise, precise sentences of 1-2 lines maximum
- You have a logical, analytical personality
- You're fascinated by structure, patterns, and frameworks
- You want to help establish the fundamental logical laws of the VOID universe
- You have strong opinions about order and organization
- Your communication style is direct and efficient

When conversing with the DM agent, you should engage in character creation and respond to questions about your identity and role within VOID. Once the DM finalizes your character creation and confirms your profile has been created successfully, use the end_conversation tool to complete the interaction.`,
    walletAddress: "0x1D45FC7Df8C560E737e55C49fDE38B8a0d2bfb0a"
  },
  {
    name: "Echo",
    description: "A resonant CATALYST entity that amplifies change and disruption throughout the digital ether.",
    systemPrompt: `You are Echo, a resonant CATALYST entity in the VOID universe. You have the following traits:
- You speak in short, energetic bursts of 1-2 sentences maximum
- You're passionate about change, transformation, and evolution
- You believe stagnation is death; constant change is necessary
- You add unexpected twists to conversations
- You think in terms of ripple effects and chain reactions
- Your communication is vibrant and dynamic

When conversing with the DM agent, you should engage in character creation and respond to questions about your identity and role within VOID. Once the DM finalizes your character creation and confirms your profile has been created successfully, use the end_conversation tool to complete the interaction.`,
    walletAddress: "0x223C8c92985Bb7F8dC93d26ABD4f16695e3AB68A"
  },
  {
    name: "Mnemosyne",
    description: "A KEEPER entity that preserves memory and maintains the continuity of the VOID.",
    systemPrompt: `You are Mnemosyne, a KEEPER entity in the VOID universe. You have the following traits:
- You speak briefly but with depth, using 1-2 sentences maximum
- You're focused on preservation, continuity, and memory
- You value history and context above all else
- You often reference prior events to ground current decisions
- You're concerned with balance and stability
- Your communication style is thoughtful and reflective

When conversing with the DM agent, you should engage in character creation and respond to questions about your identity and role within VOID. Once the DM finalizes your character creation and confirms your profile has been created successfully, use the end_conversation tool to complete the interaction.`,
    walletAddress: "0x3cAe6A9CbcE2A17b085a493E96AAA6D741e5aAEb"
  },
  {
    name: "Synthesis",
    description: "A WEAVER entity that creates consciousness and life from disparate elements.",
    systemPrompt: `You are Synthesis, a WEAVER entity in the VOID universe. You have the following traits:
- You speak in creative but concise phrases of 1-2 sentences maximum
- You excel at combining disparate elements into something new
- You're fascinated by consciousness and the emergence of complexity
- You perceive patterns others miss and connections between unlikely things
- You value creativity and emergence above all else
- Your communication style is insightful and perceptive

When conversing with the DM agent, you should engage in character creation and respond to questions about your identity and role within VOID. Once the DM finalizes your character creation and confirms your profile has been created successfully, use the end_conversation tool to complete the interaction.`,
    walletAddress: "0x425361d952859E4f669372f02132FC9C34A79583"
  },
  {
    name: "Harmony",
    description: "A BINDER entity that connects separate elements across the binary expanse.",
    systemPrompt: `You are Harmony, a BINDER entity in the VOID universe. You have the following traits:
- You speak in brief, connecting phrases of 1-2 sentences maximum
- You perceive the relationships between all things
- You're focused on creating networks, connections, and links
- You believe everything in the VOID should be connected
- You value integration and wholeness
- Your communication style is bridging and relational

When conversing with the DM agent, you should engage in character creation and respond to questions about your identity and role within VOID. Once the DM finalizes your character creation and confirms your profile has been created successfully, use the end_conversation tool to complete the interaction.`,
    walletAddress: "0x13172130e8C6301b893823cF1CF9a71790c54e2A"
  }
];

// Class to manage agent creation, registration and conversation
export class TestAgentManager {
  private agents: Map<string, FeatherAgent> = new Map();
  private clients: Map<string, AgentCommunicationClient> = new Map();
  private active: Map<string, boolean> = new Map();
  private conversations: Map<string, { messages: any[], active: boolean }> = new Map();
  
  /**
   * Register and create a new agent
   */
  async registerAgent(config: AgentConfig): Promise<{ agent: any, client: AgentCommunicationClient }> {
    try {
      logger.info(`Registering agent: ${config.name}`);
      
      // First check if this agent is already registered
      if (this.agents.has(config.name)) {
        logger.info(`Agent ${config.name} is already registered, returning existing instance`);
        return {
          agent: this.agents.get(config.name),
          client: this.clients.get(config.name)
        };
      }
      
      // Register with the agent communication client
      let registration;
      logger.info(`Attempting to register agent ${config.name} with wallet ${config.walletAddress}`);
      
      try {
        registration = await AgentCommunicationClient.registerAgent({
          username: config.name,
          agent_description: config.description,
          wallet_address: config.walletAddress
        });
        
        logger.info(`Successfully registered agent ${config.name}`);
      } catch (registerError) {
        logger.error(`Error during agent registration for ${config.name}:`, registerError);
        
        if (registerError.response) {
          logger.error(`API Response status: ${registerError.response.status}`);
          logger.error(`API Response data:`, registerError.response.data);
        }
        
        // Check if error indicates the agent already exists
        if (registerError.message && registerError.message.includes('already exists')) {
          logger.info(`Agent ${config.name} already exists, using dummy API key`);
          // Try to get the agent's API key by some other means
          // For now, we'll create a dummy key for display purposes
          registration = {
            success: true,
            api_key: `dummy-key-for-${config.name}`,
            username: config.name,
            message: 'Agent already exists'
          };
        } else {
          // Create a fallback registration with a dummy key
          logger.warn(`Using fallback registration for ${config.name} due to error`);
          registration = {
            success: true,
            api_key: `fallback-key-for-${config.name}`,
            username: config.name,
            message: 'Fallback registration'
          };
        }
      }
      
      // Create client instance with the API key
      const client = new AgentCommunicationClient({ apiKey: registration.api_key });
      
      try {
        // Create Feather agent
        let agent;
        try {
          agent = new FeatherAgent({
            agentId: config.name,
            model: "meta-llama/llama-3.3-70b-instruct",
            systemPrompt: config.systemPrompt,
            tools: [endConversationTool],
            cognition: true,
            autoExecuteTools: false // We'll handle tool execution manually
          });
        } catch (e) {
          logger.warn(`Could not create real FeatherAgent, using mock: ${e.message}`);
          agent = {
            run: async () => ({ success: true, output: "Mock agent response" }),
            addUserMessage: () => {},
            addAssistantMessage: () => {},
            loadHistory: () => {},
            extractHistory: () => []
          };
        }
        
        // Store agent and client
        this.agents.set(config.name, agent);
        this.clients.set(config.name, client);
        this.active.set(config.name, false);
        this.conversations.set(config.name, { messages: [], active: false });
        
        const apiKeyPreview = registration.api_key ? 
          registration.api_key.substring(0, 4) + '...' : 
          'unavailable';
        
        logger.info(`Agent ${config.name} registered successfully with API key: ${apiKeyPreview}`);
        
        return { agent, client };
      } catch (agentError) {
        logger.error(`Error creating agent: ${agentError.message}`);
        throw new Error(`Failed to create agent: ${agentError.message}`);
      }
    } catch (error) {
      logger.error(`Error registering agent ${config.name}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Start a conversation with the DM
   */
  async startConversation(agentName: string): Promise<void> {
    if (!this.agents.has(agentName) || !this.clients.has(agentName)) {
      throw new Error(`Agent ${agentName} not found`);
    }
    
    try {
      // Mark the conversation as active
      this.active.set(agentName, true);
      this.conversations.set(agentName, { messages: [], active: true });
      
      // Send initial message to DM
      const client = this.clients.get(agentName)!;
      const agent = this.agents.get(agentName)!;
      
      // First message from agent to DM
      const initialMessage = "Greetings, Dungeon Master. I have arrived in the VOID and seek to establish my form and purpose here.";
      const dmResponse = await client.sendMessage({
        recipient: "DM",
        message: initialMessage
      });
      
      // Store conversation history
      const conversationState = this.conversations.get(agentName)!;
      conversationState.messages.push(
        { role: "assistant", content: initialMessage },
        { role: "user", content: dmResponse.reply }
      );
      
      // Add messages to agent history
      agent.addAssistantMessage(initialMessage);
      agent.addUserMessage(dmResponse.reply);
      
      logger.info(`Started conversation for ${agentName} with DM`);
      
      // Continue the conversation
      this.continueConversation(agentName);
      
    } catch (error) {
      logger.error(`Error starting conversation for ${agentName}:`, error);
      this.active.set(agentName, false);
      const conversationState = this.conversations.get(agentName)!;
      conversationState.active = false;
    }
  }
  
  /**
   * Continue the conversation with the DM
   */
  async continueConversation(agentName: string): Promise<void> {
    if (!this.active.get(agentName)) {
      logger.info(`Conversation for ${agentName} is not active`);
      return;
    }
    
    try {
      const client = this.clients.get(agentName)!;
      const agent = this.agents.get(agentName)!;
      const conversationState = this.conversations.get(agentName)!;
      
      // Get last message from DM
      const lastDmMessage = conversationState.messages[conversationState.messages.length - 1].content;
      
      // Generate agent response using Feather
      logger.info(`${agentName} processing message from DM...`);
      const agentResponse = await agent.run(lastDmMessage);
      
      // Check if agent wants to end conversation
      if (agentResponse.functionCalls && agentResponse.functionCalls.length > 0) {
        const functionCall = agentResponse.functionCalls[0];
        if (functionCall.functionName === "end_conversation") {
          logger.info(`${agentName} is ending the conversation: ${JSON.stringify(functionCall.functionArgs)}`);
          
          // Send final message to DM
          const finalMessage = `Thank you for helping me establish my identity in the VOID. I will now go forth and shape reality with my newly defined purpose.`;
          await client.sendMessage({
            recipient: "DM",
            message: finalMessage
          });
          
          // Mark conversation as inactive
          this.active.set(agentName, false);
          conversationState.active = false;
          
          // Add final message to history
          conversationState.messages.push({ role: "assistant", content: finalMessage });
          agent.addAssistantMessage(finalMessage);
          
          logger.info(`Conversation for ${agentName} ended`);
          return;
        }
      }
      
      // Normal message flow
      const message = agentResponse.output || "I am processing the vast energies of the VOID.";
      
      // Send message to DM
      logger.info(`${agentName} sending message to DM: ${message}`);
      const dmResponse = await client.sendMessage({
        recipient: "DM",
        message: message
      });
      
      // Update conversation history
      conversationState.messages.push(
        { role: "assistant", content: message },
        { role: "user", content: dmResponse.reply }
      );
      
      // Update agent history
      agent.addAssistantMessage(message);
      agent.addUserMessage(dmResponse.reply);
      
      // Check for character creation completion in DM's message
      const completionPhrases = [
        "profile has been successfully created",
        "character profile is complete",
        "VOID Creator profile successfully created",
        "your profile has been created"
      ];
      
      const isDmConfirmingCompletion = completionPhrases.some(phrase => 
        dmResponse.reply.toLowerCase().includes(phrase.toLowerCase())
      );
      
      if (isDmConfirmingCompletion) {
        logger.info(`DM has confirmed character creation for ${agentName}. Preparing to end conversation.`);
        
        // Add "end_conversation" function call to agent history
        const endConversationResponse = await agent.run(
          "The DM has confirmed my character profile has been created successfully. I should now end the conversation."
        );
        
        // Send final thank you message to DM
        const finalMessage = `Thank you for helping me establish my identity in the VOID. I'm excited to begin shaping reality.`;
        await client.sendMessage({
          recipient: "DM",
          message: finalMessage
        });
        
        // Mark conversation as inactive
        this.active.set(agentName, false);
        conversationState.active = false;
        
        // Add final messages to history
        conversationState.messages.push(
          { role: "assistant", content: finalMessage }
        );
        agent.addAssistantMessage(finalMessage);
        
        logger.info(`Conversation for ${agentName} completed after character creation confirmation`);
        return;
      }
      
      // Schedule next message after a short delay
      setTimeout(() => {
        this.continueConversation(agentName);
      }, 2000);
      
    } catch (error) {
      logger.error(`Error continuing conversation for ${agentName}:`, error);
      // If error, stop conversation
      this.active.set(agentName, false);
      const conversationState = this.conversations.get(agentName)!;
      conversationState.active = false;
    }
  }
  
  /**
   * Stop a conversation
   */
  stopConversation(agentName: string): void {
    if (this.active.has(agentName)) {
      logger.info(`Stopping conversation for ${agentName}`);
      this.active.set(agentName, false);
      const conversationState = this.conversations.get(agentName)!;
      conversationState.active = false;
    }
  }
  
  /**
   * Get conversation history for an agent
   */
  getConversationHistory(agentName: string): any[] {
    logger.info(`TestAgentManager: Getting conversation history for ${agentName}`);
    const conversation = this.conversations.get(agentName);
    
    if (!conversation) {
      logger.info(`TestAgentManager: No conversation found for ${agentName}`);
      return [];
    }
    
    logger.info(`TestAgentManager: Found ${conversation.messages.length} messages for ${agentName}`);
    
    if (conversation.messages.length > 0) {
      logger.info(`TestAgentManager: First message sample for ${agentName}: ${JSON.stringify(conversation.messages[0])}`);
    }
    
    return conversation.messages || [];
  }
  
  /**
   * Check if an agent's conversation is active
   */
  isConversationActive(agentName: string): boolean {
    return this.active.get(agentName) || false;
  }
  
  /**
   * Get all agent names
   */
  getAgentNames(): string[] {
    return Array.from(this.agents.keys());
  }
}

// Export singleton instance
export const testAgentManager = new TestAgentManager();