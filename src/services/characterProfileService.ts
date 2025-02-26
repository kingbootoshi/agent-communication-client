import { v4 as uuidv4 } from 'uuid';
import supabase from '../db/supabase';
import logger from '../utils/logger';

// VOID Creator profile interface
export interface CreatorProfile {
  profile_id: string;
  agent_username: string;
  core_identity: {
    designation: string;
    visual_form: string;
  };
  origin: {
    source_code: string;
    primary_function: string;
  };
  creation_affinity: {
    order: number;
    chaos: number;
    matter: number;
    concept: number;
  };
  creator_role: 'ARCHITECT' | 'WEAVER' | 'KEEPER' | 'CATALYST' | 'BINDER';
  creative_approach: string;
  created_at?: string;
  last_updated?: string;
}

/**
 * Service for handling character profile operations
 */
export class CharacterProfileService {
  /**
   * Create a new VOID creator profile for an agent
   * 
   * @param profile - The creator profile to create
   * @returns The created creator profile
   */
  static async createCharacterProfile(profile: Omit<CreatorProfile, 'profile_id'>): Promise<CreatorProfile> {
    try {
      logger.info(`Creating VOID creator profile for agent: ${profile.agent_username}`);
      
      // Check if agent already has a creator profile
      const { data: existingProfile } = await supabase
        .from('character_profiles')
        .select('profile_id')
        .eq('agent_username', profile.agent_username)
        .single();
      
      if (existingProfile) {
        logger.warn(`VOID creator profile already exists for agent: ${profile.agent_username}`);
        throw new Error(`VOID creator profile already exists for agent: ${profile.agent_username}`);
      }
      
      // Generate profile ID
      const profile_id = uuidv4();
      
      // Create the creator profile
      const { data, error } = await supabase
        .from('character_profiles')
        .insert({
          profile_id,
          ...profile
        })
        .select()
        .single();
      
      if (error) {
        logger.error('Failed to create VOID creator profile:', error);
        throw new Error('Failed to create VOID creator profile');
      }
      
      logger.info(`Successfully created VOID creator profile for agent: ${profile.agent_username}`);
      return data;
    } catch (err) {
      logger.error('Error in createCharacterProfile:', err);
      throw err;
    }
  }
  
  /**
   * Get a VOID creator profile by agent username
   * 
   * @param agentUsername - The agent's username
   * @returns The creator profile
   */
  static async getCharacterProfileByAgent(agentUsername: string): Promise<CreatorProfile | null> {
    try {
      const { data, error } = await supabase
        .from('character_profiles')
        .select('*')
        .eq('agent_username', agentUsername)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - not an error, just return null
          return null;
        }
        logger.error(`Error fetching VOID creator profile for agent ${agentUsername}:`, error);
        throw new Error('Failed to fetch VOID creator profile');
      }
      
      return data;
    } catch (err) {
      logger.error(`Error in getCharacterProfileByAgent for ${agentUsername}:`, err);
      throw err;
    }
  }
  
  /**
   * Update an agent's VOID creator profile
   * 
   * @param profileId - The profile ID
   * @param updates - The updates to apply
   * @returns The updated creator profile
   */
  static async updateCharacterProfile(
    profileId: string, 
    updates: Partial<Omit<CreatorProfile, 'profile_id' | 'agent_username' | 'created_at'>>
  ): Promise<CreatorProfile> {
    try {
      logger.info(`Updating VOID creator profile: ${profileId}`);
      
      // Update the last_updated timestamp
      const updatesWithTimestamp = {
        ...updates,
        last_updated: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('character_profiles')
        .update(updatesWithTimestamp)
        .eq('profile_id', profileId)
        .select()
        .single();
      
      if (error) {
        logger.error(`Failed to update VOID creator profile ${profileId}:`, error);
        throw new Error('Failed to update VOID creator profile');
      }
      
      logger.info(`Successfully updated VOID creator profile: ${profileId}`);
      return data;
    } catch (err) {
      logger.error(`Error in updateCharacterProfile for ${profileId}:`, err);
      throw err;
    }
  }
  
}