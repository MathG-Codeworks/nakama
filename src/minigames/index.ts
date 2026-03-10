function evaluateAnswer(exercises: Exercise[], operation: string, answer: string, minigame: number): number {
    const exercise = exercises.find(ex => ex.operation === operation);
    if (!exercise) return 0;
    
    const option = exercise.options.find(opt => opt.result === answer);
    return option?.is_correct ? getPoints(minigame) : 0;
}

function getPoints(minigame: number): number {
    switch (minigame) {
        case Minigames.BRINCA_BRINCA:
            return Brinca.ROUND_POINTS;
        default:    
            return 0;
    }
}