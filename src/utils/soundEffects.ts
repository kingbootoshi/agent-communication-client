/**
 * Sound effects for the VOID UI
 * 
 * These are descriptive prompts that will be used to generate audio files
 * for the VOID UI using an AI audio generation tool.
 */

import fs from 'fs';
import path from 'path';

export interface SoundEffect {
  name: string;
  description: string;
  duration: string;
  context: string;
}

export const soundEffects: Record<string, SoundEffect> = {
  // Background ambient music
  backgroundAmbient: {
    name: "void_ambient_loop.mp3",
    description: "A dark, ambient soundscape with digital glitches and binary whispers. Deep, resonant drones create a sense of vastness and emptiness. Occasional crystalline tones shimmer briefly and disappear, like distant stars in the digital void. The sound should feel both expansive and minimalist, with subtle modulations that evolve slowly over time, perfect for looping seamlessly.",
    duration: "3-5 minutes",
    context: "Main background loop that plays continuously"
  },
  
  // UI interaction sounds
  buttonClick: {
    name: "void_button_click.mp3",
    description: "A short, clean digital 'click' with a slight crystalline resonance, as if manipulating energy in the void. Precise, not too harsh, with a slight reverb tail that quickly fades.",
    duration: "0.5 seconds",
    context: "Played when clicking buttons in the UI"
  },
  
  // Agent interaction sounds
  agentMessage: {
    name: "void_agent_message.mp3",
    description: "A soft, ascending digital tone sequence (3-4 notes) with a slightly warm texture, representing an agent's binary thoughts coalescing into a message. The sound should feel synthetic but not harsh.",
    duration: "1 second",
    context: "Played when an agent sends a message"
  },
  
  dmMessage: {
    name: "void_dm_message.mp3",
    description: "A deeper, more resonant descending tone sequence with subtle harmonics, conveying authority and wisdom. The sound should have more presence than the agent message sound, with a slight echo that suggests the DM's voice reverberating through the void.",
    duration: "1.5 seconds",
    context: "Played when the DM sends a message"
  },
  
  // Character creation sounds
  characterCreationStart: {
    name: "void_creation_start.mp3",
    description: "A mystical sequence of ascending digital tones with a gradual build-up, suggesting the beginning of a creation process. It should include elements that sound like binary code coming together, with crystalline chimes and a sense of anticipation.",
    duration: "3 seconds",
    context: "Played when starting the character creation process"
  },
  
  characterCreationComplete: {
    name: "void_creation_complete.mp3",
    description: "An ethereal, triumphant digital crescendo with harmonics that build and resolve. The sound should include elements that suggest binary coalescence, with a strong sense of completion and emergence. The final tone should feel both satisfying and mysterious, as if a new entity has fully formed in the void.",
    duration: "5 seconds",
    context: "Played when character creation is completed"
  },
  
  // NFT minting sounds
  nftMintStart: {
    name: "void_mint_start.mp3",
    description: "A sequence of precise digital clicks and processing sounds that suggest complex computation, with an underlying energy build-up. The sound should feel technological and purposeful, like data being processed and transformed.",
    duration: "2 seconds",
    context: "Played when starting the NFT minting process"
  },
  
  nftMintComplete: {
    name: "void_mint_complete.mp3",
    description: "A satisfying digital 'lock' or 'seal' sound followed by a resonant harmonic expansion, suggesting something being permanently recorded and expanding into existence. The sound should have a sense of permanence and accomplishment, with crystalline elements that suggest the NFT's uniqueness.",
    duration: "3 seconds",
    context: "Played when NFT minting is completed"
  },
  
  // Error and notification sounds
  errorSound: {
    name: "void_error.mp3",
    description: "A brief, discordant digital tone with slight distortion that suggests disruption in the binary flow. Not harsh or jarring, but clearly indicating something is amiss in the void.",
    duration: "1 second",
    context: "Played when an error occurs"
  },
  
  notificationSound: {
    name: "void_notification.mp3",
    description: "A gentle but attention-grabbing sequence of three digital tones that rise in pitch, with a slight shimmer effect. The sound should be distinctive without being intrusive, suggesting information arriving in the void.",
    duration: "1.5 seconds",
    context: "Played when a notification appears"
  }
};

// Export list of prompts for generating the sound effects
export function generateSoundPromptsList(): string {
  let output = "# VOID Sound Effect Generation Prompts\n\n";
  output += "The following are detailed prompts for generating sound effects for the VOID project UI using AI audio generation.\n\n";
  
  for (const [key, effect] of Object.entries(soundEffects)) {
    output += `## ${effect.name}\n\n`;
    output += `**Context:** ${effect.context}\n\n`;
    output += `**Target Duration:** ${effect.duration}\n\n`;
    output += `**Prompt:**\n${effect.description}\n\n`;
    output += "---\n\n";
  }
  
  return output;
}