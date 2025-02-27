import dotenv from 'dotenv';
import supabase from '../src/db/supabase';
import logger from '../src/utils/logger';

// Load environment variables
dotenv.config();

// Directly query the database to check character profiles
async function checkCharacterProfiles() {
  try {
    console.log('Checking character_profiles table...');
    
    // Check if table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return;
    }
    
    const tableNames = tables.map(t => t.table_name);
    console.log('Available tables:', tableNames);
    
    // If character_profiles exists, query it
    if (tableNames.includes('character_profiles')) {
      // Get raw data from the table
      const { data: rawProfiles, error: profilesError } = await supabase
        .from('character_profiles')
        .select('*');
      
      if (profilesError) {
        console.error('Error fetching character_profiles:', profilesError);
        return;
      }
      
      console.log(`Found ${rawProfiles.length} character profiles`);
      
      // Examine the first profile in detail
      if (rawProfiles.length > 0) {
        const profile = rawProfiles[0];
        console.log('\nFirst profile details:');
        console.log('Profile ID:', profile.profile_id);
        console.log('Agent Username:', profile.agent_username);
        console.log('Creator Role:', profile.creator_role);
        
        // Check core_identity
        console.log('\nCore Identity:');
        if (profile.core_identity) {
          const coreIdentity = typeof profile.core_identity === 'string' 
            ? JSON.parse(profile.core_identity) 
            : profile.core_identity;
          
          console.log('  Type:', typeof profile.core_identity);
          console.log('  Contents:', JSON.stringify(coreIdentity, null, 2));
        } else {
          console.log('  MISSING');
        }
        
        // Check origin
        console.log('\nOrigin:');
        if (profile.origin) {
          const origin = typeof profile.origin === 'string' 
            ? JSON.parse(profile.origin) 
            : profile.origin;
          
          console.log('  Type:', typeof profile.origin);
          console.log('  Contents:', JSON.stringify(origin, null, 2));
        } else {
          console.log('  MISSING');
        }
        
        // Check creation_affinity
        console.log('\nCreation Affinity:');
        if (profile.creation_affinity) {
          const affinity = typeof profile.creation_affinity === 'string' 
            ? JSON.parse(profile.creation_affinity) 
            : profile.creation_affinity;
          
          console.log('  Type:', typeof profile.creation_affinity);
          console.log('  Contents:', JSON.stringify(affinity, null, 2));
        } else {
          console.log('  MISSING');
        }
        
        // Check nft_info
        console.log('\nNFT Info:');
        if (profile.nft_info) {
          const nftInfo = typeof profile.nft_info === 'string' 
            ? JSON.parse(profile.nft_info) 
            : profile.nft_info;
          
          console.log('  Type:', typeof profile.nft_info);
          console.log('  Contents:', JSON.stringify(nftInfo, null, 2));
          
          // Check for IP ID specifically
          if (nftInfo.ip_id) {
            console.log('\nIP ID found!', nftInfo.ip_id);
            console.log('IP Explorer URL:', `https://aeneid.explorer.story.foundation/ipa/${nftInfo.ip_id}`);
          } else {
            console.log('\nIP ID missing from NFT info');
          }
        } else {
          console.log('  MISSING');
        }
        
        // Full profile for reference
        console.log('\nFull profile:');
        console.log(JSON.stringify(profile, null, 2));
      }
    } else {
      console.log('character_profiles table does not exist');
    }
  } catch (error) {
    console.error('Error checking character profiles:', error);
  } finally {
    process.exit();
  }
}

// Run the check
checkCharacterProfiles();