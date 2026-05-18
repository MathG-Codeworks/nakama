const exercises : Exercise[]  = [
    {
        "operation": "F(x) = 5x + x + 3",
        "options": [
            {"result": "5 + 1", "is_correct": true},
            {"result": "5x", "is_correct": false},
            {"result": "3", "is_correct": false},
            {"result": "6x + 3", "is_correct": false}
        ] 
    },
    {
        "operation": "F(x) = 15x + 2",
        "options": [
            {"result": "15x", "is_correct": false},
            {"result": "2", "is_correct": false},
            {"result": "15", "is_correct": true},
            {"result": "17x", "is_correct": false}
        ] 
    },
    {
        "operation": "F(x) = 4x^3 + 2x^2 + 2",
        "options": [
            {"result": "64x + 4x", "is_correct": false},
            {"result": "12x^2 + 4x", "is_correct": true},
            {"result": "6x^5 + 2", "is_correct": false},
            {"result": "2", "is_correct": false}
        ] 
    },
    {
        "operation": "F(x) = 7x^2 + 10",
        "options": [
            {"result": "17x^2", "is_correct": false},
            {"result": "27x", "is_correct": false},
            {"result": "10x", "is_correct": false},
            {"result": "14x", "is_correct": true},
        ] 
    }
];

function getBrincaBrincaExercises(nk: nkruntime.Nakama, logger: nkruntime.Logger): Exercise[] {
    try {
        const response = nk.httpRequest(
            GET_EXERCISES_URL.replace(":rounds", Brinca.NUMBER_OF_ROUNDS.toString()),
            "get",
        );

        if (response.code < 200 || response.code >= 300) {
            logger.error("Failed to fetch exercises:", response);
            return exercises;
        } else {
            const exercises : Exercise[] = JSON.parse(response.body).map((exercise: any) => {
                const options = exercise.steps[0].options.map((option: any) => ({
                    result: option.result,
                    is_correct: option.isCorrect
                }));

                for (let i = options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const tmp = options[i];
                    options[i] = options[j];
                    options[j] = tmp;
                }

                return {
                    operation: exercise.operation,
                    options
                };
            });
            return exercises;
        }
    } catch (error) {
        logger.error("Error occurred while fetching exercises:", error);
        return exercises;
    }
}

function saveRanking(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, score: number, accuracy: number, position: number, roundId: number): void {
    try {
        const response = nk.httpRequest(
            SAVE_RANKING_URL,
            "post",
            {
                "Content-Type": "application/json"
            },
            JSON.stringify({
                userId: userId,
                score: score,
                accuracy: accuracy,
                position: position,
                roundId: roundId
            })
        );

        if (response.code < 200 || response.code >= 300) {
            logger.error("Failed to save ranking:", response);
        }
    } catch (error) {
        logger.error("Error occurred while saving ranking:", error);
    }
}