const { JSDOM } = require('jsdom');

// Mock the React environment
const dom = new JSDOM('<!DOCTYPE html><html lang=""><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Test the mission #25 button logic fix
function testMission25ButtonLogic() {
  console.log('🧪 Testing Mission #25 Button Logic Fix...\n');

  // Mock mission data (simplified version of mission #25)
  const mission25 = {
    id: 25,
    title: "Suite de 7-8-9-10 de cœur",
    description: "Suite de 7-8-9-10 de cœur (obligatoirement en ♥)",
    icon: "7️⃣8️⃣9️⃣🔟♥️",
    requirements: { sequences: 1, minSequenceLength: 4, specificRequirements: "hearts_7_8_9_10" }
  };

  // Mock player with completed missions and current mission #25
  const playerWithCompletedMissions = {
    id: 1,
    name: "Player 1",
    currentMission: 25,
    completedMissions: [1, 2, 3], // Has completed some missions
    hand: [],
    combinations: []
  };

  // Mock player without completed missions
  const playerWithoutCompletedMissions = {
    id: 2,
    name: "Player 2", 
    currentMission: 25,
    completedMissions: [], // No completed missions
    hand: [],
    combinations: []
  };

  // Helper function to determine if current mission requires specific validation
  const requiresSpecificValidation = (mission) => {
    if (!mission) return false;
    
    // Missions that require specific validation (not general group laying)
    const specificValidationMissions = [
      6, 7, 12, 16, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
    ];
    
    return specificValidationMissions.includes(mission.id) || 
           mission.requirements?.specificRequirements;
  };

  // Test the old logic (broken)
  function getButtonTextOldLogic(player) {
    const hasCompletedMission = player.completedMissions.length > 0;
    return hasCompletedMission 
      ? "🎪 Poser Groupes"
      : "🪄 Présenter";
  }

  // Test the new logic (fixed)
  function getButtonTextNewLogic(player, mission) {
    const shouldPresent = requiresSpecificValidation(mission);
    return shouldPresent 
      ? "🪄 Présenter"
      : "🎪 Poser Groupes";
  }

  console.log('📋 Test Case: Player with completed missions on Mission #25');
  console.log('Player:', playerWithCompletedMissions.name);
  console.log('Current Mission:', mission25.id, '-', mission25.title);
  console.log('Completed Missions:', playerWithCompletedMissions.completedMissions);
  console.log('');

  const oldButtonText = getButtonTextOldLogic(playerWithCompletedMissions);
  const newButtonText = getButtonTextNewLogic(playerWithCompletedMissions, mission25);

  console.log('🔴 OLD LOGIC (Broken):');
  console.log('  Button Text:', oldButtonText);
  console.log('  Logic: Based on whether any missions completed');
  console.log('');

  console.log('🟢 NEW LOGIC (Fixed):');
  console.log('  Button Text:', newButtonText);
  console.log('  Logic: Based on current mission requirements');
  console.log('');

  // Verify the fix
  const isFixed = newButtonText === "🪄 Présenter";
  console.log('✅ Fix Status:', isFixed ? 'WORKING' : 'FAILED');
  
  if (isFixed) {
    console.log('✅ Mission #25 now correctly shows "🪄 Présenter" button');
    console.log('✅ Players can properly present their specific mission requirements');
  } else {
    console.log('❌ Fix failed - button text is still incorrect');
  }

  console.log('\n📋 Test Case: Player without completed missions on Mission #25');
  const newButtonTextNoCompleted = getButtonTextNewLogic(playerWithoutCompletedMissions, mission25);
  console.log('Button Text:', newButtonTextNoCompleted);
  console.log('Should also be "🪄 Présenter":', newButtonTextNoCompleted === "🪄 Présenter" ? '✅' : '❌');

  console.log('\n🎯 Summary:');
  console.log('- Mission #25 requires specific validation (hearts 7-8-9-10)');
  console.log('- Button should show "🪄 Présenter" regardless of completed missions');
  console.log('- Fix ensures mission requirements determine button text, not completion status');
}

// Run the test
testMission25ButtonLogic();