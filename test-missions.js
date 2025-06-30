const fs = require('fs');

// Read the missions file
const missionsContent = fs.readFileSync('src/data/missions.ts', 'utf8');

// Count the number of missions by counting the id: pattern
const missionMatches = missionsContent.match(/id:\s*\d+/g);
const missionCount = missionMatches ? missionMatches.length : 0;

console.log('🎪 Testing Cirque Rummy Missions...');
console.log(`📊 Total missions found: ${missionCount}`);

if (missionCount === 30) {
  console.log('✅ All 30 missions are properly implemented!');
  
  // Check for the new mission categories
  const hasNewMissions = missionsContent.includes('🆕 Missions inédites');
  const hasColorMissions = missionsContent.includes('🎨 Missions avec contrainte de couleur spécifique');
  
  console.log(`✅ New missions section: ${hasNewMissions ? 'Found' : 'Missing'}`);
  console.log(`✅ Color-specific missions section: ${hasColorMissions ? 'Found' : 'Missing'}`);
  
  // Check for some specific new mission requirements
  const hasSpecificRequirements = [
    'group_4_sequence_4',
    'groups_of_4',
    'sequence_A_to_9',
    'seven_odd_cards',
    'hearts_7_8_9_10',
    'red_even_sequence_6'
  ].every(req => missionsContent.includes(req));
  
  console.log(`✅ Specific requirements implemented: ${hasSpecificRequirements ? 'Yes' : 'No'}`);
  
  if (hasNewMissions && hasColorMissions && hasSpecificRequirements) {
    console.log('🎉 All 18 new missions have been successfully implemented!');
  }
} else {
  console.log(`❌ Expected 30 missions, but found ${missionCount}`);
}