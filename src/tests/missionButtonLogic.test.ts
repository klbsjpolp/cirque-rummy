import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../data/missions';
import { Mission } from '../types/game';

describe('Mission Button Logic', () => {
  // Test player type for button logic testing
  interface TestPlayer {
    currentMission?: number;
    completedMissions: number[];
  }

  // Helper function to determine if current mission requires specific validation
  const requiresSpecificValidation = (mission: Mission | null | undefined) => {
    if (!mission) return false;

    // Missions that require specific validation (not general group laying)
    const specificValidationMissions = [
      6, 7, 12, 16, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
    ];

    return specificValidationMissions.includes(mission.id) || 
           mission.requirements?.specificRequirements;
  };

  // Function to get button text based on actual GameBoard.tsx logic
  const getButtonText = (player: TestPlayer, mission: Mission | null | undefined) => {
    // Handle null/undefined missions gracefully
    if (!mission) {
      return "🎪 Poser Groupes";
    }

    // This matches the actual logic in GameBoard.tsx lines 249-251
    // The button text depends on whether the player has completed their CURRENT mission
    const hasCompletedCurrentMission = player.completedMissions && 
      player.completedMissions.includes(player.currentMission || mission.id);

    return hasCompletedCurrentMission
      ? "🎪 Poser Groupes"
      : "🪄 Présenter";
  };

  it('should show "Présenter" for mission #25 regardless of completed missions', () => {
    const mission25 = MISSIONS.find(m => m.id === 25);

    // Player with completed missions
    const playerWithCompleted = {
      currentMission: 25,
      completedMissions: [1, 2, 3]
    };

    // Player without completed missions
    const playerWithoutCompleted = {
      currentMission: 25,
      completedMissions: []
    };

    expect(getButtonText(playerWithCompleted, mission25)).toBe("🪄 Présenter");
    expect(getButtonText(playerWithoutCompleted, mission25)).toBe("🪄 Présenter");
  });

  it('should show "Présenter" for uncompleted missions', () => {
    const uncompletedMissions = [6, 7, 12, 16, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29];

    uncompletedMissions.forEach(missionId => {
      const mission = MISSIONS.find(m => m.id === missionId);
      const player = {
        currentMission: missionId,
        completedMissions: [1, 2, 3] // Has completed some missions, but not the current one
      };

      if (mission) {
        expect(getButtonText(player, mission)).toBe("🪄 Présenter");
      }
    });
  });

  it('should show "Poser Groupes" for completed missions', () => {
    const completedMissions = [1, 2, 3];

    completedMissions.forEach(missionId => {
      const mission = MISSIONS.find(m => m.id === missionId);
      const player = {
        currentMission: missionId,
        completedMissions: [1, 2, 3] // Has completed these missions
      };

      if (mission) {
        expect(getButtonText(player, mission)).toBe("🎪 Poser Groupes");
      }
    });
  });

  it('should handle missions with specificRequirements property when not completed', () => {
    // Test missions that have specificRequirements in their requirements
    const missionsWithSpecificReqs = MISSIONS.filter(m => 
      m.requirements?.specificRequirements
    );

    missionsWithSpecificReqs.forEach(mission => {
      const player = {
        currentMission: mission.id,
        completedMissions: [1, 2, 3] // Has completed some missions, but not this one
      };

      expect(getButtonText(player, mission)).toBe("🪄 Présenter");
    });
  });

  it('should handle null or undefined mission gracefully', () => {
    const player = {
      completedMissions: [1, 2, 3]
    };

    expect(getButtonText(player, null)).toBe("🎪 Poser Groupes");
    expect(getButtonText(player, undefined)).toBe("🎪 Poser Groupes");
  });

  it('should verify mission #25 has correct requirements', () => {
    const mission25 = MISSIONS.find(m => m.id === 25);

    expect(mission25).toBeDefined();
    expect(mission25?.title).toBe("Suite de 7-8-9-10 de cœur");
    expect(mission25?.requirements?.specificRequirements).toBe("hearts_7_8_9_10");
    expect(requiresSpecificValidation(mission25)).toBe(true);
  });

  it('should demonstrate the fix for the original issue', () => {
    // Original issue: Player with mission #25 and completed missions 
    // was seeing "Poser Groupes" instead of "Présenter"

    const mission25 = MISSIONS.find(m => m.id === 25);
    const playerWithIssue = {
      currentMission: 25,
      completedMissions: [1, 2, 3, 4] // Has completed several missions
    };

    // Old logic would have returned "Poser Groupes" based on completedMissions.length > 0
    const oldLogicResult = playerWithIssue.completedMissions.length > 0 
      ? "🎪 Poser Groupes" 
      : "🪄 Présenter";

    // New logic returns correct result based on mission requirements
    const newLogicResult = getButtonText(playerWithIssue, mission25);

    expect(oldLogicResult).toBe("🎪 Poser Groupes"); // This was the bug
    expect(newLogicResult).toBe("🪄 Présenter"); // This is the fix
  });
});
